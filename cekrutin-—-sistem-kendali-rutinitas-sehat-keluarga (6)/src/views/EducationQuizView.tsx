import React, {useState} from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import {
  CertificateRecord,
  EducationArticle,
  FamilyMember,
} from '../types/health';
import {
  EDUCATION_ARTICLES,
  FAMILY_WELLNESS_BANNER,
  PTM_QUIZ_QUESTIONS,
} from '../data/educationData';
import {PROMOTIVE_DISCLAIMER} from '../lib/hbmEvaluator';
import {CertificateGenerator} from '../components/CertificateGenerator';

interface EducationQuizViewProps {
  managerName: string;
  activeMember: FamilyMember | null;
  certificates: CertificateRecord[];
  onIssueCertificate: (score: number, totalQuestions: number) => CertificateRecord;
}

export const EducationQuizView: React.FC<EducationQuizViewProps> = ({
  managerName,
  activeMember,
  certificates,
  onIssueCertificate,
}) => {
  const participantName = activeMember?.name || managerName;
  const [selectedArticle, setSelectedArticle] = useState<EducationArticle | null>(
    EDUCATION_ARTICLES[0],
  );
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [latestCertificate, setLatestCertificate] = useState<CertificateRecord | null>(
    certificates[0] || null,
  );

  const allAnswered = PTM_QUIZ_QUESTIONS.every((q) => quizAnswers[q.id] !== undefined);

  const correctCount = PTM_QUIZ_QUESTIONS.filter(
    (q) => quizAnswers[q.id] === q.correctIndex,
  ).length;
  const quizScore = Math.round((correctCount / PTM_QUIZ_QUESTIONS.length) * 100);
  const passed = quizScore >= 80;

  const handleSubmitQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) return;
    setQuizSubmitted(true);
    if (quizScore >= 80) {
      const issued = onIssueCertificate(quizScore, PTM_QUIZ_QUESTIONS.length);
      setLatestCertificate(issued);
    }
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Hero Banner */}
      <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-center space-y-3">
            <span className="text-xs font-semibold text-teal-700">
              Edukasi Promotif-Preventif · Gerakan Keluarga Sehat
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Pencegahan PTM & E-Sertifikat Keluarga
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Pelajari panduan praktis pencegahan hipertensi, diabetes, dan kolesterol, lalu
              selesaikan kuis singkat 5 soal (nilai minimal 80) untuk mendapatkan{' '}
              <strong>E-Sertifikat Keluarga Sadar Sehat</strong> atas nama{' '}
              <strong>{participantName}</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
              <span>{EDUCATION_ARTICLES.length} Artikel Ringkas</span>
              <span aria-hidden="true">·</span>
              <span>5 Soal Evaluasi</span>
              <span aria-hidden="true">·</span>
              <span>Unduh PNG / PDF Langsung</span>
            </div>
          </div>

          <div className="lg:col-span-6 min-h-[220px] bg-teal-50 relative">
            <img
              src={FAMILY_WELLNESS_BANNER}
              alt="Keluarga Indonesia menyiapkan buah dan sayur segar bersama di dapur"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover lg:absolute lg:inset-0"
            />
          </div>
        </div>
      </section>

      {/* Articles Grid + Reader */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900">
            <BookOpen className="w-5 h-5 text-teal-700" />
            <h2>Artikel Singkat Pencegahan PTM</h2>
          </div>

          {EDUCATION_ARTICLES.map((art) => {
            const isSelected = selectedArticle?.id === art.id;
            return (
              <button
                key={art.id}
                type="button"
                onClick={() => setSelectedArticle(art)}
                className={`w-full text-left rounded-2xl border p-3.5 flex gap-3.5 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50/70 border-teal-400'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-24 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={art.imageUrl}
                    alt={art.imageAlt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-teal-700">{art.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{art.readMinutes} mnt baca</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                    {art.title}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
                    Baca ringkasan <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Article Reader */}
        {selectedArticle && (
          <article className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="aspect-16/9 max-h-64 w-full bg-slate-100 overflow-hidden">
              <img
                src={selectedArticle.imageUrl}
                alt={selectedArticle.imageAlt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-teal-700">{selectedArticle.category}</span>
                <span aria-hidden="true">·</span>
                <span>Waktu baca {selectedArticle.readMinutes} menit</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 leading-snug">
                {selectedArticle.title}
              </h3>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                {selectedArticle.summary}
              </p>

              <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                {selectedArticle.bodyParagraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 space-y-2">
                <p className="text-xs font-bold text-teal-950">Langkah Praktis di Rumah:</p>
                <ul className="space-y-1.5 text-xs text-teal-900">
                  {selectedArticle.keyActions.map((act, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                {PROMOTIVE_DISCLAIMER}
              </p>
            </div>
          </article>
        )}
      </section>

      {/* Interactive 5-Question Quiz & Certificate Reward */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Kuis Interaktif Pencegahan PTM (5 Soal)
              </h2>
              <p className="text-xs text-slate-500">
                Peserta aktif: <strong>{participantName}</strong> · Skor kelulusan minimal{' '}
                <span className="font-mono font-semibold">80/100</span>
              </p>
            </div>
          </div>

          {quizSubmitted && (
            <button
              type="button"
              onClick={handleResetQuiz}
              className="min-h-[42px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ulangi Kuis
            </button>
          )}
        </div>

        <form onSubmit={handleSubmitQuiz} className="space-y-5">
          {PTM_QUIZ_QUESTIONS.map((q, qIdx) => {
            const chosen = quizAnswers[q.id];
            return (
              <fieldset
                key={q.id}
                className="rounded-xl border border-slate-200 p-4 space-y-3"
              >
                <legend className="text-sm font-bold text-slate-900 leading-snug">
                  <span className="font-mono text-teal-700 mr-1.5">0{qIdx + 1}.</span>
                  {q.question}
                </legend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, oIdx) => {
                    const isPicked = chosen === oIdx;
                    const isCorrectOpt = q.correctIndex === oIdx;

                    let stateClass =
                      'border-slate-200 bg-white hover:bg-slate-50 text-slate-800';
                    if (quizSubmitted) {
                      if (isCorrectOpt) {
                        stateClass = 'border-emerald-400 bg-emerald-50 text-emerald-950 font-semibold';
                      } else if (isPicked && !isCorrectOpt) {
                        stateClass = 'border-red-300 bg-red-50 text-red-900';
                      }
                    } else if (isPicked) {
                      stateClass = 'border-teal-600 bg-teal-50 text-teal-950 font-semibold';
                    }

                    return (
                      <label
                        key={oIdx}
                        className={`min-h-[46px] rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm flex items-center gap-2.5 transition-colors cursor-pointer ${stateClass}`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={oIdx}
                          checked={isPicked}
                          disabled={quizSubmitted}
                          onChange={() =>
                            setQuizAnswers((prev) => ({...prev, [q.id]: oIdx}))
                          }
                          className="accent-teal-600 w-4 h-4 shrink-0"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>

                {quizSubmitted && (
                  <div
                    className={`rounded-lg px-3.5 py-2.5 text-xs flex items-start gap-2 ${
                      chosen === q.correctIndex
                        ? 'bg-emerald-50 text-emerald-900'
                        : 'bg-amber-50 text-amber-950'
                    }`}
                  >
                    {chosen === q.correctIndex ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span>{q.explanation}</span>
                  </div>
                )}
              </fieldset>
            );
          })}

          {!quizSubmitted ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                Terjawab{' '}
                <strong className="font-mono tabular-nums text-slate-800">
                  {Object.keys(quizAnswers).length}/{PTM_QUIZ_QUESTIONS.length}
                </strong>{' '}
                soal
              </span>
              <button
                type="submit"
                disabled={!allAnswered}
                className="min-h-[48px] px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-45 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Periksa Jawaban & Nilai Kuis
              </button>
            </div>
          ) : (
            <div
              className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 ${
                passed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div>
                <p className="text-base font-extrabold">
                  Skor Anda:{' '}
                  <span className="font-mono tabular-nums">{quizScore}/100</span> (
                  {correctCount} dari {PTM_QUIZ_QUESTIONS.length} benar)
                </p>
                <p className="text-xs mt-1">
                  {passed
                    ? 'Selamat! Anda lulus evaluasi pencegahan PTM dan berhak mengunduh E-Sertifikat Keluarga Sadar Sehat di bawah ini.'
                    : 'Skor belum mencapai batas lulus 80. Pelajari kembali penjelasan jawaban di atas lalu tekan Ulangi Kuis.'}
                </p>
              </div>
              {!passed && (
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="min-h-[44px] px-5 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Coba Lagi Sekarang
                </button>
              )}
            </div>
          )}
        </form>
      </section>

      {/* E-Sertifikat Output Section */}
      {latestCertificate && (
        <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  E-Sertifikat Keluarga Sadar Sehat
                </h2>
                <p className="text-xs text-slate-500">
                  Diterbitkan untuk {latestCertificate.recipientName} · Nomor{' '}
                  <span className="font-mono">{latestCertificate.certificateNumber}</span>
                </p>
              </div>
            </div>
          </div>

          <CertificateGenerator certificate={latestCertificate} />
        </section>
      )}
    </div>
  );
};
