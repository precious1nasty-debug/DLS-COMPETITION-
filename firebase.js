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
  apiKey: "AIzaSyAhCSFDYBlofKMSDSViO8yJzMQuhWM_L9A",
  authDomain: "dls-competition-test.firebaseapp.com",
  projectId: "dls-competition-test",
  storageBucket: "dls-competition-test.firebasestorage.app",
  messagingSenderId: "847276827680",
  appId: "1:847276827680:web:6f76f1ac4f41ab2314c845"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);


window.db = db;
window.auth = auth;
window.firebaseReady = true;