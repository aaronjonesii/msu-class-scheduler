/**
 * Tests for migrate-classes-to-courses.ts against the Firestore emulator.
 *
 * Uses a `demo-` project, which the emulator never connects to real Firebase,
 * and refuses to run without FIRESTORE_EMULATOR_HOST.
 *
 *   npm i --no-save firebase-admin@13 tsx
 *   firebase emulators:exec --only firestore --project demo-msu-class-scheduler "npx tsx --test migrate-classes-to-courses.spec.ts"
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { before, beforeEach, describe, it } from 'node:test';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { DocumentData } from 'firebase-admin/firestore';
import {
  applyMigration,
  deserialize,
  planMigration,
  serialize,
} from './migrate-classes-to-courses';
import type { BackupEntry } from './migrate-classes-to-courses';
import { FirestorePaths } from './src/app/firestore.routes';
import { Color } from './src/app/shared/enums/color';
import { Day } from './src/app/shared/enums/day';
import { ScheduleCourseMeetingType } from './src/app/shared/enums/schedule-course-meeting-type';
import { ScheduleCourseStatus } from './src/app/shared/enums/schedule-course-status';

const PROJECT_ID = 'demo-msu-class-scheduler';
const EMULATOR_HOST = process.env['FIRESTORE_EMULATOR_HOST'];
const BACKUP_FILE = join(__dirname, 'classes-backup-1789575062385.json');

if (!EMULATOR_HOST) {
  throw new Error('FIRESTORE_EMULATOR_HOST is not set; refusing to run outside the emulator.');
}

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore();

function legacyClass(overrides: DocumentData = {}): DocumentData {
  return {
    name: 'Calculus I',
    status: ScheduleCourseStatus.OPEN,
    meetings: [{
      type: ScheduleCourseMeetingType.LECTURE,
      location: 'Wells Hall A1',
      instructor: null,
      meetingTimes: [{
        days: [Day.MONDAY, Day.WEDNESDAY, Day.FRIDAY],
        startTime: '10:20',
        endTime: '11:10',
      }],
    }],
    subjectCode: 'MTH',
    courseNumber: 132,
    description: null,
    credits: 3,
    startDate: Timestamp.fromDate(new Date('2025-01-13T05:00:00Z')),
    endDate: null,
    color: Color.SPRING_GREEN,
    isNotMSUCourse: null,
    // Microsecond precision (the finest Firestore stores), to prove the copy is lossless.
    created: new Timestamp(1720000000, 123456000),
    updated: new Timestamp(1720000500, 987654000),
    ...overrides,
  };
}

async function seedSchedule(id: string, data: DocumentData = {}) {
  const schedule = { name: id, userId: 'user-1', description: null, ...data };
  await db.doc(FirestorePaths.schedule(id)).set(schedule);
  return schedule;
}

async function seedLegacyClass(scheduleId: string, classId: string, data = legacyClass()) {
  await db.doc(`schedules/${scheduleId}/classes/${classId}`).set(data);
  return data;
}

async function getCourse(scheduleId: string, courseId: string) {
  return db.doc(FirestorePaths.scheduleCourse(scheduleId, courseId)).get();
}

async function migrate() {
  return applyMigration(db, await planMigration(db));
}

describe('migrate-classes-to-courses', () => {
  before(() => {
    assert.ok(PROJECT_ID.startsWith('demo-'));
  });

  beforeEach(async () => {
    const res = await fetch(
      `http://${EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
      { method: 'DELETE' },
    );
    assert.equal(res.status, 200, 'failed to clear emulator');
  });

  it('does not initialize a production app when imported', () => {
    const apps = getApps();

    assert.equal(apps.length, 1);
    assert.equal(apps[0]!.options.projectId, PROJECT_ID);
  });

  it('copies each legacy class to courses with the same id and identical data', async () => {
    await seedSchedule('s1');
    const calc = await seedLegacyClass('s1', 'calc');
    const chem = await seedLegacyClass('s1', 'chem', legacyClass({
      name: 'General Chemistry',
      endDate: Timestamp.fromDate(new Date('2025-05-02T04:00:00Z')),
    }));

    const result = await migrate();

    assert.deepEqual(result, { copied: 2, verified: 2, failed: [] });
    assert.deepEqual((await getCourse('s1', 'calc')).data(), calc);
    assert.deepEqual((await getCourse('s1', 'chem')).data(), chem);

    const created = (await getCourse('s1', 'calc')).get('created');
    assert.ok(created instanceof Timestamp);
    assert.equal(created.nanoseconds, 123456000);
  });

  it('writes to the collection the app reads schedule courses from', async () => {
    await seedSchedule('s1');
    await seedLegacyClass('s1', 'calc');

    await migrate();

    // Same path ScheduleCoursesService.getAll$ / SchedulesService.getScheduleCourses$ use.
    const courses = await db.collection(FirestorePaths.scheduleCourses('s1')).get();
    assert.equal(FirestorePaths.scheduleCourses('s1'), 'schedules/s1/courses');
    assert.deepEqual(courses.docs.map((d) => d.id), ['calc']);
  });

  it('leaves legacy classes docs and schedule docs untouched', async () => {
    const schedule = await seedSchedule('s1');
    const calc = await seedLegacyClass('s1', 'calc');

    await migrate();

    assert.deepEqual((await db.doc('schedules/s1/classes/calc').get()).data(), calc);
    assert.deepEqual((await db.doc(FirestorePaths.schedule('s1')).get()).data(), schedule);
  });

  it('writes nothing when only planning (dry run)', async () => {
    await seedSchedule('s1');
    await seedLegacyClass('s1', 'calc');

    const plan = await planMigration(db);

    assert.equal(plan.toCopy.length, 1);
    assert.equal((await db.collection(FirestorePaths.scheduleCourses('s1')).get()).size, 0);
  });

  it('migrates every schedule and ignores schedules without legacy classes', async () => {
    await seedSchedule('s1');
    await seedSchedule('s2');
    await seedSchedule('empty');
    await seedLegacyClass('s1', 'a');
    await seedLegacyClass('s2', 'b');

    const plan = await planMigration(db);
    await applyMigration(db, plan);

    assert.deepEqual(plan.toCopy.map((c) => c.scheduleId).sort(), ['s1', 's2']);
    assert.ok((await getCourse('s1', 'a')).exists);
    assert.ok((await getCourse('s2', 'b')).exists);
    assert.equal((await db.collection(FirestorePaths.scheduleCourses('empty')).get()).size, 0);
  });

  it('skips courses that already exist without overwriting them', async () => {
    await seedSchedule('s1');
    await seedLegacyClass('s1', 'same');
    await seedLegacyClass('s1', 'edited');
    await db.doc(FirestorePaths.scheduleCourse('s1', 'same')).set(legacyClass());
    const edited = legacyClass({ name: 'Edited in the new app' });
    await db.doc(FirestorePaths.scheduleCourse('s1', 'edited')).set(edited);

    const plan = await planMigration(db);
    const result = await applyMigration(db, plan);

    assert.equal(result.copied, 0);
    assert.deepEqual(
      plan.alreadyMigrated.sort((a, b) => a.path.localeCompare(b.path)),
      [
        { path: 'schedules/s1/courses/edited', identical: false },
        { path: 'schedules/s1/courses/same', identical: true },
      ],
    );
    assert.deepEqual((await getCourse('s1', 'edited')).data(), edited);
  });

  it('skips orphaned classes whose schedule was deleted', async () => {
    await seedLegacyClass('deleted-schedule', 'calc');

    const plan = await planMigration(db);
    await applyMigration(db, plan);

    assert.deepEqual(plan.orphaned, ['schedules/deleted-schedule/classes/calc']);
    assert.equal(plan.toCopy.length, 0);
    assert.equal((await getCourse('deleted-schedule', 'calc')).exists, false);
  });

  it('ignores `classes` collections that are not under schedules', async () => {
    await db.doc('classes/top-level').set(legacyClass());
    await db.doc('semester-plans/p1/classes/c1').set(legacyClass());

    const plan = await planMigration(db);

    assert.deepEqual(plan.backup, []);
    assert.deepEqual(plan.toCopy, []);
    assert.deepEqual(plan.orphaned, []);
  });

  it('is idempotent', async () => {
    await seedSchedule('s1');
    await seedLegacyClass('s1', 'calc');

    await migrate();
    const secondPlan = await planMigration(db);
    const secondResult = await applyMigration(db, secondPlan);

    assert.equal(secondPlan.toCopy.length, 0);
    assert.deepEqual(secondPlan.alreadyMigrated, [
      { path: 'schedules/s1/courses/calc', identical: true },
    ]);
    assert.deepEqual(secondResult, { copied: 0, verified: 0, failed: [] });
  });

  it('fails rather than overwrite a course created between planning and applying', async () => {
    await seedSchedule('s1');
    await seedLegacyClass('s1', 'calc');
    await seedLegacyClass('s1', 'chem');

    const plan = await planMigration(db);
    const concurrent = legacyClass({ name: 'Added in the app meanwhile' });
    await db.doc(FirestorePaths.scheduleCourse('s1', 'calc')).set(concurrent);

    await assert.rejects(applyMigration(db, plan));
    assert.deepEqual((await getCourse('s1', 'calc')).data(), concurrent);
    // Batch is atomic: nothing else from it was written either.
    assert.equal((await getCourse('s1', 'chem')).exists, false);
  });

  it('handles more docs than fit in one batch', async () => {
    await seedSchedule('big');
    const count = 501;
    for (let i = 0; i < count; i += 500) {
      const batch = db.batch();
      for (let j = i; j < Math.min(i + 500, count); j++) {
        batch.set(db.doc(`schedules/big/classes/c${j}`), legacyClass({ name: `Course ${j}` }));
      }
      await batch.commit();
    }

    const result = await migrate();

    assert.deepEqual(result, { copied: count, verified: count, failed: [] });
    assert.equal((await db.collection(FirestorePaths.scheduleCourses('big')).get()).size, count);
  });

  it('backs up legacy docs with their paths and timestamps as ISO strings', async () => {
    await seedSchedule('s1');
    await seedLegacyClass('s1', 'calc');

    const plan = await planMigration(db);

    assert.equal(plan.backup.length, 1);
    assert.equal(plan.backup[0]!.path, 'schedules/s1/classes/calc');
    assert.deepEqual(
      (plan.backup[0]!.data as DocumentData)['startDate'],
      { __timestamp: '2025-01-13T05:00:00.000Z' },
    );
  });

  // The backup holds personal data, so it is gitignored and absent from a fresh clone.
  describe('with the real pre-migration production snapshot', { skip: !existsSync(BACKUP_FILE) }, () => {
    let backup: BackupEntry[];

    before(() => {
      backup = JSON.parse(readFileSync(BACKUP_FILE, 'utf8'));
    });

    beforeEach(async () => {
      const scheduleIds = new Set(backup.map((e) => e.path.split('/')[1]!));
      for (const id of scheduleIds) await seedSchedule(id);
      for (const { path, data } of backup) {
        await db.doc(path).set(deserialize(data) as DocumentData);
      }
    });

    it('migrates all 13 classes across the 3 schedules', async () => {
      const plan = await planMigration(db);
      const result = await applyMigration(db, plan);

      assert.deepEqual(result, { copied: 13, verified: 13, failed: [] });
      assert.equal(new Set(plan.toCopy.map((c) => c.scheduleId)).size, 3);

      for (const { path, data } of backup) {
        const [, scheduleId, , classId] = path.split('/');
        const course = await getCourse(scheduleId!, classId!);
        assert.deepEqual(serialize(course.data()), data, path);
      }
    });

    it('produces docs that satisfy the app\'s ScheduleCourse model', async () => {
      await migrate();

      const statuses = Object.values(ScheduleCourseStatus) as string[];
      const meetingTypes = Object.values(ScheduleCourseMeetingType) as string[];
      const days = Object.values(Day) as string[];
      const colors = Object.values(Color) as string[];

      const courses = await db.collectionGroup('courses').get();
      assert.equal(courses.size, 13);

      for (const doc of courses.docs) {
        const c = doc.data();
        const at = doc.ref.path;

        assert.equal(typeof c['name'], 'string', at);
        assert.ok(statuses.includes(c['status']), at);
        assert.ok('isNotMSUCourse' in c, at);
        assert.ok(c['color'] === undefined || c['color'] === null || colors.includes(c['color']), at);
        for (const field of ['startDate', 'endDate', 'created', 'updated']) {
          assert.ok(c[field] == null || c[field] instanceof Timestamp, `${at} ${field}`);
        }

        assert.ok(Array.isArray(c['meetings']), at);
        for (const meeting of c['meetings']) {
          assert.ok(meetingTypes.includes(meeting.type), at);
          assert.ok(Array.isArray(meeting.meetingTimes), at);
          for (const time of meeting.meetingTimes) {
            assert.ok(time.days.every((d: string) => days.includes(d)), at);
            assert.match(time.startTime, /^\d{2}:\d{2}$/, at);
            assert.match(time.endTime, /^\d{2}:\d{2}$/, at);
          }
        }
      }
    });
  });
});
