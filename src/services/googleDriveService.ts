import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'consent' });

class GoogleDriveService {
  private accessToken: string | null = null;
  private currentUser: User | null = null;
  private tokenExpiresAt: number = 0;
  private tokenClient: any = null;

  constructor() {
    this.setupAuthStateListener();
  }

  private setupAuthStateListener() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (!user) {
        this.accessToken = null;
        this.tokenExpiresAt = 0;
      }
    });
  }

  getCurrentUser(): User | null {
    return this.currentUser || auth.currentUser;
  }

  // Session-only in-memory token storage
  getAccessToken(): string | null {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }
    return null;
  }

  isConnected(): boolean {
    return !!this.getAccessToken();
  }

  // GSI fallback / companion init
  initTokenClient(clientId?: string, onTokenReceived?: (token: string) => void): boolean {
    const finalClientId = clientId || firebaseConfig.oAuthClientId;
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      return false;
    }

    if (!finalClientId) return false;

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: finalClientId,
        scope: SCOPES.join(' '),
        callback: (response: any) => {
          if (response.error) {
            console.error('Google OAuth Error:', response);
            return;
          }
          this.accessToken = response.access_token;
          const expiresIn = response.expires_in ? parseInt(response.expires_in) * 1000 : 3600 * 1000;
          this.tokenExpiresAt = Date.now() + expiresIn - 60000;
          if (onTokenReceived) {
            onTokenReceived(response.access_token);
          }
        },
      });
      return true;
    } catch (err) {
      console.warn('GSI Token Client warning:', err);
      return false;
    }
  }

  // Request Access Token: uses Firebase Auth signInWithPopup first, falls back to GSI token client
  async requestAccessToken(): Promise<string> {
    const active = this.getAccessToken();
    if (active) {
      return active;
    }

    // Attempt Firebase Auth signInWithPopup
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        this.accessToken = credential.accessToken;
        this.currentUser = result.user;
        this.tokenExpiresAt = Date.now() + 3500 * 1000; // ~1 hour
        return this.accessToken;
      }
    } catch (firebaseErr: any) {
      console.warn('Firebase popup attempt failed or closed, trying GSI client:', firebaseErr);
    }

    // Fallback: GSI Token client
    return new Promise((resolve, reject) => {
      const clientId = firebaseConfig.oAuthClientId;
      if (!this.tokenClient && clientId) {
        this.initTokenClient(clientId);
      }

      if (!this.tokenClient) {
        return reject(
          new Error('Klien OAuth Google belum siap. Pastikan izin Google diaktifkan.')
        );
      }

      const originalCallback = this.tokenClient.callback;
      this.tokenClient.callback = (resp: any) => {
        if (originalCallback) originalCallback(resp);
        if (resp.error) {
          reject(new Error(resp.error_description || resp.error || 'Autentikasi Google dibatalkan.'));
        } else {
          this.accessToken = resp.access_token;
          this.tokenExpiresAt = Date.now() + 3500 * 1000;
          resolve(resp.access_token);
        }
      };

      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  async disconnect() {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Error signing out of Firebase:', e);
    }

    if (this.accessToken && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(this.accessToken, () => {
          console.log('Token sesi Google dicabut.');
        });
      } catch (e) {
        console.warn(e);
      }
    }

    this.accessToken = null;
    this.currentUser = null;
    this.tokenExpiresAt = 0;
  }

  // Google Drive API v3: List files in folder
  async listFilesInFolder(folderId: string): Promise<any[]> {
    const token = await this.requestAccessToken();
    const q = folderId
      ? `'${folderId}' in parents and trashed = false and (mimeType = 'application/pdf' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'application/vnd.google-apps.document')`
      : `trashed = false and (mimeType = 'application/pdf' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'application/vnd.google-apps.document')`;

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', q);
    url.searchParams.set('fields', 'files(id, name, mimeType, modifiedTime, md5Checksum, webViewLink, size)');
    url.searchParams.set('pageSize', '100');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(
        `Gagal mengakses Google Drive: ${errorJson.error?.message || res.statusText} (${res.status})`
      );
    }

    const data = await res.json();
    return data.files || [];
  }

  // Download or export file from Google Drive
  async downloadFile(fileId: string, mimeType: string): Promise<{ base64?: string; text?: string; mimeType: string }> {
    const token = await this.requestAccessToken();

    if (mimeType === 'application/vnd.google-apps.document') {
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
      const res = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal mengekspor Google Docs ke teks.');
      const text = await res.text();
      return { text, mimeType: 'text/plain' };
    }

    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Gagal mengunduh file dari Google Drive.');

    const blob = await res.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const raw = result.split(',')[1] || result;
        resolve(raw);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return { base64, mimeType };
  }

  // Create Google Doc in target folder
  async createGoogleDoc(
    folderId: string,
    title: string,
    plainTextContent: string
  ): Promise<{ docId: string; webViewLink: string }> {
    const token = await this.requestAccessToken();

    const metadata: any = {
      name: title,
      mimeType: 'application/vnd.google-apps.document',
    };
    if (folderId) {
      metadata.parents = [folderId];
    }

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(`Gagal membuat berkas Google Docs di Drive: ${err.error?.message || createRes.statusText}`);
    }

    const docFile = await createRes.json();
    const docId = docFile.id;

    if (plainTextContent) {
      const docsApiUrl = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;
      const updateRes = await fetch(docsApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: plainTextContent,
              },
            },
          ],
        }),
      });

      if (!updateRes.ok) {
        console.warn('Gagal memasukkan teks via Docs API:', await updateRes.text());
      }
    }

    const getFileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}?fields=id,webViewLink`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const fileData = await getFileRes.json();

    return {
      docId,
      webViewLink: fileData.webViewLink || `https://docs.google.com/document/d/${docId}/edit`,
    };
  }

  // Export Google Doc to PDF in target Final folder
  async exportDocToPdfAndSave(
    docId: string,
    targetFolderId: string,
    pdfTitle: string
  ): Promise<{ fileId: string; webViewLink: string }> {
    const token = await this.requestAccessToken();

    const exportUrl = `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/pdf`;
    const res = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Gagal mengekspor Google Docs ke format PDF.');

    const pdfBlob = await res.blob();

    const metadata: any = {
      name: pdfTitle.endsWith('.pdf') ? pdfTitle : `${pdfTitle}.pdf`,
      mimeType: 'application/pdf',
    };
    if (targetFolderId) {
      metadata.parents = [targetFolderId];
    }

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('file', pdfBlob);

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(`Gagal menyimpan PDF hasil finalisasi ke folder Drive: ${err.error?.message || uploadRes.statusText}`);
    }

    const uploaded = await uploadRes.json();
    return {
      fileId: uploaded.id,
      webViewLink: `https://drive.google.com/file/d/${uploaded.id}/view`,
    };
  }
}

export const googleDriveService = new GoogleDriveService();
