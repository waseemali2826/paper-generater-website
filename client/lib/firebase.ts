import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGpMz4LkRnR_E3tCe6pxJgN8iOgIspzYY",
  authDomain: "paper-gen-bec57.firebaseapp.com",
  projectId: "paper-gen-bec57",
  storageBucket: "paper-gen-bec57.firebasestorage.app",
  messagingSenderId: "576519900341",
  appId: "1:576519900341:web:4cf63958cd5be8a79942fc",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});
