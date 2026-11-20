import React, {useEffect, useMemo, useState} from 'react';
import {
  Bell,
  BellRing,
  Building2,
  Calendar as CalendarIcon,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {FamilyMember, FaskesVisit, RoutineReminder} from '../types/health';
import {downloadVisitIcsFile} from '../lib/storage';

interface RemindersAgendaViewProps {
  members: FamilyMember[];
  activeMember: FamilyMember | null;
  defaultFacilityName: string;
  reminders: RoutineReminder[];
  faskesVisits: FaskesVisit[];
  prefillReason?: string;
  onClearPrefillReason: () => void;
  onAddReminder: (reminder: Omit<RoutineReminder, 'id'>) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onAddVisit: (visit: Omit<FaskesVisit, 'id' | 'completed'>) => void;
  onToggleVisitComplete: (id: string) => void;
  onDeleteVisit: (id: string) => void;
  onAddFirstMember: () => void;
}

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const WEEKDAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const RemindersAgendaView: React.FC<RemindersAgendaViewProps> = ({
  members,
  activeMember,
  defaultFacilityName,
  reminders,
  faskesVisits,
  prefillReason,
  onClearPrefillReason,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onAddVisit,
  onToggleVisitComplete,
  onDeleteVisit,
  onAddFirstMember,
}) => {
  const [notifPermission, setNotifPermission] = useState<string>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  );
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  // Reminder form
  const [remTitle, setRemTitle] = useState('Minum Air Putih & Peregangan');
  const [remCategory, setRemCategory] = useState<RoutineReminder['category']>('air');
  const [remTime, setRemTime] = useState('09:00');
  const [remMemberId, setRemMemberId] = useState(activeMember?.id || '');

  // Visit form
  const todayIso = new Date().toISOString().slice(0, 10);
  const [visMemberId, setVisMemberId] = useState(activeMember?.id || '');
  const [visFacility, setVisFacility] = useState(defaultFacilityName || 'Puskesmas Kecamatan');
  const [visService, setVisService] = useState(
    prefillReason ? 'Kontrol & Konsultasi Hasil Skrining' : 'Cek Rutin Posbindu PTM',
  );
  const [visDate, setVisDate] = useState(todayIso);
  const [visTime, setVisTime] = useState('08:30');
  const [visNotes, setVisNotes] = useState(prefillReason || '');

  // Calendar view state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (activeMember?.id) {
      setRemMemberId((prev) => (members.some((m) => m.id === prev) ? prev : activeMember.id));
      setVisMemberId((prev) => (members.some((m) => m.id === prev) ? prev : activeMember.id));
    }
  }, [activeMember?.id, members]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: Array<{day: number | null; dateStr?: string}> = [];
    for (let i = 0; i < firstDay; i++) cells.push({day: null});
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(calMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({day: d, dateStr: `${calYear}-${mStr}-${dStr}`});
    }
    return cells;
  }, [calYear, calMonth]);

  const visitsByDate = useMemo(() => {
    const map: Record<string, FaskesVisit[]> = {};
    for (const v of faskesVisits) {
      if (!map[v.date]) map[v.date] = [];
      map[v.date].push(v);
    }
    return map;
  }, [faskesVisits]);

  const displayedVisits = useMemo(() => {
    const sorted = [...faskesVisits].sort((a, b) => a.date.localeCompare(b.date));
    if (selectedDate) {
      return sorted.filter((v) => v.date === selectedDate);
    }
    return sorted;
  }, [faskesVisits, selectedDate]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      setNotifPermission('unsupported');
      setNotifFeedback('Browser ini tidak mendukung Web Notification API.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      new Notification('CEKRutin · Pengingat Aktif', {
        body: 'Notifikasi pengingat rutinitas sehat dan jadwal Puskesmas telah diaktifkan.',
        icon: '/pwa-192x192.png',
      });
      setNotifFeedback('Notifikasi browser berhasil diaktifkan dan diuji.');
    } else {
      setNotifFeedback('Izin notifikasi belum diberikan di pengaturan browser.');
    }
  };

  const sendTestNotification = () => {
    if (typeof Notification === 'undefined') {
      setNotifFeedback('Browser tidak mendukung Notification API.');
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification('CEKRutin · Pengingat Rutinitas Sehat', {
        body: `Waktunya cek kebiasaan sehat untuk ${activeMember?.name || 'Keluarga'} — Ingat, Periksa, Jaga Sehat!`,
        icon: '/pwa-192x192.png',
      });
      setNotifFeedback('Notifikasi uji coba dikirim.');
    } else {
      requestNotificationPermission();
    }
  };

  if (members.length === 0 || !activeMember) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-4 max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <Bell className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">
          Pengingat & Agenda Faskes
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Belum ada anggota keluarga terdaftar. Tambahkan profil anggota keluarga pertama Anda
          untuk mulai menjadwalkan pengingat rutinitas dan kunjungan ke Puskesmas.
        </p>
        <button
          type="button"
          onClick={onAddFirstMember}
          className="min-h-[46px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Anggota Keluarga Pertama
        </button>
      </div>
    );
  }

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim()) return;
    onAddReminder({
      memberId: remMemberId || activeMember.id,
      title: remTitle.trim(),
      category: remCategory,
      time: remTime,
      enabled: true,
    });
    setRemTitle('');
  };

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visFacility.trim() || !visService.trim() || !visDate) return;
    onAddVisit({
      memberId: visMemberId || activeMember.id,
      facilityName: visFacility.trim(),
      serviceType: visService.trim(),
      date: visDate,
      time: visTime,
      notes: visNotes.trim(),
    });
    setVisNotes('');
    if (prefillReason) onClearPrefillReason();
  };


  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const getMemberName = (id: string) =>
    members.find((m) => m.id === id)?.name || 'Anggota Keluarga';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-teal-700">
            Cue Kebiasaan & Integrasi Puskesmas
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
            Pengingat & Agenda Faskes
          </h1>
        </div>

        <button
          type="button"
          onClick={
            notifPermission === 'granted' ? sendTestNotification : requestNotificationPermission
          }
          className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <BellRing className="w-4 h-4" />
          <span>
            {notifPermission === 'granted'
              ? 'Uji Notifikasi Browser'
              : 'Aktifkan Notifikasi Browser'}
          </span>
        </button>
      </div>

      {notifFeedback && (
        <div
          role="status"
          className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-xs font-medium text-sky-900"
        >
          {notifFeedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Routine Reminders (Web Notification API) */}
        <section className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Pengingat Rutinitas Harian</h2>
                <p className="text-xs text-slate-500">
                  Status izin:{' '}
                  <span className="font-semibold text-slate-700">
                    {notifPermission === 'granted'
                      ? 'Aktif'
                      : notifPermission === 'denied'
                        ? 'Ditolak browser'
                        : 'Belum diizinkan'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddReminder} className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-800">Tambah Jadwal Pengingat</p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Judul Pengingat
              </label>
              <input
                type="text"
                required
                placeholder="Mis. Minum air 2 gelas sore"
                value={remTitle}
                onChange={(e) => setRemTitle(e.target.value)}
                className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-2 focus:outline-teal-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Anggota</label>
                <select
                  value={remMemberId}
                  onChange={(e) => setRemMemberId(e.target.value)}
                  className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-2.5 text-xs focus:outline-2 focus:outline-teal-600"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Kategori</label>
                <select
                  value={remCategory}
                  onChange={(e) => setRemCategory(e.target.value as RoutineReminder['category'])}
                  className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-2.5 text-xs focus:outline-2 focus:outline-teal-600"
                >
                  <option value="air">Minum Air</option>
                  <option value="buah_sayur">Buah & Sayur</option>
                  <option value="aktivitas">Aktivitas Mikro</option>
                  <option value="cek_medis">Cek Tekanan/Gula</option>
                </select>
              </div>
            </div>

            <div className="flex items-end gap-2.5">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Jam Pengingat</label>
                <input
                  type="time"
                  required
                  value={remTime}
                  onChange={(e) => setRemTime(e.target.value)}
                  className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
                />
              </div>
              <button
                type="submit"
                className="min-h-[42px] px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Simpan
              </button>
            </div>
          </form>

          <ul className="space-y-2.5">
            {reminders.length === 0 ? (
              <li className="text-xs text-slate-500 text-center py-4">
                Belum ada pengingat harian terjadwal.
              </li>
            ) : (
              reminders.map((rem) => (
                <li
                  key={rem.id}
                  className="rounded-xl border border-slate-200 px-3.5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        rem.enabled ? 'text-slate-900' : 'text-slate-400 line-through'
                      }`}
                    >
                      {rem.title}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-mono tabular-nums font-semibold">{rem.time}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{getMemberName(rem.memberId)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleReminder(rem.id)}
                      className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        rem.enabled
                          ? 'bg-teal-50 border-teal-200 text-teal-800'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {rem.enabled ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteReminder(rem.id)}
                      aria-label={`Hapus pengingat ${rem.title}`}
                      className="min-h-[34px] min-w-[34px] rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Right Column: Interactive Calendar + Faskes / Puskesmas Visits */}
        <div className="lg:col-span-7 space-y-5">
          <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-5 h-5 text-teal-700" />
                <h2 className="text-base font-bold text-slate-900">
                  Kalender Kunjungan Puskesmas & Posbindu
                </h2>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  aria-label="Bulan sebelumnya"
                  className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs font-bold text-slate-800 whitespace-nowrap">
                  {MONTH_NAMES_ID[calMonth]} {calYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  aria-label="Bulan berikutnya"
                  className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500">
              {WEEKDAYS_ID.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, idx) => {
                if (!cell.day || !cell.dateStr) {
                  return <div key={`empty-${idx}`} className="h-11" />;
                }
                const dayVisits = visitsByDate[cell.dateStr] || [];
                const isToday = cell.dateStr === todayIso;
                const isSelected = cell.dateStr === selectedDate;
                const hasPendingVisit = dayVisits.some((v) => !v.completed);

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() =>
                      setSelectedDate((prev) => (prev === cell.dateStr ? null : cell.dateStr!))
                    }
                    className={`h-11 rounded-xl border text-xs font-mono tabular-nums flex flex-col items-center justify-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-600 border-teal-600 text-white font-bold'
                        : isToday
                          ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                          : dayVisits.length > 0
                            ? 'bg-sky-50 border-sky-200 text-sky-900 font-semibold hover:bg-sky-100'
                            : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cell.day}</span>
                    {dayVisits.length > 0 && (
                      <span
                        className={`text-[9px] leading-none mt-0.5 font-sans font-bold ${
                          isSelected
                            ? 'text-white'
                            : hasPendingVisit
                              ? 'text-sky-700'
                              : 'text-emerald-700'
                        }`}
                      >
                        {dayVisits.length} agenda
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>
                  Menampilkan agenda tanggal{' '}
                  <strong className="font-mono">{selectedDate}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-teal-700 font-semibold hover:underline cursor-pointer"
                >
                  Tampilkan Semua Tanggal
                </button>
              </div>
            )}
          </section>

          {/* Add Visit Form */}
          <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <CalendarPlus className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-bold text-slate-900">
                Jadwalkan Kunjungan Ulang ke Puskesmas / Faskes
              </h2>
            </div>

            <form onSubmit={handleAddVisit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Anggota Keluarga
                </label>
                <select
                  value={visMemberId}
                  onChange={(e) => setVisMemberId(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-2 focus:outline-teal-600"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Faskes / Puskesmas
                </label>
                <input
                  type="text"
                  required
                  value={visFacility}
                  onChange={(e) => setVisFacility(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-sm focus:outline-2 focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Layanan / Pemeriksaan
                </label>
                <input
                  type="text"
                  required
                  value={visService}
                  onChange={(e) => setVisService(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-sm focus:outline-2 focus:outline-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={visDate}
                    onChange={(e) => setVisDate(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-slate-300 px-2.5 text-xs font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam</label>
                  <input
                    type="time"
                    required
                    value={visTime}
                    onChange={(e) => setVisTime(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-slate-300 px-2.5 text-xs font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Persiapan (Mis. Puasa / Bawa Obat)
                </label>
                <input
                  type="text"
                  placeholder="Catatan untuk petugas atau keluarga"
                  value={visNotes}
                  onChange={(e) => setVisNotes(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-sm focus:outline-2 focus:outline-teal-600"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full min-h-[46px] rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  Simpan Agenda Kunjungan Faskes
                </button>
              </div>
            </form>
          </section>

          {/* Agenda List */}
          <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900">Daftar Agenda Faskes</h2>
            {displayedVisits.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Tidak ada jadwal kunjungan pada filter tanggal ini.
              </p>
            ) : (
              <div className="space-y-3">
                {displayedVisits.map((visit) => {
                  const memberName = getMemberName(visit.memberId);
                  return (
                    <div
                      key={visit.id}
                      className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        visit.completed
                          ? 'bg-slate-50 border-slate-200 opacity-75'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono tabular-nums font-semibold text-sky-700">
                            {new Date(visit.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            · {visit.time} WIB
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-slate-700">{memberName}</span>
                        </div>
                        <p
                          className={`text-sm font-bold ${
                            visit.completed ? 'line-through text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          {visit.serviceType} — {visit.facilityName}
                        </p>
                        {visit.notes && (
                          <p className="text-xs text-slate-600 leading-relaxed">{visit.notes}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => downloadVisitIcsFile(visit, memberName)}
                          className="min-h-[38px] px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                          title="Simpan ke aplikasi Kalender HP"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Kalender (.ics)
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleVisitComplete(visit.id)}
                          className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                            visit.completed
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                              : 'bg-teal-600 hover:bg-teal-700 text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {visit.completed ? 'Selesai' : 'Tandai Selesai'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteVisit(visit.id)}
                          aria-label="Hapus agenda"
                          className="min-h-[38px] min-w-[38px] rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
