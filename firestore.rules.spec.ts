/**
 * Tests for firestore.rules against the Firestore emulator.
 *
 * Uses a `demo-` project, which the emulator never connects to real Firebase,
 * and refuses to run without FIRESTORE_EMULATOR_HOST. Writes go through the
 * client SDK as a signed-in user, so the rules apply to them.
 *
 *   npm i --no-save tsx
 *   .\scripts\firebase-dev.ps1 emulators:exec --only firestore --project demo-msu-class-scheduler "npx tsx --test firestore.rules.spec.ts"
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, describe, it } from 'node:test';
import { deleteApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  Firestore,
  FirestoreError,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  setLogLevel,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { FirestorePaths } from './src/app/firestore.routes';

const PROJECT_ID = 'demo-msu-class-scheduler';
const EMULATOR_HOST = process.env['FIRESTORE_EMULATOR_HOST'];

if (!EMULATOR_HOST) {
  throw new Error('FIRESTORE_EMULATOR_HOST is not set; refusing to run outside the emulator.');
}

const [HOST, PORT] = EMULATOR_HOST.split(':');

setLogLevel('silent');

function clientFor(uid?: string): Firestore {
  const db = getFirestore(initializeApp({ projectId: PROJECT_ID }, uid ?? 'signed-out'));

  connectFirestoreEmulator(db, HOST, Number(PORT), uid ? { mockUserToken: { sub: uid } } : {});

  return db;
}

const alice = clientFor('alice');
const bob = clientFor('bob');
const signedOut = clientFor();

const MINE = { userId: 'alice', name: 'Mine', description: null };

async function denied(attempt: Promise<unknown>) {
  await assert.rejects(attempt, (error: FirestoreError) => {
    assert.equal(error.code, 'permission-denied');

    return true;
  });
}

/** For a step that sets up a test, where only what happens next is under test. */
const ignoringFailure = (attempt: Promise<unknown>) => attempt.catch(() => undefined);

after(() => Promise.all(getApps().map((app) => deleteApp(app))));

const OWNED_DOCUMENTS = [
  { label: 'a schedule', collectionPath: FirestorePaths.schedules, path: FirestorePaths.schedule },
  { label: 'a semester plan', collectionPath: FirestorePaths.semesterPlans, path: FirestorePaths.semesterPlan },
];

for (const { label, collectionPath, path } of OWNED_DOCUMENTS) {
  describe(label, () => {
    async function ownedByAlice() {
      const id = randomUUID();

      await setDoc(doc(alice, path(id)), MINE);

      return id;
    }

    async function isStillAlices(id: string) {
      const snapshot = await getDoc(doc(alice, path(id)));

      assert.deepEqual(snapshot.data(), MINE);
    }

    describe('creating', () => {
      it('should let a user create their own', async () => {
        await setDoc(doc(alice, path(randomUUID())), MINE);
      });

      it('should not let a user create one for someone else', async () => {
        await denied(setDoc(doc(bob, path(randomUUID())), MINE));
      });

      it('should not let a user create one with no owner', async () => {
        await denied(setDoc(doc(alice, path(randomUUID())), { name: 'Mine' }));
      });

      it('should not let a signed-out visitor create one', async () => {
        await denied(setDoc(doc(signedOut, path(randomUUID())), MINE));
      });
    });

    describe('reading', () => {
      it('should let the owner read it', async () => {
        const id = await ownedByAlice();

        await isStillAlices(id);
      });

      it('should not let anyone else read it', async () => {
        const id = await ownedByAlice();

        await denied(getDoc(doc(bob, path(id))));
      });

      it('should not let a signed-out visitor read it', async () => {
        const id = await ownedByAlice();

        await denied(getDoc(doc(signedOut, path(id))));
      });

      it('should let a user list their own', async () => {
        const id = await ownedByAlice();

        const mine = await getDocs(query(collection(alice, collectionPath), where('userId', '==', 'alice')));

        assert.ok(mine.docs.some((snapshot) => snapshot.id === id));
      });

      it('should not let a user list everyone else', async () => {
        await denied(getDocs(collection(bob, collectionPath)));
      });
    });

    describe('changing', () => {
      it('should let the owner save the whole form, which includes their userId', async () => {
        const id = await ownedByAlice();

        await updateDoc(doc(alice, path(id)), { ...MINE, name: 'Renamed', updated: serverTimestamp() });
      });

      it('should let the owner change only when it was last updated', async () => {
        const id = await ownedByAlice();

        await updateDoc(doc(alice, path(id)), 'updated', serverTimestamp());
      });

      it('should not let anyone else change it', async () => {
        const id = await ownedByAlice();

        await denied(updateDoc(doc(bob, path(id)), { name: 'Not yours' }));
        await isStillAlices(id);
      });

      it('should not let a signed-out visitor change it', async () => {
        const id = await ownedByAlice();

        await denied(updateDoc(doc(signedOut, path(id)), { name: 'Not yours' }));
        await isStillAlices(id);
      });

      it('should not let the owner give it to someone else', async () => {
        const id = await ownedByAlice();

        await denied(updateDoc(doc(alice, path(id)), { userId: 'bob' }));
        await isStillAlices(id);
      });
    });

    describe('taking it from its owner', () => {
      it('should not work by updating the userId', async () => {
        const id = await ownedByAlice();

        await denied(updateDoc(doc(bob, path(id)), { userId: 'bob' }));
        await isStillAlices(id);
      });

      it('should not work by overwriting the document', async () => {
        const id = await ownedByAlice();

        await denied(setDoc(doc(bob, path(id)), { userId: 'bob', name: 'Mine now' }));
        await isStillAlices(id);
      });

      it('should not work by merging into the document', async () => {
        const id = await ownedByAlice();

        await denied(setDoc(doc(bob, path(id)), { userId: 'bob' }, { merge: true }));
        await isStillAlices(id);
      });
    });

    describe('deleting', () => {
      it('should let the owner delete it', async () => {
        const id = await ownedByAlice();

        await deleteDoc(doc(alice, path(id)));
      });

      it('should not let anyone else delete it', async () => {
        const id = await ownedByAlice();

        await denied(deleteDoc(doc(bob, path(id))));
        await isStillAlices(id);
      });

      it('should not let a signed-out visitor delete it', async () => {
        const id = await ownedByAlice();

        await denied(deleteDoc(doc(signedOut, path(id))));
        await isStillAlices(id);
      });
    });
  });
}

const CHILD_DOCUMENTS = [
  {
    label: 'a course on a schedule',
    parentPath: FirestorePaths.schedule,
    path: (parentId: string, id: string) => FirestorePaths.scheduleCourse(parentId, id),
  },
  {
    label: 'a course on a semester plan',
    parentPath: FirestorePaths.semesterPlan,
    path: (parentId: string, id: string) => FirestorePaths.semesterPlanCourse(parentId, id),
  },
  {
    label: 'a section on a semester plan',
    parentPath: FirestorePaths.semesterPlan,
    path: (parentId: string, id: string) => FirestorePaths.semesterPlanCourseSection(parentId, 'course', id),
  },
];

for (const { label, parentPath, path } of CHILD_DOCUMENTS) {
  describe(label, () => {
    async function underAlice() {
      const parentId = randomUUID();
      const id = randomUUID();

      await setDoc(doc(alice, parentPath(parentId)), MINE);
      await setDoc(doc(alice, path(parentId, id)), { name: 'Calculus II' });

      return { parentId, id };
    }

    it('should let the owner add, read, change and delete it', async () => {
      const { parentId, id } = await underAlice();
      const child = doc(alice, path(parentId, id));

      assert.equal((await getDoc(child)).data()?.['name'], 'Calculus II');
      await updateDoc(child, { name: 'Calculus III' });
      await deleteDoc(child);
    });

    it('should not let anyone else add one', async () => {
      const { parentId } = await underAlice();

      await denied(setDoc(doc(bob, path(parentId, randomUUID())), { name: 'Not yours' }));
    });

    it('should not let anyone else read it', async () => {
      const { parentId, id } = await underAlice();

      await denied(getDoc(doc(bob, path(parentId, id))));
    });

    it('should not let anyone else change it', async () => {
      const { parentId, id } = await underAlice();

      await denied(updateDoc(doc(bob, path(parentId, id)), { name: 'Not yours' }));
    });

    it('should not let anyone else delete it', async () => {
      const { parentId, id } = await underAlice();

      await denied(deleteDoc(doc(bob, path(parentId, id))));
    });

    it('should not let a signed-out visitor read it', async () => {
      const { parentId, id } = await underAlice();

      await denied(getDoc(doc(signedOut, path(parentId, id))));
    });

    it('should stay out of reach after an attempt to take its parent', async () => {
      const { parentId, id } = await underAlice();

      await ignoringFailure(updateDoc(doc(bob, parentPath(parentId)), { userId: 'bob' }));

      await denied(getDoc(doc(bob, path(parentId, id))));
      await denied(updateDoc(doc(bob, path(parentId, id)), { name: 'Not yours' }));
    });

    it('should not be addable under a parent that does not exist', async () => {
      await denied(setDoc(doc(alice, path(randomUUID(), randomUUID())), { name: 'Calculus II' }));
    });
  });
}

/** The batches the app really sends, so the rules can't quietly break a save. */
describe('what the app writes', () => {
  async function planWithCourse() {
    const planId = randomUUID();
    const courseId = randomUUID();
    const sectionId = randomUUID();

    await setDoc(doc(alice, FirestorePaths.semesterPlan(planId)), MINE);
    await setDoc(doc(alice, FirestorePaths.semesterPlanCourse(planId, courseId)), { name: 'Calculus II' });
    await setDoc(doc(alice, FirestorePaths.semesterPlanCourseSection(planId, courseId, sectionId)), { name: '001' });

    return { planId, courseId, sectionId };
  }

  async function scheduleWithCourse() {
    const scheduleId = randomUUID();
    const courseId = randomUUID();

    await setDoc(doc(alice, FirestorePaths.schedule(scheduleId)), MINE);
    await setDoc(doc(alice, FirestorePaths.scheduleCourse(scheduleId, courseId)), { name: 'Calculus II' });

    return { scheduleId, courseId };
  }

  it('should save a course on a schedule, which also touches the schedule', async () => {
    const { scheduleId, courseId } = await scheduleWithCourse();
    const batch = writeBatch(alice);

    batch.update(doc(alice, FirestorePaths.schedule(scheduleId)), 'updated', serverTimestamp());
    batch.update(doc(alice, FirestorePaths.scheduleCourse(scheduleId, courseId)), {
      name: 'Calculus III',
      updated: serverTimestamp(),
    });

    await batch.commit();
  });

  it('should save a section, which also touches its course and plan', async () => {
    const { planId, courseId, sectionId } = await planWithCourse();
    const batch = writeBatch(alice);

    batch.update(doc(alice, FirestorePaths.semesterPlan(planId)), 'updated', serverTimestamp());
    batch.update(doc(alice, FirestorePaths.semesterPlanCourse(planId, courseId)), 'updated', serverTimestamp());
    batch.update(doc(alice, FirestorePaths.semesterPlanCourseSection(planId, courseId, sectionId)), {
      name: '002',
      updated: serverTimestamp(),
    });

    await batch.commit();
  });

  it('should import a new class from MSU into a plan', async () => {
    const { planId } = await planWithCourse();
    const courseId = randomUUID();
    const batch = writeBatch(alice);

    batch.set(doc(alice, FirestorePaths.semesterPlanCourseSection(planId, courseId, randomUUID())), {
      name: '001',
      created: serverTimestamp(),
    });
    batch.set(doc(alice, FirestorePaths.semesterPlanCourse(planId, courseId)), {
      name: 'Circuits Lab',
      created: serverTimestamp(),
    });
    batch.update(doc(alice, FirestorePaths.semesterPlan(planId)), 'updated', serverTimestamp());

    await batch.commit();
  });

  it('should import more sections into a course already on the plan', async () => {
    const { planId, courseId } = await planWithCourse();
    const batch = writeBatch(alice);

    batch.set(doc(alice, FirestorePaths.semesterPlanCourseSection(planId, courseId, randomUUID())), {
      name: '002',
      created: serverTimestamp(),
    });
    batch.update(doc(alice, FirestorePaths.semesterPlanCourse(planId, courseId)), { updated: serverTimestamp() });
    batch.update(doc(alice, FirestorePaths.semesterPlan(planId)), 'updated', serverTimestamp());

    await batch.commit();
  });

  it('should delete a schedule along with its courses', async () => {
    const { scheduleId, courseId } = await scheduleWithCourse();
    const batch = writeBatch(alice);

    batch.delete(doc(alice, FirestorePaths.schedule(scheduleId)));
    batch.delete(doc(alice, FirestorePaths.scheduleCourse(scheduleId, courseId)));

    await batch.commit();
  });

  it('should delete a plan along with its courses', async () => {
    const { planId, courseId } = await planWithCourse();
    const batch = writeBatch(alice);

    batch.delete(doc(alice, FirestorePaths.semesterPlan(planId)));
    batch.delete(doc(alice, FirestorePaths.semesterPlanCourse(planId, courseId)));

    await batch.commit();
  });

  it('should refuse a whole batch that includes a takeover', async () => {
    const { planId } = await planWithCourse();
    const { scheduleId } = await scheduleWithCourse();
    const batch = writeBatch(bob);

    batch.set(doc(bob, FirestorePaths.semesterPlan(randomUUID())), { userId: 'bob', name: 'Fine on its own' });
    batch.update(doc(bob, FirestorePaths.schedule(scheduleId)), { userId: 'bob' });

    await denied(batch.commit());

    assert.equal((await getDoc(doc(alice, FirestorePaths.schedule(scheduleId)))).data()?.['userId'], 'alice');
    assert.equal((await getDoc(doc(alice, FirestorePaths.semesterPlan(planId)))).data()?.['userId'], 'alice');
  });
});
