import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC9g7v9J6j5hvkq_hskn0Rvk2kM2CU8ApM",
  authDomain: "carwashdetailing-efd04.firebaseapp.com",
  projectId: "carwashdetailing-efd04",
  storageBucket: "carwashdetailing-efd04.firebasestorage.app",
  messagingSenderId: "431395218137",
  appId: "1:431395218137:web:dcc01f28e2eb785e2414c8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);