/**
 * Tests for fill-section-names.ts against the Firestore emulator.
 *
 * Uses a `demo-` project, which the emulator never connects to real Firebase,
 * and refuses to run without FIRESTORE_EMULATOR_HOST.
 *
 *   .\scripts\firebase-dev.ps1 emulators:exec --only firestore --project demo-msu-class-scheduler "npx tsx --test scripts/fill-section-names.spec.ts"
 */
import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { DocumentData } from 'firebase-admin/firestore';
import { applySectionNames, planSectionNames } from './fill-section-names';
import { FirestorePaths } from '../src/app/firestore.routes';
import { CourseMeetingType } from '../src/app/shared/enums/course-meeting-type';
import { CourseStatus } from '../src/app/shared/enums/course-status';
import { Day } from '../src/app/shared/enums/day';
import { SemesterTerm } from '../src/app/shared/enums/semester-term';

const PROJECT_ID = 'demo-msu-class-scheduler';
const EMULATOR_HOST = process.env['FIRESTORE_EMULATOR_HOST'];

if (!EMULATOR_HOST) {
  throw new Error('FIRESTORE_EMULATOR_HOST is not set; refusing to run outside the emulator.');
}

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore();

const ECE_331 = { name: 'Microprocessors', subjectCode: 'ECE', courseNumber: '331', credits: 4 };
const IAH_221 = { name: 'Big Ideas in the Arts', subjectCode: 'IAH', courseNumber: '221C', credits: 4 };

function meeting(type: CourseMeetingType, days: Day[], startTime: string, endTime: string, location = 'Wells Hall') {
  return { type, location, instructor: null, meetingTimes: [{ days, startTime, endTime }] };
}

const ECE_331_LECTURE = meeting(CourseMeetingType.LECTURE, [Day.MONDAY, Day.WEDNESDAY], '13:50', '14:40');
const ECE_331_SECTIONS: Record<string, DocumentData> = {
  s001: { name: '001', status: CourseStatus.OPEN, meetings: [ECE_331_LECTURE, meeting(CourseMeetingType.LABORATORY, [Day.THURSDAY], '08:00', '10:50')] },
  s002: { name: '002', status: CourseStatus.OPEN, meetings: [ECE_331_LECTURE, meeting(CourseMeetingType.LABORATORY, [Day.THURSDAY], '11:30', '14:20')] },
};
const IAH_221_SECTIONS: Record<string, DocumentData> = {
  s730: { name: '730', status: CourseStatus.OPEN, meetings: [{ type: CourseMeetingType.LECTURE, location: 'Online', instructor: 'Ann Lee', meetingTimes: [] }] },
  s001: { name: '001', status: CourseStatus.OPEN, meetings: [meeting(CourseMeetingType.LECTURE, [Day.TUESDAY, Day.THURSDAY], '10:20', '11:40')] },
};

async function seedPlan(id = 'plan', data: DocumentData = {}) {
  await db.doc(FirestorePaths.semesterPlan(id)).set({
    name: 'Spring 2027', userId: 'user-1', description: null, year: 2027, term: SemesterTerm.SPRING, ...data,
  });
}

async function seedPlanCourse(planId: string, courseId: string, course: DocumentData, sections: Record<string, DocumentData>) {
  await db.doc(FirestorePaths.semesterPlanCourse(planId, courseId)).set(course);
  for (const [sectionId, section] of Object.entries(sections)) {
    await db.doc(FirestorePaths.semesterPlanCourseSection(planId, courseId, sectionId)).set(section);
  }
}

async function seedSchedule(id = 'schedule', data: DocumentData = {}) {
  await db.doc(FirestorePaths.schedule(id)).set({ name: 'Spring 2027', userId: 'user-1', description: null, ...data });
}

/** What Create saved for a course before sections were stored: the course, and the meetings of its section. */
function savedCourse(course: DocumentData, section: DocumentData): DocumentData {
  return {
    status: section['status'],
    subjectCode: course['subjectCode'] ?? null,
    courseNumber: course['courseNumber'] ?? null,
    name: course['name'],
    description: null,
    meetings: section['meetings'].map(({ type, instructor, meetingTimes, location }: DocumentData) =>
      ({ type, instructor, meetingTimes, location })),
    sections: [],
    color: null,
    endDate: null,
    credits: course['credits'] ?? null,
    startDate: null,
    term: null,
    notes: null,
    isNotMSUCourse: null,
    created: null,
    updated: null,
  };
}

async function seedScheduleCourse(scheduleId: string, courseId: string, data: DocumentData) {
  await db.doc(FirestorePaths.scheduleCourse(scheduleId, courseId)).set(data);
  return data;
}

async function getScheduleCourse(scheduleId: string, courseId: string) {
  return (await db.doc(FirestorePaths.scheduleCourse(scheduleId, courseId)).get()).data();
}

/** The real plan and schedule: ECE 331 section 002 and IAH 221C section 730. */
async function seedSpring() {
  await seedPlan();
  await seedPlanCourse('plan', 'ece331', ECE_331, ECE_331_SECTIONS);
  await seedPlanCourse('plan', 'iah221', IAH_221, IAH_221_SECTIONS);
  await seedSchedule();
  const ece = await seedScheduleCourse('schedule', 'a', savedCourse(ECE_331, ECE_331_SECTIONS['s002']!));
  const iah = await seedScheduleCourse('schedule', 'b', savedCourse(IAH_221, IAH_221_SECTIONS['s730']!));

  return { ece, iah };
}

async function fill() {
  return applySectionNames(db, await planSectionNames(db, 'schedule', 'plan'));
}

describe('fill-section-names', () => {
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

  it('fills in the section whose meetings each course has', async () => {
    await seedSpring();

    const written = await fill();

    assert.equal(written, 2);
    assert.equal((await getScheduleCourse('schedule', 'a'))?.['sectionName'], '002');
    assert.equal((await getScheduleCourse('schedule', 'b'))?.['sectionName'], '730');
  });

  it('changes nothing else on the course', async () => {
    const { ece } = await seedSpring();

    await fill();

    assert.deepEqual(await getScheduleCourse('schedule', 'a'), { ...ece, sectionName: '002' });
  });

  it('says what it would fill in without writing when only planning', async () => {
    await seedSpring();

    const plan = await planSectionNames(db, 'schedule', 'plan');

    assert.deepEqual(
      plan.fills.map(({ path, course, sectionName }) => ({ path, course, sectionName })).sort((x, y) => x.path.localeCompare(y.path)),
      [
        { path: 'schedules/schedule/courses/a', course: 'ECE 331', sectionName: '002' },
        { path: 'schedules/schedule/courses/b', course: 'IAH 221C', sectionName: '730' },
      ],
    );
    assert.equal((await getScheduleCourse('schedule', 'a'))?.['sectionName'], undefined);
  });

  it('leaves a course alone when no section in the plan has its meetings', async () => {
    await seedSpring();
    const edited = savedCourse(ECE_331, ECE_331_SECTIONS['s001']!);
    edited['meetings'][1].location = 'Moved by hand';
    await seedScheduleCourse('schedule', 'a', edited);

    const plan = await planSectionNames(db, 'schedule', 'plan');
    await applySectionNames(db, plan);

    assert.deepEqual(plan.unmatched, [{ course: 'ECE 331', reason: 'no section in the plan has its meetings' }]);
    assert.equal((await getScheduleCourse('schedule', 'a'))?.['sectionName'], undefined);
  });

  it('leaves a course alone when more than one section has its meetings', async () => {
    await seedPlan();
    // Section IDs are random, so 731 is read first here.
    await seedPlanCourse('plan', 'iah221', IAH_221, {
      ...IAH_221_SECTIONS,
      a731: { ...IAH_221_SECTIONS['s730'], name: '731' },
    });
    await seedSchedule();
    await seedScheduleCourse('schedule', 'b', savedCourse(IAH_221, IAH_221_SECTIONS['s730']!));

    const plan = await planSectionNames(db, 'schedule', 'plan');
    await applySectionNames(db, plan);

    assert.deepEqual(plan.unmatched, [{ course: 'IAH 221C', reason: 'more than one section has its meetings: 730, 731' }]);
    assert.equal((await getScheduleCourse('schedule', 'b'))?.['sectionName'], undefined);
  });

  it('only looks at the sections of the same course', async () => {
    await seedPlan();
    await seedPlanCourse('plan', 'ece331', ECE_331, ECE_331_SECTIONS);
    // Read before ece331, so a course matched on less than its name and number would be one of these.
    await seedPlanCourse('plan', 'decoy-number', { ...ECE_331, courseNumber: '332' }, { s9: { ...ECE_331_SECTIONS['s002'], name: '009' } });
    await seedPlanCourse('plan', 'decoy-subject', { ...ECE_331, subjectCode: 'CSE' }, { s8: { ...ECE_331_SECTIONS['s002'], name: '008' } });
    await seedSchedule();
    await seedScheduleCourse('schedule', 'a', savedCourse(ECE_331, ECE_331_SECTIONS['s002']!));

    await fill();

    assert.equal((await getScheduleCourse('schedule', 'a'))?.['sectionName'], '002');
  });

  it('leaves a course alone when the plan no longer has it', async () => {
    await seedSpring();
    await seedScheduleCourse('schedule', 'a', savedCourse({ ...ECE_331, name: 'Renamed' }, ECE_331_SECTIONS['s002']!));

    const plan = await planSectionNames(db, 'schedule', 'plan');

    assert.deepEqual(plan.unmatched, [{ course: 'ECE 331', reason: 'the plan has no course with this name and number' }]);
  });

  it('keeps a section a course already has', async () => {
    await seedSpring();
    await seedScheduleCourse('schedule', 'a', { ...savedCourse(ECE_331, ECE_331_SECTIONS['s002']!), sectionName: '002' });

    const plan = await planSectionNames(db, 'schedule', 'plan');

    assert.deepEqual(plan.alreadyNamed, [{ course: 'ECE 331', sectionName: '002' }]);
    assert.deepEqual(plan.fills.map((f) => f.course), ['IAH 221C']);
  });

  it('is idempotent', async () => {
    await seedSpring();

    await fill();
    const secondPlan = await planSectionNames(db, 'schedule', 'plan');

    assert.equal(secondPlan.fills.length, 0);
    assert.equal(secondPlan.alreadyNamed.length, 2);
  });

  it('refuses a plan that belongs to someone else', async () => {
    await seedSpring();
    await seedPlan('plan', { userId: 'user-2' });

    await assert.rejects(planSectionNames(db, 'schedule', 'plan'), /different people/);
  });

  it('refuses a schedule or plan that does not exist', async () => {
    await seedSpring();

    await assert.rejects(planSectionNames(db, 'missing', 'plan'), /schedules\/missing does not exist/);
    await assert.rejects(planSectionNames(db, 'schedule', 'missing'), /semester-plans\/missing does not exist/);
  });

  it('writes nothing if a course changed after planning', async () => {
    await seedSpring();
    const plan = await planSectionNames(db, 'schedule', 'plan');
    const changed = { ...savedCourse(ECE_331, ECE_331_SECTIONS['s002']!), name: 'Changed in the app meanwhile' };
    await seedScheduleCourse('schedule', 'a', changed);

    await assert.rejects(applySectionNames(db, plan));
    assert.deepEqual(await getScheduleCourse('schedule', 'a'), changed);
    // The batch is atomic, so the other course wasn't written either.
    assert.equal((await getScheduleCourse('schedule', 'b'))?.['sectionName'], undefined);
  });
});
