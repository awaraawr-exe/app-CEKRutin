export type AppTab = 'beranda' | 'cek' | 'agenda' | 'edukasi' | 'keluarga';

export type FamilyRole = 'Ayah' | 'Ibu' | 'Anak' | 'Lansia' | 'Pengelola';

export type Gender = 'Laki-laki' | 'Perempuan';

export type HbmStatus = 'normal' | 'waspada' | 'konsultasi';

export type GlucoseType = 'sewaktu' | 'puasa';

export interface FamilyManagerAccount {
  id: string;
  name: string;
  email?: string;
  photoUrl?: string;
  city: string;
  puskesmasName: string;
  pinEnabled: boolean;
  pinCode: string;
  isLocked: boolean;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  age: number;
  gender: Gender;
  targetWaterGlasses: number;
  targetFruitVegPortions: number;
  targetActivityMinutes: number;
  targetSteps?: number;
  medicalNote: string;
  createdAt: string;
}

export interface MicroActivityEntry {
  id: string;
  label: string;
  minutes: number;
  loggedAt: string;
}

export interface StepLogEntry {
  id: string;
  source: 'duration' | 'manual';
  label: string;
  minutes?: number;
  steps: number;
  loggedAt: string;
}

export interface DailyRoutineLog {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  waterGlasses: number; // 1 gelas = 250 ml
  fruitPortions: number;
  vegetablePortions: number;
  activities: MicroActivityEntry[];
  stepsCount?: number;
  stepEntries?: StepLogEntry[];
}

export interface HealthCheckRecord {
  id: string;
  memberId: string;
  recordedAt: string; // ISO string
  systolic: number;
  diastolic: number;
  glucose: number;
  glucoseType: GlucoseType;
  cholesterol: number;
  weightKg: number;
  heightCm: number;
  bmi: number;
  overallStatus: HbmStatus;
  notes?: string;
}

export interface RoutineReminder {
  id: string;
  memberId: string;
  title: string;
  category: 'air' | 'buah_sayur' | 'aktivitas' | 'cek_medis';
  time: string; // HH:mm
  enabled: boolean;
  lastTriggeredDate?: string;
}

export interface FaskesVisit {
  id: string;
  memberId: string;
  facilityName: string;
  serviceType: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes: string;
  completed: boolean;
}

export interface CertificateRecord {
  id: string;
  certificateNumber: string;
  recipientName: string;
  memberRole: FamilyRole;
  score: number;
  totalQuestions: number;
  issuedAt: string;
}

export interface EducationArticle {
  id: string;
  title: string;
  category: string;
  readMinutes: number;
  imageUrl: string;
  imageAlt: string;
  summary: string;
  keyActions: string[];
  bodyParagraphs: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CekRutinStore {
  manager: FamilyManagerAccount;
  members: FamilyMember[];
  activeMemberId: string;
  routineLogs: DailyRoutineLog[];
  healthChecks: HealthCheckRecord[];
  reminders: RoutineReminder[];
  faskesVisits: FaskesVisit[];
  certificates: CertificateRecord[];
}
