import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarPlus,
  HeartPulse,
  PlusCircle,
  Stethoscope,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  FamilyMember,
  GlucoseType,
  HealthCheckRecord,
} from '../types/health';
import {
  calculateBmi,
  evaluateFullHealthCheck,
  PROMOTIVE_DISCLAIMER,
} from '../lib/hbmEvaluator';
import {StatusIndicator} from '../components/StatusBadge';
import {ChartMetric, HealthTrendChart} from '../components/HealthTrendChart';

interface HealthCheckViewProps {
  activeMember: FamilyMember | null;
  records: HealthCheckRecord[];
  onAddHealthCheck: (record: Omit<HealthCheckRecord, 'id' | 'overallStatus' | 'bmi'>) => void;
  onDeleteHealthCheck: (recordId: string) => void;
  onQuickSchedulePuskesmas: (memberId: string, reason: string) => void;
  onAddFirstMember: () => void;
}

export const HealthCheckView: React.FC<HealthCheckViewProps> = ({
  activeMember,
  records,
  onAddHealthCheck,
  onDeleteHealthCheck,
  onQuickSchedulePuskesmas,
  onAddFirstMember,
}) => {
  const memberRecords = useMemo(() => {
    if (!activeMember) return [];
    return records
      .filter((r) => r.memberId === activeMember.id)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }, [records, activeMember]);

  const latest = memberRecords[0];

  const [systolic, setSystolic] = useState<string>(latest ? String(latest.systolic) : '120');
  const [diastolic, setDiastolic] = useState<string>(latest ? String(latest.diastolic) : '80');
  const [glucose, setGlucose] = useState<string>(latest ? String(latest.glucose) : '95');
  const [glucoseType, setGlucoseType] = useState<GlucoseType>(latest ? latest.glucoseType : 'puasa');
  const [cholesterol, setCholesterol] = useState<string>(latest ? String(latest.cholesterol) : '180');
  const [weightKg, setWeightKg] = useState<string>(latest ? String(latest.weightKg) : '60');
  const [heightCm, setHeightCm] = useState<string>(latest ? String(latest.heightCm) : '165');
  const [notes, setNotes] = useState<string>('');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('bp');
  const [conclusionSource, setConclusionSource] = useState<'live' | 'saved'>('live');
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  if (!activeMember) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-4 max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center mx-auto">
          <HeartPulse className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">
          Cek Kesehatan & Grafik Tren
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Belum ada profil anggota keluarga yang tercatat. Tambahkan anggota keluarga pertama Anda
          untuk mulai mencatat tekanan darah, gula darah, kolesterol, dan IMT.
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

  const parsedWeight = Number(weightKg) || 0;
  const parsedHeight = Number(heightCm) || 0;
  const liveBmi = calculateBmi(parsedWeight, parsedHeight);

  const liveEvaluation = evaluateFullHealthCheck({
    systolic: Number(systolic) || 0,
    diastolic: Number(diastolic) || 0,
    glucose: Number(glucose) || 0,
    glucoseType,
    cholesterol: Number(cholesterol) || 0,
    weightKg: parsedWeight,
    heightCm: parsedHeight,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = Number(systolic);
    const dia = Number(diastolic);
    const glu = Number(glucose);
    const chol = Number(cholesterol);
    const wt = Number(weightKg);
    const ht = Number(heightCm);

    if (!sys || !dia || !glu || !chol || !wt || !ht) return;

    onAddHealthCheck({
      memberId: activeMember.id,
      recordedAt: new Date().toISOString(),
      systolic: sys,
      diastolic: dia,
      glucose: glu,
      glucoseType,
      cholesterol: chol,
      weightKg: wt,
      heightCm: ht,
      notes: notes.trim() || undefined,
    });

    setNotes('');
    setConclusionSource('saved');
    setSavedBanner(`Hasil cek kesehatan ${activeMember.name} berhasil disimpan offline.`);
    window.setTimeout(() => setSavedBanner(null), 4000);
  };

  const activeSummaryEval =
    conclusionSource === 'saved' && latest
      ? evaluateFullHealthCheck(latest)
      : liveEvaluation;

  const activeSummaryMetrics =
    conclusionSource === 'saved' && latest
      ? {
          bp: `${latest.systolic}/${latest.diastolic} mmHg`,
          glu: `${latest.glucose} mg/dL (${latest.glucoseType === 'puasa' ? 'Puasa' : 'Sewaktu'})`,
          chol: `${latest.cholesterol} mg/dL`,
          bmi: `${latest.bmi} kg/m²`,
        }
      : {
          bp: `${Number(systolic) || 0}/${Number(diastolic) || 0} mmHg`,
          glu: `${Number(glucose) || 0} mg/dL (${glucoseType === 'puasa' ? 'Puasa' : 'Sewaktu'})`,
          chol: `${Number(cholesterol) || 0} mg/dL`,
          bmi: `${liveBmi} kg/m²`,
        };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-teal-700">
            Profil Dipantau: {activeMember.name} · {activeMember.role} ({activeMember.age} th)
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
            Cek Kesehatan & Grafik Tren
          </h1>
        </div>
        {latest && <StatusIndicator status={latest.overallStatus} />}
      </div>

      {savedBanner && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          {savedBanner}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Form & Live HBM Preview */}
        <section className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Catat Pemeriksaan Baru</h2>
              <p className="text-xs text-slate-500">
                Evaluasi otomatis warna HBM & kalkulator IMT
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Blood Pressure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sistolik (mmHg)
                </label>
                <input
                  type="number"
                  min={60}
                  max={260}
                  required
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diastolik (mmHg)
                </label>
                <input
                  type="number"
                  min={40}
                  max={160}
                  required
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
                />
              </div>
            </div>

            {/* Blood Glucose */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gula Darah (mg/dL)
                </label>
                <input
                  type="number"
                  min={30}
                  max={600}
                  required
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Waktu Pemeriksaan
                </label>
                <select
                  value={glucoseType}
                  onChange={(e) => setGlucoseType(e.target.value as GlucoseType)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-2 focus:outline-teal-600"
                >
                  <option value="puasa">Puasa (≥8 jam)</option>
                  <option value="sewaktu">Sewaktu</option>
                </select>
              </div>
            </div>

            {/* Cholesterol */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kolesterol Total (mg/dL)
              </label>
              <input
                type="number"
                min={70}
                max={500}
                required
                value={cholesterol}
                onChange={(e) => setCholesterol(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
              />
            </div>

            {/* Weight & Height -> Auto BMI */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Berat Badan (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={5}
                  max={250}
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tinggi Badan (cm)
                </label>
                <input
                  type="number"
                  min={50}
                  max={230}
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
                />
              </div>
            </div>

            {/* Automatic BMI Readout */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-500">Kalkulator IMT Otomatis</span>
                <p className="text-lg font-extrabold font-mono tabular-nums text-slate-900">
                  {liveBmi} kg/m²
                </p>
                <p className="text-xs text-slate-600">{liveEvaluation.bmi.detailLabel}</p>
              </div>
              <StatusIndicator status={liveEvaluation.bmi.status} compact />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Mis. Diukur pagi hari setelah istirahat"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:outline-2 focus:outline-teal-600"
              />
            </div>

            {/* Live HBM Screening Evaluation Box */}
            <div
              className={`rounded-xl border p-4 space-y-2.5 ${
                liveEvaluation.overallStatus === 'normal'
                  ? 'bg-emerald-50 border-emerald-200'
                  : liveEvaluation.overallStatus === 'waspada'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Pratinjau Evaluasi HBM
                </span>
                <StatusIndicator status={liveEvaluation.overallStatus} compact />
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {liveEvaluation.summaryRecommendation}
              </p>
              {liveEvaluation.needsPuskesmasReferral && (
                <button
                  type="button"
                  onClick={() =>
                    onQuickSchedulePuskesmas(
                      activeMember.id,
                      `Tindak lanjut cek kesehatan (${liveEvaluation.overallLabel}): TD ${systolic}/${diastolic}, Gula ${glucose}, Kol ${cholesterol}`,
                    )
                  }
                  className="w-full min-h-[40px] rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4 text-red-600" />
                  Jadwalkan Kunjungan ke Puskesmas
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Simpan Hasil Pemeriksaan
            </button>
          </form>
        </section>

        {/* Right: Self-Monitoring Conclusion + Mandatory Disclaimer + Trend Chart */}
        <div className="lg:col-span-7 space-y-5">
          {/* Kesimpulan Hasil Pemantauan Mandiri + Disclaimer Faskes Terdekat */}
          <section
            aria-labelledby="conclusion-heading"
            className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="conclusion-heading" className="text-base font-bold text-slate-900">
                    Kesimpulan Hasil Pemantauan Mandiri
                  </h2>
                  <p className="text-xs text-slate-500">
                    {conclusionSource === 'saved' && latest
                      ? `Pemeriksaan tersimpan (${new Date(latest.recordedAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})})`
                      : 'Dihitung otomatis dari angka input formulir saat ini'}
                  </p>
                </div>
              </div>

              {latest && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setConclusionSource('live')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      conclusionSource === 'live'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Input Saat Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setConclusionSource('saved')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      conclusionSource === 'saved'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tersimpan Terakhir
                  </button>
                </div>
              )}
            </div>

            {/* Category & Summary Narrative */}
            <div
              className={`rounded-xl border p-4 space-y-3 ${
                activeSummaryEval.overallStatus === 'normal'
                  ? 'bg-emerald-50 border-emerald-200'
                  : activeSummaryEval.overallStatus === 'waspada'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    Kategori Kesimpulan ({activeMember.name}):
                  </span>
                  <p className="text-base font-extrabold text-slate-900">
                    {activeSummaryEval.conclusionTitle}
                  </p>
                </div>
                <StatusIndicator status={activeSummaryEval.overallStatus} />
              </div>

              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                {activeSummaryEval.summaryRecommendation}
              </p>

              {/* 4-Metric Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="rounded-lg bg-white/90 border border-slate-200/80 px-2.5 py-2">
                  <span className="text-[11px] text-slate-500 block">Tekanan Darah</span>
                  <span className="text-xs font-mono tabular-nums font-bold text-slate-900 block">
                    {activeSummaryMetrics.bp}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700">
                    {activeSummaryEval.bloodPressure.statusLabel}
                  </span>
                </div>
                <div className="rounded-lg bg-white/90 border border-slate-200/80 px-2.5 py-2">
                  <span className="text-[11px] text-slate-500 block">Gula Darah</span>
                  <span className="text-xs font-mono tabular-nums font-bold text-slate-900 block">
                    {activeSummaryMetrics.glu}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700">
                    {activeSummaryEval.glucose.statusLabel}
                  </span>
                </div>
                <div className="rounded-lg bg-white/90 border border-slate-200/80 px-2.5 py-2">
                  <span className="text-[11px] text-slate-500 block">Kolesterol</span>
                  <span className="text-xs font-mono tabular-nums font-bold text-slate-900 block">
                    {activeSummaryMetrics.chol}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700">
                    {activeSummaryEval.cholesterol.statusLabel}
                  </span>
                </div>
                <div className="rounded-lg bg-white/90 border border-slate-200/80 px-2.5 py-2">
                  <span className="text-[11px] text-slate-500 block">IMT Otomatis</span>
                  <span className="text-xs font-mono tabular-nums font-bold text-slate-900 block">
                    {activeSummaryMetrics.bmi}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700">
                    {activeSummaryEval.bmi.statusLabel}
                  </span>
                </div>
              </div>

              {activeSummaryEval.needsPuskesmasReferral && (
                <button
                  type="button"
                  onClick={() =>
                    onQuickSchedulePuskesmas(
                      activeMember.id,
                      `Pemeriksaan lanjutan Faskes (${activeSummaryEval.conclusionTitle}): TD ${activeSummaryMetrics.bp}, Gula ${activeSummaryMetrics.glu}, Kol ${activeSummaryMetrics.chol}, IMT ${activeSummaryMetrics.bmi}`,
                    )
                  }
                  className="w-full min-h-[42px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Jadwalkan Pemeriksaan ke Faskes / Puskesmas Terdekat</span>
                </button>
              )}
            </div>

            {/* Clear Non-Diagnostic Disclaimer & Faskes Instruction */}
            <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sky-950 font-bold text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Disclaimer Penting: Bukan Diagnosis Medis Resmi</span>
              </div>
              <p className="text-xs text-sky-950 leading-relaxed">
                Kesimpulan dan kategori hasil pemantauan mandiri ini dihitung dari angka yang Anda
                masukkan untuk membantu deteksi dini keluarga, dan{' '}
                <strong>
                  bukan merupakan diagnosis medis resmi dari dokter atau tenaga kesehatan ahli
                </strong>
                . Apabila terdapat hasil di luar batas normal atau{' '}
                <strong>{activeMember.name}</strong> mengalami keluhan/kendala kesehatan, segera
                periksakan ke{' '}
                <strong>
                  fasilitas pelayanan kesehatan (Faskes) terdekat (seperti Puskesmas atau klinik)
                </strong>{' '}
                untuk pemeriksaan dan penanganan profesional.
              </p>
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900">Grafik Tren Pemeriksaan</h2>
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {(
                  [
                    {id: 'bp', label: 'Tekanan Darah'},
                    {id: 'glucose', label: 'Gula Darah'},
                    {id: 'cholesterol', label: 'Kolesterol'},
                    {id: 'bmi', label: 'IMT'},
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setChartMetric(item.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      chartMetric === item.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <HealthTrendChart records={memberRecords} metric={chartMetric} />
          </section>

          {/* Alur Pelayanan Promotif-Preventif */}
          <section className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Panduan Tindak Lanjut Faskes Primer</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{PROMOTIVE_DISCLAIMER}</p>
          </section>

          {/* History Table */}
          <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Riwayat Pemeriksaan Medis</h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {memberRecords.length} catatan
              </span>
            </div>

            {memberRecords.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Belum ada riwayat pemeriksaan tersimpan untuk profil ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2.5 pr-3 font-semibold">Tanggal</th>
                      <th className="py-2.5 px-3 font-semibold text-right">TD (mmHg)</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Gula (mg/dL)</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Kolesterol</th>
                      <th className="py-2.5 px-3 font-semibold text-right">IMT</th>
                      <th className="py-2.5 px-3 font-semibold">Status HBM</th>
                      <th className="py-2.5 pl-2 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {memberRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80">
                        <td className="py-3 pr-3 whitespace-nowrap text-slate-700">
                          <div className="font-medium">
                            {new Date(rec.recordedAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          {rec.notes && (
                            <div className="text-[11px] text-slate-400 max-w-[160px] truncate">
                              {rec.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {rec.systolic}/{rec.diastolic}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                          {rec.glucose}{' '}
                          <span className="text-[10px] text-slate-400">
                            ({rec.glucoseType === 'puasa' ? 'P' : 'S'})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                          {rec.cholesterol}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                          {rec.bmi}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <StatusIndicator status={rec.overallStatus} compact />
                        </td>
                        <td className="py-3 pl-2 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteHealthCheck(rec.id)}
                            aria-label="Hapus catatan pemeriksaan"
                            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
