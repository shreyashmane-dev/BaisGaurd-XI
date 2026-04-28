import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCsu8JsZyQuDTNqXTkI92DNPScdJL-hf6E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "baisguard-x.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "baisguard-x",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "baisguard-x.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "104213477836",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:104213477836:web:c099eecd95eb196d4d4569",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SF5WLX36P4",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
export const db = getFirestore(app);
export const functionsRegion = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || "us-central1";
export const functionsEmulatorHost = import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST || "";
export const functionsEmulatorPort = Number(import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5001);
export const isUsingFunctionsEmulator = Boolean(functionsEmulatorHost);
export const functions = getFunctions(app, functionsRegion);

if (isUsingFunctionsEmulator) {
  connectFunctionsEmulator(functions, functionsEmulatorHost, functionsEmulatorPort);
}

export let analytics = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}
