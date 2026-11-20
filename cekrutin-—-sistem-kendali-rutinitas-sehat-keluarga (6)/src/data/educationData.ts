import {EducationArticle, QuizQuestion} from '../types/health';

export const FAMILY_WELLNESS_BANNER =
  '/src/assets/images/cekrutin_family_wellness_1794923407692.jpg';

export const EDUCATION_ARTICLES: EducationArticle[] = [
  {
    id: 'art-hipertensi',
    title: 'Kendalikan Tekanan Darah Keluarga dengan Pola PATUH & Kurangi Garam',
    category: 'Pencegahan Hipertensi',
    readMinutes: 3,
    imageUrl: '/src/assets/images/ptm_hypertension_care_1794923406416.jpg',
    imageAlt: 'Alat ukur tekanan darah digital di samping semangkuk alpukat, bayam, dan teh herbal',
    summary:
      'Hipertensi sering muncul tanpa gejala (silent killer). Deteksi rutin di rumah dan pembatasan natrium membantu menjaga tekanan darah tetap di bawah 120/80 mmHg.',
    keyActions: [
      'Batasi konsumsi garam dapur maksimal 1 sendok teh (5 gram) per orang per hari.',
      'Perbanyak bahan kaya kalium seperti pisang, bayam, alpukat, dan kacang-kacangan.',
      'Ukur tekanan darah dalam posisi duduk tenang setelah beristirahat 5 menit.',
      'Segera konsultasi ke Puskesmas bila hasil ≥140/90 mmHg secara berulang.',
    ],
    bodyParagraphs: [
      'Penyakit Tidak Menular (PTM) seperti hipertensi dapat dicegah dan dikendalikan sejak dari lingkup rumah tangga. Anggota keluarga usia dewasa maupun lansia sangat dianjurkan memantau tekanan darah minimal sebulan sekali melalui Posbindu PTM atau alat tensimeter rumah.',
      'Prinsip PATUH dari Kemenkes (Periksa kesehatan secara rutin, Atasi penyakit dengan pengobatan tepat, Tetap diet gizi seimbang, Upayakan aktivitas fisik aman, Hindari asap rokok dan alkohol) terbukti menurunkan risiko komplikasi jantung dan stroke.',
    ],
  },
  {
    id: 'art-gula-kolesterol',
    title: 'Atur Porsi "Isi Piringku" untuk Cegah Lonjakan Gula Darah & Kolesterol',
    category: 'Gizi Seimbang & Diabetes',
    readMinutes: 4,
    imageUrl: '/src/assets/images/ptm_diabetes_balance_1794923407349.jpg',
    imageAlt: 'Piring makan sehat Isi Piringku berisi nasi merah, ikan panggang, kangkung, tomat, dan pepaya',
    summary:
      'Komposisi piring makan seimbang membagi separuh piring untuk sayur dan buah berserat, sehingga penyerapan glukosa lebih stabil dan kolesterol lebih terkendali.',
    keyActions: [
      'Isi 1/2 piring dengan aneka sayuran dan buah segar setiap kali makan utama.',
      'Pilih karbohidrat berserat (nasi merah, jagung, umbi) dan lauk ikan/tahu/tempe pada 1/2 piring lainnya.',
      'Terapkan batas GGL harian: Gula max 4 sdm, Garam max 1 sdt, Lemak/Minyak max 5 sdm.',
      'Ganti minuman manis dengan air putih minimal 8 gelas (2 liter) per hari.',
    ],
    bodyParagraphs: [
      'Kebiasaan mengonsumsi minuman berpemanis dan gorengan berlebih memicu kenaikan gula darah sewaktu dan kolesterol total tanpa disadari. Dengan konsep Isi Piringku, keluarga tidak perlu diet ekstrem—cukup menata proporsi serat lebih dulu sebelum karbohidrat.',
      'Jika hasil skrining gula darah puasa ≥126 mg/dL atau kolesterol total ≥240 mg/dL, manfaatkan layanan pemeriksaan laboratorium dasar di Puskesmas untuk pemastian medis.',
    ],
  },
  {
    id: 'art-aktivitas-mikro',
    title: 'Strategi Aktivitas Fisik Mikro 5–15 Menit di Tengah Kesibukan Keluarga',
    category: 'Aktivitas Fisik Mikro',
    readMinutes: 3,
    imageUrl: '/src/assets/images/ptm_micro_exercise_1794923407122.jpg',
    imageAlt: 'Orang dewasa melakukan peregangan pagi di teras rumah yang cerah dikelilingi tanaman hijau',
    summary:
      'Hambatan terbesar keluarga adalah kurangnya waktu olahraga. Aktivitas fisik mikro 5–15 menit yang dilakukan konsisten efektif menjaga metabolisme tubuh.',
    keyActions: [
      'Mulai dari peregangan otot leher, bahu, dan pinggang 5 menit setelah bangun tidur.',
      'Lakukan jalan kaki ringan 10 menit di sekitar rumah atau setelah makan malam.',
      'Untuk lansia, pilih senam duduk atau jalan santai bertahap sesuai kemampuan napas.',
      'Catat aktivitas dengan satu kali ketukan di CEKRutin untuk menjaga konsistensi harian.',
    ],
    bodyParagraphs: [
      'Dalam teori Health Belief Model, rasa tidak punya waktu sering menjadi hambatan (perceived barrier) untuk hidup aktif. Memecah target olahraga 30 menit menjadi 2–3 sesi mikro berdurasi 5 hingga 15 menit membuat kebiasaan lebih mudah dimulai dan dipertahankan.',
      'Aktivitas fisik teratur membantu meningkatkan sensitivitas insulin, menjaga berat badan pada rentang IMT normal (18,5–25,0 kg/m²), dan memperbaiki kualitas tidur seluruh anggota keluarga.',
    ],
  },
];

export const PTM_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question:
      'Berapa ambang batas tekanan darah yang termasuk kategori "Perlu Konsultasi Puskesmas" (indikasi hipertensi) pada skrining CEKRutin?',
    options: [
      '110 / 70 mmHg',
      '120 / 80 mmHg',
      '≥ 140 / 90 mmHg',
      '125 / 82 mmHg',
    ],
    correctIndex: 2,
    explanation:
      'Tekanan darah ≥140 mmHg sistolik atau ≥90 mmHg diastolik menandakan zona Merah yang perlu dikonfirmasi langsung oleh tenaga kesehatan di Puskesmas.',
  },
  {
    id: 'q2',
    question:
      'Dalam panduan gizi seimbang "Isi Piringku" Kemenkes RI, berapa porsi piring makan yang idealnya diisi oleh buah dan sayuran?',
    options: [
      'Seperempat (1/4) piring',
      'Setengah (1/2) piring',
      'Seperlima (1/5) piring',
      'Hanya sebagai pelengkap seminggu sekali',
    ],
    correctIndex: 1,
    explanation:
      'Setengah (1/2) piring makan sebaiknya terdiri dari sayuran dan buah-buahan untuk mencukupi kebutuhan serat, vitamin, dan mineral pencegah PTM.',
  },
  {
    id: 'q3',
    question:
      'Berapa batas aman anjuran konsumsi gula, garam, dan lemak (GGL) harian per orang menurut Kemenkes RI?',
    options: [
      'Gula 4 sdm, Garam 1 sdt, Lemak 5 sdm',
      'Gula 10 sdm, Garam 3 sdt, Lemak 10 sdm',
      'Gula 1 sdm, Garam 5 sdt, Lemak 2 sdm',
      'Tidak ada batas selama minum air putih',
    ],
    correctIndex: 0,
    explanation:
      'Pedoman G4-G1-L5 menganjurkan maksimal 4 sendok makan gula (50g), 1 sendok teh garam (5g), dan 5 sendok makan lemak/minyak (67g) per hari.',
  },
  {
    id: 'q4',
    question:
      'Apa tujuan utama pendekatan aktivitas fisik mikro berdurasi 5–15 menit di aplikasi CEKRutin?',
    options: [
      'Menggantikan konsultasi dokter sepenuhnya',
      'Mengatasi hambatan kurang waktu agar anggota keluarga tetap konsisten bergerak setiap hari',
      'Meningkatkan tekanan darah secara drastis',
      'Hanya diperuntukkan bagi atlet profesional',
    ],
    correctIndex: 1,
    explanation:
      'Aktivitas fisik mikro menurunkan hambatan waktu (perceived barriers) dan memudahkan pemicu kebiasaan (Fogg Behavior Model) untuk dilakukan konsisten setiap hari.',
  },
  {
    id: 'q5',
    question:
      'Apa langkah terbaik ketika hasil pemeriksaan gula darah puasa atau kolesterol anggota keluarga berada pada kategori Kuning (Waspada) atau Merah?',
    options: [
      'Mengabaikan hasil dan menunggu keluhan berat muncul',
      'Mengonsumsi obat resep milik tetangga tanpa pemeriksaan',
      'Memperbaiki pola hidup harian dan menjadwalkan pemeriksaan lanjutan ke Puskesmas/Posbindu PTM',
      'Berhenti minum air putih agar gula darah turun',
    ],
    correctIndex: 2,
    explanation:
      'CEKRutin berfungsi sebagai skrining promotif-preventif. Hasil Waspada atau Merah harus ditindaklanjuti dengan gaya hidup sehat serta verifikasi medis di Puskesmas atau FKTP.',
  },
];
