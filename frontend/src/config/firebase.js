import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBPwtNs87fufXOjTBFIchkA-897GnFh2j4",
    authDomain: "originbythesea.firebaseapp.com",
    projectId: "originbythesea",
    storageBucket: "originbythesea.firebasestorage.app",
    messagingSenderId: "156608754022",
    appId: "1:156608754022:web:4e0bf895e39ae909b758a7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);