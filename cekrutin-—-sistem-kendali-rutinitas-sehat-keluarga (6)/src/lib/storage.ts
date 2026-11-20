import {CekRutinStore, DailyRoutineLog, FaskesVisit} from '../types/health';

const DB_NAME = 'cekrutin_offline_db';
const DB_VERSION = 2;
const STORE_NAME = 'app_state';

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface ManagerSeedIdentity {
  uid?: string;
  name?: string | null;
  email?: string | null;
  photoUrl?: string | null;
}

export function createDefaultStore(identity?: ManagerSeedIdentity): CekRutinStore {
  const managerName = identity?.name?.trim() || 'Pengelola Keluarga';
  const managerEmail = identity?.email?.trim() || '';

  return {
    manager: {
      id: identity?.uid || 'mgr-1',
      name: managerName,
      email: managerEmail,
      photoUrl: identity?.photoUrl || undefined,
      city: '',
      puskesmasName: '',
      pinEnabled: false,
      pinCode: '1234',
      isLocked: false,
      createdAt: new Date().toISOString(),
    },
    members: [],
    activeMemberId: '',
    routineLogs: [],
    healthChecks: [],
    reminders: [],
    faskesVisits: [],
    certificates: [],
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadCekRutinStore(identity?: ManagerSeedIdentity): Promise<CekRutinStore> {
  const uid = identity?.uid || 'default';
  const stateKey = `primary_store_v2_${uid}`;
  const lsKey = `cekrutin_offline_store_v2_${uid}`;

  try {
    const db = await openDatabase();
    const result = await new Promise<CekRutinStore | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(stateKey);
      req.onsuccess = () => resolve(req.result as CekRutinStore | undefined);
      req.onerror = () => reject(req.error);
    });
    if (result && result.manager && Array.isArray(result.members)) {
      return result;
    }
  } catch {
    // Fallback to localStorage below
  }

  try {
    const raw = window.localStorage.getItem(lsKey);
    if (raw) {
      const parsed = JSON.parse(raw) as CekRutinStore;
      if (parsed && parsed.manager && Array.isArray(parsed.members)) {
        return parsed;
      }
    }
  } catch {
    // Use clean empty store
  }

  const cleanStore = createDefaultStore(identity);
  await saveCekRutinStore(cleanStore, uid);
  return cleanStore;
}

export async function saveCekRutinStore(storeData: CekRutinStore, uid = 'default'): Promise<void> {
  const stateKey = `primary_store_v2_${uid}`;
  const lsKey = `cekrutin_offline_store_v2_${uid}`;

  try {
    window.localStorage.setItem(lsKey, JSON.stringify(storeData));
  } catch {
    // Ignore storage quota errors
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(storeData, stateKey);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // localStorage mirror already saved
  }
}

export function getOrCreateRoutineLog(
  logs: DailyRoutineLog[],
  memberId: string,
  date: string,
): DailyRoutineLog {
  const existing = logs.find((l) => l.memberId === memberId && l.date === date);
  if (existing) {
    return {
      ...existing,
      stepsCount: existing.stepsCount ?? 0,
      stepEntries: existing.stepEntries ?? [],
    };
  }
  return {
    id: `log-${memberId}-${date}`,
    memberId,
    date,
    waterGlasses: 0,
    fruitPortions: 0,
    vegetablePortions: 0,
    activities: [],
    stepsCount: 0,
    stepEntries: [],
  };
}

export function calculateMemberStreak(logs: DailyRoutineLog[], memberId: string): number {
  const memberLogs = logs.filter((l) => l.memberId === memberId);
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const dateStr = getDateOffset(i);
    const log = memberLogs.find((l) => l.date === dateStr);
    const hasActivity =
      log &&
      (log.waterGlasses > 0 ||
        log.fruitPortions + log.vegetablePortions > 0 ||
        log.activities.length > 0 ||
        (log.stepsCount ?? 0) > 0);
    if (hasActivity) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function downloadVisitIcsFile(visit: FaskesVisit, memberName: string): void {
  const cleanDate = visit.date.replace(/-/g, '');
  const cleanTime = visit.time.replace(':', '') + '00';
  const startStamp = `${cleanDate}T${cleanTime}`;
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CEKRutin//Agenda Kesehatan Keluarga//ID',
    'BEGIN:VEVENT',
    `UID:${visit.id}@cekrutin.local`,
    `DTSTAMP:${cleanDate}T000000Z`,
    `DTSTART:${startStamp}`,
    `SUMMARY:CEKRutin: ${visit.serviceType} (${memberName})`,
    `LOCATION:${visit.facilityName}`,
    `DESCRIPTION:${visit.notes || 'Jadwal kunjungan fasilitas kesehatan CEKRutin.'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], {type: 'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `agenda-faskes-${visit.date}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
