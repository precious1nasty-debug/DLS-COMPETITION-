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


// =========================================================
// PART 3 — TEAM MANAGEMENT & SETTINGS VALIDATION
// =========================================================


// =========================================================
// TEAM COUNT
// =========================================================

function getTeamCount() {

  return championsData.teams.length;

}


// =========================================================
// VALIDATE TEAM COUNT
// =========================================================

function validateTeamCount() {

  const count =
    getTeamCount();


  if (count < 9) {

    return {
      valid: false,
      message:
        `❌ Champions League requires at least 9 approved teams. Current: ${count}.`
    };

  }


  if (count > 128) {

    return {
      valid: false,
      message:
        `❌ Champions League supports a maximum of 128 teams. Current: ${count}.`
    };

  }


  return {
    valid: true,
    message: ""
  };

}


// =========================================================
// VALIDATE MATCHES PER TEAM
// =========================================================

function validateMatchesPerTeam() {

  const teamCount =
    getTeamCount();


  const matches =
    Number(
      matchesPerTeamInput?.value ||
      championsData.matchesPerTeam
    );


  if (
    !Number.isInteger(matches) ||
    matches < 1 ||
    matches > 8
  ) {

    return {
      valid: false,
      message:
        "❌ Matches per team must be between 1 and 8."
    };

  }


  if (teamCount >= 9) {

    if (
      matches >
      teamCount - 1
    ) {

      return {
        valid: false,
        message:
          `❌ A team cannot play itself. With ${teamCount} teams, the maximum is ${teamCount - 1} matches.`
      };

    }


    if (
      (
        teamCount *
        matches
      ) % 2 !== 0
    ) {

      return {
        valid: false,
        message:
          "❌ These settings cannot produce an exact number of matches for every team."
      };

    }

  }


  return {
    valid: true,
    value: matches,
    message: ""
  };

}


// =========================================================
// QUALIFICATION COUNT
// =========================================================

function getQualificationCount() {

  const teamCount =
    getTeamCount();


  if (
    teamCount >= 9 &&
    teamCount <= 16
  ) {

    return 8;

  }


  if (
    teamCount >= 17 &&
    teamCount <= 32
  ) {

    return 16;

  }


  if (
    teamCount >= 33 &&
    teamCount <= 128
  ) {

    return 32;

  }


  return 0;

}


// =========================================================
// QUALIFICATION DESCRIPTION
// =========================================================

function getQualificationDescription() {

  const count =
    getQualificationCount();


  if (!count) {

    return "";

  }


  return `Top ${count} qualify for the knockout phase.`;

}


// =========================================================
// RENDER APPROVED TEAMS
// =========================================================

function renderApprovedTeams() {

  if (!approvedTeamList) {
    return;
  }


  const teams =
    championsData.teams;


  if (!teams.length) {

    approvedTeamList.innerHTML =
      "<p>No approved teams found.</p>";

    showMessage(
      teamCountMessage,
      "No approved teams found.",
      "error"
    );

    return;

  }


  showMessage(
    teamCountMessage,
    `${teams.length} approved team${teams.length === 1 ? "" : "s"}.`
  );


  approvedTeamList.innerHTML = "";


  teams.forEach(
    (team, index) => {

      const item =
        document.createElement("div");

      item.className =
        "team-item";


      const number =
        document.createElement("span");

      number.textContent =
        `${index + 1}.`;


      const name =
        document.createElement("strong");

      name.textContent =
        team.name;


      const player =
        document.createElement("span");

      player.textContent =
        team.player
          ? ` — ${team.player}`
          : "";


      item.appendChild(number);

      item.appendChild(name);

      item.appendChild(player);

      approvedTeamList.appendChild(item);

    }
  );


  const qualification =
    getQualificationCount();


  if (qualification) {

    showMessage(
      teamCountMessage,
      `${teams.length} approved teams. Top ${qualification} qualify for the knockout phase.`
    );

  }

}


// =========================================================
// SETTINGS VALIDATION BEFORE FIXTURES
// =========================================================

function validateFixtureSettings() {

  const teamCheck =
    validateTeamCount();


  if (!teamCheck.valid) {

    return teamCheck;

  }


  const matchCheck =
    validateMatchesPerTeam();


  if (!matchCheck.valid) {

    return matchCheck;

  }


  const startDate =
    seasonStartDateInput?.value ||
    championsData.seasonStartDate;


  const endDate =
    seasonEndDateInput?.value ||
    championsData.seasonEndDate;


  if (!startDate) {

    return {
      valid: false,
      message:
        "❌ Select a season start date."
    };

  }


  if (!endDate) {

    return {
      valid: false,
      message:
        "❌ Select a season end date."
    };

  }


  if (endDate < startDate) {

    return {
      valid: false,
      message:
        "❌ Season end date cannot be before the start date."
    };

  }


  return {

    valid: true,

    startDate,

    endDate,

    matchesPerTeam:
      matchCheck.value

  };

}


// =========================================================
// GET AVAILABLE CALENDAR DAYS
// =========================================================

function getAvailableCalendarDays(
  startDate,
  endDate
) {

  const start =
    new Date(
      `${startDate}T00:00:00`
    );

  const end =
    new Date(
      `${endDate}T00:00:00`
    );


  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {

    return 0;

  }


  const difference =
    end.getTime() -
    start.getTime();


  return (
    Math.floor(
      difference /
      (
        1000 *
        60 *
        60 *
        24
      )
    ) + 1
  );

}


// =========================================================
// LOCAL DATE STRING
// =========================================================

function getLocalDateString(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;

}


// =========================================================
// REQUIRED MATCH DAYS
// =========================================================
//
// Champions League league phase:
// - NO 1/2 leg setting
// - Matches per team controls the number
// - Even number of teams: K Match Days
// - Odd number of teams: K + 1 Match Days
//
// This keeps the calendar/Match Day system
// consistent with the League system.
//

function getRequiredMatchDays(
  teamCount,
  matchesPerTeam
) {

  if (teamCount % 2 === 0) {

    return matchesPerTeam;

  }


  return matchesPerTeam + 1;

}


// =========================================================
// VALIDATE CALENDAR LENGTH
// =========================================================

function validateCalendarLength(
  startDate,
  endDate,
  teamCount,
  matchesPerTeam
) {

  const availableDays =
    getAvailableCalendarDays(
      startDate,
      endDate
    );


  const requiredDays =
    getRequiredMatchDays(
      teamCount,
      matchesPerTeam
    );


  if (
    availableDays <
    requiredDays
  ) {

    return {

      valid: false,

      message:
        `❌ The selected calendar is too short.\n\n${teamCount} teams with ${matchesPerTeam} match${matchesPerTeam === 1 ? "" : "es"} per team require ${requiredDays} Match Days.\n\nYou selected only ${availableDays} calendar day${availableDays === 1 ? "" : "s"}.`

    };

  }


  return {

    valid: true,

    availableDays,

    requiredDays

  };

}


// =========================================================
// SAVE CURRENT FORM SETTINGS
// =========================================================

async function saveCurrentSettings() {

  const validation =
    validateFixtureSettings();


  if (!validation.valid) {

    showMessage(
      settingsMessage,
      validation.message,
      "error"
    );

    return false;

  }


  championsData.seasonStartDate =
    validation.startDate;


  championsData.seasonEndDate =
    validation.endDate;


  championsData.matchesPerTeam =
    validation.matchesPerTeam;


  if (knockoutLegsInput) {

    championsData.knockoutLegs =
      Number(
        knockoutLegsInput.value
      ) === 2
        ? 2
        : 1;

  }


  await saveChampionsData();


  return true;

}


// =========================================================
// REFRESH ALL ADMIN SECTIONS
// =========================================================

function refreshAllAdminSections() {

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

// =========================================================
// PART 4 — CHAMPIONS LEAGUE PHASE FIXTURE GENERATOR
// =========================================================


// =========================================================
// SHUFFLE
// =========================================================

function shuffleArray(array) {

  const result =
    [...array];


  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );


    [
      result[i],
      result[j]
    ] =
    [
      result[j],
      result[i]
    ];

  }


  return result;

}


// =========================================================
// CREATE CIRCULAR OPPONENT GRAPH
// =========================================================
//
// Creates exactly K opponents for every team.
//
// Even number of teams:
// normal circular distances.
//
// Odd number of teams:
// K must be even because N × K
// must be even.
//

function createOpponentGraph(
  teams,
  matchesPerTeam
) {

  const count =
    teams.length;


  const edges = [];

  const edgeKeys =
    new Set();


  function addEdge(
    first,
    second
  ) {

    if (
      first === second
    ) {

      return;

    }


    const a =
      Math.min(
        first,
        second
      );

    const b =
      Math.max(
        first,
        second
      );


    const key =
      `${a}|${b}`;


    if (
      edgeKeys.has(key)
    ) {

      return;

    }


    edgeKeys.add(key);

    edges.push({
      a,
      b
    });

  }


  const half =
    Math.floor(
      matchesPerTeam / 2
    );


  // -------------------------------------------------------
  // MAIN CIRCULAR DISTANCES
  // -------------------------------------------------------

  for (
    let distance = 1;
    distance <= half;
    distance++
  ) {

    for (
      let i = 0;
      i < count;
      i++
    ) {

      const opponent =
        (
          i + distance
        ) % count;


      addEdge(
        i,
        opponent
      );

    }

  }


  // -------------------------------------------------------
  // OPPOSITE MATCH
  // -------------------------------------------------------
  //
  // Only possible when the number of teams is even
  // and K is odd.
  //

  if (
    count % 2 === 0 &&
    matchesPerTeam % 2 === 1
  ) {

    const distance =
      count / 2;


    for (
      let i = 0;
      i < count;
      i++
    ) {

      const opponent =
        (
          i + distance
        ) % count;


      addEdge(
        i,
        opponent
      );

    }

  }


  return edges;

}


// =========================================================
// VERIFY OPPONENT GRAPH
// =========================================================

function verifyOpponentGraph(
  teams,
  edges,
  matchesPerTeam
) {

  const counts =
    new Array(
      teams.length
    ).fill(0);


  const opponents =
    Array.from(
      {
        length:
          teams.length
      },
      () => new Set()
    );


  for (
    const edge of edges
  ) {

    if (
      edge.a === edge.b
    ) {

      return false;

    }


    if (
      opponents[edge.a]
        .has(edge.b)
    ) {

      return false;

    }


    opponents[edge.a]
      .add(edge.b);

    opponents[edge.b]
      .add(edge.a);


    counts[edge.a]++;

    counts[edge.b]++;

  }


  return counts.every(
    count =>
      count ===
      matchesPerTeam
  );

}


// =========================================================
// EDGE COLORING / MATCH DAY SCHEDULING
// =========================================================
//
// Each color represents one Match Day.
//
// The algorithm searches for a valid arrangement where
// a team appears only once on a Match Day.
//

function createMatchDaySchedule(
  teams,
  edges,
  matchDays
) {

  const edgeCount =
    edges.length;


  const edgeColors =
    new Array(
      edgeCount
    ).fill(-1);


  const teamColors =
    Array.from(
      {
        length:
          teams.length
      },
      () => new Set()
    );


  const edgeIndexes =
    edges.map(
      (_, index) =>
        index
    );


  function getAvailableColors(
    edgeIndex
  ) {

    const edge =
      edges[edgeIndex];


    const used =
      new Set([
        ...teamColors[edge.a],
        ...teamColors[edge.b]
      ]);


    const available = [];


    for (
      let color = 0;
      color < matchDays;
      color++
    ) {

      if (
        !used.has(color)
      ) {

        available.push(color);

      }

    }


    return available;

  }


  function chooseNextEdge() {

    let best =
      -1;

    let bestOptions =
      null;


    for (
      const index
      of edgeIndexes
    ) {

      if (
        edgeColors[index] !== -1
      ) {

        continue;

      }


      const options =
        getAvailableColors(
          index
        );


      if (
        options.length === 0
      ) {

        return {
          index,
          options
        };

      }


      if (
        best === -1 ||
        options.length <
        bestOptions.length
      ) {

        best =
          index;

        bestOptions =
          options;

      }

    }


    if (
      best === -1
    ) {

      return null;

    }


    return {
      index: best,
      options: bestOptions
    };

  }


  function search(
    placed
  ) {

    if (
      placed === edgeCount
    ) {

      return true;

    }


    const next =
      chooseNextEdge();


    if (!next) {

      return true;

    }


    for (
      const color
      of next.options
    ) {

      const edge =
        edges[next.index];


      edgeColors[
        next.index
      ] = color;


      teamColors[edge.a]
        .add(color);

      teamColors[edge.b]
        .add(color);


      if (
        search(
          placed + 1
        )
      ) {

        return true;

      }


      teamColors[edge.a]
        .delete(color);

      teamColors[edge.b]
        .delete(color);


      edgeColors[
        next.index
      ] = -1;

    }


    return false;

  }


  const success =
    search(0);


  if (!success) {

    return null;

  }


  const schedule =
    Array.from(
      {
        length:
          matchDays
      },
      () => []
    );


  edges.forEach(
    (edge, index) => {

      const day =
        edgeColors[index];


      schedule[day]
        .push(edge);

    }
  );


  return schedule;

}


// =========================================================
// CREATE FIXTURE DATE
// =========================================================

function getMatchDayDate(
  startDate,
  dayNumber
) {

  const date =
    new Date(
      `${startDate}T00:00:00`
    );


  date.setDate(
    date.getDate() +
    (
      dayNumber - 1
    )
  );


  return getLocalDateString(
    date
  );

}


// =========================================================
// CREATE LEAGUE FIXTURE OBJECT
// =========================================================

function createLeagueFixture(
  homeTeam,
  awayTeam,
  day,
  date
) {

  return {

    id:
      `champions-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`,

    phase:
      "league",

    day,

    date,

    home:
      homeTeam.id,

    away:
      awayTeam.id,

    homeName:
      homeTeam.name,

    awayName:
      awayTeam.name,

    homeScore:
      null,

    awayScore:
      null,

    status:
      "scheduled",

    completed:
      false

  };

}


// =========================================================
// GENERATE CHAMPIONS LEAGUE FIXTURES
// =========================================================

function generateLeagueFixtures() {

  const validation =
    validateFixtureSettings();


  if (!validation.valid) {

    showMessage(
      settingsMessage,
      validation.message,
      "error"
    );

    return [];

  }


  const teams =
    shuffleArray(
      championsData.teams
    );


  const teamCount =
    teams.length;


  const matchesPerTeam =
    validation.matchesPerTeam;


  const calendar =
    validateCalendarLength(
      validation.startDate,
      validation.endDate,
      teamCount,
      matchesPerTeam
    );


  if (!calendar.valid) {

    showMessage(
      settingsMessage,
      calendar.message,
      "error"
    );

    return [];

  }


  const requiredMatchDays =
    calendar.requiredDays;


  // -------------------------------------------------------
  // CREATE OPPONENTS
  // -------------------------------------------------------

  const edges =
    createOpponentGraph(
      teams,
      matchesPerTeam
    );


  // -------------------------------------------------------
  // VERIFY EXACT MATCH COUNT
  // -------------------------------------------------------

  if (
    !verifyOpponentGraph(
      teams,
      edges,
      matchesPerTeam
    )
  ) {

    showMessage(
      settingsMessage,
      "❌ Could not create an exact opponent schedule.",
      "error"
    );

    return [];

  }


  // -------------------------------------------------------
  // CREATE MATCH DAYS
  // -------------------------------------------------------

  const schedule =
    createMatchDaySchedule(
      teams,
      edges,
      requiredMatchDays
    );


  if (!schedule) {

    showMessage(
      settingsMessage,
      "❌ Could not arrange the fixtures into valid Match Days. Try another match-per-team setting.",
      "error"
    );

    return [];

  }


  // -------------------------------------------------------
  // CREATE FIXTURES
  // -------------------------------------------------------

  const generated =
    [];


  schedule.forEach(
    (
      dayEdges,
      dayIndex
    ) => {

      const day =
        dayIndex + 1;


      const date =
        getMatchDayDate(
          validation.startDate,
          day
        );


      dayEdges.forEach(
        edge => {

          const first =
            teams[edge.a];

          const second =
            teams[edge.b];


          // Randomize home/away.
          const homeFirst =
            Math.random() < 0.5;


          const homeTeam =
            homeFirst
              ? first
              : second;


          const awayTeam =
            homeFirst
              ? second
              : first;


          generated.push(
            createLeagueFixture(
              homeTeam,
              awayTeam,
              day,
              date
            )
          );

        }
      );

    }
  );


  // -------------------------------------------------------
  // FINAL VERIFICATION
  // -------------------------------------------------------

  const counts =
    new Map();


  teams.forEach(
    team => {

      counts.set(
        team.id,
        0
      );

    }
  );


  generated.forEach(
    fixture => {

      counts.set(
        fixture.home,
        (
          counts.get(
            fixture.home
          ) || 0
        ) + 1
      );


      counts.set(
        fixture.away,
        (
          counts.get(
            fixture.away
          ) || 0
        ) + 1
      );

    }
  );


  const validCounts =
    [...counts.values()]
      .every(
        count =>
          count ===
          matchesPerTeam
      );


  if (!validCounts) {

    showMessage(
      settingsMessage,
      "❌ Fixture verification failed. No fixtures were saved.",
      "error"
    );

    return [];

  }


  championsData.fixtures =
    generated;


  championsData.seasonStartDate =
    validation.startDate;


  championsData.seasonEndDate =
    validation.endDate;


  championsData.matchesPerTeam =
    matchesPerTeam;


  championsData.started =
    false;


  championsData.knockoutRound =
    null;


  championsData.winner =
    null;


  saveChampionsData()
    .then(
      () => {

        refreshAllAdminSections();

        showMessage(
          settingsMessage,
          `✅ ${generated.length} league-phase fixtures generated across ${requiredMatchDays} Match Days.`,
          "success"
        );

      }
    )
    .catch(
      error => {

        console.error(
          "Fixture save error:",
          error
        );

        showMessage(
          settingsMessage,
          "❌ Fixtures were generated but could not be saved.",
          "error"
        );

      }
    );


  return generated;

}


// =========================================================
// GENERATE BUTTON
// =========================================================

generateFixturesButton?.addEventListener(
  "click",
  generateLeagueFixtures
);

// =========================================================
// PART 5 — LEAGUE PHASE FIXTURES & RESULTS
// =========================================================


// =========================================================
// FIND TEAM
// =========================================================

function findTeamById(teamId) {

  return championsData.teams.find(
    team =>
      String(team.id) ===
      String(teamId)
  );

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatFixtureDate(dateString) {

  if (!dateString) {
    return "";
  }


  const date =
    new Date(
      `${dateString}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return dateString;

  }


  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );

}


// =========================================================
// RENDER LEAGUE FIXTURES
// =========================================================

function renderFixtures() {

  if (!adminFixtureList) {
    return;
  }


  const fixtures =
    championsData.fixtures
      .filter(
        fixture =>
          fixture.phase ===
          "league"
      )
      .sort(
        (a, b) =>
          Number(a.day || 0) -
          Number(b.day || 0)
      );


  if (!fixtures.length) {

    adminFixtureList.innerHTML =
      "<p>No league-phase fixtures generated yet.</p>";

    return;

  }


  adminFixtureList.innerHTML = "";


  let currentDay =
    null;


  fixtures.forEach(
    fixture => {

      const day =
        Number(
          fixture.day || 1
        );


      if (
        day !== currentDay
      ) {

        currentDay =
          day;


        const heading =
          document.createElement(
            "div"
          );


        heading.className =
          "match-day-heading";


        heading.textContent =
          `Match Day ${day}` +
          (
            fixture.date
              ? ` — ${formatFixtureDate(fixture.date)}`
              : ""
          );


        adminFixtureList.appendChild(
          heading
        );

      }


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "match-card";


      const home =
        document.createElement(
          "strong"
        );


      home.textContent =
        fixture.homeName ||
        findTeamById(
          fixture.home
        )?.name ||
        "Unknown Team";


      const versus =
        document.createElement(
          "span"
        );


      versus.textContent =
        " vs ";


      const away =
        document.createElement(
          "strong"
        );


      away.textContent =
        fixture.awayName ||
        findTeamById(
          fixture.away
        )?.name ||
        "Unknown Team";


      const status =
        document.createElement(
          "span"
        );


      status.className =
        "fixture-status";


      status.textContent =
        fixture.completed
          ? ` ${fixture.homeScore} - ${fixture.awayScore}`
          : " Scheduled";


      card.appendChild(home);

      card.appendChild(versus);

      card.appendChild(away);

      card.appendChild(status);


      adminFixtureList.appendChild(
        card
      );

    }
  );

}


// =========================================================
// RENDER LEAGUE RESULTS
// =========================================================

function renderLeagueResults() {

  if (!leagueResultsList) {
    return;
  }


  const fixtures =
    championsData.fixtures
      .filter(
        fixture =>
          fixture.phase ===
          "league"
      )
      .sort(
        (a, b) =>
          Number(a.day || 0) -
          Number(b.day || 0)
      );


  if (!fixtures.length) {

    leagueResultsList.innerHTML =
      "<p>No league-phase fixtures available.</p>";

    return;

  }


  leagueResultsList.innerHTML = "";


  fixtures.forEach(
    fixture => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "result-card";


      const title =
        document.createElement(
          "div"
        );


      title.className =
        "result-match-title";


      title.textContent =
        `Match Day ${fixture.day || 1}`;


      const match =
        document.createElement(
          "div"
        );


      match.className =
        "result-match";


      const homeLabel =
        document.createElement(
          "span"
        );


      homeLabel.textContent =
        fixture.homeName;


      const homeInput =
        document.createElement(
          "input"
        );


      homeInput.type =
        "number";

      homeInput.min =
        "0";

      homeInput.step =
        "1";

      homeInput.inputMode =
        "numeric";

      homeInput.value =
        fixture.homeScore === null ||
        fixture.homeScore === undefined
          ? ""
          : fixture.homeScore;


      homeInput.setAttribute(
        "aria-label",
        `${fixture.homeName} score`
      );


      const dash =
        document.createElement(
          "span"
        );


      dash.textContent =
        " - ";


      const awayInput =
        document.createElement(
          "input"
        );


      awayInput.type =
        "number";

      awayInput.min =
        "0";

      awayInput.step =
        "1";

      awayInput.inputMode =
        "numeric";

      awayInput.value =
        fixture.awayScore === null ||
        fixture.awayScore === undefined
          ? ""
          : fixture.awayScore;


      awayInput.setAttribute(
        "aria-label",
        `${fixture.awayName} score`
      );


      const awayLabel =
        document.createElement(
          "span"
        );


      awayLabel.textContent =
        fixture.awayName;


      const saveButton =
        document.createElement(
          "button"
        );


      saveButton.type =
        "button";

      saveButton.textContent =
        fixture.completed
          ? "Update Result"
          : "Save Result";


      saveButton.addEventListener(
        "click",
        async () => {

          const homeScore =
            Number(
              homeInput.value
            );


          const awayScore =
            Number(
              awayInput.value
            );


          if (
            homeInput.value === "" ||
            awayInput.value === ""
          ) {

            alert(
              "❌ Enter both scores."
            );

            return;

          }


          if (
            !Number.isInteger(
              homeScore
            ) ||
            !Number.isInteger(
              awayScore
            ) ||
            homeScore < 0 ||
            awayScore < 0
          ) {

            alert(
              "❌ Scores must be whole numbers 0 or higher."
            );

            return;

          }


          fixture.homeScore =
            homeScore;


          fixture.awayScore =
            awayScore;


          fixture.completed =
            true;


          fixture.status =
            "completed";


          try {

            await saveChampionsData();

            refreshAllAdminSections();

          }
          catch (error) {

            console.error(
              "League result save error:",
              error
            );

            alert(
              "❌ Could not save the result."
            );

          }

        }
      );


      match.appendChild(
        homeLabel
      );

      match.appendChild(
        homeInput
      );

      match.appendChild(
        dash
      );

      match.appendChild(
        awayInput
      );

      match.appendChild(
        awayLabel
      );


      card.appendChild(
        title
      );

      card.appendChild(
        match
      );

      card.appendChild(
        saveButton
      );


      leagueResultsList.appendChild(
        card
      );

    }
  );

}


// =========================================================
// CHECK LEAGUE PHASE COMPLETION
// =========================================================

function isLeaguePhaseComplete() {

  const fixtures =
    championsData.fixtures
      .filter(
        fixture =>
          fixture.phase ===
          "league"
      );


  if (!fixtures.length) {
    return false;
  }


  return fixtures.every(
    fixture =>
      fixture.completed === true &&
      Number.isInteger(
        Number(
          fixture.homeScore
        )
      ) &&
      Number.isInteger(
        Number(
          fixture.awayScore
        )
      )
  );

}


// =========================================================
// COUNT COMPLETED LEAGUE MATCHES
// =========================================================

function getCompletedLeagueMatches() {

  return championsData.fixtures
    .filter(
      fixture =>
        fixture.phase ===
        "league" &&
        fixture.completed === true
    )
    .length;

}


// =========================================================
// TOTAL LEAGUE MATCHES
// =========================================================

function getTotalLeagueMatches() {

  return championsData.fixtures
    .filter(
      fixture =>
        fixture.phase ===
        "league"
    )
    .length;

}

// =========================================================
// PART 6 — LEAGUE TABLE & QUALIFICATION
// =========================================================


// =========================================================
// CALCULATE LEAGUE TABLE
// =========================================================

function calculateLeagueTable() {

  const table =
    new Map();


  championsData.teams.forEach(
    team => {

      table.set(
        team.id,
        {

          id:
            team.id,

          name:
            team.name,

          played:
            0,

          wins:
            0,

          draws:
            0,

          losses:
            0,

          goalsFor:
            0,

          goalsAgainst:
            0,

          goalDifference:
            0,

          points:
            0

        }
      );

    }
  );


  const fixtures =
    championsData.fixtures.filter(
      fixture =>
        fixture.phase === "league" &&
        fixture.completed === true
    );


  fixtures.forEach(
    fixture => {

      const home =
        table.get(
          fixture.home
        );


      const away =
        table.get(
          fixture.away
        );


      if (!home || !away) {
        return;
      }


      const homeScore =
        Number(
          fixture.homeScore
        );


      const awayScore =
        Number(
          fixture.awayScore
        );


      if (
        !Number.isInteger(
          homeScore
        ) ||
        !Number.isInteger(
          awayScore
        )
      ) {

        return;

      }


      home.played++;

      away.played++;


      home.goalsFor +=
        homeScore;

      home.goalsAgainst +=
        awayScore;


      away.goalsFor +=
        awayScore;

      away.goalsAgainst +=
        homeScore;


      if (
        homeScore >
        awayScore
      ) {

        home.wins++;

        away.losses++;

        home.points += 3;

      }
      else if (
        homeScore <
        awayScore
      ) {

        away.wins++;

        home.losses++;

        away.points += 3;

      }
      else {

        home.draws++;

        away.draws++;

        home.points++;

        away.points++;

      }

    }
  );


  table.forEach(
    team => {

      team.goalDifference =
        team.goalsFor -
        team.goalsAgainst;

    }
  );


  const sorted =
    [...table.values()]
      .sort(
        (a, b) => {

          if (
            b.points !==
            a.points
          ) {

            return (
              b.points -
              a.points
            );

          }


          if (
            b.goalDifference !==
            a.goalDifference
          ) {

            return (
              b.goalDifference -
              a.goalDifference
            );

          }


          if (
            b.goalsFor !==
            a.goalsFor
          ) {

            return (
              b.goalsFor -
              a.goalsFor
            );

          }


          return a.name.localeCompare(
            b.name
          );

        }
      );


  return sorted;

}


// =========================================================
// RENDER LEAGUE TABLE
// =========================================================

function renderLeagueTable() {

  if (!leagueTable) {
    return;
  }


  const rows =
    calculateLeagueTable();


  if (!rows.length) {

    leagueTable.innerHTML =
      "<p>No approved teams available.</p>";

    return;

  }


  const qualificationCount =
    getQualificationCount();


  const tableElement =
    document.createElement(
      "table"
    );


  tableElement.className =
    "league-table";


  const thead =
    document.createElement(
      "thead"
    );


  const headerRow =
    document.createElement(
      "tr"
    );


  const headers = [

    "Pos",

    "Team",

    "P",

    "W",

    "D",

    "L",

    "GF",

    "GA",

    "GD",

    "Pts"

  ];


  headers.forEach(
    header => {

      const th =
        document.createElement(
          "th"
        );


      th.textContent =
        header;


      headerRow.appendChild(
        th
      );

    }
  );


  thead.appendChild(
    headerRow
  );


  const tbody =
    document.createElement(
      "tbody"
    );


  rows.forEach(
    (team, index) => {

      const position =
        index + 1;


      const row =
        document.createElement(
          "tr"
        );


      if (
        qualificationCount &&
        position <=
        qualificationCount
      ) {

        row.classList.add(
          "qualifying-team"
        );

      }


      const values = [

        position,

        team.name,

        team.played,

        team.wins,

        team.draws,

        team.losses,

        team.goalsFor,

        team.goalsAgainst,

        team.goalDifference,

        team.points

      ];


      values.forEach(
        value => {

          const td =
            document.createElement(
              "td"
            );


          td.textContent =
            value;


          row.appendChild(
            td
          );

        }
      );


      tbody.appendChild(
        row
      );


      // ---------------------------------------------------
      // QUALIFICATION LINE
      // ---------------------------------------------------

      if (
        qualificationCount &&
        position ===
        qualificationCount
      ) {

        const lineRow =
          document.createElement(
            "tr"
          );


        lineRow.className =
          "qualification-line";


        const lineCell =
          document.createElement(
            "td"
          );


        lineCell.colSpan =
          headers.length;


        lineCell.textContent =
          `🏆 QUALIFICATION LINE — Top ${qualificationCount} qualify for the knockout phase`;


        lineRow.appendChild(
          lineCell
        );


        tbody.appendChild(
          lineRow
        );

      }

    }
  );


  tableElement.appendChild(
    thead
  );

  tableElement.appendChild(
    tbody
  );


  leagueTable.innerHTML = "";


  leagueTable.appendChild(
    tableElement
  );


  // -------------------------------------------------------
  // TABLE INFORMATION
  // -------------------------------------------------------

  const info =
    document.createElement(
      "p"
    );


  info.className =
    "qualification-info";


  if (qualificationCount) {

    info.textContent =
      `Top ${qualificationCount} teams qualify for the knockout phase.`;

  }
  else {

    info.textContent =
      "Qualification is unavailable until the team count is valid.";

  }


  leagueTable.appendChild(
    info
  );

}


// =========================================================
// GET QUALIFIED TEAMS
// =========================================================

function getQualifiedTeams() {

  const table =
    calculateLeagueTable();


  const qualificationCount =
    getQualificationCount();


  if (
    !qualificationCount
  ) {

    return [];

  }


  return table.slice(
    0,
    qualificationCount
  );

}


// =========================================================
// CHECK QUALIFICATION STATUS
// =========================================================

function getQualificationStatus() {

  const qualificationCount =
    getQualificationCount();


  if (!qualificationCount) {

    return {
      valid: false,
      message:
        "Qualification count is unavailable."
    };

  }


  const table =
    calculateLeagueTable();


  const qualified =
    table.slice(
      0,
      qualificationCount
    );


  return {

    valid: true,

    count:
      qualificationCount,

    teams:
      qualified

  };

}

// =========================================================
// PART 7 — START COMPETITION & STATUS
// =========================================================


// =========================================================
// START CHAMPIONS LEAGUE
// =========================================================

async function startChampionsLeague() {

  const validation =
    validateFixtureSettings();


  if (!validation.valid) {

    showMessage(
      settingsMessage,
      validation.message,
      "error"
    );

    return;

  }


  if (
    championsData.fixtures.filter(
      fixture =>
        fixture.phase === "league"
    ).length === 0
  ) {

    showMessage(
      settingsMessage,
      "❌ Generate the league-phase fixtures first.",
      "error"
    );

    return;

  }


  const calendar =
    validateCalendarLength(
      validation.startDate,
      validation.endDate,
      championsData.teams.length,
      validation.matchesPerTeam
    );


  if (!calendar.valid) {

    showMessage(
      settingsMessage,
      calendar.message,
      "error"
    );

    return;

  }


  championsData.seasonStartDate =
    validation.startDate;

  championsData.seasonEndDate =
    validation.endDate;

  championsData.matchesPerTeam =
    validation.matchesPerTeam;

  championsData.started =
    true;

  championsData.knockoutRound =
    null;

  championsData.winner =
    null;


  try {

    await saveChampionsData();


    refreshAllAdminSections();


    showMessage(
      settingsMessage,
      "✅ Champions League has started.",
      "success"
    );

  }
  catch (error) {

    console.error(
      "Start competition error:",
      error
    );


    championsData.started =
      false;


    showMessage(
      settingsMessage,
      "❌ Could not start the Champions League.",
      "error"
    );

  }

}


// =========================================================
// UPDATE COMPETITION STATUS
// =========================================================

function updateCompetitionStatus() {

  if (!competitionStatus) {
    return;
  }


  const fixtures =
    championsData.fixtures.filter(
      fixture =>
        fixture.phase === "league"
    );


  const total =
    fixtures.length;


  const completed =
    fixtures.filter(
      fixture =>
        fixture.completed === true
    ).length;


  const leagueComplete =
    total > 0 &&
    completed === total;


  let status =
    "Not Started";


  let description =
    "The Champions League has not started yet.";


  if (
    championsData.started &&
    !leagueComplete
  ) {

    status =
      "League Phase Active";


    description =
      `${completed} of ${total} league-phase matches completed.`;

  }


  if (
    championsData.started &&
    leagueComplete &&
    !championsData.knockoutRound &&
    !championsData.winner
  ) {

    status =
      "League Phase Complete";


    description =
      "The league phase is complete. The qualified teams can enter the knockout phase.";

  }


  if (
    championsData.knockoutRound &&
    !championsData.winner
  ) {

    status =
      "Knockout Phase Active";


    description =
      `Current round: ${getKnockoutRoundName(
        championsData.knockoutRound
      )}`;

  }


  if (championsData.winner) {

    status =
      "Competition Complete";


    description =
      `🏆 Champion: ${championsData.winner}`;

  }


  competitionStatus.innerHTML = "";


  const statusTitle =
    document.createElement(
      "strong"
    );


  statusTitle.textContent =
    status;


  const statusText =
    document.createElement(
      "p"
    );


  statusText.textContent =
    description;


  competitionStatus.appendChild(
    statusTitle
  );

  competitionStatus.appendChild(
    statusText
  );

}


// =========================================================
// CHECK WHETHER COMPETITION CAN START
// =========================================================

function canStartCompetition() {

  const teamCheck =
    validateTeamCount();


  if (!teamCheck.valid) {

    return teamCheck;

  }


  const matchCheck =
    validateMatchesPerTeam();


  if (!matchCheck.valid) {

    return matchCheck;

  }


  const fixtureCount =
    championsData.fixtures.filter(
      fixture =>
        fixture.phase === "league"
    ).length;


  if (!fixtureCount) {

    return {

      valid: false,

      message:
        "❌ Generate league-phase fixtures before starting."

    };

  }


  return {
    valid: true,
    message: ""
  };

}


// =========================================================
// START BUTTON
// =========================================================

startCompetitionButton?.addEventListener(
  "click",
  async () => {

    const check =
      canStartCompetition();


    if (!check.valid) {

      showMessage(
        settingsMessage,
        check.message,
        "error"
      );

      return;

    }


    if (
      championsData.started
    ) {

      showMessage(
        settingsMessage,
        "⚠️ The Champions League is already active.",
        "error"
      );

      return;

    }


    const confirmed =
      window.confirm(
        "Start the Champions League now?"
      );


    if (!confirmed) {
      return;
    }


    await startChampionsLeague();

  }
);


// =========================================================
// SAVE SETTINGS BUTTON UPDATE
// =========================================================
//
// Replaces the earlier listener with the complete
// settings-save workflow.
//

saveSettingsButton?.addEventListener(
  "click",
  async () => {

    const saved =
      await saveCurrentSettings();


    if (!saved) {
      return;
    }


    loadSettingsIntoForm();


    showMessage(
      settingsMessage,
      "✅ Settings saved successfully.",
      "success"
    );

  }
);

// =========================================================
// PART 8 — KNOCKOUT QUALIFICATION & RANDOM DRAW
// =========================================================


// =========================================================
// SHUFFLE QUALIFIED TEAMS
// =========================================================

function shuffleQualifiedTeams(teams) {

  return shuffleArray(
    teams.map(
      team => ({
        ...team
      })
    )
  );

}


// =========================================================
// GET KNOCKOUT ROUND NAME
// =========================================================

function getKnockoutRoundName(
  knockoutData
) {

  if (!knockoutData) {

    return "Not Started";

  }


  return (
    knockoutData.round ||
    "Knockout Phase"
  );

}


// =========================================================
// GET INITIAL ROUND NAME
// =========================================================

function getInitialKnockoutRoundName(
  teamCount
) {

  if (teamCount === 8) {

    return "Quarter-finals";

  }


  if (teamCount === 16) {

    return "Round of 16";

  }


  if (teamCount === 32) {

    return "Round of 32";

  }


  return "Knockout Phase";

}


// =========================================================
// GET NEXT ROUND NAME
// =========================================================

function getNextKnockoutRoundName(
  currentTeamCount
) {

  if (currentTeamCount === 32) {

    return "Round of 16";

  }


  if (currentTeamCount === 16) {

    return "Quarter-finals";

  }


  if (currentTeamCount === 8) {

    return "Semi-finals";

  }


  if (currentTeamCount === 4) {

    return "Final";

  }


  return "Knockout Phase";

}


// =========================================================
// CREATE KNOCKOUT MATCH
// =========================================================

function createKnockoutMatch(
  homeTeam,
  awayTeam,
  round,
  tieIndex,
  leg
) {

  return {

    id:
      `ko-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`,

    phase:
      "knockout",

    round,

    tieIndex,

    leg,

    home:
      homeTeam.id,

    away:
      awayTeam.id,

    homeName:
      homeTeam.name,

    awayName:
      awayTeam.name,

    homeScore:
      null,

    awayScore:
      null,

    completed:
      false,

    status:
      "scheduled"

  };

}


// =========================================================
// CREATE KNOCKOUT TIE
// =========================================================

function createKnockoutTie(
  homeTeam,
  awayTeam,
  round,
  tieIndex,
  legs
) {

  const leg1 =
    createKnockoutMatch(
      homeTeam,
      awayTeam,
      round,
      tieIndex,
      1
    );


  let leg2 =
    null;


  if (legs === 2) {

    leg2 =
      createKnockoutMatch(
        awayTeam,
        homeTeam,
        round,
        tieIndex,
        2
      );

  }


  return {

    id:
      `tie-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`,

    round,

    tieIndex,

    legs,

    homeTeamId:
      homeTeam.id,

    awayTeamId:
      awayTeam.id,

    homeName:
      homeTeam.name,

    awayName:
      awayTeam.name,

    leg1,

    leg2,

    winner:
      null

  };

}


// =========================================================
// GENERATE KNOCKOUT DRAW
// =========================================================

async function generateKnockout() {

  if (
    !championsData.started
  ) {

    showMessage(
      knockoutMessage,
      "❌ Start the Champions League first.",
      "error"
    );

    return;

  }


  if (
    !isLeaguePhaseComplete()
  ) {

    showMessage(
      knockoutMessage,
      "❌ All league-phase matches must be completed first.",
      "error"
    );

    return;

  }


  if (
    championsData.knockoutRound
  ) {

    showMessage(
      knockoutMessage,
      "⚠️ A knockout phase already exists.",
      "error"
    );

    return;

  }


  const qualification =
    getQualificationStatus();


  if (!qualification.valid) {

    showMessage(
      knockoutMessage,
      "❌ Qualification cannot be determined.",
      "error"
    );

    return;

  }


  const qualifiedTeams =
    shuffleQualifiedTeams(
      qualification.teams
    );


  const teamCount =
    qualifiedTeams.length;


  const legs =
    Number(
      knockoutLegsInput?.value
    ) === 2
      ? 2
      : 1;


  championsData.knockoutLegs =
    legs;


  const round =
    getInitialKnockoutRoundName(
      teamCount
    );


  const ties =
    [];


  for (
    let i = 0;
    i < teamCount;
    i += 2
  ) {

    const homeTeam =
      qualifiedTeams[i];

    const awayTeam =
      qualifiedTeams[i + 1];


    ties.push(
      createKnockoutTie(
        homeTeam,
        awayTeam,
        round,
        (
          i / 2
        ) + 1,
        legs
      )
    );

  }


  championsData.knockoutRound = {

    round,

    legs,

    teamCount,

    ties

  };


  try {

    await saveChampionsData();


    refreshAllAdminSections();


    showMessage(
      knockoutMessage,
      `✅ Random ${round} draw generated with ${legs} leg${legs === 1 ? "" : "s"} per tie.`,
      "success"
    );

  }
  catch (error) {

    console.error(
      "Knockout draw error:",
      error
    );


    championsData.knockoutRound =
      null;


    showMessage(
      knockoutMessage,
      "❌ Could not save the knockout draw.",
      "error"
    );

  }

}


// =========================================================
// GENERATE KNOCKOUT BUTTON
// =========================================================

generateKnockoutButton?.addEventListener(
  "click",
  async () => {

    const legs =
      Number(
        knockoutLegsInput?.value
      ) === 2
        ? 2
        : 1;


    const confirmed =
      window.confirm(
        `Generate the knockout draw using ${legs} leg${legs === 1 ? "" : "s"} per tie?`
      );


    if (!confirmed) {
      return;
    }


    await generateKnockout();

  }
);


// =========================================================
// RENDER KNOCKOUT OVERVIEW
// =========================================================

function renderKnockout() {

  if (!knockoutMessage) {
    return;
  }


  if (
    !championsData.knockoutRound
  ) {

    knockoutMessage.textContent =
      "No knockout draw has been generated yet.";


    if (knockoutTree) {

      knockoutTree.innerHTML =
        "";

    }


    return;

  }


  const knockout =
    championsData.knockoutRound;


  knockoutMessage.textContent =
    `${knockout.round} — ${knockout.legs} leg${knockout.legs === 1 ? "" : "s"} per tie.`;

}

// =========================================================
// PART 9 — KNOCKOUT RESULTS & ADVANCEMENT
// =========================================================


// =========================================================
// GET KNOCKOUT TIES
// =========================================================

function getKnockoutTies() {

  if (
    !championsData.knockoutRound ||
    !Array.isArray(
      championsData.knockoutRound.ties
    )
  ) {

    return [];

  }


  return championsData.knockoutRound.ties;

}


// =========================================================
// GET MATCH SCORE
// =========================================================

function getMatchScore(
  match
) {

  if (!match) {

    return {
      home: 0,
      away: 0
    };

  }


  return {

    home:
      Number(match.homeScore) || 0,

    away:
      Number(match.awayScore) || 0

  };

}


// =========================================================
// CHECK WHETHER A MATCH IS COMPLETE
// =========================================================

function isKnockoutMatchComplete(
  match
) {

  if (!match) {
    return false;
  }


  return (
    match.completed === true &&
    Number.isInteger(
      Number(match.homeScore)
    ) &&
    Number.isInteger(
      Number(match.awayScore)
    )
  );

}


// =========================================================
// CHECK WHETHER A TIE IS COMPLETE
// =========================================================

function isKnockoutTieComplete(
  tie
) {

  if (!tie) {
    return false;
  }


  if (
    tie.legs === 1
  ) {

    return isKnockoutMatchComplete(
      tie.leg1
    );

  }


  return (
    isKnockoutMatchComplete(
      tie.leg1
    ) &&
    isKnockoutMatchComplete(
      tie.leg2
    )
  );

}


// =========================================================
// GET AGGREGATE SCORE
// =========================================================

function getAggregateScore(
  tie
) {

  const leg1 =
    getMatchScore(
      tie.leg1
    );


  const leg2 =
    tie.legs === 2
      ? getMatchScore(
          tie.leg2
        )
      : {
          home: 0,
          away: 0
        };


  return {

    firstTeam:
      leg1.home +
      leg2.away,

    secondTeam:
      leg1.away +
      leg2.home

  };

}


// =========================================================
// DETERMINE TIE WINNER
// =========================================================
//
// A one-leg draw or two-leg aggregate draw is NOT
// automatically decided. The admin must later choose
// the winner.
//

function determineTieWinner(
  tie
) {

  if (
    !isKnockoutTieComplete(
      tie
    )
  ) {

    return null;

  }


  const aggregate =
    getAggregateScore(
      tie
    );


  if (
    aggregate.firstTeam >
    aggregate.secondTeam
  ) {

    return tie.homeTeamId;

  }


  if (
    aggregate.secondTeam >
    aggregate.firstTeam
  ) {

    return tie.awayTeamId;

  }


  return null;

}


// =========================================================
// GET TEAM FROM TIE
// =========================================================

function getTieTeam(
  tie,
  teamId
) {

  if (
    String(teamId) ===
    String(tie.homeTeamId)
  ) {

    return {
      id:
        tie.homeTeamId,

      name:
        tie.homeName

    };

  }


  if (
    String(teamId) ===
    String(tie.awayTeamId)
  ) {

    return {
      id:
        tie.awayTeamId,

      name:
        tie.awayName

    };

  }


  return null;

}


// =========================================================
// SAVE KNOCKOUT RESULT
// =========================================================

async function saveKnockoutResult(
  tie,
  legNumber,
  homeScore,
  awayScore
) {

  const match =
    legNumber === 2
      ? tie.leg2
      : tie.leg1;


  if (!match) {

    return;

  }


  if (
    !Number.isInteger(
      homeScore
    ) ||
    !Number.isInteger(
      awayScore
    ) ||
    homeScore < 0 ||
    awayScore < 0
  ) {

    alert(
      "❌ Scores must be whole numbers 0 or higher."
    );

    return;

  }


  match.homeScore =
    homeScore;

  match.awayScore =
    awayScore;

  match.completed =
    true;

  match.status =
    "completed";


  // -------------------------------------------------------
  // DETERMINE WINNER IF POSSIBLE
  // -------------------------------------------------------

  if (
    isKnockoutTieComplete(
      tie
    )
  ) {

    const winner =
      determineTieWinner(
        tie
      );


    tie.winner =
      winner;

  }


  await saveChampionsData();

  refreshAllAdminSections();

}


// =========================================================
// CREATE NEXT KNOCKOUT ROUND
// =========================================================

async function createNextKnockoutRound() {

  const current =
    championsData.knockoutRound;


  if (!current) {
    return;
  }


  const ties =
    getKnockoutTies();


  if (!ties.length) {
    return;
  }


  // -------------------------------------------------------
  // EVERY TIE MUST BE COMPLETE
  // -------------------------------------------------------

  if (
    !ties.every(
      tie =>
        isKnockoutTieComplete(
          tie
        )
    )
  ) {

    return;

  }


  // -------------------------------------------------------
  // EVERY TIE MUST HAVE A WINNER
  // -------------------------------------------------------

  if (
    !ties.every(
      tie =>
        Boolean(
          tie.winner
        )
    )
  ) {

    return;

  }


  const winners =
    ties.map(
      tie =>
        getTieTeam(
          tie,
          tie.winner
        )
    );


  // -------------------------------------------------------
  // FINAL
  // -------------------------------------------------------

  if (
    winners.length === 2
  ) {

    const finalRound =
      "Final";


    const finalTie =
      createKnockoutTie(
        winners[0],
        winners[1],
        finalRound,
        1,
        current.legs
      );


    championsData.knockoutRound = {

      round:
        finalRound,

      legs:
        current.legs,

      teamCount:
        2,

      ties: [
        finalTie
      ]

    };


    await saveChampionsData();

    refreshAllAdminSections();

    return;

  }


  // -------------------------------------------------------
  // NEXT ROUND
  // -------------------------------------------------------

  const nextRound =
    getNextKnockoutRoundName(
      winners.length
    );


  const nextTies =
    [];


  for (
    let i = 0;
    i < winners.length;
    i += 2
  ) {

    nextTies.push(
      createKnockoutTie(
        winners[i],
        winners[i + 1],
        nextRound,
        (
          i / 2
        ) + 1,
        current.legs
      )
    );

  }


  championsData.knockoutRound = {

    round:
      nextRound,

    legs:
      current.legs,

    teamCount:
      winners.length,

    ties:
      nextTies

  };


  await saveChampionsData();

  refreshAllAdminSections();

}


// =========================================================
// CHECK FOR AUTOMATIC ADVANCEMENT
// =========================================================

async function checkKnockoutAdvancement() {

  const knockout =
    championsData.knockoutRound;


  if (!knockout) {
    return;
  }


  const ties =
    getKnockoutTies();


  if (!ties.length) {
    return;
  }


  // Don't advance if an aggregate tie is level.
  if (
    ties.some(
      tie =>
        isKnockoutTieComplete(
          tie
        ) &&
        !tie.winner
    )
  ) {

    return;

  }


  if (
    ties.every(
      tie =>
        isKnockoutTieComplete(
          tie
        ) &&
        tie.winner
    )
  ) {

    await createNextKnockoutRound();

  }

}


// =========================================================
// RENDER KNOCKOUT RESULTS
// =========================================================

function renderKnockoutResults() {

  if (!knockoutResultsList) {
    return;
  }


  const knockout =
    championsData.knockoutRound;


  if (!knockout) {

    knockoutResultsList.innerHTML =
      "<p>No knockout matches yet.</p>";

    return;

  }


  const ties =
    knockout.ties || [];


  knockoutResultsList.innerHTML =
    "";


  ties.forEach(
    (tie, tieIndex) => {

      const container =
        document.createElement(
          "div"
        );


      container.className =
        "knockout-tie";


      const heading =
        document.createElement(
          "h3"
        );


      heading.textContent =
        `Tie ${tieIndex + 1}: ${tie.homeName} vs ${tie.awayName}`;


      container.appendChild(
        heading
      );


      // ---------------------------------------------------
      // RENDER EACH LEG
      // ---------------------------------------------------

      const legs =
        tie.legs === 2
          ? [tie.leg1, tie.leg2]
          : [tie.leg1];


      legs.forEach(
        (match, index) => {

          if (!match) {
            return;
          }


          const card =
            document.createElement(
              "div"
            );


          card.className =
            "knockout-match";


          const title =
            document.createElement(
              "strong"
            );


          title.textContent =
            tie.legs === 2
              ? `Leg ${index + 1}`
              : "Match";


          const home =
            document.createElement(
              "span"
            );


          home.textContent =
            match.homeName;


          const homeInput =
            document.createElement(
              "input"
            );


          homeInput.type =
            "number";

          homeInput.min =
            "0";

          homeInput.step =
            "1";

          homeInput.inputMode =
            "numeric";

          homeInput.value =
            match.homeScore === null ||
            match.homeScore === undefined
              ? ""
              : match.homeScore;


          const dash =
            document.createElement(
              "span"
            );


          dash.textContent =
            " - ";


          const awayInput =
            document.createElement(
              "input"
            );


          awayInput.type =
            "number";

          awayInput.min =
            "0";

          awayInput.step =
            "1";

          awayInput.inputMode =
            "numeric";

          awayInput.value =
            match.awayScore === null ||
            match.awayScore === undefined
              ? ""
              : match.awayScore;


          const away =
            document.createElement(
              "span"
            );


          away.textContent =
            match.awayName;


          const save =
            document.createElement(
              "button"
            );


          save.type =
            "button";


          save.textContent =
            match.completed
              ? "Update Result"
              : "Save Result";


          save.addEventListener(
            "click",
            async () => {

              if (
                homeInput.value === "" ||
                awayInput.value === ""
              ) {

                alert(
                  "❌ Enter both scores."
                );

                return;

              }


              await saveKnockoutResult(
                tie,
                index + 1,
                Number(
                  homeInput.value
                ),
                Number(
                  awayInput.value
                )
              );

            }
          );


          card.appendChild(
            title
          );

          card.appendChild(
            home
          );

          card.appendChild(
            homeInput
          );

          card.appendChild(
            dash
          );

          card.appendChild(
            awayInput
          );

          card.appendChild(
            away
          );

          card.appendChild(
            save
          );


          container.appendChild(
            card
          );

        }
      );


      // ---------------------------------------------------
      // AGGREGATE
      // ---------------------------------------------------

      if (
        tie.legs === 2
      ) {

        const aggregate =
          getAggregateScore(
            tie
          );


        const aggregateText =
          document.createElement(
            "p"
          );


        aggregateText.textContent =
          `Aggregate: ${tie.homeName} ${aggregate.firstTeam} - ${aggregate.secondTeam} ${tie.awayName}`;


        container.appendChild(
          aggregateText
        );

      }


      // ---------------------------------------------------
      // WINNER / TIE LEVEL
      // ---------------------------------------------------

      if (
        tie.winner
      ) {

        const winner =
          getTieTeam(
            tie,
            tie.winner
          );


        const winnerText =
          document.createElement(
            "p"
          );


        winnerText.textContent =
          `✅ Advances: ${winner?.name || "Unknown Team"}`;


        container.appendChild(
          winnerText
        );

      }
      else if (
        isKnockoutTieComplete(
          tie
        )
      ) {

        const aggregate =
          getAggregateScore(
            tie
          );


        if (
          aggregate.firstTeam ===
          aggregate.secondTeam
        ) {

          const tied =
            document.createElement(
              "p"
            );


          tied.textContent =
            "⚠️ Tie is level. A winner must be selected before the next round can be generated.";


          container.appendChild(
            tied
          );

        }

      }


      knockoutResultsList.appendChild(
        container
      );

    }
  );

}

// =========================================================
// CHAMPIONS LEAGUE ADMIN
// PART 10 — KNOCKOUT ADVANCEMENT, TIES, FINAL & WINNER
// =========================================================


// =========================================================
// SELECT WINNER WHEN AGGREGATE IS TIED
// =========================================================

async function selectKnockoutTieWinner(
  tieId,
  teamId
) {

  const current =
    championsData.knockoutRound;

  if (!current) {
    return;
  }

  const tie =
    current.ties.find(
      item => item.id === tieId
    );

  if (!tie) {
    return;
  }

  if (
    teamId !== tie.homeTeamId &&
    teamId !== tie.awayTeamId
  ) {
    return;
  }

  tie.winner = teamId;

  await saveChampionsData();

  await checkKnockoutAdvancement();
}


// =========================================================
// GET WINNER NAME
// =========================================================

function getKnockoutWinnerName() {

  if (!championsData.winner) {
    return null;
  }

  const team =
    findTeamById(
      championsData.winner
    );

  return team
    ? getTeamName(team)
    : null;
}


// =========================================================
// RENDER WINNER
// =========================================================

function renderWinner() {

  if (!winner) {
    return;
  }

  const winnerName =
    getKnockoutWinnerName();

  if (!winnerName) {
    winner.innerHTML = "";
    return;
  }

  winner.innerHTML = `
    <div class="winner-card">

      <div class="winner-icon">
        🏆
      </div>

      <div class="winner-title">
        CHAMPIONS LEAGUE WINNER
      </div>

      <div class="winner-team">
        ${winnerName}
      </div>

    </div>
  `;
}


// =========================================================
// COMPLETE FINAL
// =========================================================

async function completeChampionsFinal() {

  const current =
    championsData.knockoutRound;

  if (!current) {
    return;
  }

  if (current.round !== "Final") {
    return;
  }

  const finalTie =
    current.ties[0];

  if (!finalTie) {
    return;
  }

  if (!finalTie.winner) {
    return;
  }

  championsData.winner =
    finalTie.winner;

  await saveChampionsData();

  renderKnockout();
  renderKnockoutResults();
  renderWinner();
  updateCompetitionStatus();
}


// =========================================================
// REPLACE KNOCKOUT ADVANCEMENT FUNCTION
// =========================================================

async function checkKnockoutAdvancement() {

  const current =
    championsData.knockoutRound;

  if (!current) {
    return;
  }

  const allComplete =
    current.ties.every(
      tie =>
        isKnockoutTieComplete(tie)
    );

  if (!allComplete) {
    await saveChampionsData();

    renderKnockout();
    renderKnockoutResults();
    renderWinner();
    updateCompetitionStatus();

    return;
  }


  // -------------------------------------------------------
  // FINAL
  // -------------------------------------------------------

  if (current.round === "Final") {

    const finalTie =
      current.ties[0];

    if (
      finalTie &&
      finalTie.winner
    ) {

      championsData.winner =
        finalTie.winner;

      await saveChampionsData();

      renderKnockout();
      renderKnockoutResults();
      renderWinner();
      updateCompetitionStatus();
    }

    return;
  }


  // -------------------------------------------------------
  // GET WINNERS
  // -------------------------------------------------------

  const winners = [];

  current.ties.forEach(
    tie => {

      if (tie.winner) {

        winners.push(
          tie.winner
        );

      }

    }
  );


  // -------------------------------------------------------
  // SAFETY CHECK
  // -------------------------------------------------------

  if (
    winners.length !==
    current.ties.length
  ) {

    await saveChampionsData();

    renderKnockout();
    renderKnockoutResults();

    return;
  }


  // -------------------------------------------------------
  // CREATE NEXT ROUND
  // -------------------------------------------------------

  await createNextKnockoutRound(
    winners
  );
}


// =========================================================
// REPLACE KNOCKOUT RESULT SAVE FUNCTION
// =========================================================

async function saveKnockoutResult(
  matchId
) {

  const current =
    championsData.knockoutRound;

  if (!current) {
    return;
  }

  let targetMatch = null;
  let targetTie = null;

  for (
    const tie of current.ties
  ) {

    const matches = [
      tie.leg1,
      tie.leg2
    ].filter(Boolean);

    const found =
      matches.find(
        match =>
          match.id === matchId
      );

    if (found) {

      targetMatch = found;
      targetTie = tie;

      break;
    }
  }

  if (
    !targetMatch ||
    !targetTie
  ) {
    return;
  }


  const homeInput =
    document.querySelector(
      `[data-home-score="${matchId}"]`
    );

  const awayInput =
    document.querySelector(
      `[data-away-score="${matchId}"]`
    );

  if (
    !homeInput ||
    !awayInput
  ) {
    return;
  }


  const homeScore =
    Number(homeInput.value);

  const awayScore =
    Number(awayInput.value);


  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {

    alert(
      "❌ Enter valid non-negative scores."
    );

    return;
  }


  targetMatch.homeScore =
    homeScore;

  targetMatch.awayScore =
    awayScore;

  targetMatch.completed =
    true;

  targetMatch.status =
    "completed";


  // -------------------------------------------------------
  // DETERMINE TIE WINNER
  // -------------------------------------------------------

  const winnerId =
    determineTieWinner(
      targetTie
    );


  if (winnerId) {

    targetTie.winner =
      winnerId;

  } else {

    targetTie.winner =
      null;
  }


  await saveChampionsData();


  // -------------------------------------------------------
  // CHECK FOR NEXT ROUND / FINAL
  // -------------------------------------------------------

  await checkKnockoutAdvancement();
}


// =========================================================
// RENDER KNOCKOUT RESULTS WITH TIE WINNER SELECTION
// =========================================================

function renderKnockoutResults() {

  if (!knockoutResultsList) {
    return;
  }

  knockoutResultsList.innerHTML = "";


  const current =
    championsData.knockoutRound;

  if (!current) {

    knockoutResultsList.innerHTML =
      `<p>No knockout matches yet.</p>`;

    return;
  }


  current.ties.forEach(
    (tie, tieIndex) => {

      const wrapper =
        document.createElement("div");

      wrapper.className =
        "knockout-tie";


      const heading =
        document.createElement("h3");

      heading.textContent =
        `${current.round} — Tie ${tieIndex + 1}`;

      wrapper.appendChild(
        heading
      );


      const matches = [
        tie.leg1,
        tie.leg2
      ].filter(Boolean);


      matches.forEach(
        match => {

          const matchBox =
            document.createElement("div");

          matchBox.className =
            "knockout-match";


          const title =
            document.createElement("div");

          title.className =
            "knockout-match-title";

          title.textContent =
            match.leg === 1
              ? "Leg 1"
              : "Leg 2";


          const teams =
            document.createElement("div");

          teams.className =
            "knockout-match-teams";

          teams.innerHTML = `
            <span>
              ${match.homeName}
            </span>

            <span>vs</span>

            <span>
              ${match.awayName}
            </span>
          `;


          const scoreRow =
            document.createElement("div");

          scoreRow.className =
            "knockout-score-row";


          const homeInput =
            document.createElement("input");

          homeInput.type =
            "number";

          homeInput.min =
            "0";

          homeInput.step =
            "1";

          homeInput.value =
            match.homeScore === null
              ? ""
              : match.homeScore;

          homeInput.dataset.homeScore =
            match.id;


          const awayInput =
            document.createElement("input");

          awayInput.type =
            "number";

          awayInput.min =
            "0";

          awayInput.step =
            "1";

          awayInput.value =
            match.awayScore === null
              ? ""
              : match.awayScore;

          awayInput.dataset.awayScore =
            match.id;


          const saveButton =
            document.createElement("button");

          saveButton.type =
            "button";

          saveButton.textContent =
            match.completed
              ? "Update Result"
              : "Save Result";


          saveButton.addEventListener(
            "click",
            async () => {

              await saveKnockoutResult(
                match.id
              );

            }
          );


          scoreRow.appendChild(
            homeInput
          );

          scoreRow.appendChild(
            awayInput
          );

          scoreRow.appendChild(
            saveButton
          );


          matchBox.appendChild(
            title
          );

          matchBox.appendChild(
            teams
          );

          matchBox.appendChild(
            scoreRow
          );


          wrapper.appendChild(
            matchBox
          );

        }
      );


      // ---------------------------------------------------
      // AGGREGATE
      // ---------------------------------------------------

      if (current.legs === 2) {

        const aggregate =
          getAggregateScore(
            tie
          );

        const aggregateBox =
          document.createElement("div");

        aggregateBox.className =
          "knockout-aggregate";

        aggregateBox.innerHTML = `
          <strong>
            Aggregate
          </strong>

          <div>
            ${tie.homeName}:
            ${aggregate.home}
          </div>

          <div>
            ${tie.awayName}:
            ${aggregate.away}
          </div>
        `;

        wrapper.appendChild(
          aggregateBox
        );


        // -----------------------------------------------
        // TIED AGGREGATE
        // -----------------------------------------------

        if (
          isKnockoutTieComplete(tie) &&
          aggregate.home ===
            aggregate.away &&
          !tie.winner
        ) {

          const tieMessage =
            document.createElement("p");

          tieMessage.className =
            "knockout-tied-message";

          tieMessage.textContent =
            "⚠️ Aggregate is tied. Select the team that advances.";

          wrapper.appendChild(
            tieMessage
          );


          const winnerButtons =
            document.createElement("div");

          winnerButtons.className =
            "knockout-winner-buttons";


          const homeButton =
            document.createElement("button");

          homeButton.type =
            "button";

          homeButton.textContent =
            `Advance ${tie.homeName}`;

          homeButton.addEventListener(
            "click",
            async () => {

              await selectKnockoutTieWinner(
                tie.id,
                tie.homeTeamId
              );

            }
          );


          const awayButton =
            document.createElement("button");

          awayButton.type =
            "button";

          awayButton.textContent =
            `Advance ${tie.awayName}`;

          awayButton.addEventListener(
            "click",
            async () => {

              await selectKnockoutTieWinner(
                tie.id,
                tie.awayTeamId
              );

            }
          );


          winnerButtons.appendChild(
            homeButton
          );

          winnerButtons.appendChild(
            awayButton
          );

          wrapper.appendChild(
            winnerButtons
          );
        }
      }


      // ---------------------------------------------------
      // WINNER
      // ---------------------------------------------------

      if (tie.winner) {

        const winnerTeam =
          findTeamById(
            tie.winner
          );

        const winnerText =
          document.createElement("div");

        winnerText.className =
          "knockout-tie-winner";

        winnerText.textContent =
          `🏆 Advances: ${
            winnerTeam
              ? getTeamName(winnerTeam)
              : "Unknown team"
          }`;

        wrapper.appendChild(
          winnerText
        );
      }


      knockoutResultsList.appendChild(
        wrapper
      );

    }
  );
}


// =========================================================
// REFRESH WINNER AFTER DATA LOAD
// =========================================================

renderWinner();