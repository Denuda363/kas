import React from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, CheckCircle2, Laptop } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'compact' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, showIOSGuide, promptInstall, closeIOSGuide } = usePWAInstall();

  if (isInstalled && variant !== 'banner') {
    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Aplikasi Terpasang</span>
      </div>
    );
  }

  return (
    <>
      {/* Button Renderings */}
      {variant === 'navbar' && (
        <button
          onClick={promptInstall}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer group active:scale-95"
          title="Install aplikasi BukuKas ke perangkat Anda"
        >
          <Download className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
          <span>Install Aplikasi</span>
          <span className="hidden md:inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
        </button>
      )}

      {variant === 'compact' && (
        <button
          onClick={promptInstall}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors cursor-pointer"
          title="Install ke perangkat"
        >
          <Download className="w-3.5 h-3.5 text-emerald-700" />
          <span>Install</span>
        </button>
      )}

      {/* Modal Guide for iOS or Manual Browser installation */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={closeIOSGuide}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base leading-tight">
                  Pasang Aplikasi BukuKas Pro
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dapat dipasang di Android, iPhone/iPad, Windows & Mac
                </p>
              </div>
            </div>

            {/* Instructions */}
            {isIOS ? (
              <div className="space-y-3.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-5">
                <p className="font-semibold text-slate-800 text-xs mb-2">
                  Petunjuk pemasangan di iPhone / iPad (Safari):
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    Ketuk tombol <strong className="text-slate-900">Bagikan (Share)</strong>{' '}
                    <Share2 className="w-3.5 h-3.5 inline text-sky-600 mx-0.5" /> di menu bar bawah Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    Gulir opsi ke bawah lalu pilih{' '}
                    <strong className="text-slate-900">
                      "Tambahkan ke Layar Utama" (Add to Home Screen)
                    </strong>{' '}
                    <PlusSquare className="w-3.5 h-3.5 inline text-emerald-600 mx-0.5" />.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    Ketuk <strong className="text-slate-900">"Tambah" (Add)</strong> di pojok kanan atas. Ikon BukuKas akan muncul di beranda HP Anda!
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-5">
                <p className="font-semibold text-slate-800 text-xs mb-2">
                  Cara Pasang di Browser / Desktop / Android:
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    Jika muncul dialog konfirmasi peramban, klik <strong className="text-slate-900">"Install"</strong> atau <strong className="text-slate-900">"Pasang"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    Di Chrome/Edge desktop: Anda juga dapat mengeklik ikon <Laptop className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" /> di sisi kanan bilah alamat (address bar).
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    Aplikasi akan berjalan mandiri tanpa bilah browser (fullscreen), lebih cepat, dan dapat diakses offline!
                  </div>
                </div>
              </div>
            )}

            {/* Action button */}
            <button
              onClick={closeIOSGuide}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            >
              Mengerti & Lanjutkan
            </button>
          </div>
        </div>
      )}
    </>
  );
};
