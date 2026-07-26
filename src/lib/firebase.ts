import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

const getFirebaseApp = (): FirebaseApp | null => {
  if (!isFirebaseConfigured) {
    return null;
  }

  return getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
};

const app = getFirebaseApp();

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  : null;
export const googleProvider = new GoogleAuthProvider();

export const requireAuth = () => {
  if (!auth) {
    throw new Error("Firebase Auth is not configured.");
  }

  return auth;
};

export const requireDb = () => {
  if (!db) {
    throw new Error("Cloud Firestore is not configured.");
  }

  return db;
};
