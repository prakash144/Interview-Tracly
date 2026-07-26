import {
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { requireDb } from "@/lib/firebase";
import type { ProgressMap, UserProblemProgress } from "@/lib/progressTypes";

const progressCollection = (uid: string) =>
  collection(requireDb(), "users", uid, "progress");

const progressDoc = (uid: string, problemId: string) =>
  doc(requireDb(), "users", uid, "progress", problemId);

const activityDoc = (uid: string, date: string) =>
  doc(requireDb(), "users", uid, "activity", date);

export const subscribeProgress = (
  uid: string,
  callback: (progress: ProgressMap) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const unsub = onSnapshot(
    progressCollection(uid),
    (snapshot) => {
      const progress: ProgressMap = {};
      snapshot.forEach((d) => {
        progress[d.id] = d.data() as UserProblemProgress;
      });
      callback(progress);
    },
    (error) => { if (onError) onError(error); }
  );
  return unsub;
};

export const getUserProgress = async (uid: string): Promise<ProgressMap> => {
  const snapshot = await getDocs(progressCollection(uid));
  const progress: ProgressMap = {};

  snapshot.forEach((document) => {
    progress[document.id] = document.data() as UserProblemProgress;
  });

  return progress;
};

export const saveProblemProgress = async (
  uid: string,
  progress: Omit<UserProblemProgress, "updatedAt"> & { updatedAt?: unknown }
) => {
  await setDoc(
    progressDoc(uid, progress.problemId),
    {
      ...progress,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const updateDailyActivity = async (
  uid: string,
  date: string,
  updates: { solvedDelta?: number; attemptedDelta?: number }
) => {
  const payload: Record<string, unknown> = {
    date,
    updatedAt: serverTimestamp(),
  };

  if (updates.solvedDelta) {
    payload.solvedCount = increment(updates.solvedDelta);
  }

  if (updates.attemptedDelta) {
    payload.attemptedCount = increment(updates.attemptedDelta);
  }

  await setDoc(activityDoc(uid, date), payload, { merge: true });
};

export interface DailyActivity {
  date: string;
  solvedCount: number;
  attemptedCount: number;
}

export const getUserActivity = async (uid: string): Promise<DailyActivity[]> => {
  const snapshot = await getDocs(collection(requireDb(), "users", uid, "activity"));

  return snapshot.docs.map((document) => {
    const data = document.data();

    return {
      date: typeof data.date === "string" ? data.date : document.id,
      solvedCount: typeof data.solvedCount === "number" ? data.solvedCount : 0,
      attemptedCount: typeof data.attemptedCount === "number" ? data.attemptedCount : 0,
    };
  });
};
