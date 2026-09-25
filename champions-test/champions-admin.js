/* =========================================================
   DLS CHAMPIONS LEAGUE
   champions-admin.js
   PART 7F — AUTH + APPROVED TEAMS + SELECTION SETUP
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


/* =========================
   ADMIN ACCOUNT
========================= */

const ADMIN_EMAIL =
  "obakimoprecious07@gmail.com";


/* =========================
   TEAM DATA
========================= */

let approvedTeams = [];

let selectedChampionsTeams = [];


/* =========================
   WAIT FOR FIREBASE
========================= */

function waitForFirebase() {

  return new Promise((resolve) => {

    if (
      window.championsFirebaseReady &&
      window.championsAuth &&
      window.championsDb
    ) {

      resolve({
        auth: window.championsAuth,
        db: window.championsDb
      });

      return;

    }


    const checkFirebase =
      setInterval(() => {

        if (
          window.championsFirebaseReady &&
          window.championsAuth &&
          window.championsDb
        ) {

          clearInterval(checkFirebase);

          resolve({
            auth: window.championsAuth,
            db: window.championsDb
          });

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

const teamSelectionMessage =
  document.getElementById(
    "teamSelectionMessage"
  );

const availableTeamsList =
  document.getElementById(
    "availableTeamsList"
  );

const randomSelectionButton =
  document.getElementById(
    "randomSelectionButton"
  );

const selectedTeamsList =
  document.getElementById(
    "selectedTeamsList"
  );


/* =========================
   LOGIN MESSAGE
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
    document.getElementById(
      "adminWelcome"
    );


  if (welcome) {

    welcome.textContent =
      `Welcome, ${user.email}`;

  }

}


/* =========================
   TEAM MESSAGE
========================= */

function showTeamMessage(message) {

  if (teamSelectionMessage) {

    teamSelectionMessage.textContent =
      message;

  }

}


/* =========================
   LOAD APPROVED TEAMS
========================= */

async function loadApprovedTeams() {

  showTeamMessage(
    "Loading approved teams..."
  );


  try {

    const {
      db
    } = await waitForFirebase();


    const competitionRef =
      doc(
        db,
        "competition",
        "main"
      );


    const competitionSnapshot =
      await getDoc(
        competitionRef
      );


    if (
      !competitionSnapshot.exists()
    ) {

      approvedTeams = [];

      renderAvailableTeams();

      showTeamMessage(
        "No current league competition data was found."
      );

      return;

    }


    const competitionData =
      competitionSnapshot.data();


    const teams =
      Array.isArray(
        competitionData.teams
      )
        ? competitionData.teams
        : [];


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


    renderAvailableTeams();


    if (approvedTeams.length === 0) {

      showTeamMessage(
        "There are no approved teams available yet."
      );

      return;

    }


    showTeamMessage(
      `${approvedTeams.length} approved team(s) available.`
    );

  } catch (error) {

    console.error(
      "Error loading approved teams:",
      error
    );


    approvedTeams = [];

    renderAvailableTeams();


    showTeamMessage(
      "Unable to load approved teams."
    );

  }

}


/* =========================
   RENDER AVAILABLE TEAMS
========================= */

function renderAvailableTeams() {

  if (!availableTeamsList) {
    return;
  }


  availableTeamsList.innerHTML = "";


  if (approvedTeams.length === 0) {

    const emptyMessage =
      document.createElement("p");

    emptyMessage.textContent =
      "No approved teams found.";

    availableTeamsList.appendChild(
      emptyMessage
    );

    return;

  }


  approvedTeams.forEach(
    (team, index) => {

      const teamCard =
        document.createElement("div");


      teamCard.className =
        "team-selection-card";


      const checkbox =
        document.createElement("input");


      checkbox.type =
        "checkbox";

      checkbox.id =
        `championsTeam_${index}`;

      checkbox.value =
        team.name;


      checkbox.dataset.index =
        index;


      const label =
        document.createElement("label");


      label.htmlFor =
        checkbox.id;


      label.textContent =
        team.player
          ? `${team.name} — ${team.player}`
          : team.name;


      teamCard.appendChild(
        checkbox
      );

      teamCard.appendChild(
        label
      );


      availableTeamsList.appendChild(
        teamCard
      );

    }
  );

}


/* =========================
   RENDER SELECTED TEAMS
========================= */

function renderSelectedTeams() {

  if (!selectedTeamsList) {
    return;
  }


  selectedTeamsList.innerHTML = "";


  if (
    selectedChampionsTeams.length === 0
  ) {

    const emptyMessage =
      document.createElement("p");

    emptyMessage.textContent =
      "No Champions League teams selected.";

    selectedTeamsList.appendChild(
      emptyMessage
    );

    return;

  }


  selectedChampionsTeams.forEach(
    (team) => {

      const teamCard =
        document.createElement("div");


      teamCard.className =
        "selected-team-card";


      const teamName =
        document.createElement("strong");


      teamName.textContent =
        team.name;


      teamCard.appendChild(
        teamName
      );


      if (team.player) {

        const playerName =
          document.createElement("span");


        playerName.textContent =
          ` — ${team.player}`;


        teamCard.appendChild(
          playerName
        );

      }


      selectedTeamsList.appendChild(
        teamCard
      );

    }
  );

}


/* =========================
   RANDOM SELECTION SETUP
========================= */

if (randomSelectionButton) {

  randomSelectionButton.disabled =
    true;

}


/* =========================
   ADMIN LOGIN
========================= */

loginForm.addEventListener(
  "submit",
  async (event) => {

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


    loginButton.disabled =
      true;


    showLoginMessage(
      "Signing in..."
    );


    try {

      const {
        auth
      } = await waitForFirebase();


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


      await loadApprovedTeams();


      if (randomSelectionButton) {

        randomSelectionButton.disabled =
          approvedTeams.length === 0;

      }


      renderSelectedTeams();

    } catch (error) {

      console.error(
        "Champions admin login error:",
        error
      );


      showLoginMessage(
        "Login failed. Please check your email and password."
      );

    } finally {

      loginButton.disabled =
        false;

    }

  }
);


/* =========================
   AUTH STATE
========================= */

waitForFirebase().then(
  ({ auth }) => {

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


        await loadApprovedTeams();


        if (randomSelectionButton) {

          randomSelectionButton.disabled =
            approvedTeams.length === 0;

        }


        renderSelectedTeams();

      }
    );

  }
);