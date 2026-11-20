import React, {useState} from 'react';
import {CheckCircle2, Download, Share, Smartphone, Wifi, WifiOff, X} from 'lucide-react';
import {useOnlineStatus, usePWAInstall} from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  open: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({open, onClose}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [platformTab, setPlatformTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!open) return null;

  const handleNativeInstall = async () => {
    const accepted = await install();
    if (accepted) {
      setInstallSuccess(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
    >
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="sm:hidden w-10 h-1.5 bg-slate-200 rounded-full mx-auto mt-3" />

        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 id="pwa-modal-title" className="text-lg font-bold text-slate-900">
                Instal CEKRutin di HP
              </h2>
              <p className="text-xs text-slate-500">
                Akses instan dari layar utama tanpa Play Store atau App Store
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup panduan instalasi"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {isInstalled || installSuccess ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  CEKRutin Sudah Terpasang di Perangkat
                </p>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Aplikasi berjalan dalam mode layar penuh (standalone). Seluruh profil keluarga,
                  log harian, dan riwayat cek kesehatan tersimpan lokal di perangkat Anda.
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-teal-950">
                Perangkat Anda mendukung instalasi otomatis satu klik
              </p>
              <p className="text-xs text-teal-900 leading-relaxed">
                Tekan tombol di bawah untuk menambahkan ikon CEKRutin ke layar utama HP atau
                desktop Anda dengan dukungan mode offline penuh.
              </p>
              <button
                onClick={handleNativeInstall}
                className="w-full min-h-[48px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Pasang Sekarang ke Layar Utama
              </button>
            </div>
          ) : null}

          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 font-medium">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-teal-600" />
                  <span>Terhubung · Penyimpanan Offline Aktif (IndexedDB)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-amber-600" />
                  <span>Mode Offline · Data Tersimpan Lokal di Perangkat</span>
                </>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setPlatformTab('android')}
                className={`flex-1 min-h-[40px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  platformTab === 'android'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Android (Chrome / Edge)
              </button>
              <button
                type="button"
                onClick={() => setPlatformTab('ios')}
                className={`flex-1 min-h-[40px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  platformTab === 'ios'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                iPhone / iPad (Safari)
              </button>
            </div>

            {platformTab === 'android' ? (
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Buka tautan web <strong>CEKRutin</strong> menggunakan browser{' '}
                    <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> di Android.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Ketuk ikon menu <strong>titik tiga (⋮)</strong> di pojok kanan atas browser,
                    lalu pilih <strong>"Tambahkan ke Layar Utama"</strong> atau{' '}
                    <strong>"Instal Aplikasi"</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Konfirmasi dengan mengetuk <strong>Instal</strong>. Ikon CEKRutin akan muncul di
                    Home Screen dan terbuka dalam mode aplikasi penuh tanpa bilah browser.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Pastikan Anda membuka CEKRutin menggunakan browser <strong>Safari</strong> di
                    iPhone atau iPad.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span className="flex items-center flex-wrap gap-1">
                    Ketuk ikon <strong>Bagikan / Share</strong>{' '}
                    <Share className="w-4 h-4 inline text-sky-600" /> di bilah bawah atau atas
                    Safari.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Gulir ke bawah, pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>
                    , lalu ketuk <strong>Tambah</strong>.
                  </span>
                </li>
              </ol>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
