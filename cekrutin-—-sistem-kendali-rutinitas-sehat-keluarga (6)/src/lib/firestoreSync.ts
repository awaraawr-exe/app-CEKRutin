import {User} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  CekRutinStore,
  CertificateRecord,
  DailyRoutineLog,
  FamilyManagerAccount,
  FamilyMember,
  FaskesVisit,
  HealthCheckRecord,
  RoutineReminder,
} from '../types/health';
import {db, handleFirestoreError, OperationType} from './firebase';
import {createDefaultStore} from './storage';

function sanitizeStr(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

export async function ensureFamilyWorkspace(user: User): Promise<void> {
  const uid = user.uid;
  const familyRef = doc(db, 'families', uid);
  const familyPath = `families/${uid}`;

  let snap;
  try {
    snap = await getDoc(familyRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, familyPath);
  }

  if (snap && snap.exists()) {
    return;
  }

  const seed = createDefaultStore({
    uid,
    name: user.displayName,
    email: user.email,
    photoUrl: user.photoURL,
  });

  // Step 1: Create parent family document FIRST so subcollection exists() rules pass
  try {
    await setDoc(familyRef, {
      ownerUid: uid,
      managerName: sanitizeStr(seed.manager.name, 100) || 'Pengelola Keluarga',
      managerEmail: sanitizeStr(user.email || 'pengelola@keluarga.id', 150),
      city: sanitizeStr(seed.manager.city, 100),
      puskesmasName: sanitizeStr(seed.manager.puskesmasName, 150),
      pinEnabled: false,
      pinCode: '1234',
      activeMemberId: seed.activeMemberId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, familyPath);
  }

  // Step 2: Seed subcollections (members, routineLogs, healthChecks, reminders, faskesVisits)
  const batch = writeBatch(db);

  for (const m of seed.members) {
    batch.set(doc(db, 'families', uid, 'members', m.id), {
      ownerUid: uid,
      name: sanitizeStr(m.name, 100),
      role: m.role,
      age: m.age,
      gender: m.gender,
      targetWaterGlasses: m.targetWaterGlasses,
      targetFruitVegPortions: m.targetFruitVegPortions,
      targetActivityMinutes: m.targetActivityMinutes,
      medicalNote: sanitizeStr(m.medicalNote, 300),
      createdAt: m.createdAt.slice(0, 40),
      updatedAt: serverTimestamp(),
    });
  }

  for (const l of seed.routineLogs) {
    batch.set(doc(db, 'families', uid, 'routineLogs', l.id), {
      ownerUid: uid,
      memberId: l.memberId,
      date: l.date,
      waterGlasses: l.waterGlasses,
      fruitPortions: l.fruitPortions,
      vegetablePortions: l.vegetablePortions,
      activities: l.activities.slice(0, 30),
      updatedAt: serverTimestamp(),
    });
  }

  for (const h of seed.healthChecks) {
    const payload: Record<string, unknown> = {
      ownerUid: uid,
      memberId: h.memberId,
      recordedAt: h.recordedAt.slice(0, 40),
      systolic: h.systolic,
      diastolic: h.diastolic,
      glucose: h.glucose,
      glucoseType: h.glucoseType,
      cholesterol: h.cholesterol,
      weightKg: h.weightKg,
      heightCm: h.heightCm,
      bmi: h.bmi,
      overallStatus: h.overallStatus,
      createdAt: serverTimestamp(),
    };
    if (h.notes) payload.notes = sanitizeStr(h.notes, 300);
    batch.set(doc(db, 'families', uid, 'healthChecks', h.id), payload);
  }

  for (const r of seed.reminders) {
    batch.set(doc(db, 'families', uid, 'reminders', r.id), {
      ownerUid: uid,
      memberId: r.memberId,
      title: sanitizeStr(r.title, 120),
      category: r.category,
      time: r.time,
      enabled: r.enabled,
      createdAt: serverTimestamp(),
    });
  }

  for (const v of seed.faskesVisits) {
    batch.set(doc(db, 'families', uid, 'faskesVisits', v.id), {
      ownerUid: uid,
      memberId: v.memberId,
      facilityName: sanitizeStr(v.facilityName, 150),
      serviceType: sanitizeStr(v.serviceType, 150),
      date: v.date,
      time: v.time,
      notes: sanitizeStr(v.notes, 300),
      completed: v.completed,
      createdAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `families/${uid}/seed`);
  }
}

export function subscribeFamilyWorkspace(
  user: User,
  onUpdate: (partial: Partial<CekRutinStore>) => void,
): Unsubscribe {
  const uid = user.uid;
  const unsubs: Unsubscribe[] = [];

  // 1. Parent family document
  const familyPath = `families/${uid}`;
  unsubs.push(
    onSnapshot(
      doc(db, 'families', uid),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        onUpdate({
          manager: {
            id: uid,
            name: String(d.managerName || user.displayName || 'Pengelola Keluarga'),
            email: String(d.managerEmail || user.email || ''),
            photoUrl: user.photoURL || undefined,
            city: String(d.city || ''),
            puskesmasName: String(d.puskesmasName || ''),
            pinEnabled: Boolean(d.pinEnabled),
            pinCode: String(d.pinCode || '1234'),
            isLocked: false,
            createdAt: new Date().toISOString(),
          },
          activeMemberId: String(d.activeMemberId || 'mem-ibu'),
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, familyPath);
      },
    ),
  );

  // 2. Members
  const membersPath = `families/${uid}/members`;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'families', uid, 'members'), where('ownerUid', '==', uid)),
      (snap) => {
        const members: FamilyMember[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            name: String(d.name),
            role: d.role,
            age: Number(d.age),
            gender: d.gender,
            targetWaterGlasses: Number(d.targetWaterGlasses),
            targetFruitVegPortions: Number(d.targetFruitVegPortions),
            targetActivityMinutes: Number(d.targetActivityMinutes),
            medicalNote: String(d.medicalNote || ''),
            createdAt: String(d.createdAt || ''),
          };
        });
        if (members.length > 0) {
          onUpdate({members});
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, membersPath);
      },
    ),
  );

  // 3. Routine Logs
  const logsPath = `families/${uid}/routineLogs`;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'families', uid, 'routineLogs'), where('ownerUid', '==', uid)),
      (snap) => {
        const routineLogs: DailyRoutineLog[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            memberId: String(d.memberId),
            date: String(d.date),
            waterGlasses: Number(d.waterGlasses),
            fruitPortions: Number(d.fruitPortions),
            vegetablePortions: Number(d.vegetablePortions),
            activities: Array.isArray(d.activities) ? d.activities : [],
          };
        });
        onUpdate({routineLogs});
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, logsPath);
      },
    ),
  );

  // 4. Health Checks
  const checksPath = `families/${uid}/healthChecks`;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'families', uid, 'healthChecks'), where('ownerUid', '==', uid)),
      (snap) => {
        const healthChecks: HealthCheckRecord[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            memberId: String(d.memberId),
            recordedAt: String(d.recordedAt),
            systolic: Number(d.systolic),
            diastolic: Number(d.diastolic),
            glucose: Number(d.glucose),
            glucoseType: d.glucoseType,
            cholesterol: Number(d.cholesterol),
            weightKg: Number(d.weightKg),
            heightCm: Number(d.heightCm),
            bmi: Number(d.bmi),
            overallStatus: d.overallStatus,
            notes: d.notes ? String(d.notes) : undefined,
          };
        });
        onUpdate({healthChecks});
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, checksPath);
      },
    ),
  );

  // 5. Reminders
  const remindersPath = `families/${uid}/reminders`;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'families', uid, 'reminders'), where('ownerUid', '==', uid)),
      (snap) => {
        const reminders: RoutineReminder[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            memberId: String(d.memberId),
            title: String(d.title),
            category: d.category,
            time: String(d.time),
            enabled: Boolean(d.enabled),
            lastTriggeredDate: d.lastTriggeredDate ? String(d.lastTriggeredDate) : undefined,
          };
        });
        onUpdate({reminders});
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, remindersPath);
      },
    ),
  );

  // 6. Faskes Visits
  const visitsPath = `families/${uid}/faskesVisits`;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'families', uid, 'faskesVisits'), where('ownerUid', '==', uid)),
      (snap) => {
        const faskesVisits: FaskesVisit[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            memberId: String(d.memberId),
            facilityName: String(d.facilityName),
            serviceType: String(d.serviceType),
            date: String(d.date),
            time: String(d.time),
            notes: String(d.notes || ''),
            completed: Boolean(d.completed),
          };
        });
        onUpdate({faskesVisits});
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, visitsPath);
      },
    ),
  );

  // 7. Certificates
  const certsPath = `families/${uid}/certificates`;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'families', uid, 'certificates'), where('ownerUid', '==', uid)),
      (snap) => {
        const certificates: CertificateRecord[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            certificateNumber: String(d.certificateNumber),
            recipientName: String(d.recipientName),
            memberRole: d.memberRole,
            score: Number(d.score),
            totalQuestions: Number(d.totalQuestions),
            issuedAt: String(d.issuedAt),
          };
        });
        onUpdate({certificates});
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, certsPath);
      },
    ),
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}

// Firestore Write Helpers
export async function syncActiveMemberId(uid: string, activeMemberId: string): Promise<void> {
  const path = `families/${uid}`;
  try {
    await updateDoc(doc(db, 'families', uid), {
      activeMemberId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncManagerAccount(
  uid: string,
  manager: FamilyManagerAccount,
): Promise<void> {
  const path = `families/${uid}`;
  try {
    await updateDoc(doc(db, 'families', uid), {
      managerName: sanitizeStr(manager.name, 100) || 'Pengelola Keluarga',
      city: sanitizeStr(manager.city, 100),
      puskesmasName: sanitizeStr(manager.puskesmasName, 150),
      pinEnabled: manager.pinEnabled,
      pinCode: manager.pinCode.replace(/\D/g, '').slice(0, 4).padEnd(4, '0'),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncUpsertMember(
  uid: string,
  member: FamilyMember,
  isNew: boolean,
): Promise<void> {
  const path = `families/${uid}/members/${member.id}`;
  const ref = doc(db, 'families', uid, 'members', member.id);
  try {
    if (isNew) {
      await setDoc(ref, {
        ownerUid: uid,
        name: sanitizeStr(member.name, 100),
        role: member.role,
        age: member.age,
        gender: member.gender,
        targetWaterGlasses: member.targetWaterGlasses,
        targetFruitVegPortions: member.targetFruitVegPortions,
        targetActivityMinutes: member.targetActivityMinutes,
        medicalNote: sanitizeStr(member.medicalNote, 300),
        createdAt: member.createdAt.slice(0, 40),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        name: sanitizeStr(member.name, 100),
        role: member.role,
        age: member.age,
        gender: member.gender,
        targetWaterGlasses: member.targetWaterGlasses,
        targetFruitVegPortions: member.targetFruitVegPortions,
        targetActivityMinutes: member.targetActivityMinutes,
        medicalNote: sanitizeStr(member.medicalNote, 300),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function syncDeleteMember(uid: string, memberId: string): Promise<void> {
  const path = `families/${uid}/members/${memberId}`;
  try {
    await deleteDoc(doc(db, 'families', uid, 'members', memberId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncRoutineLog(uid: string, log: DailyRoutineLog): Promise<void> {
  const path = `families/${uid}/routineLogs/${log.id}`;
  const ref = doc(db, 'families', uid, 'routineLogs', log.id);
  try {
    const snap = await getDoc(ref);
    const activities = log.activities.slice(0, 30).map((a) => ({
      id: sanitizeStr(a.id, 64),
      label: sanitizeStr(a.label, 100),
      minutes: Math.max(1, Math.min(180, a.minutes)),
      loggedAt: sanitizeStr(a.loggedAt, 40),
    }));
    if (snap.exists()) {
      await updateDoc(ref, {
        waterGlasses: log.waterGlasses,
        fruitPortions: log.fruitPortions,
        vegetablePortions: log.vegetablePortions,
        activities,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ownerUid: uid,
        memberId: log.memberId,
        date: log.date,
        waterGlasses: log.waterGlasses,
        fruitPortions: log.fruitPortions,
        vegetablePortions: log.vegetablePortions,
        activities,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncAddHealthCheck(
  uid: string,
  record: HealthCheckRecord,
): Promise<void> {
  const path = `families/${uid}/healthChecks/${record.id}`;
  try {
    const payload: Record<string, unknown> = {
      ownerUid: uid,
      memberId: record.memberId,
      recordedAt: record.recordedAt.slice(0, 40),
      systolic: record.systolic,
      diastolic: record.diastolic,
      glucose: record.glucose,
      glucoseType: record.glucoseType,
      cholesterol: record.cholesterol,
      weightKg: record.weightKg,
      heightCm: record.heightCm,
      bmi: record.bmi,
      overallStatus: record.overallStatus,
      createdAt: serverTimestamp(),
    };
    if (record.notes && record.notes.trim()) {
      payload.notes = sanitizeStr(record.notes, 300);
    }
    await setDoc(doc(db, 'families', uid, 'healthChecks', record.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncDeleteHealthCheck(uid: string, recordId: string): Promise<void> {
  const path = `families/${uid}/healthChecks/${recordId}`;
  try {
    await deleteDoc(doc(db, 'families', uid, 'healthChecks', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncAddReminder(uid: string, rem: RoutineReminder): Promise<void> {
  const path = `families/${uid}/reminders/${rem.id}`;
  try {
    await setDoc(doc(db, 'families', uid, 'reminders', rem.id), {
      ownerUid: uid,
      memberId: rem.memberId,
      title: sanitizeStr(rem.title, 120),
      category: rem.category,
      time: rem.time,
      enabled: rem.enabled,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncToggleReminder(
  uid: string,
  remId: string,
  enabled: boolean,
): Promise<void> {
  const path = `families/${uid}/reminders/${remId}`;
  try {
    await updateDoc(doc(db, 'families', uid, 'reminders', remId), {enabled});
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncReminderTriggered(
  uid: string,
  remId: string,
  lastTriggeredDate: string,
): Promise<void> {
  const path = `families/${uid}/reminders/${remId}`;
  try {
    await updateDoc(doc(db, 'families', uid, 'reminders', remId), {lastTriggeredDate});
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncDeleteReminder(uid: string, remId: string): Promise<void> {
  const path = `families/${uid}/reminders/${remId}`;
  try {
    await deleteDoc(doc(db, 'families', uid, 'reminders', remId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncAddVisit(uid: string, visit: FaskesVisit): Promise<void> {
  const path = `families/${uid}/faskesVisits/${visit.id}`;
  try {
    await setDoc(doc(db, 'families', uid, 'faskesVisits', visit.id), {
      ownerUid: uid,
      memberId: visit.memberId,
      facilityName: sanitizeStr(visit.facilityName, 150),
      serviceType: sanitizeStr(visit.serviceType, 150),
      date: visit.date,
      time: visit.time,
      notes: sanitizeStr(visit.notes, 300),
      completed: visit.completed,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncToggleVisitComplete(
  uid: string,
  visitId: string,
  completed: boolean,
): Promise<void> {
  const path = `families/${uid}/faskesVisits/${visitId}`;
  try {
    await updateDoc(doc(db, 'families', uid, 'faskesVisits', visitId), {completed});
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncDeleteVisit(uid: string, visitId: string): Promise<void> {
  const path = `families/${uid}/faskesVisits/${visitId}`;
  try {
    await deleteDoc(doc(db, 'families', uid, 'faskesVisits', visitId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncAddCertificate(uid: string, cert: CertificateRecord): Promise<void> {
  const path = `families/${uid}/certificates/${cert.id}`;
  try {
    await setDoc(doc(db, 'families', uid, 'certificates', cert.id), {
      ownerUid: uid,
      certificateNumber: sanitizeStr(cert.certificateNumber, 40),
      recipientName: sanitizeStr(cert.recipientName, 100),
      memberRole: cert.memberRole,
      score: cert.score,
      totalQuestions: cert.totalQuestions,
      issuedAt: cert.issuedAt.slice(0, 40),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
