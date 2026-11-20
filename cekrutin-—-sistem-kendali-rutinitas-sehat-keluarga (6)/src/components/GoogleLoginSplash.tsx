import React, {useState} from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartPulse,
  Lock,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import {FAMILY_WELLNESS_BANNER} from '../data/educationData';
import {usePWAInstall} from '../hooks/usePWAInstall';
import {
  getRegisteredAccounts,
  MIN_PASSWORD_LENGTH,
  registerManagerAccount,
  verifyManagerCredentials,
} from '../lib/authCrypto';

export interface LocalGoogleUser {
  uid: string;
  name: string;
  email: string;
}

interface GoogleLoginSplashProps {
  onCompleteLogin: (account: LocalGoogleUser) => void;
  onOpenPwaGuide: () => void;
}

export const GoogleLoginSplash: React.FC<GoogleLoginSplashProps> = ({
  onCompleteLogin,
  onOpenPwaGuide,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authTab, setAuthTab] = useState<'register' | 'signin'>(() =>
    getRegisteredAccounts().length > 0 ? 'signin' : 'register',
  );

  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formHint, setFormHint] = useState<string | null>(null);

  const {isInstalled} = usePWAInstall();

  const openModalWithTab = (tab: 'register' | 'signin') => {
    setAuthTab(tab);
    setFormHint(null);
    setPassword('');
    setConfirmPassword('');
    setShowLoginModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormHint(null);

    if (authTab === 'register') {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setFormHint(`Password minimal harus terdiri dari ${MIN_PASSWORD_LENGTH} karakter.`);
        return;
      }
      if (password !== confirmPassword) {
        setFormHint('Konfirmasi password tidak cocok. Silakan periksa kembali.');
        return;
      }

      setSubmitting(true);
      const res = await registerManagerAccount({
        name: managerName,
        email: managerEmail,
        password,
      });
      setSubmitting(false);

      if (!res.ok) {
        setFormHint(res.error);
        return;
      }

      onCompleteLogin({
        uid: res.account.uid,
        name: res.account.name,
        email: res.account.email,
      });
      return;
    }

    // Sign In mode: verify email & SHA-256 password hash
    setSubmitting(true);
    const res = await verifyManagerCredentials(managerEmail, password);
    setSubmitting(false);

    if (!res.ok) {
      setFormHint(res.error);
      return;
    }

    onCompleteLogin({
      uid: res.account.uid,
      name: res.account.name,
      email: res.account.email,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Minimal Top Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <img src="/icon.svg" alt="Logo CEKRutin" className="w-7 h-7 rounded-lg" />
          <span className="text-lg font-extrabold tracking-tight text-slate-900">CEKRutin</span>
        </div>

        <span className="hidden sm:inline text-xs font-medium text-teal-700">
          Ingat, Periksa, Jaga Sehat
        </span>

        {!isInstalled ? (
          <button
            type="button"
            onClick={onOpenPwaGuide}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-teal-700" />
            <span>Instal di HP</span>
          </button>
        ) : (
          <span className="text-xs font-semibold text-teal-700 whitespace-nowrap">
            Mode Aplikasi HP
          </span>
        )}
      </header>

      {/* Main Split Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Brand Value & Password-Protected Manager Sign-In */}
          <section className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
                <span>Sistem Kendali Rutinitas Sehat Keluarga</span>
                <span aria-hidden="true">·</span>
                <span>Berbasis Keluarga & Puskesmas</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Ingat, Periksa, Jaga Sehat Bersama Keluarga
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Daftar atau masuk sebagai <strong>Family Health Manager</strong> dengan email dan{' '}
                <strong>password terenkripsi</strong> untuk mencatat rutinitas minum air, konsumsi
                buah & sayur, langkah harian, serta hasil skrining kesehatan keluarga Anda.
              </p>

              {/* Auth Actions */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() =>
                    openModalWithTab(
                      getRegisteredAccounts().length > 0 ? 'signin' : 'register',
                    )
                  }
                  className="w-full min-h-[52px] px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-teal-300 shrink-0" />
                  <span>
                    {getRegisteredAccounts().length > 0
                      ? 'Masuk dengan Email & Password'
                      : 'Daftar & Masuk Pengelola Keluarga'}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openModalWithTab('signin')}
                    className="min-h-[42px] px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Sudah Punya Akun (Masuk)
                  </button>
                  <button
                    type="button"
                    onClick={() => openModalWithTab('register')}
                    className="min-h-[42px] px-3 rounded-xl border border-teal-300 bg-teal-50/70 hover:bg-teal-50 text-teal-900 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Buat Akun Baru
                  </button>
                </div>

                <div className="flex items-start gap-2 text-xs text-slate-500 pt-1">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    Password Anda diamankan dengan hash kriptografi SHA-256 (Web Crypto API)
                    sebelum disimpan di perangkat—tanpa kata sandi teks polos dan tanpa data
                    contoh palsu.
                  </span>
                </div>
              </div>
            </div>

            {/* Key Capabilities */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span>Multi-Profil</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Tambah dan pantau profil anggota keluarga Anda sendiri.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <HeartPulse className="w-4 h-4 text-sky-600" />
                  <span>Skrining Mandiri</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Pantau tekanan darah, gula, kolesterol, IMT & rujukan Faskes.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <CalendarClock className="w-4 h-4 text-emerald-600" />
                  <span>Agenda & Kuis</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Pengingat Faskes dan E-Sertifikat edukasi PTM keluarga.
                </p>
              </div>
            </div>
          </section>

          {/* Right Column: Editorial Visual & Family Preview */}
          <section className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 overflow-hidden flex flex-col">
            <div className="relative flex-1 min-h-[260px] bg-teal-50">
              <img
                src={FAMILY_WELLNESS_BANNER}
                alt="Keluarga Indonesia menerapkan kebiasaan sehat bersama di rumah"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover lg:absolute lg:inset-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-2">
                <p className="text-xs font-semibold text-teal-200">
                  Gerakan Keluarga Sadar Sehat · Promotif & Preventif
                </p>
                <p className="text-lg font-bold leading-snug">
                  Kendalikan faktor risiko hipertensi, diabetes, dan kolesterol mulai dari rumah.
                </p>
              </div>
            </div>

            <div className="p-5 bg-white border-t border-slate-100 space-y-2.5">
              <p className="text-xs font-bold text-slate-800">
                Mulai aman dan bersih sesuai data asli keluarga Anda:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Akun dilindungi password SHA-256</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Mode offline penuh di PWA HP</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Clean Register / Sign-In Modal (No Dummy Accounts, Password Verified) */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[92vh] overflow-y-auto">
            <div className="sm:hidden w-10 h-1.5 bg-slate-200 rounded-full mx-auto mt-3" />

            <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="auth-modal-title" className="text-base font-bold text-slate-900">
                    {authTab === 'register'
                      ? 'Daftar Akun Pengelola Keluarga'
                      : 'Masuk ke Akun Pengelola'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {authTab === 'register'
                      ? 'Buat akun baru dengan password pribadi Anda'
                      : 'Verifikasi email dan password yang telah dibuat'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                aria-label="Tutup formulir autentikasi"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pt-4">
              <div
                role="tablist"
                aria-label="Mode autentikasi"
                className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={authTab === 'signin'}
                  onClick={() => {
                    setAuthTab('signin');
                    setFormHint(null);
                  }}
                  className={`min-h-[40px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    authTab === 'signin'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Masuk (Sign In)
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authTab === 'register'}
                  onClick={() => {
                    setAuthTab('register');
                    setFormHint(null);
                  }}
                  className={`min-h-[40px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    authTab === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Daftar Baru
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {authTab === 'register' && (
                <div>
                  <label
                    htmlFor="auth-manager-name"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Nama Lengkap Pengelola
                  </label>
                  <input
                    id="auth-manager-name"
                    type="text"
                    required
                    autoFocus
                    placeholder="Masukkan nama lengkap Anda"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full min-h-[46px] rounded-xl border border-slate-300 px-3.5 text-sm focus:outline-2 focus:outline-teal-600"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-manager-email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Alamat Email
                </label>
                <input
                  id="auth-manager-email"
                  type="email"
                  required
                  autoFocus={authTab === 'signin'}
                  placeholder="namaanda@gmail.com"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  className="w-full min-h-[46px] rounded-xl border border-slate-300 px-3.5 text-sm focus:outline-2 focus:outline-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={authTab === 'register' ? MIN_PASSWORD_LENGTH : 1}
                    placeholder={
                      authTab === 'register'
                        ? `Minimal ${MIN_PASSWORD_LENGTH} karakter`
                        : 'Masukkan password Anda'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-[46px] rounded-xl border border-slate-300 pl-3.5 pr-11 text-sm focus:outline-2 focus:outline-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authTab === 'register' && (
                  <p
                    className={`text-[11px] mt-1 ${
                      password.length === 0
                        ? 'text-slate-500'
                        : password.length >= MIN_PASSWORD_LENGTH
                          ? 'text-emerald-700 font-medium'
                          : 'text-amber-700 font-medium'
                    }`}
                  >
                    Aturan password: minimal {MIN_PASSWORD_LENGTH} karakter (kombinasi huruf &
                    angka disarankan).
                  </p>
                )}
              </div>

              {authTab === 'register' && (
                <div>
                  <label
                    htmlFor="auth-confirm-password"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={MIN_PASSWORD_LENGTH}
                      placeholder="Ulangi password yang sama"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full min-h-[46px] rounded-xl border border-slate-300 pl-3.5 pr-11 text-sm focus:outline-2 focus:outline-teal-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword ? 'Sembunyikan konfirmasi' : 'Lihat konfirmasi'
                      }
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {formHint && (
                <div
                  role="alert"
                  className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700 font-medium"
                >
                  {formHint}
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="min-h-[46px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 min-h-[46px] rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {submitting
                    ? 'Memverifikasi...'
                    : authTab === 'register'
                      ? 'Daftar & Mulai CEKRutin'
                      : 'Masuk ke Dasbor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
