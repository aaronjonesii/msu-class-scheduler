/**
 * Builds ./seed: the local Firestore and Auth emulator data used by the dev server.
 *
 * Writes to the emulators only and refuses to run without them. It never reads
 * production. Schedules come from the pre-migration backup when it is present;
 * that file holds personal data, so it is gitignored and missing from a fresh
 * clone. Semester plans only exist in production, so the plan here is sample
 * data: the ECE 203 sections copied from the Spring 2027 class page, plus one
 * made-up lecture so schedule generation has two courses to combine.
 *
 * Usage (from the repo root):
 *   npm i --no-save firebase-admin@13 tsx
 *   .\scripts\firebase-dev.ps1 emulators:exec --only auth,firestore --export-on-exit=seed "npx tsx scripts/seed-emulator.ts"
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { DocumentData, Firestore } from 'firebase-admin/firestore';
import { deserialize } from '../migrate-classes-to-courses';
import type { BackupEntry } from '../migrate-classes-to-courses';
import { FirestorePaths } from '../src/app/firestore.routes';
import { Color } from '../src/app/shared/enums/color';
import { CourseMeetingType } from '../src/app/shared/enums/course-meeting-type';
import { CourseStatus } from '../src/app/shared/enums/course-status';
import { Day } from '../src/app/shared/enums/day';
import { SemesterTerm } from '../src/app/shared/enums/semester-term';

// The client config in src/environments uses this project ID.
const PROJECT_ID = 'msu-class-scheduler';
const BACKUP_FILE = resolve('classes-backup-1789575062385.json');
const USER_ID = 'local-dev-user';
const SAMPLE_PLAN_ID = 'sample-ss27';

const ECE_203_LABS: [string, Day, string, string][] = [
  ['001', Day.THURSDAY, '08:00', '10:50'],
  ['002', Day.THURSDAY, '11:30', '14:20'],
  ['003', Day.THURSDAY, '15:00', '17:50'],
  ['004', Day.THURSDAY, '19:00', '21:50'],
  ['005', Day.WEDNESDAY, '19:00', '21:50'],
  ['006', Day.MONDAY, '19:00', '21:50'],
  ['007', Day.MONDAY, '15:00', '17:50'],
  ['008', Day.FRIDAY, '15:00', '17:50'],
  ['009', Day.MONDAY, '11:30', '14:20'],
];

function assertEmulators(): void {
  for (const name of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
    if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(process.env[name] ?? '')) {
      throw new Error(`${name} does not point at a local emulator; refusing to run.`);
    }
  }
}

async function seedUser(): Promise<void> {
  const auth = getAuth();
  const profile = { email: 'dev@example.test', displayName: 'Local Dev User' };

  await auth.createUser({ uid: USER_ID, emailVerified: true, ...profile });
  // Lists the account in the emulator's Google sign-in popup.
  await auth.updateUser(USER_ID, {
    providerToLink: { providerId: 'google.com', uid: 'local-dev-google-id', ...profile },
  });
}

async function seedSchedules(db: Firestore, now: Timestamp): Promise<number> {
  const backup: BackupEntry[] = existsSync(BACKUP_FILE) ?
    JSON.parse(readFileSync(BACKUP_FILE, 'utf8')) : [];
  const scheduleIds = [...new Set(backup.map(({ path }) => path.split('/')[1]))];

  for (const [index, id] of scheduleIds.entries()) {
    await db.doc(FirestorePaths.schedule(id)).set({
      name: `Schedule ${index + 1}`, userId: USER_ID, description: null, created: now, updated: now,
    });
  }

  for (const { path, data } of backup) {
    const [, scheduleId, , courseId] = path.split('/');
    await db.doc(FirestorePaths.scheduleCourse(scheduleId, courseId))
      .set(deserialize(data) as DocumentData);
  }

  return scheduleIds.length;
}

async function seedCourse(
  db: Firestore,
  now: Timestamp,
  id: string,
  course: DocumentData,
  sections: DocumentData[],
): Promise<void> {
  await db.doc(FirestorePaths.semesterPlanCourse(SAMPLE_PLAN_ID, id)).set({
    status: CourseStatus.OPEN,
    description: null,
    isNotMSUCourse: null,
    created: now,
    updated: now,
    ...course,
  });

  for (const section of sections) {
    await db.collection(FirestorePaths.semesterPlanCourseSections(SAMPLE_PLAN_ID, id))
      .add({ created: now, updated: now, ...section });
  }
}

async function seedSamplePlan(db: Firestore, now: Timestamp): Promise<void> {
  await db.doc(FirestorePaths.semesterPlan(SAMPLE_PLAN_ID)).set({
    name: 'Sample enrollment plan',
    description: 'Local sample data',
    year: 2027,
    term: SemesterTerm.SPRING,
    userId: USER_ID,
    created: now,
    updated: now,
  });

  await seedCourse(db, now, 'ece-203', {
    name: 'Circuits Lab',
    subjectCode: 'ECE',
    courseNumber: 203,
    credits: 1,
    color: Color.AZURE,
  }, ECE_203_LABS.map(([name, day, startTime, endTime]) => ({
    name,
    meetings: [{
      type: CourseMeetingType.LABORATORY,
      location: 'Engineering Building 3225',
      instructor: null,
      meetingTimes: [{ days: [day], startTime, endTime }],
    }],
  })));

  await seedCourse(db, now, 'sample-lecture', {
    name: 'Sample Lecture',
    subjectCode: 'SMP',
    courseNumber: 100,
    credits: 3,
    color: Color.ORANGE,
  }, [{
    name: '001',
    meetings: [{
      type: CourseMeetingType.LECTURE,
      location: 'Sample Hall 1',
      instructor: null,
      meetingTimes: [{
        days: [Day.MONDAY, Day.WEDNESDAY, Day.FRIDAY],
        startTime: '10:20',
        endTime: '11:10',
      }],
    }],
  }]);
}

async function main(): Promise<void> {
  assertEmulators();
  initializeApp({ projectId: PROJECT_ID });
  const db = getFirestore();
  const now = Timestamp.now();

  await seedUser();
  const schedules = await seedSchedules(db, now);
  await seedSamplePlan(db, now);

  console.log(`Seeded 1 dev user, ${schedules} schedules and 1 sample plan.`);
}

main().then(() => process.exit(0)).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
