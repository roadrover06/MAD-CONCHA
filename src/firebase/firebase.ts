import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDjLtsulXhW7Xn2suLXLQowZt8BN0pVOg8",
  authDomain: "mad-concha.firebaseapp.com",
  projectId: "mad-concha",
  storageBucket: "mad-concha.firebasestorage.app",
  messagingSenderId: "948940304124",
  appId: "1:948940304124:web:9a1bc6caad9d9616d7f179"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable Firestore offline persistence
enableIndexedDbPersistence(db).catch(() => {});

// Helper for online status
export const isOnline = () => window.navigator.onLine;