import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE!,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID!,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
// };
const firebaseConfig = {
  apiKey: "AIzaSyC3VJr9VHNFuS0AxPrKpSfIg9YC5ZfJTjI",
  authDomain: "pitchgenie-33c93.firebaseapp.com",
  projectId: "pitchgenie-33c93",
  storageBucket: "pitchgenie-33c93.firebasestorage.app",
  messagingSenderId: "559056806088",
  appId: "1:559056806088:web:7a86ce698bcfc3bf7885fd",
  measurementId: "G-578JH97PEN"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
