import React, {useState} from 'react';
import {
  Check,
  Download,
  Lock,
  LogOut,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  CekRutinStore,
  FamilyManagerAccount,
  FamilyMember,
  FamilyRole,
  Gender,
  HealthCheckRecord,
} from '../types/health';
import {StatusIndicator} from '../components/StatusBadge';

interface FamilyProfilesViewProps {
  store: CekRutinStore;
  onSelectMember: (memberId: string) => void;
  onAddMember: (member: Omit<FamilyMember, 'id' | 'createdAt'>) => void;
  onUpdateMember: (member: FamilyMember) => void;
  onDeleteMember: (memberId: string) => void;
  onUpdateManager: (manager: FamilyManagerAccount) => void;
  onResetDemoData: () => void;
  onSignOut: () => void;
}

const ROLES: FamilyRole[] = ['Ayah', 'Ibu', 'Anak', 'Lansia', 'Pengelola'];

export const FamilyProfilesView: React.FC<FamilyProfilesViewProps> = ({
  store,
  onSelectMember,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onUpdateManager,
  onResetDemoData,
  onSignOut,
}) => {
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<FamilyRole>('Ayah');
  const [age, setAge] = useState('35');
  const [gender, setGender] = useState<Gender>('Laki-laki');
  const [waterTarget, setWaterTarget] = useState('8');
  const [stepsTarget, setStepsTarget] = useState('6000');
  const [medicalNote, setMedicalNote] = useState('');

  // Manager account form
  const [mgrName, setMgrName] = useState(store.manager.name);
  const [mgrCity, setMgrCity] = useState(store.manager.city);
  const [mgrPuskesmas, setMgrPuskesmas] = useState(store.manager.puskesmasName);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const startEdit = (m: FamilyMember) => {
    setEditingMember(m);
    setName(m.name);
    setRole(m.role);
    setAge(String(m.age));
    setGender(m.gender);
    setWaterTarget(String(m.targetWaterGlasses));
    setStepsTarget(String(m.targetSteps ?? (m.role === 'Lansia' ? 4000 : 6000)));
    setMedicalNote(m.medicalNote);
  };

  const resetMemberForm = () => {
    setEditingMember(null);
    setName('');
    setRole('Anak');
    setAge('14');
    setGender('Laki-laki');
    setWaterTarget('8');
    setStepsTarget('6000');
    setMedicalNote('');
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const parsedAge = Math.max(1, Math.min(120, Number(age) || 30));
    const parsedWater = Math.max(4, Math.min(16, Number(waterTarget) || 8));
    const defaultRoleSteps = role === 'Lansia' ? 4000 : 6000;
    const parsedSteps = Math.max(1000, Math.min(30000, Number(stepsTarget) || defaultRoleSteps));

    if (editingMember) {
      onUpdateMember({
        ...editingMember,
        name: name.trim(),
        role,
        age: parsedAge,
        gender,
        targetWaterGlasses: parsedWater,
        targetSteps: parsedSteps,
        medicalNote: medicalNote.trim(),
      });
      setSavedNotice(`Profil ${name.trim()} berhasil diperbarui.`);
    } else {
      onAddMember({
        name: name.trim(),
        role,
        age: parsedAge,
        gender,
        targetWaterGlasses: parsedWater,
        targetFruitVegPortions: parsedAge < 12 ? 4 : 5,
        targetActivityMinutes: role === 'Lansia' ? 10 : 15,
        targetSteps: parsedSteps,
        medicalNote: medicalNote.trim(),
      });
      setSavedNotice(`Anggota keluarga ${name.trim()} berhasil ditambahkan.`);
    }
    resetMemberForm();
    window.setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleManagerSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateManager({
      ...store.manager,
      name: mgrName.trim() || store.manager.name,
      city: mgrCity.trim() || store.manager.city,
      puskesmasName: mgrPuskesmas.trim() || store.manager.puskesmasName,
    });
    setSavedNotice('Pengaturan akun pengelola keluarga tersimpan.');
    window.setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleLockSession = () => {
    onUpdateManager({
      ...store.manager,
      isLocked: true,
    });
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadangan-cekrutin-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLatestCheck = (memberId: string): HealthCheckRecord | undefined =>
    store.healthChecks
      .filter((h) => h.memberId === memberId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-teal-700">
            Pengelolaan Terpusat · {store.members.length} Anggota Keluarga
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
            Profil Keluarga & Akun Pengelola
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="min-h-[42px] px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Cadangkan Data (.json)
          </button>
          <button
            type="button"
            onClick={onResetDemoData}
            className="min-h-[42px] px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Kosongkan Semua Data
          </button>
        </div>
      </div>

      {savedNotice && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          {savedNotice}
        </div>
      )}

      {/* Multi-Profile Family Grid */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Users className="w-5 h-5 text-teal-700" />
          <h2>Pilih atau Pantau Profil Anggota Keluarga</h2>
        </div>

        {store.members.length === 0 ? (
          <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-6 text-center space-y-2">
            <p className="text-sm font-bold text-slate-800">
              Belum Ada Anggota Keluarga Terdaftar (0 Profil)
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Gunakan formulir <strong>Tambah Anggota Keluarga Baru</strong> di bawah ini untuk
              mendaftarkan profil keluarga Anda (Ayah, Ibu, Anak, atau Lansia).
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {store.members.map((member) => {
            const isActive = member.id === store.activeMemberId;
            const latestCheck = getLatestCheck(member.id);

            return (
              <article
                key={member.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between space-y-4 transition-colors ${
                  isActive
                    ? 'bg-teal-50/50 border-teal-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-teal-700">
                        {member.role} · {member.gender}
                      </p>
                      <h3 className="text-base font-extrabold text-slate-900 truncate">
                        {member.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono tabular-nums">
                        Usia {member.age} tahun · {member.targetWaterGlasses} gelas ·{' '}
                        {(
                          member.targetSteps ?? (member.role === 'Lansia' ? 4000 : 6000)
                        ).toLocaleString('id-ID')}{' '}
                        lkh
                      </p>
                    </div>
                  </div>

                  {latestCheck ? (
                    <div className="pt-1 space-y-1">
                      <StatusIndicator status={latestCheck.overallStatus} compact />
                      <p className="text-[11px] font-mono tabular-nums text-slate-600">
                        TD {latestCheck.systolic}/{latestCheck.diastolic} · Gula {latestCheck.glucose}{' '}
                        · IMT {latestCheck.bmi}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Belum ada pemeriksaan medis</p>
                  )}

                  {member.medicalNote && (
                    <p className="text-xs text-slate-600 line-clamp-2">{member.medicalNote}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectMember(member.id)}
                    className={`flex-1 min-h-[40px] rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5" />}
                    {isActive ? 'Sedang Dipantau' : 'Pilih Profil'}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(member)}
                    aria-label={`Ubah profil ${member.name}`}
                    className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteMember(member.id)}
                    aria-label={`Hapus profil ${member.name}`}
                    className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Add / Edit Family Member */}
        <section className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <UserPlus className="w-5 h-5 text-teal-700" />
              <h2 className="text-base font-bold text-slate-900">
                {editingMember ? `Ubah Profil: ${editingMember.name}` : 'Tambah Anggota Keluarga Baru'}
              </h2>
            </div>
            {editingMember && (
              <button
                type="button"
                onClick={resetMemberForm}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Batal Ubah
              </button>
            )}
          </div>

          <form onSubmit={handleMemberSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Anggota Keluarga
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan nama lengkap anggota keluarga"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:outline-2 focus:outline-teal-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran di Keluarga
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as FamilyRole)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-2 focus:outline-teal-600"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-2 focus:outline-teal-600"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Usia (Tahun)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Air (Gelas)
                </label>
                <input
                  type="number"
                  min={4}
                  max={16}
                  required
                  value={waterTarget}
                  onChange={(e) => setWaterTarget(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Langkah/Hari
                </label>
                <input
                  type="number"
                  min={1000}
                  max={30000}
                  step={500}
                  required
                  value={stepsTarget}
                  onChange={(e) => setStepsTarget(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Kesehatan / Riwayat (Opsional)
              </label>
              <input
                type="text"
                placeholder="Mis. Riwayat gula darah atau alergi"
                value={medicalNote}
                onChange={(e) => setMedicalNote(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:outline-2 focus:outline-teal-600"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {editingMember ? 'Simpan Perubahan Profil' : 'Tambahkan Profil Anggota'}
            </button>
          </form>
        </section>

        {/* Family Health Manager Authentication & Local Privacy PIN */}
        <section className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Akun Pengelola & Keamanan Password
                </h2>
                <p className="text-xs text-slate-500">
                  Sesi pengelola dilindungi verifikasi email dan password terenkripsi SHA-256.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-teal-50 border border-teal-200 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {store.manager.photoUrl ? (
                <img
                  src={store.manager.photoUrl}
                  alt={store.manager.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-teal-300 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {store.manager.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-teal-950 truncate">{store.manager.name}</p>
                <p className="text-xs text-teal-800 truncate">
                  {store.manager.email || 'Akun Pengelola'} · Family Health Manager
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-[38px] px-3 rounded-lg bg-white border border-teal-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-xs font-semibold text-teal-900 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar (Logout)
            </button>
          </div>

          <form onSubmit={handleManagerSave} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pengelola Keluarga (Family Health Manager)
              </label>
              <input
                type="text"
                required
                value={mgrName}
                onChange={(e) => setMgrName(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:outline-2 focus:outline-teal-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kota / Wilayah
                </label>
                <input
                  type="text"
                  value={mgrCity}
                  onChange={(e) => setMgrCity(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:outline-2 focus:outline-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Puskesmas Rujukan Utama
                </label>
                <input
                  type="text"
                  value={mgrPuskesmas}
                  onChange={(e) => setMgrPuskesmas(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:outline-2 focus:outline-teal-600"
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-800">Kunci Sesi Privasi Keluarga</p>
              <p className="mt-1">
                Menekan <strong>Kunci Layar</strong> akan mengunci dasbor sementara. Untuk membuka
                kembali, pengelola wajib memverifikasi email dan password akun ini.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="submit"
                className="flex-1 min-h-[46px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Simpan Pengaturan Pengelola
              </button>
              <button
                type="button"
                onClick={handleLockSession}
                className="min-h-[46px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Kunci Layar
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
