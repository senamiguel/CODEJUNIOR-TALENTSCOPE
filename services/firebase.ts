import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined;
const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;
const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined;

// Consider config valid only when both apiKey and projectId are present and not placeholder/undefined
const isKeyValid = !!apiKey && apiKey !== "YOUR_API_KEY" && !apiKey.includes("undefined");
const isProjectIdValid = !!projectId && projectId !== "YOUR_PROJECT_ID" && !projectId.includes("undefined");
const isConfigValidComputed = isKeyValid && isProjectIdValid;

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId
};

export const isConfigValid = isConfigValidComputed;

let app;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    console.log("Firebase initialized successfully", { projectId, apiKey: apiKey?.slice?.(0,8) + '...' });
  } catch (error) {
    console.error("Firebase initialization error:", error);
    auth = null;
    db = null;
  }
} else {
  console.warn("Firebase keys missing or invalid (projectId or apiKey). Running in Demo/Local Mode.", { projectId, apiKey });
}

export { auth, db, googleProvider };