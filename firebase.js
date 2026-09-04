import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyBbknvIO-87ff0lOCSUHtJlPs_CyhkTDnE",
  authDomain: "dls-competition.firebaseapp.com",
  projectId: "dls-competition",
  storageBucket: "dls-competition.firebasestorage.app",
  messagingSenderId: "855283628558",
  appId: "1:855283628558:web:c7c4335e13da16a8775a5f",
  measurementId: "G-1CFJFVHBXZ"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);


window.db = db;
window.auth = auth;
window.firebaseReady = true;