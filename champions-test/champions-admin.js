/* =========================================================
   DLS CHAMPIONS LEAGUE
   champions-admin.js
   PART 10C — ADMIN LOGIN + SETTINGS
   ========================================================= */

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
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

let savedMatchesPerTeam = null;

let championsCompetitionData = null;


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

const championsStatus =
  document.getElementById("championsStatus");

const eligibleTeamsCount =
  document.getElementById("eligibleTeamsCount");

const matchesPerTeamDisplay =
  document.getElementById("matchesPerTeamDisplay");

const fixturesCount =
  document.getElementById("fixturesCount");

const championName =
  document.getElementById("championName");

const matchesPerTeam =
  document.getElementById("matchesPerTeam");

const settingsMessage =
  document.getElementById("settingsMessage");

const saveSettingsButton =
  document.getElementById("saveSettingsButton");

const eligibleTeamsList =
  document.getElementById("eligibleTeamsList");

const teamsMessage =
  document.getElementById("teamsMessage");

const startCompetitionMessage =
  document.getElementById("startCompetitionMessage");

const startCompetitionButton =
  document.getElementById("startCompetitionButton");

const adminLogoutButton =
  document.getElementById("adminLogoutButton");


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

          auth:
            window.championsAuth,

          db:
            window.championsDb

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

  adminLoginMessage.textContent =
    message;

}


/* =========================================================
   SHOW DASHBOARD
   ========================================================= */

function showDashboard(user) {

  if (adminLogin) {

    adminLogin.classList.add(
      "hidden"
    );

  }


  if (adminDashboard) {

    adminDashboard.classList.remove(
      "hidden"
    );

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

    adminDashboard.classList.add(
      "hidden"
    );

  }


  if (adminLogin) {

    adminLogin.classList.remove(
      "hidden"
    );

  }

}


/* =========================================================
   RENDER APPROVED TEAMS
   ========================================================= */

function renderApprovedTeams() {

  if (!eligibleTeamsList) {
    return;
  }


  eligibleTeamsList.innerHTML =
    "";


  if (approvedTeams.length === 0) {

    eligibleTeamsList.innerHTML = `
      <div class="empty-message">
        No approved teams are currently available.
      </div>
    `;

    return;
  }


  approvedTeams.forEach(
    (team, index) => {

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


      card.appendChild(
        teamName
      );

      card.appendChild(
        playerName
      );

      eligibleTeamsList.appendChild(
        card
      );

    }
  );

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
      The existing DLS League stores
      approved teams in:

      competition/main

      This function ONLY reads that document.
    */

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


    if (!competitionSnapshot.exists()) {

      approvedTeams = [];


      if (eligibleTeamsCount) {

        eligibleTeamsCount.textContent =
          "0";

      }


      if (teamsMessage) {

        teamsMessage.textContent =
          "The current DLS League competition data could not be found.";

      }


      renderApprovedTeams();

      updateStartButton();

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


    /*
      Every approved team is eligible.

      No random selection.
      No checkbox selection.
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

      if (
        approvedTeams.length === 0
      ) {

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

    updateStartButton();

  } catch (error) {

    console.error(
      "Error loading approved teams:",
      error
    );


    approvedTeams = [];


    if (eligibleTeamsCount) {

      eligibleTeamsCount.textContent =
        "0";

    }


    if (teamsMessage) {

      teamsMessage.textContent =
        "Unable to load the approved teams.";

    }


    renderApprovedTeams();

    updateStartButton();

  }

}


/* =========================================================
   LOAD CHAMPIONS COMPETITION
   ========================================================= */

async function loadChampionsCompetition() {

  try {

    const {
      db
    } = await waitForFirebase();


    const championsRef =
      doc(
        db,
        "championsLeague",
        "main"
      );


    const championsSnapshot =
      await getDoc(
        championsRef
      );


    if (
      !championsSnapshot.exists()
    ) {

      championsCompetitionData =
        null;

      savedMatchesPerTeam =
        null;

      updateDashboard();

      updateStartButton();

      return;
    }


    championsCompetitionData =
      championsSnapshot.data();


    const storedMatches =
      championsCompetitionData
        .matchesPerTeam;


    if (
      Number.isInteger(
        storedMatches
      ) &&
      storedMatches >= 1 &&
      storedMatches <= 8
    ) {

      savedMatchesPerTeam =
        storedMatches;

    } else {

      savedMatchesPerTeam =
        null;

    }


    if (
      matchesPerTeam &&
      savedMatchesPerTeam !== null
    ) {

      matchesPerTeam.value =
        String(
          savedMatchesPerTeam
        );

    }


    updateDashboard();

    updateStartButton();

  } catch (error) {

    console.error(
      "Error loading Champions League data:",
      error
    );

  }

}


/* =========================================================
   UPDATE DASHBOARD
   ========================================================= */

function updateDashboard() {

  if (eligibleTeamsCount) {

    eligibleTeamsCount.textContent =
      approvedTeams.length;

  }


  if (matchesPerTeamDisplay) {

    matchesPerTeamDisplay.textContent =
      savedMatchesPerTeam !== null
        ? String(
            savedMatchesPerTeam
          )
        : "Not Set";

  }


  if (fixturesCount) {

    const fixtures =
      championsCompetitionData &&
      Array.isArray(
        championsCompetitionData.fixtures
      )
        ? championsCompetitionData.fixtures.length
        : 0;

    fixturesCount.textContent =
      fixtures;

  }


  if (championName) {

    const champion =
      championsCompetitionData &&
      championsCompetitionData.champion;


    if (
      champion &&
      champion.name
    ) {

      championName.textContent =
        champion.name;

    } else {

      championName.textContent =
        "Not Decided";

    }

  }


  if (championsStatus) {

    const status =
      championsCompetitionData &&
      championsCompetitionData.status;


    championsStatus.textContent =
      status ||
      "Not Started";

  }

}


/* =========================================================
   VALIDATE MATCHES PER TEAM
   ========================================================= */

function validateMatchesPerTeam(
  value
) {

  const number =
    Number(value);


  if (
    !Number.isInteger(number)
  ) {

    return {
      valid: false,
      message:
        "Please select the number of matches per team."
    };

  }


  if (
    number < 1 ||
    number > 8
  ) {

    return {
      valid: false,
      message:
        "Matches per team must be between 1 and 8."
    };

  }


  /*
    A team cannot play more unique opponents
    than there are other teams.

    Example:

    8 teams = maximum 7 unique opponents.
  */

  if (
    approvedTeams.length < 2
  ) {

    return {
      valid: false,
      message:
        "At least 2 approved teams are required."
    };

  }


  if (
    number >
    approvedTeams.length - 1
  ) {

    return {
      valid: false,
      message:
        `With ${approvedTeams.length} teams, each team can play a maximum of ${
          approvedTeams.length - 1
        } matches in the league phase.`
    };

  }


  /*
    Every team must play exactly the selected
    number of matches.

    Total team appearances must therefore
    be even, because every fixture contains
    two teams.

    Example:

    5 teams × 3 matches = 15 appearances.

    That cannot be divided equally into
    two-team fixtures.

    Therefore this setting is rejected.
  */

  const totalAppearances =
    approvedTeams.length * number;


  if (
    totalAppearances % 2 !== 0
  ) {

    return {
      valid: false,
      message:
        `This combination cannot give every team exactly ${number} matches. Please choose another number.`
    };

  }


  return {
    valid: true,
    value: number
  };

}


/* =========================================================
   SAVE COMPETITION SETTINGS
   ========================================================= */

async function saveCompetitionSettings() {

  if (
    !matchesPerTeam ||
    !saveSettingsButton
  ) {
    return;
  }


  const validation =
    validateMatchesPerTeam(
      matchesPerTeam.value
    );


  if (!validation.valid) {

    if (settingsMessage) {

      settingsMessage.textContent =
        validation.message;

    }

    return;
  }


  try {

    const {
      db
    } = await waitForFirebase();


    saveSettingsButton.disabled =
      true;


    if (settingsMessage) {

      settingsMessage.textContent =
        "Saving competition settings...";

    }


    const championsRef =
      doc(
        db,
        "championsLeague",
        "main"
      );


    const existingSnapshot =
      await getDoc(
        championsRef
      );


    const existingData =
      existingSnapshot.exists()
        ? existingSnapshot.data()
        : {};


    const selectedValue =
      validation.value;


    await setDoc(
      championsRef,
      {

        ...existingData,

        matchesPerTeam:
          selectedValue,

        eligibleTeams:
          approvedTeams,

        updatedAt:
          new Date().toISOString()

      },
      {
        merge: true
      }
    );


    savedMatchesPerTeam =
      selectedValue;


    championsCompetitionData = {

      ...existingData,

      matchesPerTeam:
        selectedValue,

      eligibleTeams:
        approvedTeams

    };


    updateDashboard();

    updateStartButton();


    if (settingsMessage) {

      settingsMessage.textContent =
        `Saved: each team will play ${selectedValue} league-phase match${
          selectedValue === 1
            ? ""
            : "es"
        }.`;

    }

  } catch (error) {

    console.error(
      "Error saving competition settings:",
      error
    );


    if (settingsMessage) {

      settingsMessage.textContent =
        "Unable to save the competition settings.";

    }

  } finally {

    saveSettingsButton.disabled =
      false;

  }

}


/* =========================================================
   UPDATE START BUTTON
   ========================================================= */

function updateStartButton() {

  if (
    !startCompetitionButton
  ) {
    return;
  }


  /*
    The actual fixture-generation system
    will be added in a later part.

    For now, the button stays disabled.
  */

  startCompetitionButton.disabled =
    true;


  if (
    startCompetitionMessage
  ) {

    if (
      approvedTeams.length < 2
    ) {

      startCompetitionMessage.textContent =
        "At least 2 approved teams are required.";

      return;
    }


    if (
      savedMatchesPerTeam === null
    ) {

      startCompetitionMessage.textContent =
        "Select and save the number of matches per team.";

      return;
    }


    const validation =
      validateMatchesPerTeam(
        savedMatchesPerTeam
      );


    if (!validation.valid) {

      startCompetitionMessage.textContent =
        validation.message;

      return;
    }


    startCompetitionMessage.textContent =
      "Competition settings are valid. Fixture generation will be added next.";

  }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleAdminLogin(
  event
) {

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


  if (
    !email ||
    !password
  ) {

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
      "This account is not authorized to access the Champions League Admin."
    );

    return;
  }


  adminLoginButton.disabled =
    true;


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
      !credential.user.email ||
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

    adminLoginButton.disabled =
      false;

  }

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function handleAdminLogout() {

  try {

    const {
      auth
    } = await waitForFirebase();


    await signOut(auth);


    approvedTeams = [];

    savedMatchesPerTeam =
      null;

    championsCompetitionData =
      null;


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


        /*
          Load both:

          1. Approved teams from the
             existing DLS League.

          2. Existing Champions League
             settings, if any.
        */

        await loadApprovedTeams();

        await loadChampionsCompetition();

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


if (saveSettingsButton) {

  saveSettingsButton.addEventListener(
    "click",
    saveCompetitionSettings
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