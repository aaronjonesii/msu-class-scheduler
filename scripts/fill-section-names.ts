/**
 * Fills in the section of each course on a schedule saved before schedules
 * stored it, using the semester plan the schedule was generated from.
 *
 * A saved course has the meetings of its section, so the section is the one
 * in the plan with exactly those meetings. A course with no such section, or
 * more than one, is left alone and listed. When more than one has them, like
 * two online sections with the same instructor, --choose names the one to use.
 * Only `sectionName` is written, and nothing is written to a course that has
 * changed since the dry run read it.
 *
 * Requires `firebase-admin` + `tsx` (not project dependencies) and Application
 * Default Credentials (`gcloud auth application-default login`). The IDs are
 * the last part of the schedule and semester plan addresses in the app.
 *
 * Usage (from the repo root):
 *   npm i --no-save firebase-admin@13 tsx
 *   npx tsx scripts/fill-section-names.ts <scheduleId> <semesterPlanId>            # dry run (read-only)
 *   npx tsx scripts/fill-section-names.ts <scheduleId> <semesterPlanId> --apply    # write
 *   npx tsx scripts/fill-section-names.ts <scheduleId> <semesterPlanId> "--choose=IAH 221C=730"    # pick between matches
 *   (set GOOGLE_CLOUD_QUOTA_PROJECT=msu-class-scheduler if ADC's quota project differs)
 *
 * Tests (Firestore emulator, never touches production):
 *   .\scripts\firebase-dev.ps1 emulators:exec --only firestore --project demo-msu-class-scheduler "npx tsx --test scripts/fill-section-names.spec.ts"
 */
import { isDeepStrictEqual } from 'node:util';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { DocumentData, Firestore, Timestamp } from 'firebase-admin/firestore';
import { FirestorePaths } from '../src/app/firestore.routes';

const PROJECT_ID = 'msu-class-scheduler';

export interface SectionFill {
  path: string,
  course: string,
  sectionName: string,
  updateTime: Timestamp,
}

export interface FillPlan {
  fills: SectionFill[],
  unmatched: { course: string, reason: string }[],
  alreadyNamed: { course: string, sectionName: string }[],
}

/** Generate copies these from a course to the schedule, so a saved course can be traced back. */
const courseKey = ({ subjectCode, courseNumber, name }: DocumentData) => [subjectCode, courseNumber, name];

const courseLabel = ({ subjectCode, courseNumber, name }: DocumentData): string =>
  [subjectCode, courseNumber].filter(Boolean).join(' ') || name;

async function existing(db: Firestore, path: string): Promise<DocumentData> {
  const snapshot = await db.doc(path).get();

  if (!snapshot.exists) throw new Error(`${path} does not exist.`);

  return snapshot.data()!;
}

/** Read-only: works out which section each course is. */
export async function planSectionNames(
  db: Firestore,
  scheduleId: string,
  semesterPlanId: string,
  chosen: Record<string, string> = {},
): Promise<FillPlan> {
  const schedule = await existing(db, FirestorePaths.schedule(scheduleId));
  const semesterPlan = await existing(db, FirestorePaths.semesterPlan(semesterPlanId));

  if (schedule['userId'] !== semesterPlan['userId']) {
    throw new Error('The schedule and semester plan belong to different people.');
  }

  const planCourses = await db.collection(FirestorePaths.semesterPlanCourses(semesterPlanId)).get();
  const scheduleCourses = await db.collection(FirestorePaths.scheduleCourses(scheduleId)).get();
  const plan: FillPlan = { fills: [], unmatched: [], alreadyNamed: [] };

  for (const scheduleCourse of scheduleCourses.docs) {
    const saved = scheduleCourse.data();
    const course = courseLabel(saved);

    if (saved['sectionName'] != null) {
      plan.alreadyNamed.push({ course, sectionName: saved['sectionName'] });
      continue;
    }

    const planCourse = planCourses.docs.find((c) => isDeepStrictEqual(courseKey(c.data()), courseKey(saved)));

    if (!planCourse) {
      plan.unmatched.push({ course, reason: 'the plan has no course with this name and number' });
      continue;
    }

    const sections = await planCourse.ref.collection('sections').get();
    const matches = sections.docs
      .filter((section) => isDeepStrictEqual(section.get('meetings'), saved['meetings']))
      .map((section) => section.get('name') as string)
      .sort();

    const sectionName = matches.length === 1 ? matches[0] : matches.find((name) => name === chosen[course]);

    if (sectionName) {
      plan.fills.push({ path: scheduleCourse.ref.path, course, sectionName, updateTime: scheduleCourse.updateTime });
    } else if (matches.length === 0) {
      plan.unmatched.push({ course, reason: 'no section in the plan has its meetings' });
    } else if (chosen[course]) {
      plan.unmatched.push({ course, reason: `the chosen section ${chosen[course]} does not have its meetings, but ${matches.join(', ')} do` });
    } else {
      plan.unmatched.push({ course, reason: `more than one section has its meetings: ${matches.join(', ')}` });
    }
  }

  return plan;
}

/** Writes every fill in one batch, which fails as a whole if a course changed after planning. */
export async function applySectionNames(db: Firestore, plan: FillPlan): Promise<number> {
  const batch = db.batch();

  for (const { path, sectionName, updateTime } of plan.fills) {
    batch.update(db.doc(path), { sectionName }, { lastUpdateTime: updateTime });
  }

  await batch.commit();

  return plan.fills.length;
}

async function main(): Promise<void> {
  const [scheduleId, semesterPlanId] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  const apply = process.argv.includes('--apply');
  const chosen = Object.fromEntries(process.argv
    .filter((arg) => arg.startsWith('--choose='))
    .map((arg) => arg.slice('--choose='.length).split('=')));

  if (!scheduleId || !semesterPlanId) {
    throw new Error('Usage: npx tsx scripts/fill-section-names.ts <scheduleId> <semesterPlanId> ["--choose=<course>=<section>"...] [--apply]');
  }

  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();

  console.log(`Project: ${PROJECT_ID}  Mode: ${apply ? 'APPLY' : 'DRY RUN'}\n`);

  const plan = await planSectionNames(db, scheduleId, semesterPlanId, chosen);

  plan.fills.forEach(({ course, sectionName }) => console.log(`  FILL     ${course} -> section ${sectionName}`));
  plan.alreadyNamed.forEach(({ course, sectionName }) => console.log(`  HAS      ${course} already has section ${sectionName}`));
  plan.unmatched.forEach(({ course, reason }) => console.log(`  SKIP     ${course}: ${reason}`));

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to write.');
    return;
  }

  const written = await applySectionNames(db, plan);
  console.log(`\nWrote ${written}. Run the dry run again to read them back.`);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
