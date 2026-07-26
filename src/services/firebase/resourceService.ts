import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { requireDb } from "@/lib/firebase";
import type { KnowledgeResource, UserResourceProgress, ResourceProgressMap } from "@/lib/knowledgeBase";
import type { TrackId } from "@/lib/interviewTracks";
import { RESOURCES_COLLECTION } from "@/lib/knowledgeBase";

const resourceCollection = (uid: string) =>
  collection(requireDb(), "users", uid, RESOURCES_COLLECTION);

const resourceDoc = (uid: string, resourceId: string) =>
  doc(requireDb(), "users", uid, RESOURCES_COLLECTION, resourceId);

const resourceProgressCollection = (uid: string) =>
  collection(requireDb(), "users", uid, "resourceProgress");

const resourceProgressDoc = (uid: string, resourceId: string) =>
  doc(requireDb(), "users", uid, "resourceProgress", resourceId);

export const subscribeResources = (
  uid: string,
  callback: (resources: KnowledgeResource[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const unsub = onSnapshot(resourceCollection(uid),
    (snapshot) => callback(snapshot.docs.map((d) => d.data() as KnowledgeResource)),
    (error) => { if (onError) onError(error); }
  );
  return unsub;
};

export const subscribeResourceProgress = (
  uid: string,
  callback: (progress: ResourceProgressMap) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const unsub = onSnapshot(resourceProgressCollection(uid),
    (snapshot) => {
      const progress: ResourceProgressMap = {};
      snapshot.forEach((d) => {
        progress[d.id] = d.data() as UserResourceProgress;
      });
      callback(progress);
    },
    (error) => { if (onError) onError(error); }
  );
  return unsub;
};

export const getUserResources = async (uid: string, trackId?: TrackId): Promise<KnowledgeResource[]> => {
  const ref = resourceCollection(uid);
  const q = trackId ? query(ref, where("track", "==", trackId)) : ref;
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as KnowledgeResource);
};

export const addResource = async (uid: string, resource: KnowledgeResource): Promise<void> => {
  await setDoc(resourceDoc(uid, resource.id), {
    ...resource,
    updatedAt: Date.now(),
    createdAt: resource.createdAt || Date.now(),
  });
};

export const updateResource = async (
  uid: string,
  resourceId: string,
  data: Partial<KnowledgeResource>
): Promise<void> => {
  await setDoc(
    resourceDoc(uid, resourceId),
    { ...data, updatedAt: Date.now() },
    { merge: true }
  );
};

export const archiveResource = async (uid: string, resourceId: string): Promise<void> => {
  await updateDoc(resourceDoc(uid, resourceId), { archivedAt: Date.now(), updatedAt: Date.now() });
};

export const restoreResource = async (uid: string, resourceId: string): Promise<void> => {
  await updateDoc(resourceDoc(uid, resourceId), { archivedAt: null, updatedAt: Date.now() });
};

export const deleteResource = async (uid: string, resourceId: string): Promise<void> => {
  await deleteDoc(resourceDoc(uid, resourceId));
  try {
    await deleteDoc(resourceProgressDoc(uid, resourceId));
  } catch {
    console.warn("Resource progress doc could not be deleted — possible orphan:", resourceId);
  }
};

export const deleteResourcesByTrack = async (uid: string, trackId: string): Promise<void> => {
  const resources = await getUserResources(uid, trackId);
  await Promise.all(resources.map((r) => deleteResource(uid, r.id)));
};

// Progress CRUD

export const getUserResourceProgress = async (uid: string): Promise<ResourceProgressMap> => {
  const snapshot = await getDocs(resourceProgressCollection(uid));
  const progress: ResourceProgressMap = {};
  snapshot.forEach((document) => {
    progress[document.id] = document.data() as UserResourceProgress;
  });
  return progress;
};

export const saveResourceProgress = async (
  uid: string,
  progress: Omit<UserResourceProgress, "updatedAt"> & { updatedAt?: unknown }
) => {
  await setDoc(
    resourceProgressDoc(uid, progress.resourceId),
    { ...progress, updatedAt: serverTimestamp() },
    { merge: true }
  );
};
