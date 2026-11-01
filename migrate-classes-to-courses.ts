/**
 * One-off migration: schedules/{scheduleId}/classes/* -> schedules/{scheduleId}/courses/*
 *
 * v2.0.0 (commit 2318b0b) renamed the schedule subcollection from `classes` to
 * `courses`. Document fields are unchanged, so docs are copied verbatim with
 * the same IDs. Old `classes` docs are NOT deleted.
 *
 * Ran against production on 2026-09-16: 13 docs copied across 3 schedules
 * (FS24, SS25, FS25), verified 13/13. Pre-migration backup of the legacy docs:
 * classes-backup-1789575062385.json
 *
 * Requires `firebase-admin` + `tsx` (not project dependencies) and Application
 * Default Credentials (`gcloud auth application-default login`).
 *
 * Usage (from the repo root):
 *   npm i --no-save firebase-admin@13 tsx
 *   npx tsx migrate-classes-to-courses.ts            # dry run (read-only)
 *   npx tsx migrate-classes-to-courses.ts --apply    # write
 *   (set GOOGLE_CLOUD_QUOTA_PROJECT=msu-class-scheduler if ADC's quota project differs)
 *
 * Tests (Firestore emulator, never touches production):
 *   firebase emulators:exec --only firestore --project demo-msu-class-scheduler "npx tsx --test migrate-classes-to-courses.spec.ts"
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type {
  DocumentData,
  DocumentReference,
  Firestore,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { FirestorePaths } from './src/app/firestore.routes';

const PROJECT_ID = 'msu-class-scheduler';
const LEGACY_COURSES_COLLECTION = 'classes';
const BATCH_LIMIT = 500;

export interface PendingCopy {
  scheduleId: string;
  from: QueryDocumentSnapshot;
  to: DocumentReference;
}

export interface BackupEntry {
  path: string;
  data: unknown;
}

export interface MigrationPlan {
  schedules: Map<string, DocumentData>;
  backup: BackupEntry[];
  toCopy: PendingCopy[];
  /** Target already exists; `identical` is false if it differs from the legacy doc. */
  alreadyMigrated: { path: string, identical: boolean }[];
  /** Legacy docs whose parent schedule document no longer exists. */
  orphaned: string[];
}

export interface MigrationResult {
  copied: number;
  verified: number;
  failed: string[];
}

/** JSON-safe representation of Firestore data (Timestamps -> ISO strings). */
export function serialize(value: unknown): unknown {
  if (value instanceof Timestamp) return { __timestamp: value.toDate().toISOString() };
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, serialize(v)]),
    );
  }
  return value;
}

/** Inverse of serialize(): turns backup JSON back into Firestore data. */
export function deserialize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(deserialize);
  if (value && typeof value === 'object') {
    if ('__timestamp' in value) {
      return Timestamp.fromDate(new Date(value.__timestamp as string));
    }
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, deserialize(v)]),
    );
  }
  return value;
}

/** Read-only: works out what needs copying. */
export async function planMigration(db: Firestore): Promise<MigrationPlan> {
  const schedulesSnap = await db.collection(FirestorePaths.schedules).get();
  const plan: MigrationPlan = {
    schedules: new Map(schedulesSnap.docs.map((d) => [d.id, d.data()])),
    backup: [],
    toCopy: [],
    alreadyMigrated: [],
    orphaned: [],
  };

  // Collection group so orphans (schedule deleted) are found too.
  const legacySnap = await db.collectionGroup(LEGACY_COURSES_COLLECTION).get();

  for (const legacyDoc of legacySnap.docs) {
    const scheduleRef = legacyDoc.ref.parent.parent;
    if (!scheduleRef || scheduleRef.parent.path !== FirestorePaths.schedules) continue;

    plan.backup.push({ path: legacyDoc.ref.path, data: serialize(legacyDoc.data()) });

    if (!plan.schedules.has(scheduleRef.id)) {
      plan.orphaned.push(legacyDoc.ref.path);
      continue;
    }

    const courseRef = db.doc(FirestorePaths.scheduleCourse(scheduleRef.id, legacyDoc.id));
    const existing = await courseRef.get();
    if (existing.exists) {
      plan.alreadyMigrated.push({
        path: courseRef.path,
        identical: isDeepStrictEqual(existing.data(), legacyDoc.data()),
      });
      continue;
    }

    plan.toCopy.push({ scheduleId: scheduleRef.id, from: legacyDoc, to: courseRef });
  }

  return plan;
}

/** Writes the plan. Uses create(), so a batch fails rather than overwrite a course. */
export async function applyMigration(
  db: Firestore,
  plan: MigrationPlan,
): Promise<MigrationResult> {
  for (let i = 0; i < plan.toCopy.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const { from, to } of plan.toCopy.slice(i, i + BATCH_LIMIT)) {
      batch.create(to, from.data());
    }
    await batch.commit();
  }

  const result: MigrationResult = { copied: plan.toCopy.length, verified: 0, failed: [] };
  for (const { from, to } of plan.toCopy) {
    const snap = await to.get();

    if (snap.exists && isDeepStrictEqual(snap.data(), from.data())) result.verified++;
    else result.failed.push(to.path);
  }

  return result;
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();

  console.log(`Project: ${PROJECT_ID}  Mode: ${apply ? 'APPLY' : 'DRY RUN'}\n`);

  const plan = await planMigration(db);

  for (const path of plan.orphaned) {
    console.log(`  ORPHAN  ${path} (schedule doc missing) - skipped`);
  }
  for (const { path, identical } of plan.alreadyMigrated) {
    console.log(`  EXISTS  ${path} - skipped (${identical ? 'identical' : 'DIFFERS from legacy doc'})`);
  }

  const perSchedule = new Map<string, string[]>();
  for (const { scheduleId, from } of plan.toCopy) {
    perSchedule.set(scheduleId, [...(perSchedule.get(scheduleId) ?? []), from.data()['name']]);
  }
  for (const [scheduleId, names] of perSchedule) {
    const schedule = plan.schedules.get(scheduleId);
    console.log(`\n  ${scheduleId}  "${schedule?.['name']}"  (user ${schedule?.['userId']})`);
    console.log(`    -> ${names.length} course(s): ${names.join(', ')}`);
  }

  console.log(`\nSchedules total:            ${plan.schedules.size}`);
  console.log(`Legacy 'classes' docs found: ${plan.backup.length}`);
  console.log(`  to copy -> courses:        ${plan.toCopy.length}`);
  console.log(`  already in courses:        ${plan.alreadyMigrated.length}`);
  console.log(`  orphaned (skipped):        ${plan.orphaned.length}`);
  console.log(`Schedules affected:          ${perSchedule.size}`);

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to write.');
    return;
  }

  const backupFile = resolve(`classes-backup-${Date.now()}.json`);
  writeFileSync(backupFile, JSON.stringify(plan.backup, null, 2));
  console.log(`\nBackup written: ${backupFile}`);

  const result = await applyMigration(db, plan);
  console.log(`Copied ${result.copied} doc(s).`);
  result.failed.forEach((path) => console.error(`  VERIFY FAILED: ${path}`));
  console.log(`Verified ${result.verified}/${result.copied}.`);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
