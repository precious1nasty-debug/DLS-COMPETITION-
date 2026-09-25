// =========================================================
// DLS CHAMPIONS LEAGUE ADMIN
// PART 2 — FIREBASE, AUTHENTICATION & GLOBAL STATE
// =========================================================


import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// =========================================================
// GLOBALS
// =========================================================

const db = window.championsDb;
const auth = window.championsAuth;

const ADMIN_EMAIL =
  "obakimoprecious07@gmail.com";


// =========================================================
// CHAMPIONS DATA
// =========================================================

let championsData = {

  started: false,

  seasonStartDate: null,

  seasonEndDate: null,

  matchesPerTeam: 1,

  teams: [],

  fixtures: [],

  knockoutLegs: 1,

  knockoutRound: null,

  winner: null

};


// =========================================================
// DOM REFERENCES
// =========================================================

const adminLogin =
  document.getElementById("adminLogin");

const adminDashboard =
  document.getElementById("adminDashboard");

const adminLoginForm =
  document.getElementById("adminLoginForm");

const adminLoginMessage =
  document.getElementById("adminLoginMessage");

const adminEmailInput =
  document.getElementById("adminEmail");

const adminPasswordInput =
  document.getElementById("adminPassword");

const saveSettingsButton =
  document.getElementById("saveSettingsButton");

const generateFixturesButton =
  document.getElementById("generateFixturesButton");

const startCompetitionButton =
  document.getElementById("startCompetitionButton");

const adminLogoutButton =
  document.getElementById("adminLogoutButton");

const seasonStartDateInput =
  document.getElementById("seasonStartDate");

const seasonEndDateInput =
  document.getElementById("seasonEndDate");

const matchesPerTeamInput =
  document.getElementById("matchesPerTeam");

const knockoutLegsInput =
  document.getElementById("knockoutLegs");

const settingsMessage =
  document.getElementById("settingsMessage");

const teamCountMessage =
  document.getElementById("teamCountMessage");

const approvedTeamList =
  document.getElementById("approvedTeamList");

const adminFixtureList =
  document.getElementById("adminFixtureList");

const leagueResultsList =
  document.getElementById("leagueResultsList");

const leagueTable =
  document.getElementById("leagueTable");

const knockoutResultsList =
  document.getElementById("knockoutResultsList");

const knockoutTree =
  document.getElementById("knockoutTree");

const knockoutMessage =
  document.getElementById("knockoutMessage");

const competitionStatus =
  document.getElementById("competitionStatus");

const winnerElement =
  document.getElementById("winner");

const generateKnockoutButton =
  document.getElementById("generateKnockoutButton");


// =========================================================
// BASIC MESSAGE HELPER
// =========================================================

function showMessage(
  element,
  message,
  type = ""
) {

  if (!element) {
    return;
  }

  element.textContent = message;

  element.className =
    "message" +
    (type ? ` ${type}` : "");

}


// =========================================================
// FIREBASE READY CHECK
// =========================================================

function firebaseIsReady() {

  return Boolean(
    window.championsFirebaseReady &&
    db &&
    auth
  );

}


// =========================================================
// LOAD CHAMPIONS DATA
// =========================================================

async function loadChampionsData() {

  const ref =
    doc(
      db,
      "championsLeague",
      "main"
    );

  const snapshot =
    await getDoc(ref);


  if (!snapshot.exists()) {

    championsData = {

      started: false,

      seasonStartDate: null,

      seasonEndDate: null,

      matchesPerTeam: 1,

      teams: [],

      fixtures: [],

      knockoutLegs: 1,

      knockoutRound: null,

      winner: null

    };

    return;

  }


  const data =
    snapshot.data() || {};


  championsData = {

    started:
      data.started === true,

    seasonStartDate:
      data.seasonStartDate || null,

    seasonEndDate:
      data.seasonEndDate || null,

    matchesPerTeam:
      Number(data.matchesPerTeam) || 1,

    teams:
      Array.isArray(data.teams)
        ? data.teams
        : [],

    fixtures:
      Array.isArray(data.fixtures)
        ? data.fixtures
        : [],

    knockoutLegs:
      Number(data.knockoutLegs) === 2
        ? 2
        : 1,

    knockoutRound:
      data.knockoutRound || null,

    winner:
      data.winner || null

  };

}


// =========================================================
// SAVE CHAMPIONS DATA
// =========================================================

async function saveChampionsData() {

  const ref =
    doc(
      db,
      "championsLeague",
      "main"
    );


  await setDoc(
    ref,
    championsData
  );

}


// =========================================================
// LOAD APPROVED TEAMS
// =========================================================

async function loadApprovedTeams() {

  const ref =
    doc(
      db,
      "competition",
      "main"
    );

  const snapshot =
    await getDoc(ref);


  if (!snapshot.exists()) {

    championsData.teams = [];

    return;

  }


  const data =
    snapshot.data() || {};


  const approvedTeams =
    Array.isArray(data.teams)
      ? data.teams
      : [];


  championsData.teams =
    normalizeApprovedTeams(
      approvedTeams
    );

}


// =========================================================
// NORMALIZE TEAMS
// =========================================================

function normalizeApprovedTeams(
  teams
) {

  return teams.map(
    (team, index) => {

      const id =
        getTeamId(team) ||
        `team-${index + 1}`;

      return {

        id,

        name:
          getTeamName(team),

        player:
          String(
            team?.player ||
            team?.playerName ||
            ""
          )

      };

    }
  );

}


// =========================================================
// TEAM ID
// =========================================================

function getTeamId(team) {

  if (!team) {
    return "";
  }

  return String(
    team.id ||
    team.teamId ||
    team.uid ||
    ""
  );

}


// =========================================================
// TEAM NAME
// =========================================================

function getTeamName(team) {

  if (!team) {
    return "Unnamed Team";
  }

  return String(
    team.name ||
    team.teamName ||
    "Unnamed Team"
  );

}


// =========================================================
// ADMIN AUTHENTICATION
// =========================================================

async function handleAdminAuth(user) {

  if (!user) {

    adminLogin?.classList.remove(
      "hidden"
    );

    adminDashboard?.classList.add(
      "hidden"
    );

    return;

  }


  const signedInEmail =
    user.email
      ? user.email
          .toLowerCase()
          .trim()
      : "";


  if (
    signedInEmail !==
    ADMIN_EMAIL.toLowerCase()
  ) {

    showMessage(
      adminLoginMessage,
      "❌ This account is not authorized as admin.",
      "error"
    );

    await signOut(auth);

    return;

  }


  adminLogin?.classList.add(
    "hidden"
  );

  adminDashboard?.classList.remove(
    "hidden"
  );


  try {

    await loadChampionsData();

    await loadApprovedTeams();

    loadSettingsIntoForm();

    renderApprovedTeams();

    renderFixtures();

    renderLeagueResults();

    renderLeagueTable();

    renderKnockout();

    renderKnockoutResults();

    updateCompetitionStatus();

    renderWinner();

  }
  catch (error) {

    console.error(
      "Champions admin loading error:",
      error
    );

    showMessage(
      adminLoginMessage,
      "❌ Failed to load Champions League data.",
      "error"
    );

  }

}


// =========================================================
// LOGIN
// =========================================================

async function handleLogin(event) {

  event.preventDefault();


  const email =
    adminEmailInput?.value
      .trim()
      .toLowerCase();


  const password =
    adminPasswordInput?.value || "";


  if (!email || !password) {

    showMessage(
      adminLoginMessage,
      "❌ Enter your email and password.",
      "error"
    );

    return;

  }


  try {

    showMessage(
      adminLoginMessage,
      "Logging in..."
    );


    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );


  }
  catch (error) {

    console.error(
      "Admin login error:",
      error
    );


    showMessage(
      adminLoginMessage,
      "❌ Login failed. Check your email and password.",
      "error"
    );

  }

}


// =========================================================
// LOAD SETTINGS INTO FORM
// =========================================================

function loadSettingsIntoForm() {

  if (seasonStartDateInput) {

    seasonStartDateInput.value =
      championsData.seasonStartDate || "";

  }


  if (seasonEndDateInput) {

    seasonEndDateInput.value =
      championsData.seasonEndDate || "";

  }


  if (matchesPerTeamInput) {

    matchesPerTeamInput.value =
      String(
        championsData.matchesPerTeam || 1
      );

  }


  if (knockoutLegsInput) {

    knockoutLegsInput.value =
      String(
        championsData.knockoutLegs === 2
          ? 2
          : 1
      );

  }

}


// =========================================================
// SAVE SETTINGS
// =========================================================

async function handleSaveSettings() {

  const startDate =
    seasonStartDateInput?.value || "";

  const endDate =
    seasonEndDateInput?.value || "";

  const matches =
    Number(
      matchesPerTeamInput?.value
    );


  if (!startDate || !endDate) {

    showMessage(
      settingsMessage,
      "❌ Select both the season start and end dates.",
      "error"
    );

    return;

  }


  if (endDate < startDate) {

    showMessage(
      settingsMessage,
      "❌ Season end date cannot be before the start date.",
      "error"
    );

    return;

  }


  if (
    !Number.isInteger(matches) ||
    matches < 1 ||
    matches > 8
  ) {

    showMessage(
      settingsMessage,
      "❌ Matches per team must be between 1 and 8.",
      "error"
    );

    return;

  }


  const teamCount =
    championsData.teams.length;


  if (
    teamCount >= 9 &&
    teamCount <= 128
  ) {

    if (matches > teamCount - 1) {

      showMessage(
        settingsMessage,
        `❌ ${teamCount} teams cannot play ${matches} matches each.`,
        "error"
      );

      return;

    }


    if (
      (
        teamCount *
        matches
      ) % 2 !== 0
    ) {

      showMessage(
        settingsMessage,
        "❌ These team and match settings cannot create an exact schedule.",
        "error"
      );

      return;

    }

  }


  championsData.seasonStartDate =
    startDate;

  championsData.seasonEndDate =
    endDate;

  championsData.matchesPerTeam =
    matches;


  try {

    await saveChampionsData();


    showMessage(
      settingsMessage,
      "✅ Settings saved.",
      "success"
    );

  }
  catch (error) {

    console.error(
      "Save settings error:",
      error
    );

    showMessage(
      settingsMessage,
      "❌ Could not save settings.",
      "error"
    );

  }

}


// =========================================================
// LOGOUT
// =========================================================

async function handleLogout() {

  try {

    await signOut(auth);

  }
  catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }

}


// =========================================================
// AUTH STATE
// =========================================================

function initializeAuthentication() {

  if (!firebaseIsReady()) {

    window.addEventListener(
      "championsFirebaseReady",
      initializeAuthentication,
      {
        once: true
      }
    );

    return;

  }


  onAuthStateChanged(
    auth,
    handleAdminAuth
  );

}


// =========================================================
// EVENT LISTENERS
// =========================================================

function initializeEventListeners() {

  adminLoginForm?.addEventListener(
    "submit",
    handleLogin
  );


  saveSettingsButton?.addEventListener(
    "click",
    handleSaveSettings
  );


  adminLogoutButton?.addEventListener(
    "click",
    handleLogout
  );

}


// =========================================================
// INITIALIZE
// =========================================================

initializeEventListeners();

initializeAuthentication();