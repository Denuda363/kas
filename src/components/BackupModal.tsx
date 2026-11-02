import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { exportBackupData, importBackupData, resetToDefaultData, isAdmin } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    try {
      const jsonStr = exportBackupData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_BukuKas_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: 'File cadangan JSON berhasil diunduh.' });
    } catch {
      setStatusMsg({ type: 'error', text: 'Gagal mengekspor file cadangan.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const success = await importBackupData(content);
        if (success) {
          setStatusMsg({ type: 'success', text: 'Data pembukuan berhasil dipulihkan!' });
        } else {
          setStatusMsg({
            type: 'error',
            text: 'Format file cadangan tidak valid atau rusak.',
          });
        }
      } catch {
        setStatusMsg({ type: 'error', text: 'Gagal membaca berkas cadangan.' });
      }
    };
    reader.readAsText(file);
  };

  const [confirmReset, setConfirmReset] = useState(false);

  const handleResetData = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    await resetToDefaultData();
    setConfirmReset(false);
    setStatusMsg({ type: 'success', text: 'Data database Firebase telah dikembalikan ke contoh awal.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Cadangan & Pemulihan Data</h2>
            <p className="text-xs text-slate-500">Amankan dan kelola arsip data kas Anda</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {statusMsg && (
            <div
              className={`p-3 text-xs font-medium rounded-xl flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Backup Action */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900">Unduh Cadangan (Backup)</p>
              <p className="text-[11px] text-slate-500">
                Simpan semua transaksi & kategori kustom ke file JSON di komputer Anda.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shrink-0 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh</span>
            </button>
          </div>

          {/* Restore & Reset Actions - Admin Only */}
          {isAdmin ? (
            <>
              {/* Restore Action */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">Pulihkan Data (Restore)</p>
                  <p className="text-[11px] text-slate-500">
                    Impor file cadangan JSON yang telah Anda simpan sebelumnya.
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 shrink-0 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Impor</span>
                </button>
              </div>

              {/* Reset Demo Data */}
              <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-rose-900">Muat Ulang Data Sampel</p>
                  <p className="text-[11px] text-rose-700">
                    {confirmReset
                      ? 'Apakah Anda yakin? Semua perubahan data di Firebase akan direset ke data sampel awal.'
                      : 'Kembalikan semua transaksi & kategori di database Firebase ke contoh bawaan.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {confirmReset && (
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    onClick={handleResetData}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 shrink-0 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{confirmReset ? 'Ya, Reset Sekarang' : 'Reset'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
              Fitur impor dan reset data dinonaktifkan pada Mode Pengguna. Masuk ke Mode Admin untuk memulihkan cadangan.
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
