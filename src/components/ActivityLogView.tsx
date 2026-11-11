import React, { useState, useMemo } from 'react';
import { AktivitasLog, UserRole } from '../types';
import {
  History,
  FileSpreadsheet,
  Search,
  Filter,
  User,
  Clock,
  Cpu,
  FileText,
  Calendar,
} from 'lucide-react';

interface ActivityLogViewProps {
  logs: AktivitasLog[];
  activeRole: UserRole;
  onExportCsvLogs: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  logs,
  activeRole,
  onExportCsvLogs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('Semua');
  const [filterAksi, setFilterAksi] = useState<string>('Semua');

  // Unique actions list
  const uniqueAksiList = useMemo(() => {
    const set = new Set(logs.map((l) => l.aksi));
    return Array.from(set);
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase();
      if (q) {
        const matchAction = log.aksi?.toLowerCase().includes(q);
        const matchUser = log.pengguna?.toLowerCase().includes(q);
        const matchDetail = log.detail?.toLowerCase().includes(q);
        const matchModel = log.model?.toLowerCase().includes(q);
        if (!matchAction && !matchUser && !matchDetail && !matchModel) {
          return false;
        }
      }

      if (filterRole !== 'Semua' && log.peran !== filterRole) {
        return false;
      }

      if (filterAksi !== 'Semua' && log.aksi !== filterAksi) {
        return false;
      }

      return true;
    });
  }, [logs, searchQuery, filterRole, filterAksi]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Log Audit & Riwayat Aktivitas Sistem
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh aksi (unggah, ekstraksi AI, koreksi, buat draft PKS, ubah status, sinkronisasi) tercatat lengkap dengan stempel waktu dan versi prompt/model.
            </p>
          </div>
        </div>

        <button
          onClick={onExportCsvLogs}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-center"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Ekspor Log (CSV)</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari log berdasarkan kata kunci aksi, pengguna, atau detail..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filter Peran */}
        <div className="flex items-center space-x-2">
          <label className="text-slate-500 font-semibold whitespace-nowrap">Peran:</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="Semua">Semua Peran</option>
            <option value="Staf">Staf</option>
            <option value="Reviewer">Reviewer</option>
            <option value="Pimpinan">Pimpinan</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        {/* Filter Aksi */}
        <div className="flex items-center space-x-2">
          <label className="text-slate-500 font-semibold whitespace-nowrap">Aksi:</label>
          <select
            value={filterAksi}
            onChange={(e) => setFilterAksi(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:ring-1 focus:ring-blue-500 max-w-xs truncate"
          >
            <option value="Semua">Semua Aksi</option>
            {uniqueAksiList.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Waktu</th>
              <th className="py-3 px-3">Pengguna & Peran</th>
              <th className="py-3 px-3">Aksi</th>
              <th className="py-3 px-4">Rincian Aktivitas</th>
              <th className="py-3 px-3 text-right">Spesifikasi AI / Template</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  Tidak ada log yang sesuai dengan filter pencarian.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  {/* Waktu */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                    <div>
                      {new Date(log.waktu).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(log.waktu).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </td>

                  {/* Pengguna & Peran */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-bold text-slate-800">{log.pengguna}</div>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-bold ${
                        log.peran === 'Admin'
                          ? 'bg-amber-100 text-amber-800'
                          : log.peran === 'Pimpinan'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.peran === 'Reviewer'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.peran}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-900">
                    {log.aksi}
                  </td>

                  {/* Rincian Aktivitas */}
                  <td className="py-3 px-4 text-slate-700 leading-relaxed max-w-md">
                    {log.detail}
                  </td>

                  {/* Spesifikasi Model & Versi */}
                  <td className="py-3 px-3 whitespace-nowrap text-right text-[10px] font-mono text-slate-500">
                    <div>Prompt: {log.versiPrompt}</div>
                    <div>Template: {log.versiTemplate}</div>
                    <div className="text-blue-600 font-semibold">{log.model}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
