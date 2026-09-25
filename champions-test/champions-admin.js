/* =========================================================
   DLS CHAMPIONS LEAGUE
   champions-admin.js
   PART 8 — ADMIN LOGIN + APPROVED TEAM LOADING
   ========================================================= */

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ADMIN CONFIGURATION
   ========================================================= */

const ADMIN_EMAIL =
  "obakimoprecious07@gmail.com";


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let approvedTeams = [];


/* =========================================================
   ELEMENTS
   ========================================================= */

const adminLogin =
  document.getElementById("adminLogin");

const adminDashboard =
  document.getElementById("adminDashboard");

const adminLoginForm =
  document.getElementById("adminLoginForm");

const adminEmail =
  document.getElementById("adminEmail");

const adminPassword =
  document.getElementById("adminPassword");

const adminLoginButton =
  document.getElementById("adminLoginButton");

const adminLoginMessage =
  document.getElementById("adminLoginMessage");

const adminWelcome =
  document.getElementById("adminWelcome");

const eligibleTeamsCount =
  document.getElementById("eligibleTeamsCount");

const eligibleTeamsList =
  document.getElementById("eligibleTeamsList");

const teamsMessage =
  document.getElementById("teamsMessage");

const adminLogoutButton =
  document.getElementById("adminLogoutButton");

const startCompetitionButton =
  document.getElementById("startCompetitionButton");


/* =========================================================
   WAIT FOR FIREBASE
   ========================================================= */

function waitForFirebase() {

  return new Promise((resolve, reject) => {

    let attempts = 0;

    const maxAttempts = 100;

    const timer = setInterval(() => {

      attempts++;

      if (
        window.championsFirebaseReady === true &&
        window.championsAuth &&
        window.championsDb
      ) {

        clearInterval(timer);

        resolve({
          auth: window.championsAuth,
          db: window.championsDb
        });

        return;
      }


      if (attempts >= maxAttempts) {

        clearInterval(timer);

        reject(
          new Error(
            "Firebase could not be initialized."
          )
        );

      }

    }, 100);

  });

}


/* =========================================================
   LOGIN MESSAGE
   ========================================================= */

function showLoginMessage(message) {

  if (!adminLoginMessage) {
    return;
  }

  adminLoginMessage.textContent = message;

}


/* =========================================================
   SHOW DASHBOARD
   ========================================================= */

function showDashboard(user) {

  if (adminLogin) {
    adminLogin.classList.add("hidden");
  }

  if (adminDashboard) {
    adminDashboard.classList.remove("hidden");
  }

  if (adminWelcome) {

    adminWelcome.textContent =
      `Welcome, ${user.email}`;

  }

}


/* =========================================================
   SHOW LOGIN
   ========================================================= */

function showLogin() {

  if (adminDashboard) {
    adminDashboard.classList.add("hidden");
  }

  if (adminLogin) {
    adminLogin.classList.remove("hidden");
  }

}


/* =========================================================
   RENDER APPROVED TEAMS
   ========================================================= */

function renderApprovedTeams() {

  if (!eligibleTeamsList) {
    return;
  }


  eligibleTeamsList.innerHTML = "";


  if (approvedTeams.length === 0) {

    eligibleTeamsList.innerHTML = `
      <div class="empty-message">
        No approved teams are currently available.
      </div>
    `;

    return;
  }


  approvedTeams.forEach((team, index) => {

    const card =
      document.createElement("div");

    card.className =
      "team-card";


    const teamName =
      document.createElement("h3");

    teamName.textContent =
      `${index + 1}. ${team.name}`;


    const playerName =
      document.createElement("p");

    playerName.textContent =
      team.player
        ? `Player: ${team.player}`
        : "Player: Not available";


    card.appendChild(teamName);

    card.appendChild(playerName);

    eligibleTeamsList.appendChild(card);

  });

}


/* =========================================================
   LOAD APPROVED TEAMS
   ========================================================= */

async function loadApprovedTeams() {

  try {

    const {
      db
    } = await waitForFirebase();


    if (teamsMessage) {

      teamsMessage.textContent =
        "Loading approved teams...";

    }


    /*
      IMPORTANT:

      The existing DLS League stores its teams in:

      competition/main

      We only READ this document here.

      We do NOT modify it.
    */

    const competitionRef =
      doc(
        db,
        "competition",
        "main"
      );


    const competitionSnapshot =
      await getDoc(competitionRef);


    if (!competitionSnapshot.exists()) {

      approvedTeams = [];


      if (eligibleTeamsCount) {
        eligibleTeamsCount.textContent = "0";
      }


      if (teamsMessage) {

        teamsMessage.textContent =
          "The current DLS League competition data could not be found.";

      }


      renderApprovedTeams();

      return;
    }


    const competitionData =
      competitionSnapshot.data();


    const teams =
      Array.isArray(competitionData.teams)
        ? competitionData.teams
        : [];


    /*
      Every team stored in the working League's
      approved teams list is eligible.

      No random selection.
      No manual selection.
    */

    approvedTeams =
      teams
        .filter((team) => {

          return (
            team &&
            typeof team.name === "string" &&
            team.name.trim() !== ""
          );

        })
        .map((team) => {

          return {

            name:
              team.name.trim(),

            player:
              typeof team.player === "string"
                ? team.player.trim()
                : ""

          };

        });


    if (eligibleTeamsCount) {

      eligibleTeamsCount.textContent =
        approvedTeams.length;

    }


    if (teamsMessage) {

      if (approvedTeams.length === 0) {

        teamsMessage.textContent =
          "There are currently no approved teams.";

      } else {

        teamsMessage.textContent =
          `${approvedTeams.length} approved team${
            approvedTeams.length === 1
              ? ""
              : "s"
          } are eligible for the Champions League.`;

      }

    }


    renderApprovedTeams();


    /*
      Starting the competition is not enabled
      by this part yet.

      We will add the safety checks and
      fixture-generation system in later parts.
    */

    if (startCompetitionButton) {

      startCompetitionButton.disabled =
        true;

    }

  } catch (error) {

    console.error(
      "Error loading approved teams:",
      error
    );


    approvedTeams = [];


    if (eligibleTeamsCount) {
      eligibleTeamsCount.textContent = "0";
    }


    if (teamsMessage) {

      teamsMessage.textContent =
        "Unable to load the approved teams.";

    }


    renderApprovedTeams();

  }

}


/* =========================================================
   ADMIN LOGIN
   ========================================================= */

async function handleAdminLogin(event) {

  event.preventDefault();


  if (
    !adminEmail ||
    !adminPassword ||
    !adminLoginButton
  ) {
    return;
  }


  const email =
    adminEmail.value.trim();

  const password =
    adminPassword.value;


  if (!email || !password) {

    showLoginMessage(
      "Please enter your email and password."
    );

    return;
  }


  /*
    Only the existing DLS admin account
    is permitted to use this dashboard.
  */

  if (
    email.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {

    showLoginMessage(
      "This account is not authorized to access the Champions League Admin."
    );

    return;
  }


  adminLoginButton.disabled = true;

  showLoginMessage(
    "Logging in..."
  );


  try {

    const {
      auth
    } = await waitForFirebase();


    const credential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


    if (
      credential.user.email.toLowerCase() !==
      ADMIN_EMAIL.toLowerCase()
    ) {

      await signOut(auth);

      showLoginMessage(
        "This account is not authorized."
      );

      return;
    }


    showLoginMessage(
      "Login successful."
    );

  } catch (error) {

    console.error(
      "Admin login error:",
      error
    );


    showLoginMessage(
      "Login failed. Please check your email and password."
    );

  } finally {

    adminLoginButton.disabled = false;

  }

}


/* =========================================================
   ADMIN LOGOUT
   ========================================================= */

async function handleAdminLogout() {

  try {

    const {
      auth
    } = await waitForFirebase();


    await signOut(auth);

    approvedTeams = [];

    showLogin();

    showLoginMessage(
      "You have been logged out."
    );

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }

}


/* =========================================================
   AUTH STATE
   ========================================================= */

async function initializeAdmin() {

  try {

    const {
      auth
    } = await waitForFirebase();


    onAuthStateChanged(
      auth,
      async (user) => {

        if (!user) {

          showLogin();

          return;
        }


        /*
          Verify the signed-in account before
          showing the dashboard.
        */

        if (
          !user.email ||
          user.email.toLowerCase() !==
          ADMIN_EMAIL.toLowerCase()
        ) {

          await signOut(auth);

          showLogin();

          showLoginMessage(
            "This account is not authorized."
          );

          return;
        }


        showDashboard(user);

        await loadApprovedTeams();

      }
    );

  } catch (error) {

    console.error(
      "Admin initialization error:",
      error
    );


    showLoginMessage(
      "Firebase could not be initialized."
    );

  }

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

if (adminLoginForm) {

  adminLoginForm.addEventListener(
    "submit",
    handleAdminLogin
  );

}


if (adminLogoutButton) {

  adminLogoutButton.addEventListener(
    "click",
    handleAdminLogout
  );

}


/* =========================================================
   START ADMIN
   ========================================================= */

initializeAdmin();