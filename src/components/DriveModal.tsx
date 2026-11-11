import React, { useState } from 'react';
import {
  HardDrive,
  X,
  CheckCircle2,
  RefreshCw,
  FolderSync,
  ExternalLink,
  Settings,
  FolderOpen,
  LogOut,
  User,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { googleDriveService } from '../services/googleDriveService';
import firebaseConfig from '../../firebase-applet-config.json';

interface DriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onNavigateToSettings: () => void;
  onTriggerDemoSync: () => void;
  isDriveConnected: boolean;
  onDriveConnectedChange: (connected: boolean) => void;
}

export const DriveModal: React.FC<DriveModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onNavigateToSettings,
  onTriggerDemoSync,
  isDriveConnected,
  onDriveConnectedChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const currentUser = googleDriveService.getCurrentUser();

  const handleConnect = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await googleDriveService.requestAccessToken();
      onDriveConnectedChange(true);
      setSuccessMsg('Google Drive dan Google Docs berhasil tersambung!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Connection error:', err);
      setErrorMsg(err.message || 'Gagal menghubungkan Google Drive. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await googleDriveService.disconnect();
    onDriveConnectedChange(false);
    setSuccessMsg('Koneksi Google Drive telah diputuskan.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-inner">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Integrasi Google Drive & Docs</h3>
              <p className="text-xs text-slate-400">Balai Pengujian Telekomunikasi (BPT Komdigi)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {isDriveConnected ? (
            <div className="space-y-4">
              {/* Connected Status Card */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-lg mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      Akun Google Drive Aktif Terhubung
                    </div>
                    {currentUser?.email ? (
                      <div className="text-xs text-emerald-800 font-semibold mt-0.5 flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{currentUser.email}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        Token otorisasi aktif di memori sesi browser.
                      </div>
                    )}
                    <div className="text-[10px] text-emerald-600 mt-1 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Izin: Drive (Arsip MoU-PKS) & Docs (Penyusunan Draft PKS)</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition cursor-pointer flex items-center space-x-1"
                  title="Putuskan sesi koneksi Google Drive"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Putuskan</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    onClose();
                    onTriggerDemoSync();
                  }}
                  className="flex items-center justify-center space-x-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  <span>Sinkronkan Sekarang</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigateToSettings();
                  }}
                  className="flex items-center justify-center space-x-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-600" />
                  <span>Atur Folder di Pengaturan</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed">
                Hubungkan akun Google Anda untuk mengaktifkan sinkronisasi otomatis folder <strong>Arsip MoU-PKS</strong> dan pembuatan berkas kerja sama di <strong>Google Docs</strong> secara langsung.
              </div>

              {/* Features list */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Kemampuan yang Diaktifkan:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                  <li>Deteksi otomatis berkas PDF/DOCX baru di folder sumber Google Drive</li>
                  <li>Pembuatan berkas draft PKS langsung ke folder Google Docs</li>
                  <li>Penyuntingan bersama real-time oleh Staf dan Reviewer Hukum</li>
                  <li>Ekspor dokumen terfinalisasi ke format PDF di folder resmi</li>
                </ul>
              </div>

              {/* Official Google Sign In Button */}
              <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menghubungkan ke Google...</span>
                  </>
                ) : (
                  <>
                    {/* Official Google 'G' icon */}
                    <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.96 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Hubungkan dengan Akun Google</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Ingin mengubah ID folder arsip?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToSettings();
                  }}
                  className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center space-x-1"
                >
                  <Settings className="w-3 h-3" />
                  <span>Buka Menu Pengaturan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
