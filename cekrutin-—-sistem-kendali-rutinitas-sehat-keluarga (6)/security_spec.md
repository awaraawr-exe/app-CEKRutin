# CEKRutin Firestore Security Specification

## 1. Data Invariants
1. Every document in `/families/{userId}` and its subcollections (`members`, `routineLogs`, `healthChecks`, `reminders`, `faskesVisits`, `certificates`) belongs strictly to a single authenticated, email-verified Google Family Health Manager (`request.auth.uid == userId`).
2. Every subcollection document must include `ownerUid == request.auth.uid` and require the parent `/families/{userId}` document to exist on single-document operations (`get`, `create`, `update`, `delete`).
3. All document IDs (`userId`, `memberId`, `logId`, `checkId`, `reminderId`, `visitId`, `certId`) must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters.
4. `ownerUid` and `createdAt` are immutable after creation; server timestamps (`request.time`) are strictly enforced on `createdAt` and `updatedAt`.
5. Unauthenticated reads/writes, cross-family reads/writes, shadow fields (`isAdmin`, `verified`), and oversized strings/arrays are unconditionally denied.

## 2. Adversarial ("Dirty Dozen") Payloads Rejected by Rules
1. Unauthenticated read on `/families/user123`.
2. Unverified email user (`email_verified: false`) attempting to write `/families/user123`.
3. User `attacker` trying to read `/families/victim/members/mem-ibu`.
4. User `attacker` creating `/families/victim/healthChecks/hc1` with `ownerUid: "victim"`.
5. User `user123` creating `/families/user123/members/mem1` with spoofed `ownerUid: "otherUser"`.
6. Shadow field injection (`isAdmin: true`) in `/families/user123` payload.
7. Oversized `managerName` (>100 chars) or `medicalNote` (>300 chars) denial-of-wallet payload.
8. Invalid path ID (`mem/../admin` or >128 chars) on `/families/user123/members/{memberId}`.
9. Mutating `ownerUid` or `createdAt` during an `update` on `/families/user123`.
10. Client-forged `createdAt` timestamp not equal to `request.time`.
11. Unbounded `activities` array (>30 items) in `/families/user123/routineLogs/{logId}`.
12. `list` query on `/families/victim/members` executed by `attacker` (`resource.data.ownerUid == request.auth.uid` fails).
