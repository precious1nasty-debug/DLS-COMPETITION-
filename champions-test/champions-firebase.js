/* =========================================================
   DLS CHAMPIONS LEAGUE
   champions-firebase.js
   PART 4 — FIREBASE CONNECTION
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================
   FIREBASE CONFIGURATION
========================= */

const firebaseConfig = {

  apiKey: "AIzaSyBbknvIO-87ff0lOCSUHtJlPs_CyhkTDnE",

  authDomain:
    "dls-competition.firebaseapp.com",

  projectId:
    "dls-competition",

  storageBucket:
    "dls-competition.firebasestorage.app",

  messagingSenderId:
    "855283628558",

  appId:
    "1:855283628558:web:c7c4335e13da16a8775a5f",

  measurementId:
    "G-1CFJFVHBXZ"

};


/* =========================
   INITIALIZE FIREBASE
========================= */

const app = initializeApp(firebaseConfig);


/* =========================
   FIRESTORE
========================= */

const db = getFirestore(app);


/* =========================
   AUTHENTICATION
========================= */

const auth = getAuth(app);


/* =========================
   GLOBAL REFERENCES
========================= */

window.championsDb = db;

window.championsAuth = auth;

window.championsFirebaseReady = true;