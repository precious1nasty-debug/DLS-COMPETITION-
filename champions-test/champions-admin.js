/* =========================================================
   DLS CHAMPIONS LEAGUE
   champions-admin.js
   PART 6C — FIREBASE AUTH + ADMIN LOGIN
   ========================================================= */

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================
   ADMIN ACCOUNT
========================= */

const ADMIN_EMAIL = "obakimoprecious07@gmail.com";


/* =========================
   WAIT FOR FIREBASE
========================= */

function waitForFirebase() {

  return new Promise((resolve) => {

    if (
      window.championsFirebaseReady &&
      window.championsAuth
    ) {
      resolve(window.championsAuth);
      return;
    }


    const checkFirebase = setInterval(() => {

      if (
        window.championsFirebaseReady &&
        window.championsAuth
      ) {

        clearInterval(checkFirebase);

        resolve(window.championsAuth);

      }

    }, 50);

  });

}


/* =========================
   PAGE ELEMENTS
========================= */

const loginSection =
  document.getElementById("adminLogin");

const dashboardSection =
  document.getElementById("adminDashboard");

const loginForm =
  document.getElementById("adminLoginForm");

const emailInput =
  document.getElementById("adminEmail");

const passwordInput =
  document.getElementById("adminPassword");

const loginButton =
  document.getElementById("adminLoginButton");

const loginMessage =
  document.getElementById("adminLoginMessage");


/* =========================
   MESSAGE
========================= */

function showLoginMessage(message) {

  loginMessage.textContent = message;

}


/* =========================
   SHOW LOGIN
========================= */

function showLogin() {

  loginSection.classList.remove("hidden");

  dashboardSection.classList.add("hidden");

}


/* =========================
   SHOW DASHBOARD
========================= */

function showDashboard(user) {

  loginSection.classList.add("hidden");

  dashboardSection.classList.remove("hidden");

  const welcome =
    document.getElementById("adminWelcome");

  if (welcome) {

    welcome.textContent =
      `Welcome, ${user.email}`;

  }

}


/* =========================
   ADMIN LOGIN
========================= */

loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();


  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;


  if (!email || !password) {

    showLoginMessage(
      "Please enter your email and password."
    );

    return;

  }


  if (
    email.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {

    showLoginMessage(
      "Access denied. Admin account required."
    );

    return;

  }


  loginButton.disabled = true;

  showLoginMessage(
    "Signing in..."
  );


  try {

    const auth =
      await waitForFirebase();


    const result =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


    const user =
      result.user;


    if (
      !user.email ||
      user.email.toLowerCase() !==
      ADMIN_EMAIL.toLowerCase()
    ) {

      await signOut(auth);

      showLoginMessage(
        "Access denied."
      );

      return;

    }


    showLoginMessage("");

    showDashboard(user);

  } catch (error) {

    console.error(
      "Champions admin login error:",
      error
    );


    showLoginMessage(
      "Login failed. Please check your email and password."
    );

  } finally {

    loginButton.disabled = false;

  }

});


/* =========================
   AUTH STATE
========================= */

waitForFirebase().then((auth) => {

  onAuthStateChanged(
    auth,
    async (user) => {

      if (!user) {

        showLogin();

        return;

      }


      if (
        !user.email ||
        user.email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
      ) {

        await signOut(auth);

        showLogin();

        showLoginMessage(
          "Access denied. Admin account required."
        );

        return;

      }


      showDashboard(user);

    }
  );

});