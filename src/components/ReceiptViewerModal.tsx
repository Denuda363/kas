import React from 'react';
import { X, Download, FileText, Calendar, Tag } from 'lucide-react';
import { Transaction } from '../types/finance';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';

interface ReceiptViewerModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !transaction || !transaction.receiptUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = transaction.receiptUrl!;
    a.download = `Nota_${transaction.type}_${transaction.date}_${transaction.id.slice(-6)}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Bukti Nota / Struk Transaksi
              </h2>
              <p className="text-[11px] text-slate-500">
                {formatTanggalIndo(transaction.date)} ·{' '}
                <span className={transaction.type === 'pemasukan' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                  {formatRupiah(transaction.amount)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Unduh berkas nota"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Container with Scroll/Zoom */}
        <div className="p-4 bg-slate-950 flex items-center justify-center overflow-auto flex-1 min-h-[300px] max-h-[65vh]">
          <img
            src={transaction.receiptUrl}
            alt="Bukti Nota Transaksi"
            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
          />
        </div>

        {/* Footer info */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="truncate">
            <span className="font-semibold text-slate-800">Keterangan: </span>
            <span>{transaction.note || 'Tidak ada catatan'}</span>
            {transaction.recipientOrPayer && (
              <span className="text-slate-400"> ({transaction.recipientOrPayer})</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="self-end sm:self-auto px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
