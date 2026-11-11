import React, { useState } from 'react';
import {
  HardDrive,
  X,
  AlertTriangle,
  ExternalLink,
  Settings,
  CheckCircle2,
  RefreshCw,
  FolderSync,
} from 'lucide-react';
import { googleDriveService } from '../services/googleDriveService';

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

  if (!isOpen) return null;

  const handleConnect = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      googleDriveService.initTokenClient(clientId, () => {
        onDriveConnectedChange(true);
      });
      await googleDriveService.requestAccessToken();
      onDriveConnectedChange(true);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyambungkan Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    googleDriveService.disconnect();
    onDriveConnectedChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded-lg">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Integrasi Google Drive & Docs</h3>
              <p className="text-xs text-slate-400">Google Drive API v3 & Docs API v1</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!clientId ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <div className="font-bold text-amber-950">Aplikasi Berjalan dalam MODE DEMO</div>
                  <p>
                    Kolom <strong>Google OAuth Client ID</strong> belum diisi pada menu Pengaturan. Sesuai kebijakan
                    keamanan, kredensial OAuth tidak ditulis permanen di dalam kode aplikasi.
                  </p>
                  <p className="text-amber-800">
                    Dalam Mode Demo: fitur unggah manual (PDF/DOCX) dan ekstraksi AI tetap berfungsi penuh menggunakan 3
                    dokumen contoh realistis BPT Komdigi.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50 text-xs space-y-2">
                <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Fitur saat Google Drive tersambung:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li>Sinkronisasi berkas otomatis setiap 5 menit dari folder <em>Arsip MoU-PKS</em></li>
                  <li>Pembuatan berkas draft PKS langsung di Google Docs (folder <em>PKS - Draft</em>)</li>
                  <li>Penyuntingan bersama secara kolaboratif staf dan reviewer</li>
                  <li>Ekspor dokumen terfinalisasi ke PDF di folder <em>PKS - Final</em></li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToSettings();
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  <span>Atur Client ID di Pengaturan</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onTriggerDemoSync();
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  <FolderSync className="w-4 h-4 text-slate-600" />
                  <span>Simulasi Sinkronisasi Demo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                <div className="font-bold text-blue-950 mb-1">Google OAuth Client ID Terkonfigurasi</div>
                <p className="text-blue-800 font-mono text-[11px] truncate">
                  Client ID: {clientId.slice(0, 16)}...{clientId.slice(-10)}
                </p>
                <p className="mt-1 text-blue-700">
                  Token otorisasi hanya disimpan sementara di memori sesi aktif dan akan dimintakan persetujuan saat pertama kali tersambung.
                </p>
              </div>

              {isDriveConnected ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">Google Drive Aktif Terhubung</div>
                      <div className="text-[11px] text-emerald-700">Siap melakukan sinkronisasi folder arsip</div>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="px-3 py-1.5 rounded text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                  >
                    Putuskan
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Klik tombol di bawah untuk membuka dialog otorisasi akun Google (GIS OAuth 2.0). Izin mencakup pembacaan folder arsip dan penulisan dokumen draft PKS.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menghubungkan ke Google...</span>
                      </>
                    ) : (
                      <>
                        <HardDrive className="w-4 h-4" />
                        <span>Hubungkan Sekarang dengan Google</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {errorMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
