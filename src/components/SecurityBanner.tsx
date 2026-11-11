import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Check } from 'lucide-react';

export const SecurityBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState<boolean>(true);

  useEffect(() => {
    const isDismissed = localStorage.getItem('k_bpt_security_banner_dismissed');
    if (!isDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('k_bpt_security_banner_dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p>
            <span className="font-semibold text-amber-950">Pemberitahuan Keamanan & Privasi:</span>{' '}
            Dokumen kerja sama dapat memuat data sensitif. Pastikan penggunaan layanan AI sesuai kebijakan keamanan
            informasi BPT Komdigi. Semua pemrosesan AI dijalankan secara server-side dan tidak menyimpan rekaman data privat secara permanen.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-medium transition cursor-pointer flex-shrink-0"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Saya Mengerti</span>
        </button>
      </div>
    </div>
  );
};
