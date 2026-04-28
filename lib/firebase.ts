import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBF8RbuU9bmsT440pH0VDaBM2opYWnet7s",
  authDomain: "oblachnaya51.firebaseapp.com",
  projectId: "oblachnaya51",
  storageBucket: "oblachnaya51.firebasestorage.app",
  messagingSenderId: "397121981540",
  appId: "1:397121981540:web:d50ab1a47cd3ea34a76371",
};

// INIT
const app = initializeApp(firebaseConfig);

// 🔥 ВАЖНО — экспортируем!
export const auth = getAuth(app);
export const db = getFirestore(app);

// AUTH FUNCTIONS
export const registerUser = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = () => {
  return signOut(auth);
};

export const onAuthChange = (callback: any) => {
  return onAuthStateChanged(auth, callback);
};

export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};