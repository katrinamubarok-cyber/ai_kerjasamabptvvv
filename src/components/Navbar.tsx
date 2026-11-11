import React from 'react';
import { UserRole } from '../types';
import {
  FileText,
  ShieldCheck,
  HardDrive,
  Users,
  AlertTriangle,
  CheckCircle2,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  isDemoMode: boolean;
  isDriveConnected: boolean;
  queueCount: number;
  criticalReminderCount: number;
  onOpenDriveModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeRole,
  setActiveRole,
  isDemoMode,
  isDriveConnected,
  queueCount,
  criticalReminderCount,
  onOpenDriveModal,
}) => {
  const roles: UserRole[] = ['Staf', 'Reviewer', 'Pimpinan', 'Admin'];

  const roleDescriptions: Record<UserRole, string> = {
    Staf: 'Unggah, ekstraksi AI, buat draft, ubah status awal (Draft -> Review)',
    Reviewer: 'Review & beri catatan berpasal, rekomendasi persetujuan status review',
    Pimpinan: 'Menyetujui dokumen (Persetujuan -> Ditandatangani) & tanda tangan',
    Admin: 'Konfigurasi sistem, template PKS, integrasi Google Drive, dan log audit',
  };

  const roleBadgeColors: Record<UserRole, string> = {
    Staf: 'bg-blue-100 text-blue-800 border-blue-200',
    Reviewer: 'bg-purple-100 text-purple-800 border-purple-200',
    Pimpinan: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Admin: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'arsip', label: 'Arsip Dokumen', icon: 'Archive' },
    { id: 'unggah-sinkron', label: 'Unggah & Drive', icon: 'UploadCloud', badge: queueCount },
    { id: 'verifikasi', label: 'Verifikasi Ekstraksi', icon: 'FileCheck' },
    { id: 'buat-pks', label: 'Buat PKS Baru', icon: 'PlusCircle' },
    { id: 'pengingat', label: 'Pengingat Masa Berlaku', icon: 'CalendarClock', badge: criticalReminderCount, badgeColor: 'bg-red-500' },
    { id: 'tanya-dokumen', label: 'Tanya Dokumen', icon: 'MessageSquareCode' },
    { id: 'pengaturan', label: 'Pengaturan', icon: 'Settings' },
    { id: 'log', label: 'Log Aktivitas', icon: 'History' },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Bar: Brand, Status, and Role Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center shadow-inner">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-white to-blue-300">
                  KerjasamaBPT
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-900/60 border border-blue-700 text-blue-300">
                  BPT Komdigi
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Manajemen MoU & PKS • Balai Pengujian Telekomunikasi
              </p>
            </div>
          </div>

          {/* Right Controls: Drive Status & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Drive Connection Status Pill */}
            {isDemoMode ? (
              <button
                onClick={onOpenDriveModal}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
                title="Google OAuth Client ID belum diatur. Berjalan dalam Mode Demo."
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline font-semibold">MODE DEMO</span>
                <span className="text-amber-400/80 hidden lg:inline">• Unggah Manual</span>
              </button>
            ) : isDriveConnected ? (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Drive Terhubung</span>
              </div>
            ) : (
              <button
                onClick={onOpenDriveModal}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 transition-all cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Sambung Drive</span>
              </button>
            )}

            {/* Prototype Role Switcher */}
            <div className="relative flex items-center bg-slate-800/90 border border-slate-700 rounded-lg p-1">
              <div className="flex items-center space-x-1.5 px-2 text-xs text-slate-300 font-medium">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Peran:</span>
              </div>
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2.5 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                title={roleDescriptions[activeRole]}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div
                className={`ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold border hidden lg:inline-block ${roleBadgeColors[activeRole]}`}
                title={roleDescriptions[activeRole]}
              >
                {activeRole}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-950/70 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex space-x-1 py-1.5 min-w-max">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
                      item.badgeColor || 'bg-blue-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
