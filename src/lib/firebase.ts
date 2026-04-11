import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBrm6Q6dwBvEevqUgfJLJ7_s6bTEFHsj40",
  authDomain: "farmlink-783ce.firebaseapp.com",
  projectId: "farmlink-783ce",
  storageBucket: "farmlink-783ce.firebasestorage.app",
  messagingSenderId: "47602851353",
  appId: "1:47602851353:web:e0160ad1aab2bc71fc1488",
  measurementId: "G-FCF5M05SDH",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
