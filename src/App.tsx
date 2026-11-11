import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DokumenKerjasama,
  AktivitasLog,
  PengaturanApp,
  AntreanItem,
  UserRole,
  StatusDokumen,
  CatatanReviewer,
  TindakLanjut,
} from './types';
import { storageService, DEFAULT_SETTINGS, SAMPLE_DOCUMENTS } from './services/storageService';
import { googleDriveService } from './services/googleDriveService';
import { calculateSisaHari, computeLiveStatus, generateUniformFileName } from './utils/documentUtils';

import { Navbar } from './components/Navbar';
import { SecurityBanner } from './components/SecurityBanner';
import { DriveModal } from './components/DriveModal';
import { DashboardView } from './components/DashboardView';
import { ArchiveView } from './components/ArchiveView';
import { UploadSyncView } from './components/UploadSyncView';
import { VerificationView } from './components/VerificationView';
import { DocumentDetailView } from './components/DocumentDetailView';
import { CreatePksWizard } from './components/CreatePksWizard';
import { RemindersView } from './components/RemindersView';
import { AskDocumentView } from './components/AskDocumentView';
import { SettingsView } from './components/SettingsView';
import { ActivityLogView } from './components/ActivityLogView';

export default function App() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeRole, setActiveRole] = useState<UserRole>('Staf');

  // Core Data State
  const [documents, setDocuments] = useState<DokumenKerjasama[]>([]);
  const [logs, setLogs] = useState<AktivitasLog[]>([]);
  const [settings, setSettings] = useState<PengaturanApp>(DEFAULT_SETTINGS);
  const [queue, setQueue] = useState<AntreanItem[]>([]);

  // Selection for Detail and Verification
  const [selectedDocument, setSelectedDocument] = useState<DokumenKerjasama | null>(null);
  const [selectedQueueItem, setSelectedQueueItem] = useState<AntreanItem | null>(null);

  // Google Drive & Sync State
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

  const isDemoMode = !settings.googleClientId || settings.googleClientId.trim() === '';

  // Load Initial Data from Storage
  const loadData = useCallback(async () => {
    const docs = await storageService.getAllDocuments();
    const lgs = await storageService.getAllLogs();
    const stt = await storageService.getSettings();
    const que = await storageService.getAllQueue();

    setDocuments(docs);
    setLogs(lgs);
    setSettings(stt);
    setQueue(que);

    // If client ID is present, initialize token client
    if (stt.googleClientId) {
      googleDriveService.initTokenClient(stt.googleClientId, () => {
        setIsDriveConnected(true);
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Log Helper
  const recordLog = async (
    aksi: string,
    detail: string,
    dokumenId?: string
  ) => {
    const newLog: AktivitasLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      waktu: new Date().toISOString(),
      pengguna: activeRole,
      peran: activeRole,
      aksi,
      dokumenId,
      detail,
      versiPrompt: settings.versiPrompt || 'v0.1',
      versiTemplate: settings.versiTemplatePks || 'v1.2-resmi',
      model: settings.modelName || 'gemini-3.8-flash',
    };

    await storageService.addLog(newLog);
    const updated = await storageService.getAllLogs();
    setLogs(updated);
  };

  // Process Document in Queue with Gemini AI
  const processQueueItem = async (item: AntreanItem) => {
    // Set status to Memproses
    const processingItem: AntreanItem = {
      ...item,
      status: 'Memproses',
      progress: 30,
    };
    await storageService.saveQueueItem(processingItem);
    setQueue(await storageService.getAllQueue());

    try {
      let extractedData: any = null;
      let rawText = item.rawText || '';

      // If item has base64 PDF
      if (item.pdfBase64) {
        const res = await fetch('/api/gemini/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64: item.pdfBase64,
            fileName: item.namaFile,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Gagal mengekstrak PDF');
        extractedData = json.data;
      } else if (rawText) {
        const res = await fetch('/api/gemini/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: rawText,
            fileName: item.namaFile,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Gagal mengekstrak teks');
        extractedData = json.data;
      } else {
        throw new Error('Data berkas tidak dapat dibaca.');
      }

      const completedItem: AntreanItem = {
        ...processingItem,
        status: 'Perlu verifikasi',
        progress: 100,
        dataEkstraksi: extractedData,
        rawText,
      };

      await storageService.saveQueueItem(completedItem);
      setQueue(await storageService.getAllQueue());

      await recordLog(
        'Ekstraksi Metadata Gemini AI',
        `Ekstraksi dokumen "${item.namaFile}" selesai via ${settings.modelName}. Menunggu verifikasi staf.`
      );
    } catch (err: any) {
      console.error('Queue processing error:', err);
      const failedItem: AntreanItem = {
        ...processingItem,
        status: 'Gagal',
        pesanError: err.message || 'Kesalahan saat ekstraksi AI',
        progress: 0,
      };
      await storageService.saveQueueItem(failedItem);
      setQueue(await storageService.getAllQueue());

      await recordLog(
        'Gagal Ekstraksi AI',
        `Ekstraksi berkas "${item.namaFile}" gagal: ${err.message || 'Error'}`
      );
    }
  };

  // Add Manual Files to Queue
  const handleAddManualFiles = async (files: File[]) => {
    for (const file of files) {
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      const isDocx =
        file.name.toLowerCase().endsWith('.docx') ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      let pdfBase64: string | undefined;
      let rawText: string | undefined;

      if (isPdf) {
        // Read as base64
        pdfBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result as string;
            resolve(res.split(',')[1] || res);
          };
          reader.readAsDataURL(file);
        });
      } else if (isDocx) {
        // Read as base64 and parse on backend
        const docxBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result as string;
            resolve(res.split(',')[1] || res);
          };
          reader.readAsDataURL(file);
        });

        try {
          const parseRes = await fetch('/api/document/parse-docx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64: docxBase64 }),
          });
          const parsed = await parseRes.json();
          rawText = parsed.text || '';
        } catch (e) {
          console.warn('Gagal membaca docx via server:', e);
        }
      }

      const queueItem: AntreanItem = {
        id: 'q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        namaFile: file.name,
        ukuran: file.size,
        mimeType: file.type || (isPdf ? 'application/pdf' : 'application/docx'),
        sumber: 'Unggah',
        status: 'Menunggu',
        progress: 0,
        pdfBase64,
        rawText,
        ditambahkanPada: new Date().toISOString(),
      };

      await storageService.saveQueueItem(queueItem);
      // Auto-trigger AI processing
      processQueueItem(queueItem);
    }

    setQueue(await storageService.getAllQueue());
    await recordLog(
      'Unggah Dokumen Manual',
      `${files.length} berkas berhasil diunggah dan dimasukkan ke antrean pemrosesan AI.`
    );
  };

  // Sync with Drive (Real or Simulated Demo)
  const handleSyncWithDrive = async () => {
    setIsSyncing(true);
    try {
      if (isDemoMode) {
        // Demo Simulation Sync: simulate checking folder 'Arsip MoU-PKS'
        await new Promise((r) => setTimeout(r, 1500));
        const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(nowStr);

        await recordLog(
          'Simulasi Sinkronisasi Folder Drive (Mode Demo)',
          `Folder "${settings.folderSumberNama}" diperiksa. Seluruh berkas contoh telah mutakhir.`
        );
      } else {
        // Real Google Drive Sync via Drive API v3
        const driveFiles = await googleDriveService.listFilesInFolder(settings.folderSumberId);
        const existingDocs = await storageService.getAllDocuments();
        let newCount = 0;
        let updatedCount = 0;

        for (const file of driveFiles) {
          const existing = existingDocs.find((d) => d.driveFileId === file.id);

          if (!existing) {
            // New file in Drive -> Add to Queue
            newCount++;
            const { base64, text } = await googleDriveService.downloadFile(file.id, file.mimeType);

            const queueItem: AntreanItem = {
              id: 'q-drive-' + file.id,
              namaFile: file.name,
              ukuran: parseInt(file.size || '0', 10),
              mimeType: file.mimeType,
              sumber: 'Google Drive',
              driveFileId: file.id,
              status: 'Menunggu',
              progress: 0,
              pdfBase64: base64,
              rawText: text,
              ditambahkanPada: new Date().toISOString(),
            };

            await storageService.saveQueueItem(queueItem);
            processQueueItem(queueItem);
          } else {
            // File changed -> Create new version in history
            const docModifiedTime = new Date(existing.updatedAt).getTime();
            const driveModifiedTime = new Date(file.modifiedTime).getTime();

            if (driveModifiedTime > docModifiedTime + 60000) {
              updatedCount++;
              const newVersiNo = (existing.versi?.length || 1) + 1;
              existing.versi = [
                ...(existing.versi || []),
                {
                  versiNomor: newVersiNo,
                  tanggal: new Date().toISOString(),
                  diubahOleh: 'Sinkronisasi Google Drive',
                  catatan: `Berkas diperbarui di Drive pada ${new Date(file.modifiedTime).toLocaleString('id-ID')}`,
                },
              ];
              existing.updatedAt = new Date().toISOString();
              await storageService.saveDocument(existing);
            }
          }
        }

        // Check for deleted files in Drive
        for (const doc of existingDocs) {
          if (doc.driveFileId && !driveFiles.some((f) => f.id === doc.driveFileId)) {
            doc.isDeletedInDrive = true;
            await storageService.saveDocument(doc);
          }
        }

        const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(nowStr);
        setDocuments(await storageService.getAllDocuments());
        setQueue(await storageService.getAllQueue());

        await recordLog(
          'Sinkronisasi Google Drive',
          `Sinkronisasi selesai: ${newCount} berkas baru diantrekan, ${updatedCount} berkas diperbarui versinya.`
        );
      }
    } catch (err: any) {
      console.error('Sync failed:', err);
      alert('Gagal menyinkronkan Google Drive: ' + err.message);
      await recordLog('Gagal Sinkronisasi Drive', err.message || 'Kesalahan jaringan');
    } finally {
      setIsSyncing(false);
    }
  };

  // Automatic Background Sync Interval
  useEffect(() => {
    if (settings.syncIntervalMenit <= 0) return;
    const intervalMs = settings.syncIntervalMenit * 60 * 1000;
    const timer = setInterval(() => {
      handleSyncWithDrive();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [settings.syncIntervalMenit, isDemoMode]);

  // Save Verified Document to Archive
  const handleSaveToArchive = async (doc: DokumenKerjasama, fromQueueId?: string) => {
    await storageService.saveDocument(doc);
    if (fromQueueId) {
      await storageService.deleteQueueItem(fromQueueId);
    }
    setDocuments(await storageService.getAllDocuments());
    setQueue(await storageService.getAllQueue());

    await recordLog(
      'Verifikasi Dokumen Resmi',
      `Dokumen "${doc.namaFile}" (Mitra: ${doc.mitra}) diverifikasi dan disimpan ke arsip resmi.`,
      doc.id
    );

    setSelectedDocument(doc);
    setActiveTab('detail');
  };

  // Delete Document
  const handleDeleteDocument = async (id: string, judul: string) => {
    if (activeRole !== 'Admin') {
      alert('Hanya peran Admin yang berwenang menghapus dokumen arsip.');
      return;
    }
    if (confirm(`Yakin ingin menghapus dokumen "${judul}" dari arsip?`)) {
      await storageService.deleteDocument(id);
      setDocuments(await storageService.getAllDocuments());
      await recordLog('Hapus Dokumen Arsip', `Dokumen "${judul}" dihapus oleh Admin.`, id);
      if (selectedDocument?.id === id) {
        setSelectedDocument(null);
        setActiveTab('arsip');
      }
    }
  };

  // Update Status in Detail View
  const handleUpdateStatus = async (
    newStatus: StatusDokumen,
    catatan: string,
    changedBy: string
  ) => {
    if (!selectedDocument) return;

    const oldStatus = selectedDocument.status;
    const updatedDoc: DokumenKerjasama = {
      ...selectedDocument,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      versi: [
        ...(selectedDocument.versi || []),
        {
          versiNomor: (selectedDocument.versi?.length || 1) + 1,
          tanggal: new Date().toISOString(),
          diubahOleh: changedBy,
          catatan: `Perubahan status: ${oldStatus} -> ${newStatus}. ${catatan}`,
        },
      ],
    };

    await storageService.saveDocument(updatedDoc);
    setDocuments(await storageService.getAllDocuments());
    setSelectedDocument(updatedDoc);

    await recordLog(
      'Pembaruan Status Dokumen',
      `Status diubah dari ${oldStatus} menjadi ${newStatus}. Catatan: ${catatan}`,
      selectedDocument.id
    );
  };

  // Add Reviewer Note
  const handleAddReviewerNote = async (note: Omit<CatatanReviewer, 'id' | 'tanggal'>) => {
    if (!selectedDocument) return;

    const newNote: CatatanReviewer = {
      ...note,
      id: 'cat-' + Date.now(),
      tanggal: new Date().toISOString(),
    };

    const updatedDoc: DokumenKerjasama = {
      ...selectedDocument,
      catatanReviewer: [...(selectedDocument.catatanReviewer || []), newNote],
      updatedAt: new Date().toISOString(),
    };

    await storageService.saveDocument(updatedDoc);
    setDocuments(await storageService.getAllDocuments());
    setSelectedDocument(updatedDoc);

    await recordLog(
      'Tambah Catatan Reviewer',
      `Catatan telaah ditambahkan oleh ${note.penulis} (${note.pasalRujukan || 'Umum'}): ${note.isi}`,
      selectedDocument.id
    );
  };

  // Regenerate Summary
  const handleRegenerateSummary = async (doc: DokumenKerjasama) => {
    setIsSummarizing(true);
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentData: doc,
          fullText: doc.rawText || doc.ruangLingkup,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Gagal merangkum');

      const updatedDoc: DokumenKerjasama = {
        ...doc,
        ringkasanAi: json.summary,
        updatedAt: new Date().toISOString(),
      };

      await storageService.saveDocument(updatedDoc);
      setDocuments(await storageService.getAllDocuments());
      setSelectedDocument(updatedDoc);

      await recordLog(
        'Regenerasi Ringkasan AI',
        `Ringkasan eksekutif dokumen "${doc.namaFile}" diperbarui via Gemini 3.8 Flash.`,
        doc.id
      );
    } catch (err: any) {
      alert('Gagal membuat ringkasan: ' + err.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Tindak Lanjut Action from Reminders
  const handleTindakLanjut = async (docId: string, tindakLanjut: TindakLanjut) => {
    const doc = await storageService.getDocumentById(docId);
    if (!doc) return;

    doc.tindakLanjut = tindakLanjut;
    doc.updatedAt = new Date().toISOString();
    await storageService.saveDocument(doc);
    setDocuments(await storageService.getAllDocuments());

    await recordLog(
      'Tindak Lanjut Masa Berlaku',
      `Dokumen "${doc.namaFile}" ditandai: ${tindakLanjut.status}. Catatan: ${tindakLanjut.catatan}`,
      doc.id
    );
  };

  // Export CSV
  const handleExportCsv = async () => {
    const csvContent = await storageService.exportToCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Arsip_Kerjasama_BPT_Komdigi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    await recordLog('Ekspor CSV Arsip', 'Daftar arsip dokumen diekspor ke format CSV.');
  };

  // Export JSON
  const handleExportJson = async () => {
    const jsonContent = await storageService.exportToJson();
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KerjasamaBPT_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    await recordLog('Ekspor Cadangan JSON', 'Seluruh arsip, pengaturan, dan log dicadangkan ke format JSON.');
  };

  // Import JSON
  const handleImportJson = async (jsonString: string) => {
    const res = await storageService.importFromJson(jsonString);
    if (res.success) {
      await loadData();
      alert(`Berhasil mengimpor ${res.count} dokumen kerja sama!`);
    } else {
      alert('Gagal mengimpor JSON: ' + res.error);
    }
  };

  // Export Activity Logs to CSV
  const handleExportCsvLogs = () => {
    const headers = ['ID', 'Waktu', 'Pengguna', 'Peran', 'Aksi', 'Rincian', 'Prompt', 'Template', 'Model'];
    const rows = logs.map((l) => [
      `"${l.id}"`,
      `"${l.waktu}"`,
      `"${l.pengguna}"`,
      `"${l.peran}"`,
      `"${l.aksi}"`,
      `"${(l.detail || '').replace(/"/g, '""')}"`,
      `"${l.versiPrompt}"`,
      `"${l.versiTemplate}"`,
      `"${l.model}"`,
    ]);

    const csvStr = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Log_Aktivitas_KerjasamaBPT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset to Sample Data
  const handleResetSampleData = async () => {
    await storageService.resetToSampleData();
    await loadData();
    await recordLog('Reset Data Contoh', 'Seluruh data direset kembali ke 3 dokumen contoh realistis BPT Komdigi.');
    setActiveTab('dashboard');
  };

  // Critical Reminders Count for Navbar Badge
  const criticalReminderCount = documents.filter((d) => {
    const sisa = calculateSisaHari(d.tanggalBerakhir);
    return sisa !== null && sisa >= 0 && sisa <= 30;
  }).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        isDemoMode={isDemoMode}
        isDriveConnected={isDriveConnected}
        queueCount={queue.filter((q) => q.status === 'Perlu verifikasi').length}
        criticalReminderCount={criticalReminderCount}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
      />

      {/* Security Notice Banner */}
      <SecurityBanner />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            documents={documents}
            logs={logs}
            settings={settings}
            activeRole={activeRole}
            isDriveConnected={isDriveConnected}
            isDemoMode={isDemoMode}
            lastSyncTime={lastSyncTime}
            onSyncNow={handleSyncWithDrive}
            isSyncing={isSyncing}
            onNavigateTab={setActiveTab}
            onSelectDocument={(doc) => {
              setSelectedDocument(doc);
              setActiveTab('detail');
            }}
          />
        )}

        {activeTab === 'arsip' && (
          <ArchiveView
            documents={documents}
            settings={settings}
            activeRole={activeRole}
            onSelectDocument={(doc) => {
              setSelectedDocument(doc);
              setActiveTab('detail');
            }}
            onDeleteDocument={handleDeleteDocument}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onNavigateTab={setActiveTab}
            onStartVerify={(doc) => {
              setSelectedDocument(doc);
              setSelectedQueueItem(null);
              setActiveTab('verifikasi');
            }}
          />
        )}

        {activeTab === 'unggah-sinkron' && (
          <UploadSyncView
            queue={queue}
            settings={settings}
            activeRole={activeRole}
            isDriveConnected={isDriveConnected}
            isDemoMode={isDemoMode}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            onSyncNow={handleSyncWithDrive}
            onOpenDriveModal={() => setIsDriveModalOpen(true)}
            onAddManualFiles={handleAddManualFiles}
            onProcessQueueItem={processQueueItem}
            onRetryQueueItem={processQueueItem}
            onDeleteQueueItem={async (id) => {
              await storageService.deleteQueueItem(id);
              setQueue(await storageService.getAllQueue());
            }}
            onNavigateToVerify={(item) => {
              setSelectedQueueItem(item);
              setSelectedDocument(null);
              setActiveTab('verifikasi');
            }}
          />
        )}

        {activeTab === 'verifikasi' && (
          <VerificationView
            selectedItem={selectedQueueItem}
            existingDoc={selectedDocument}
            settings={settings}
            activeRole={activeRole}
            onSaveToArchive={handleSaveToArchive}
            onBack={() => {
              if (selectedDocument) setActiveTab('detail');
              else setActiveTab('unggah-sinkron');
            }}
          />
        )}

        {activeTab === 'detail' && selectedDocument && (
          <DocumentDetailView
            document={selectedDocument}
            logs={logs}
            activeRole={activeRole}
            onBack={() => setActiveTab('arsip')}
            onUpdateStatus={handleUpdateStatus}
            onAddReviewerNote={handleAddReviewerNote}
            onRegenerateSummary={handleRegenerateSummary}
            isSummarizing={isSummarizing}
            onStartVerify={(doc) => {
              setSelectedDocument(doc);
              setSelectedQueueItem(null);
              setActiveTab('verifikasi');
            }}
          />
        )}

        {activeTab === 'buat-pks' && (
          <CreatePksWizard
            documents={documents}
            settings={settings}
            activeRole={activeRole}
            isDriveConnected={isDriveConnected}
            isDemoMode={isDemoMode}
            onSaveNewPks={(newDoc) => {
              storageService.saveDocument(newDoc).then(async () => {
                setDocuments(await storageService.getAllDocuments());
                await recordLog('Penyusunan Draft PKS Baru', `Draft PKS "${newDoc.judul}" berhasil dibuat.`, newDoc.id);
                setSelectedDocument(newDoc);
              });
            }}
            onNavigateTab={setActiveTab}
            onOpenDriveModal={() => setIsDriveModalOpen(true)}
          />
        )}

        {activeTab === 'pengingat' && (
          <RemindersView
            documents={documents}
            activeRole={activeRole}
            onSelectDocument={(doc) => {
              setSelectedDocument(doc);
              setActiveTab('detail');
            }}
            onTindakLanjut={handleTindakLanjut}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'tanya-dokumen' && (
          <AskDocumentView documents={documents} activeRole={activeRole} />
        )}

        {activeTab === 'pengaturan' && (
          <SettingsView
            settings={settings}
            activeRole={activeRole}
            onSaveSettings={async (newSettings) => {
              await storageService.saveSettings(newSettings);
              setSettings(newSettings);
              await recordLog('Ubah Pengaturan Sistem', 'Admin memperbarui konfigurasi sistem.');
            }}
            onResetSampleData={handleResetSampleData}
          />
        )}

        {activeTab === 'log' && (
          <ActivityLogView
            logs={logs}
            activeRole={activeRole}
            onExportCsvLogs={handleExportCsvLogs}
          />
        )}
      </main>

      {/* Google Drive Connection & Demo Modal */}
      <DriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        clientId={settings.googleClientId}
        onNavigateToSettings={() => setActiveTab('pengaturan')}
        onTriggerDemoSync={handleSyncWithDrive}
        isDriveConnected={isDriveConnected}
        onDriveConnectedChange={setIsDriveConnected}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">KerjasamaBPT</span>
            <span>&bull;</span>
            <span>Balai Pengujian Telekomunikasi (BPT)</span>
            <span>&bull;</span>
            <span className="text-slate-400">Kementerian Komunikasi dan Digital RI</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Didukung oleh Gemini 3.8 Flash & Google Drive Integration
          </div>
        </div>
      </footer>
    </div>
  );
}
