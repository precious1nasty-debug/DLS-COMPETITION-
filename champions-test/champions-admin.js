/* =========================================================
   DLS CHAMPIONS LEAGUE
   CHAMPIONS ADMIN
   PART 1 — FIREBASE + AUTH + GLOBALS
   ========================================================= */


/* =========================
   FIREBASE AUTH
========================= */

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================
   FIRESTORE
========================= */

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================
   ADMIN EMAIL
========================= */

const ADMIN_EMAIL =
  "obakimoprecious07@gmail.com";


/* =========================
   FIREBASE REFERENCES
========================= */

let championsAuth = null;

let championsDb = null;


/* =========================
   APPLICATION DATA
========================= */

let approvedTeams = [];

let championsData = {

  started: false,

  matchesPerTeam: 1,

  teams: [],

  fixtures: [],

  knockoutRound: null,

  winner: null

};


/* =========================
   FIREBASE READY STATE
========================= */

let firebaseReady = false;


/* =========================
   LOGIN ELEMENTS
========================= */

const adminLogin =
  document.getElementById(
    "adminLogin"
  );

const adminDashboard =
  document.getElementById(
    "adminDashboard"
  );

const adminLoginForm =
  document.getElementById(
    "adminLoginForm"
  );

const adminEmail =
  document.getElementById(
    "adminEmail"
  );

const adminPassword =
  document.getElementById(
    "adminPassword"
  );

const adminLoginMessage =
  document.getElementById(
    "adminLoginMessage"
  );


/* =========================
   SETTINGS ELEMENTS
========================= */

const matchesPerTeam =
  document.getElementById(
    "matchesPerTeam"
  );

const saveSettingsButton =
  document.getElementById(
    "saveSettingsButton"
  );

const generateFixturesButton =
  document.getElementById(
    "generateFixturesButton"
  );

const startCompetitionButton =
  document.getElementById(
    "startCompetitionButton"
  );

const settingsMessage =
  document.getElementById(
    "settingsMessage"
  );


/* =========================
   TEAM ELEMENTS
========================= */

const approvedTeamList =
  document.getElementById(
    "approvedTeamList"
  );

const teamCountMessage =
  document.getElementById(
    "teamCountMessage"
  );


/* =========================
   FIXTURE ELEMENTS
========================= */

const adminFixtureList =
  document.getElementById(
    "adminFixtureList"
  );

const leagueResultsList =
  document.getElementById(
    "leagueResultsList"
  );


/* =========================
   KNOCKOUT ELEMENTS
========================= */

const generateKnockoutButton =
  document.getElementById(
    "generateKnockoutButton"
  );

const knockoutResultsList =
  document.getElementById(
    "knockoutResultsList"
  );

const knockoutMessage =
  document.getElementById(
    "knockoutMessage"
  );


/* =========================
   STATUS
========================= */

const competitionStatus =
  document.getElementById(
    "competitionStatus"
  );


/* =========================
   LOGOUT
========================= */

const adminLogoutButton =
  document.getElementById(
    "adminLogoutButton"
  );


/* =========================
   WAIT FOR FIREBASE
========================= */

function waitForFirebase() {

  return new Promise(
    resolve => {

      if (
        window.championsFirebaseReady === true
      ) {

        championsAuth =
          window.championsAuth;

        championsDb =
          window.championsDb;

        firebaseReady = true;

        resolve();

        return;

      }


      window.addEventListener(
        "championsFirebaseReady",
        () => {

          championsAuth =
            window.championsAuth;

          championsDb =
            window.championsDb;

          firebaseReady = true;

          resolve();

        },
        {
          once: true
        }
      );

    }
  );

}

/* =========================================================
   PART 2 — FIREBASE LOADING + ADMIN LOGIN
   ========================================================= */


/* =========================
   LOAD CHAMPIONS DATA
========================= */

async function loadChampionsData() {

  const championsRef =
    doc(
      championsDb,
      "championsLeague",
      "main"
    );

  const snapshot =
    await getDoc(
      championsRef
    );

  if (snapshot.exists()) {

    const data =
      snapshot.data();

    championsData = {

      started:
        data.started === true,

      matchesPerTeam:
        Number(
          data.matchesPerTeam
        ) || 1,

      teams:
        Array.isArray(data.teams)
          ? data.teams
          : [],

      fixtures:
        Array.isArray(data.fixtures)
          ? data.fixtures
          : [],

      knockoutRound:
        data.knockoutRound || null,

      winner:
        data.winner || null

    };

  } else {

    championsData = {

      started: false,

      matchesPerTeam: 1,

      teams: [],

      fixtures: [],

      knockoutRound: null,

      winner: null

    };

  }

}


/* =========================
   LOAD APPROVED TEAMS
   FROM MAIN COMPETITION
========================= */

async function loadApprovedTeams() {

  const competitionRef =
    doc(
      championsDb,
      "competition",
      "main"
    );

  const snapshot =
    await getDoc(
      competitionRef
    );

  if (!snapshot.exists()) {

    approvedTeams = [];

    return;

  }

  const data =
    snapshot.data();

  approvedTeams =
    Array.isArray(data.teams)
      ? data.teams
      : [];

}


/* =========================
   SAVE CHAMPIONS DATA
========================= */

async function saveChampionsData() {

  const championsRef =
    doc(
      championsDb,
      "championsLeague",
      "main"
    );

  await setDoc(
    championsRef,
    championsData
  );

}


/* =========================
   LOGIN
========================= */

if (adminLoginForm) {

  adminLoginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (!firebaseReady) {

        adminLoginMessage.textContent =
          "Firebase is still loading. Please wait.";

        return;

      }

      const email =
        adminEmail.value.trim();

      const password =
        adminPassword.value;

      if (!email || !password) {

        adminLoginMessage.textContent =
          "Please enter your email and password.";

        return;

      }

      adminLoginMessage.textContent =
        "Signing in...";

      try {

        const credential =
          await signInWithEmailAndPassword(
            championsAuth,
            email,
            password
          );

        const signedInEmail =
          credential.user.email
            ? credential.user.email
                .toLowerCase()
                .trim()
            : "";

        if (
          signedInEmail !==
          ADMIN_EMAIL.toLowerCase()
        ) {

          await signOut(
            championsAuth
          );

          adminLoginMessage.textContent =
            "This account is not authorized.";

          return;

        }

        adminLoginMessage.textContent =
          "Login successful.";

      } catch (error) {

        console.error(
          "Admin login error:",
          error
        );

        adminLoginMessage.textContent =
          "Login failed. Check your email and password.";

      }

    }
  );

}


/* =========================
   AUTH STATE
========================= */

async function handleAdminAuth(
  user
) {

  if (!user) {

    adminLogin.classList.remove(
      "hidden"
    );

    adminDashboard.classList.add(
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

    await signOut(
      championsAuth
    );

    return;

  }


  /* =========================
     OPEN DASHBOARD FIRST
  ========================= */

  adminLogin.classList.add(
    "hidden"
  );

  adminDashboard.classList.remove(
    "hidden"
  );


  /* =========================
     LOAD ADMIN DATA
  ========================= */

  try {

    await loadChampionsData();

    await loadApprovedTeams();

    renderApprovedTeams();

    renderFixtures();

    renderKnockout();

    updateCompetitionStatus();

  } catch (error) {

    console.error(
      "Admin data loading error:",
      error
    );

    if (adminLoginMessage) {

      adminLoginMessage.textContent =
        "Dashboard opened, but some Champions data could not be loaded.";

    }

  }

}

/* =========================
   START FIREBASE
========================= */

async function initializeAdmin() {

  try {

    await waitForFirebase();

    onAuthStateChanged(
      championsAuth,
      handleAdminAuth
    );

  } catch (error) {

    console.error(
      "Firebase initialization error:",
      error
    );

    if (adminLoginMessage) {

      adminLoginMessage.textContent =
        "Firebase could not be initialized.";

    }

  }

}


initializeAdmin();

/* =========================================================
   PART 3 — TEAMS
   LOAD, VALIDATE AND DISPLAY APPROVED TEAMS
   ========================================================= */


/* =========================
   TEAM ID
========================= */

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


/* =========================
   TEAM NAME
========================= */

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


/* =========================
   NORMALIZE APPROVED TEAMS
========================= */

function normalizeApprovedTeams() {

  approvedTeams =
    approvedTeams
      .map(
        (team, index) => {

          const id =
            getTeamId(team);

          const name =
            getTeamName(team);

          return {

            ...team,

            id:
              id ||
              `team-${index + 1}`,

            name:
              name

          };

        }
      )
      .filter(
        team =>
          team.id &&
          team.name
      );

}


/* =========================
   VALIDATE TEAM COUNT
========================= */

function validateTeamCount() {

  const count =
    approvedTeams.length;

  if (count < 9) {

    return {

      valid: false,

      message:
        `Champions League requires at least 9 approved teams. Currently there are ${count}.`

    };

  }

  if (count > 128) {

    return {

      valid: false,

      message:
        "Champions League supports a maximum of 128 teams."

    };

  }

  return {

    valid: true,

    message:
      `${count} approved teams are available.`

  };

}


/* =========================
   QUALIFICATION COUNT
========================= */

function getQualifiedCount(
  teamCount
) {

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
    teamCount >= 33
  ) {

    return 32;

  }

  return 0;

}


/* =========================
   VALIDATE MATCH COUNT
========================= */

function validateMatchesPerTeam(
  matches
) {

  const teamCount =
    approvedTeams.length;

  const value =
    Number(matches);

  if (!Number.isInteger(value)) {

    return {

      valid: false,

      message:
        "Matches per team must be a whole number."

    };

  }

  if (value < 1 || value > 8) {

    return {

      valid: false,

      message:
        "Matches per team must be between 1 and 8."

    };

  }

  if (value > teamCount - 1) {

    return {

      valid: false,

      message:
        "A team cannot play itself or the same opponent twice."

    };

  }

  if (
    (teamCount * value) % 2 !== 0
  ) {

    return {

      valid: false,

      message:
        `${teamCount} teams × ${value} matches is not an even total. Choose another matches-per-team value.`

    };

  }

  return {

  valid: true,

  message:
    `${value} matches per team is valid.`

};

}


/* =========================
   RENDER APPROVED TEAMS
========================= */

function renderApprovedTeams() {

  if (!approvedTeamList) {
    return;
  }

  normalizeApprovedTeams();

  const validation =
    validateTeamCount();

  if (teamCountMessage) {

    teamCountMessage.textContent =
      validation.message;

    teamCountMessage.className =
      validation.valid
        ? "message"
        : "message status-warning";

  }

  approvedTeamList.innerHTML = "";

  if (approvedTeams.length === 0) {

    approvedTeamList.innerHTML =
      `
        <div class="team-card">
          No approved teams found.
        </div>
      `;

    return;

  }

  approvedTeams.forEach(
    (team, index) => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "team-card";

      card.innerHTML =
        `
          <strong>
            ${escapeHtml(
              getTeamName(team)
            )}
          </strong>

          <span>
            Team ${index + 1}
          </span>
        `;

      approvedTeamList.appendChild(
        card
      );

    }
  );

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(
  value
) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}

/* =========================================================
   PART 4 — SETTINGS + LEAGUE FIXTURE GENERATION
   ========================================================= */


/* =========================
   SAVE SETTINGS
========================= */

if (saveSettingsButton) {

  saveSettingsButton.addEventListener(
    "click",
    async () => {

      const value =
        Number(
          matchesPerTeam.value
        );

      const validation =
        validateMatchesPerTeam(
          value
        );

      if (!validation.valid) {

        settingsMessage.textContent =
          validation.message;

        settingsMessage.className =
          "message status-warning";

        return;

      }

      if (championsData.started) {

        settingsMessage.textContent =
          "Settings cannot be changed after the competition starts.";

        settingsMessage.className =
          "message status-warning";

        return;

      }

      championsData.matchesPerTeam =
        value;

      try {

        await saveChampionsData();

        settingsMessage.textContent =
          `Settings saved: ${value} matches per team.`;

        settingsMessage.className =
          "message status-live";

      } catch (error) {

        console.error(
          "Save settings error:",
          error
        );

        settingsMessage.textContent =
          "Unable to save settings.";

        settingsMessage.className =
          "message status-warning";

      }

    }
  );

}


/* =========================
   SHUFFLE TEAMS
========================= */

function shuffleTeams(
  teams
) {

  const shuffled =
    [...teams];

  for (
    let i = shuffled.length - 1;
    i > 0;
    i--
  ) {

    const randomIndex =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      shuffled[i],
      shuffled[randomIndex]
    ] =
    [
      shuffled[randomIndex],
      shuffled[i]
    ];

  }

  return shuffled;

}


/* =========================
   CREATE FIXTURE ID
========================= */

function createFixtureId(
  index
) {

  return (
    `champions-league-${Date.now()}-${index}-${Math.random()
      .toString(36)
      .slice(2, 8)}`
  );

}


/* =========================
   CHECK OPPONENT
========================= */

function opponentAlreadyExists(
  fixtures,
  teamA,
  teamB
) {

  return fixtures.some(
    fixture => {

      const home =
        fixture.home;

      const away =
        fixture.away;

      return (
        (
          home === teamA &&
          away === teamB
        ) ||
        (
          home === teamB &&
          away === teamA
        )
      );

    }
  );

}


/* =========================
   ADD FIXTURE
========================= */

function addLeagueFixture(
  fixtures,
  homeTeam,
  awayTeam
) {

  if (!homeTeam || !awayTeam) {
    return false;
  }

  const homeId =
    getTeamId(homeTeam);

  const awayId =
    getTeamId(awayTeam);

  if (!homeId || !awayId) {
    return false;
  }

  if (homeId === awayId) {
    return false;
  }

  if (
    opponentAlreadyExists(
      fixtures,
      homeId,
      awayId
    )
  ) {

    return false;

  }

  fixtures.push({

    id:
      createFixtureId(
        fixtures.length
      ),

    phase:
      "league",

    home:
      homeId,

    away:
      awayId,

    homeName:
      getTeamName(homeTeam),

    awayName:
      getTeamName(awayTeam),

    homeScore:
      null,

    awayScore:
      null,

    status:
      "scheduled",

    completed:
      false

  });

  return true;

}


/* =========================
   GENERATE FIXTURES
========================= */

function generateLeagueFixtures() {

  normalizeApprovedTeams();

  const teamValidation =
    validateTeamCount();

  if (!teamValidation.valid) {

    throw new Error(
      teamValidation.message
    );

  }

  const requestedMatches =
    Number(
      matchesPerTeam.value
    );

  const matchValidation =
    validateMatchesPerTeam(
      requestedMatches
    );

  if (!matchValidation.valid) {

    throw new Error(
      matchValidation.message
    );

  }

  const teams =
    shuffleTeams(
      approvedTeams
    );

  const fixtures = [];

  const teamCount =
    teams.length;

  const targetMatches =
    requestedMatches;

  /*
     For every team, pair it with the
     required number of opponents.

     The circular-distance method works
     for every valid N/K combination:

       N × K must be even
       K <= N - 1
  */

  const distances = [];

  const half =
    Math.floor(
      targetMatches / 2
    );

  for (
    let distance = 1;
    distance <= half;
    distance++
  ) {

    distances.push(
      distance
    );

  }

  /*
     If both N and K are even/odd in a
     way that leaves one opposite pairing,
     add the unique opposite distance.
  */

  if (
    targetMatches % 2 === 1
  ) {

    const opposite =
      teamCount / 2;

    if (
      Number.isInteger(
        opposite
      )
    ) {

      distances.push(
        opposite
      );

    }

  }


  for (
    let i = 0;
    i < teamCount;
    i++
  ) {

    for (
      const distance of distances
    ) {

      const j =
        (i + distance) %
        teamCount;

      if (j === i) {
        continue;
      }

      const homeTeam =
        teams[i];

      const awayTeam =
        teams[j];

      addLeagueFixture(
        fixtures,
        homeTeam,
        awayTeam
      );

    }

  }


  /*
     Safety check:
     Every team must have exactly
     the requested number of matches.
  */

  const matchCounts =
    {};

  teams.forEach(
    team => {

      matchCounts[
        getTeamId(team)
      ] = 0;

    }
  );


  fixtures.forEach(
    fixture => {

      if (
        matchCounts[
          fixture.home
        ] !== undefined
      ) {

        matchCounts[
          fixture.home
        ]++;

      }

      if (
        matchCounts[
          fixture.away
        ] !== undefined
      ) {

        matchCounts[
          fixture.away
        ]++;

      }

    }
  );


  const invalidTeam =
    teams.find(
      team =>
        matchCounts[
          getTeamId(team)
        ] !== targetMatches
    );


  if (invalidTeam) {

    throw new Error(
      `Fixture generation failed for ${getTeamName(invalidTeam)}.`
    );

  }


  const expectedFixtureCount =
    (
      teamCount *
      targetMatches
    ) / 2;


  if (
    fixtures.length !==
    expectedFixtureCount
  ) {

    throw new Error(
      "Fixture generation produced an incorrect number of matches."
    );

  }


  return fixtures;

}


/* =========================
   GENERATE BUTTON
========================= */

if (generateFixturesButton) {

  generateFixturesButton.addEventListener(
    "click",
    async () => {

      if (championsData.started) {

        settingsMessage.textContent =
          "Fixtures cannot be regenerated after the competition starts.";

        settingsMessage.className =
          "message status-warning";

        return;

      }

      try {

        normalizeApprovedTeams();

        const validation =
          validateTeamCount();

        if (!validation.valid) {

          settingsMessage.textContent =
            validation.message;

          settingsMessage.className =
            "message status-warning";

          return;

        }

        const fixtures =
          generateLeagueFixtures();

        championsData.teams =
          approvedTeams.map(
            team => ({
              ...team
            })
          );

        championsData.fixtures =
          fixtures;

        championsData.knockoutRound =
          null;

        championsData.winner =
          null;

        championsData.started =
          false;

        championsData.matchesPerTeam =
          Number(
            matchesPerTeam.value
          );


        await saveChampionsData();


        settingsMessage.textContent =
          `${fixtures.length} league fixtures generated successfully.`;

        settingsMessage.className =
          "message status-live";


        renderFixtures();

        updateCompetitionStatus();

      } catch (error) {

        console.error(
          "Fixture generation error:",
          error
        );

        settingsMessage.textContent =
          error.message ||
          "Unable to generate fixtures.";

        settingsMessage.className =
          "message status-warning";

      }

    }
  );

}

/* =========================================================
   PART 5 — LEAGUE FIXTURES + RESULTS
   ========================================================= */


/* =========================
   FIND TEAM
========================= */

function findTeamById(
  teamId
) {

  return championsData.teams.find(
    team =>
      getTeamId(team) ===
      String(teamId)
  ) || approvedTeams.find(
    team =>
      getTeamId(team) ===
      String(teamId)
  ) || null;

}


/* =========================
   GET FIXTURE TEAM NAME
========================= */

function getFixtureTeamName(
  fixture,
  side
) {

  const id =
    side === "home"
      ? fixture.home
      : fixture.away;

  const storedName =
    side === "home"
      ? fixture.homeName
      : fixture.awayName;

  const team =
    findTeamById(id);

  if (team) {

    return getTeamName(team);

  }

  return storedName ||
    "Unknown Team";

}


/* =========================
   NORMALIZE FIXTURE
========================= */

function normalizeFixture(
  fixture
) {

  if (!fixture) {
    return null;
  }

  const home =
    fixture.home ||
    fixture.homeTeamId ||
    "";

  const away =
    fixture.away ||
    fixture.awayTeamId ||
    "";

  const homeScore =
    fixture.homeScore !== undefined
      ? fixture.homeScore
      : null;

  const awayScore =
    fixture.awayScore !== undefined
      ? fixture.awayScore
      : null;

  const completed =
    fixture.completed === true ||
    fixture.status === "completed";

  return {

    ...fixture,

    home:
      home,

    away:
      away,

    homeName:
      getFixtureTeamName(
        {
          ...fixture,
          home
        },
        "home"
      ),

    awayName:
      getFixtureTeamName(
        {
          ...fixture,
          away
        },
        "away"
      ),

    homeScore:
      homeScore,

    awayScore:
      awayScore,

    status:
      completed
        ? "completed"
        : "scheduled",

    completed:
      completed

  };

}


/* =========================
   VALID SCORE
========================= */

function isValidScore(
  value
) {

  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {

    return false;

  }

  const number =
    Number(value);

  return (
    Number.isInteger(number) &&
    number >= 0
  );

}


/* =========================
   RENDER FIXTURES
========================= */

function renderFixtures() {

  if (!adminFixtureList) {
    return;
  }

  adminFixtureList.innerHTML = "";

  const fixtures =
    Array.isArray(
      championsData.fixtures
    )
      ? championsData.fixtures
          .map(
            normalizeFixture
          )
          .filter(Boolean)
      : [];


  if (fixtures.length === 0) {

    adminFixtureList.innerHTML =
      `
        <div class="match-card">
          No league fixtures have been generated yet.
        </div>
      `;

    return;

  }


  fixtures.forEach(
    (fixture, index) => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "match-card";


      const homeName =
        getFixtureTeamName(
          fixture,
          "home"
        );

      const awayName =
        getFixtureTeamName(
          fixture,
          "away"
        );


      const completed =
        fixture.completed === true;


      const homeScore =
        completed &&
        fixture.homeScore !== null
          ? fixture.homeScore
          : "";


      const awayScore =
        completed &&
        fixture.awayScore !== null
          ? fixture.awayScore
          : "";


      card.innerHTML =
        `
          <h3>
            Match ${index + 1}
          </h3>

          <div class="score-row">

            <strong>
              ${escapeHtml(
                homeName
              )}
            </strong>

            <input
              type="number"
              min="0"
              step="1"
              class="home-score"
              value="${escapeHtml(
                String(homeScore)
              )}"
              placeholder="0"
            >

            <span>
              -
            </span>

            <input
              type="number"
              min="0"
              step="1"
              class="away-score"
              value="${escapeHtml(
                String(awayScore)
              )}"
              placeholder="0"
            >

            <strong>
              ${escapeHtml(
                awayName
              )}
            </strong>

          </div>

          <div class="button-row">

            <button
              type="button"
              class="save-result-button"
            >
              ${
                completed
                  ? "Update Result"
                  : "Save Result"
              }
            </button>

          </div>

          <p class="message result-message"></p>
        `;


      const homeInput =
        card.querySelector(
          ".home-score"
        );

      const awayInput =
        card.querySelector(
          ".away-score"
        );

      const saveButton =
        card.querySelector(
          ".save-result-button"
        );

      const resultMessage =
        card.querySelector(
          ".result-message"
        );


      saveButton.addEventListener(
        "click",
        async () => {

          if (championsData.started !== true) {

            resultMessage.textContent =
              "Start the competition before entering results.";

            resultMessage.className =
              "message status-warning";

            return;

          }


          if (
            !isValidScore(
              homeInput.value
            ) ||
            !isValidScore(
              awayInput.value
            )
          ) {

            resultMessage.textContent =
              "Enter valid whole-number scores for both teams.";

            resultMessage.className =
              "message status-warning";

            return;

          }


          const homeScoreValue =
            Number(
              homeInput.value
            );

          const awayScoreValue =
            Number(
              awayInput.value
            );


          const storedFixture =
            championsData.fixtures.find(
              item =>
                item.id ===
                fixture.id
            );


          if (!storedFixture) {

            resultMessage.textContent =
              "Fixture could not be found.";

            resultMessage.className =
              "message status-warning";

            return;

          }


          storedFixture.homeScore =
            homeScoreValue;

          storedFixture.awayScore =
            awayScoreValue;

          storedFixture.status =
            "completed";

          storedFixture.completed =
            true;


          try {

            await saveChampionsData();

            resultMessage.textContent =
              "Result saved successfully.";

            resultMessage.className =
              "message status-live";


            renderFixtures();

            renderLeagueResults();

          } catch (error) {

            console.error(
              "Save result error:",
              error
            );

            resultMessage.textContent =
              "Unable to save the result.";

            resultMessage.className =
              "message status-warning";

          }

        }
      );


      adminFixtureList.appendChild(
        card
      );

    }
  );

}


/* =========================
   RENDER COMPLETED RESULTS
========================= */

function renderLeagueResults() {

  if (!leagueResultsList) {
    return;
  }

  leagueResultsList.innerHTML = "";

  const completedFixtures =
    championsData.fixtures
      .map(
        normalizeFixture
      )
      .filter(
        fixture =>
          fixture &&
          fixture.completed === true
      );


  if (
    completedFixtures.length === 0
  ) {

    leagueResultsList.innerHTML =
      `
        <div class="match-card">
          No completed league results yet.
        </div>
      `;

    return;

  }


  completedFixtures.forEach(
    (fixture, index) => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "match-card";

      card.innerHTML =
        `
          <strong>
            Result ${index + 1}
          </strong>

          <p>
            ${escapeHtml(
              getFixtureTeamName(
                fixture,
                "home"
              )
            )}

            <strong>
              ${fixture.homeScore}
            </strong>

            -

            <strong>
              ${fixture.awayScore}
            </strong>

            ${escapeHtml(
              getFixtureTeamName(
                fixture,
                "away"
              )
            )}
          </p>
        `;

      leagueResultsList.appendChild(
        card
      );

    }
  );

}

/* =========================================================
   PART 6 — START COMPETITION + STATUS
   ========================================================= */


/* =========================
   START COMPETITION
========================= */

if (startCompetitionButton) {

  startCompetitionButton.addEventListener(
    "click",
    async () => {

      if (championsData.started === true) {

        settingsMessage.textContent =
          "The Champions League competition has already started.";

        settingsMessage.className =
          "message status-warning";

        return;

      }


      normalizeApprovedTeams();


      const teamValidation =
        validateTeamCount();

      if (!teamValidation.valid) {

        settingsMessage.textContent =
          teamValidation.message;

        settingsMessage.className =
          "message status-warning";

        return;

      }


      const fixtures =
        Array.isArray(
          championsData.fixtures
        )
          ? championsData.fixtures
          : [];


      if (fixtures.length === 0) {

        settingsMessage.textContent =
          "Generate the league fixtures before starting the competition.";

        settingsMessage.className =
          "message status-warning";

        return;

      }


      const expectedMatches =
        (
          approvedTeams.length *
          Number(
            championsData.matchesPerTeam
          )
        ) / 2;


      if (
        fixtures.length !==
        expectedMatches
      ) {

        settingsMessage.textContent =
          "The fixture list is incomplete. Generate the fixtures again.";

        settingsMessage.className =
          "message status-warning";

        return;

      }


      const confirmStart =
        window.confirm(
          "Start the Champions League competition now?"
        );


      if (!confirmStart) {
        return;
      }


      championsData.started =
        true;


      try {

        await saveChampionsData();


        settingsMessage.textContent =
          "Champions League competition started successfully.";

        settingsMessage.className =
          "message status-live";


        updateCompetitionStatus();

        renderFixtures();

        renderLeagueResults();


        startCompetitionButton.disabled =
          true;

        generateFixturesButton.disabled =
          true;

        saveSettingsButton.disabled =
          true;


      } catch (error) {

        console.error(
          "Start competition error:",
          error
        );


        championsData.started =
          false;


        settingsMessage.textContent =
          "Unable to start the competition.";

        settingsMessage.className =
          "message status-warning";

      }

    }
  );

}


/* =========================
   UPDATE STATUS
========================= */

function updateCompetitionStatus() {

  if (!competitionStatus) {
    return;
  }


  const teamCount =
    championsData.teams.length;


  const fixtureCount =
    Array.isArray(
      championsData.fixtures
    )
      ? championsData.fixtures.length
      : 0;


  const completedCount =
    Array.isArray(
      championsData.fixtures
    )
      ? championsData.fixtures.filter(
          fixture =>
            fixture.completed === true ||
            fixture.status === "completed"
        ).length
      : 0;


  if (!teamCount) {

    competitionStatus.innerHTML =
      `
        <div class="status-warning">
          No Champions League teams have been loaded.
        </div>
      `;

    return;

  }


  if (!fixtureCount) {

    competitionStatus.innerHTML =
      `
        <div class="status-warning">
          ${teamCount} teams loaded.
          Fixtures have not been generated.
        </div>
      `;

    return;

  }


  if (!championsData.started) {

    competitionStatus.innerHTML =
      `
        <div class="status-warning">
          <strong>Competition not started.</strong>
          <br>
          ${teamCount} teams
          |
          ${fixtureCount} league fixtures
          |
          ${championsData.matchesPerTeam} matches per team
        </div>
      `;

    return;

  }


  competitionStatus.innerHTML =
    `
      <div class="status-live">
        <strong>Competition is LIVE.</strong>
        <br>
        ${teamCount} teams
        |
        ${fixtureCount} league fixtures
        |
        ${completedCount} results completed
      </div>
    `;


  if (startCompetitionButton) {

    startCompetitionButton.disabled =
      true;

  }

  if (generateFixturesButton) {

    generateFixturesButton.disabled =
      true;

  }

  if (saveSettingsButton) {

    saveSettingsButton.disabled =
      true;

  }

}


/* =========================
   INITIAL SETTINGS DISPLAY
========================= */

function loadSettingsIntoForm() {

  if (!matchesPerTeam) {
    return;
  }


  const savedValue =
    Number(
      championsData.matchesPerTeam
    );


  if (
    savedValue >= 1 &&
    savedValue <= 8
  ) {

    matchesPerTeam.value =
      String(savedValue);

  }


  if (
    championsData.started === true
  ) {

    if (saveSettingsButton) {

      saveSettingsButton.disabled =
        true;

    }

    if (generateFixturesButton) {

      generateFixturesButton.disabled =
        true;

    }

    if (startCompetitionButton) {

      startCompetitionButton.disabled =
        true;

    }

  }

}


/* =========================
   REFRESH ADMIN DISPLAY
========================= */

function refreshAdminDisplay() {

  loadSettingsIntoForm();

  renderApprovedTeams();

  renderFixtures();

  renderLeagueResults();

  renderKnockout();

  updateCompetitionStatus();

}


/* =========================
   OVERRIDE DATA LOAD DISPLAY
========================= */

const originalHandleAdminAuth =
  handleAdminAuth;


/*
   The authentication function from Part 2
   already loads the data and renders the
   main sections.

   This listener simply refreshes the
   settings controls after Firebase is ready.
*/

window.addEventListener(
  "championsFirebaseReady",
  () => {

    if (
      firebaseReady &&
      championsData
    ) {

      loadSettingsIntoForm();

    }

  }
);

/* =========================================================
   PART 7 — LEAGUE TABLE
   ========================================================= */


/* =========================
   CREATE TABLE DATA
========================= */

function calculateLeagueTable() {

  const table = {};

  const teams =
    Array.isArray(
      championsData.teams
    )
      ? championsData.teams
      : [];


  /* =========================
     INITIALIZE TEAMS
  ========================= */

  teams.forEach(
    team => {

      const id =
        getTeamId(team);

      if (!id) {
        return;
      }

      table[id] = {

        id: id,

        name:
          getTeamName(team),

        played: 0,

        wins: 0,

        draws: 0,

        losses: 0,

        goalsFor: 0,

        goalsAgainst: 0,

        goalDifference: 0,

        points: 0

      };

    }
  );


  /* =========================
     PROCESS RESULTS
  ========================= */

  const fixtures =
    Array.isArray(
      championsData.fixtures
    )
      ? championsData.fixtures
      : [];


  fixtures.forEach(
    fixture => {

      const normalized =
        normalizeFixture(
          fixture
        );

      if (!normalized) {
        return;
      }

      if (
        normalized.phase !==
        "league"
      ) {

        return;

      }

      if (
        normalized.completed !==
        true
      ) {

        return;

      }

      const home =
        table[
          normalized.home
        ];

      const away =
        table[
          normalized.away
        ];


      if (!home || !away) {
        return;
      }


      const homeScore =
        Number(
          normalized.homeScore
        );

      const awayScore =
        Number(
          normalized.awayScore
        );


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

        home.points += 3;

        away.losses++;

      } else if (
        homeScore <
        awayScore
      ) {

        away.wins++;

        away.points += 3;

        home.losses++;

      } else {

        home.draws++;

        away.draws++;

        home.points++;

        away.points++;

      }

    }
  );


  /* =========================
     CALCULATE GD
  ========================= */

  Object.values(
    table
  ).forEach(
    team => {

      team.goalDifference =
        team.goalsFor -
        team.goalsAgainst;

    }
  );


  /* =========================
     SORT TABLE
  ========================= */

  return Object.values(
    table
  ).sort(
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

}


/* =========================
   DISPLAY TABLE
========================= */

function renderLeagueTable() {

  const tableContainer =
    document.getElementById(
      "leagueTable"
    );


  if (!tableContainer) {
    return;
  }


  const table =
    calculateLeagueTable();


  if (table.length === 0) {

    tableContainer.innerHTML =
      `
        <div class="match-card">
          No teams available for the league table.
        </div>
      `;

    return;

  }


  let rows = "";


  table.forEach(
    (team, index) => {

      rows +=
        `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${escapeHtml(
                team.name
              )}
            </td>

            <td>
              ${team.played}
            </td>

            <td>
              ${team.wins}
            </td>

            <td>
              ${team.draws}
            </td>

            <td>
              ${team.losses}
            </td>

            <td>
              ${team.goalsFor}
            </td>

            <td>
              ${team.goalsAgainst}
            </td>

            <td>
              ${team.goalDifference}
            </td>

            <td>
              <strong>
                ${team.points}
              </strong>
            </td>

          </tr>
        `;

    }
  );


  tableContainer.innerHTML =
    `
      <div style="overflow-x:auto;">

        <table
          style="
            width:100%;
            border-collapse:collapse;
            min-width:760px;
          "
        >

          <thead>

            <tr>

              <th>Pos</th>

              <th>Team</th>

              <th>P</th>

              <th>W</th>

              <th>D</th>

              <th>L</th>

              <th>GF</th>

              <th>GA</th>

              <th>GD</th>

              <th>Pts</th>

            </tr>

          </thead>

          <tbody>

            ${rows}

          </tbody>

        </table>

      </div>
    `;

}

/* =========================================================
   PART 8 — QUALIFICATION + RANDOM KNOCKOUT DRAW
   ========================================================= */


/* =========================
   CHECK LEAGUE COMPLETION
========================= */

function isLeagueComplete() {

  const fixtures =
    Array.isArray(
      championsData.fixtures
    )
      ? championsData.fixtures.filter(
          fixture =>
            fixture.phase === "league"
        )
      : [];


  if (fixtures.length === 0) {

    return false;

  }


  return fixtures.every(
    fixture =>
      fixture.completed === true ||
      fixture.status === "completed"
  );

}


/* =========================
   GET QUALIFIED TEAMS
========================= */

function getQualifiedTeams() {

  const table =
    calculateLeagueTable();


  const qualifiedCount =
    getQualifiedCount(
      table.length
    );


  if (
    qualifiedCount === 0
  ) {

    return [];

  }


  return table
    .slice(
      0,
      qualifiedCount
    )
    .map(
      team =>
        findTeamById(
          team.id
        ) || {
          id: team.id,
          name: team.name
        }
    );

}


/* =========================
   SHUFFLE QUALIFIED TEAMS
========================= */

function shuffleQualifiedTeams(
  teams
) {

  return shuffleTeams(
    teams
  );

}


/* =========================
   CREATE KNOCKOUT MATCH
========================= */

function createKnockoutMatch(
  homeTeam,
  awayTeam,
  round,
  index
) {

  return {

    id:
      `knockout-${Date.now()}-${round}-${index}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    phase:
      "knockout",

    round:
      round,

    home:
      getTeamId(homeTeam),

    away:
      getTeamId(awayTeam),

    homeName:
      getTeamName(homeTeam),

    awayName:
      getTeamName(awayTeam),

    homeScore:
      null,

    awayScore:
      null,

    status:
      "scheduled",

    completed:
      false,

    winner:
      null

  };

}


/* =========================
   ROUND NAME
========================= */

function getKnockoutRoundName(
  teamCount
) {

  if (teamCount === 8) {

    return "Quarter-final";

  }

  if (teamCount === 16) {

    return "Round of 16";

  }

  return "Round of 32";

}


/* =========================
   GENERATE FIRST KNOCKOUT ROUND
========================= */

function generateKnockout() {

  if (!championsData.started) {

    throw new Error(
      "The competition has not started."
    );

  }


  if (!isLeagueComplete()) {

    throw new Error(
      "All league matches must be completed before the knockout draw."
    );

  }


  const qualifiedTeams =
    getQualifiedTeams();


  if (
    qualifiedTeams.length !== 8 &&
    qualifiedTeams.length !== 16 &&
    qualifiedTeams.length !== 32
  ) {

    throw new Error(
      "The number of qualified teams is invalid."
    );

  }


  const randomizedTeams =
    shuffleQualifiedTeams(
      qualifiedTeams
    );


  const round =
    getKnockoutRoundName(
      randomizedTeams.length
    );


  const matches = [];


  for (
    let i = 0;
    i < randomizedTeams.length;
    i += 2
  ) {

    matches.push(
      createKnockoutMatch(
        randomizedTeams[i],
        randomizedTeams[i + 1],
        round,
        matches.length
      )
    );

  }


  championsData.knockoutRound = {

    round:
      round,

    matches:
      matches

  };


  championsData.winner =
    null;


  return matches;

}


/* =========================
   GENERATE KNOCKOUT BUTTON
========================= */

if (generateKnockoutButton) {

  generateKnockoutButton.addEventListener(
    "click",
    async () => {

      try {

        if (
          championsData.knockoutRound
        ) {

          const replaceDraw =
            window.confirm(
              "A knockout draw already exists. Generate a new random draw?"
            );

          if (!replaceDraw) {
            return;
          }

        }


        const matches =
          generateKnockout();


        await saveChampionsData();


        if (knockoutMessage) {

          knockoutMessage.textContent =
            `${matches.length} ${championsData.knockoutRound.round} matches generated.`;

          knockoutMessage.className =
            "message status-live";

        }


        renderKnockout();

        updateCompetitionStatus();


      } catch (error) {

        console.error(
          "Knockout generation error:",
          error
        );


        if (knockoutMessage) {

          knockoutMessage.textContent =
            error.message ||
            "Unable to generate knockout draw.";

          knockoutMessage.className =
            "message status-warning";

        }

      }

    }
  );

}


/* =========================
   RENDER KNOCKOUT
========================= */

function renderKnockout() {

  if (!knockoutResultsList) {
    return;
  }


  knockoutResultsList.innerHTML =
    "";


  const knockout =
    championsData.knockoutRound;


  if (!knockout) {

    knockoutResultsList.innerHTML =
      `
        <div class="match-card">
          Knockout draw has not been generated yet.
        </div>
      `;

    return;

  }


  const matches =
    Array.isArray(
      knockout.matches
    )
      ? knockout.matches
      : [];


  const heading =
    document.createElement(
      "h3"
    );

  heading.textContent =
    knockout.round;


  knockoutResultsList.appendChild(
    heading
  );


  matches.forEach(
    (match, index) => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "match-card";


      card.innerHTML =
        `
          <h3>
            ${escapeHtml(
              knockout.round
            )}
            ${index + 1}
          </h3>

          <p>
            <strong>
              ${escapeHtml(
                match.homeName ||
                "Unknown Team"
              )}
            </strong>

            vs

            <strong>
              ${escapeHtml(
                match.awayName ||
                "Unknown Team"
              )}
            </strong>
          </p>

          <p class="message">
            ${
              match.completed
                ? `Result: ${match.homeScore} - ${match.awayScore}`
                : "Match not played yet."
            }
          </p>
        `;


      knockoutResultsList.appendChild(
        card
      );

    }
  );

}

/* =========================================================
   PART 9 — KNOCKOUT RESULTS + AUTOMATIC ADVANCEMENT
   ========================================================= */


/* =========================
   KNOCKOUT SCORE VALIDATION
========================= */

function validateKnockoutScore(
  value
) {

  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {

    return false;

  }

  const score =
    Number(value);

  return (
    Number.isInteger(score) &&
    score >= 0
  );

}


/* =========================
   DETERMINE KNOCKOUT WINNER
========================= */

function determineKnockoutWinner(
  match
) {

  const homeScore =
    Number(
      match.homeScore
    );

  const awayScore =
    Number(
      match.awayScore
    );


  if (
    homeScore >
    awayScore
  ) {

    return match.home;

  }


  if (
    awayScore >
    homeScore
  ) {

    return match.away;

  }


  return null;

}


/* =========================
   CHECK ROUND COMPLETE
========================= */

function isKnockoutRoundComplete() {

  const knockout =
    championsData.knockoutRound;


  if (!knockout) {
    return false;
  }


  const matches =
    Array.isArray(
      knockout.matches
    )
      ? knockout.matches
      : [];


  if (matches.length === 0) {
    return false;
  }


  return matches.every(
    match =>
      match.completed === true &&
      match.winner
  );

}


/* =========================
   NEXT ROUND NAME
========================= */

function getNextRoundName(
  currentRound
) {

  if (
    currentRound ===
    "Round of 32"
  ) {

    return "Round of 16";

  }


  if (
    currentRound ===
    "Round of 16"
  ) {

    return "Quarter-final";

  }


  if (
    currentRound ===
    "Quarter-final"
  ) {

    return "Semi-final";

  }


  if (
    currentRound ===
    "Semi-final"
  ) {

    return "Final";

  }


  return null;

}


/* =========================
   CREATE NEXT ROUND
========================= */

function createNextKnockoutRound() {

  const current =
    championsData.knockoutRound;


  if (!current) {

    throw new Error(
      "No knockout round exists."
    );

  }


  if (
    !isKnockoutRoundComplete()
  ) {

    throw new Error(
      "All matches in the current round must be completed."
    );

  }


  const nextRound =
    getNextRoundName(
      current.round
    );


  if (!nextRound) {

    return false;

  }


  const winners =
    current.matches.map(
      match =>
        findTeamById(
          match.winner
        ) || {
          id:
            match.winner,

          name:
            match.winnerName ||
            "Unknown Team"
        }
    );


  if (
    winners.length < 2
  ) {

    throw new Error(
      "Not enough teams remain for another round."
    );

  }


  const matches = [];


  for (
    let i = 0;
    i < winners.length;
    i += 2
  ) {

    const homeTeam =
      winners[i];

    const awayTeam =
      winners[i + 1];


    if (
      !homeTeam ||
      !awayTeam
    ) {

      throw new Error(
        "Unable to create the next knockout round."
      );

    }


    matches.push(
      createKnockoutMatch(
        homeTeam,
        awayTeam,
        nextRound,
        matches.length
      )
    );

  }


  championsData.knockoutRound = {

    round:
      nextRound,

    matches:
      matches

  };


  return true;

}


/* =========================
   SAVE KNOCKOUT RESULT
========================= */

async function saveKnockoutResult(
  matchId,
  homeScore,
  awayScore
) {

  if (!championsData.knockoutRound) {

    throw new Error(
      "No knockout round is active."
    );

  }


  const match =
    championsData.knockoutRound.matches.find(
      item =>
        item.id === matchId
    );


  if (!match) {

    throw new Error(
      "Knockout match could not be found."
    );

  }


  if (
    !validateKnockoutScore(
      homeScore
    ) ||
    !validateKnockoutScore(
      awayScore
    )
  ) {

    throw new Error(
      "Enter valid whole-number scores."
    );

  }


  const homeValue =
    Number(homeScore);

  const awayValue =
    Number(awayScore);


  /*
     A knockout match cannot end in a draw
     because there is currently no penalty
     shootout field in this system.
  */

  if (
    homeValue ===
    awayValue
  ) {

    throw new Error(
      "Knockout matches cannot end in a draw. Enter the final score after the winner is decided."
    );

  }


  match.homeScore =
    homeValue;

  match.awayScore =
    awayValue;

  match.winner =
    determineKnockoutWinner(
      match
    );

  match.winnerName =
    match.winner === match.home
      ? match.homeName
      : match.awayName;

  match.status =
    "completed";

  match.completed =
    true;


  await saveChampionsData();

}


/* =========================
   RENDER KNOCKOUT RESULTS
========================= */

function renderKnockoutResults() {

  if (!knockoutResultsList) {
    return;
  }


  const knockout =
    championsData.knockoutRound;


  if (!knockout) {
    return;
  }


  knockoutResultsList.innerHTML =
    "";


  const heading =
    document.createElement(
      "h3"
    );

  heading.textContent =
    knockout.round;


  knockoutResultsList.appendChild(
    heading
  );


  knockout.matches.forEach(
    (match, index) => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "match-card";


      const savedHomeScore =
        match.completed
          ? match.homeScore
          : "";

      const savedAwayScore =
        match.completed
          ? match.awayScore
          : "";


      card.innerHTML =
        `
          <h3>
            ${escapeHtml(
              knockout.round
            )}
            ${index + 1}
          </h3>

          <div class="score-row">

            <strong>
              ${escapeHtml(
                match.homeName
              )}
            </strong>

            <input
              type="number"
              min="0"
              step="1"
              class="knockout-home-score"
              value="${savedHomeScore}"
              placeholder="0"
            >

            <span>
              -
            </span>

            <input
              type="number"
              min="0"
              step="1"
              class="knockout-away-score"
              value="${savedAwayScore}"
              placeholder="0"
            >

            <strong>
              ${escapeHtml(
                match.awayName
              )}
            </strong>

          </div>

          <button
            type="button"
            class="save-knockout-button"
          >
            ${
              match.completed
                ? "Update Result"
                : "Save Result"
            }
          </button>

          <p class="message knockout-result-message"></p>
        `;


      const homeInput =
        card.querySelector(
          ".knockout-home-score"
        );

      const awayInput =
        card.querySelector(
          ".knockout-away-score"
        );

      const saveButton =
        card.querySelector(
          ".save-knockout-button"
        );

      const message =
        card.querySelector(
          ".knockout-result-message"
        );


      saveButton.addEventListener(
        "click",
        async () => {

          try {

            await saveKnockoutResult(
              match.id,
              homeInput.value,
              awayInput.value
            );


            message.textContent =
              "Knockout result saved.";

            message.className =
              "message status-live";


            renderKnockoutResults();


            /*
               Automatically create the next
               round when every match is complete.
            */

            if (
              isKnockoutRoundComplete()
            ) {

              const currentRound =
                championsData.knockoutRound.round;


              if (
                currentRound ===
                "Final"
              ) {

                championsData.winner =
                  championsData.knockoutRound
                    .matches[0]
                    .winner;


                await saveChampionsData();

                updateCompetitionStatus();

                renderWinner();

                return;

              }


              const nextRoundCreated =
                createNextKnockoutRound();


              if (
                nextRoundCreated
              ) {

                await saveChampionsData();

                renderKnockoutResults();

              }

            }

          } catch (error) {

            console.error(
              "Knockout result error:",
              error
            );


            message.textContent =
              error.message ||
              "Unable to save knockout result.";

            message.className =
              "message status-warning";

          }

        }
      );


      knockoutResultsList.appendChild(
        card
      );

    }
  );

}

/* =========================================================
   PART 10 — FINAL + WINNER + LOGOUT
   ========================================================= */


/* =========================
   RENDER WINNER
========================= */

function renderWinner() {

  const winnerContainer =
    document.getElementById(
      "winner"
    );

  if (!winnerContainer) {
    return;
  }


  if (!championsData.winner) {

    winnerContainer.innerHTML =
      `
        <div class="match-card">
          The Champions League winner has not been decided yet.
        </div>
      `;

    return;

  }


  const winnerTeam =
    findTeamById(
      championsData.winner
    );


  const winnerName =
    winnerTeam
      ? getTeamName(winnerTeam)
      : "Unknown Team";


  winnerContainer.innerHTML =
    `
      <div class="status-live">

        <h2>
          🏆 Champions League Winner
        </h2>

        <p>
          <strong>
            ${escapeHtml(
              winnerName
            )}
          </strong>
        </p>

      </div>
    `;

}


/* =========================
   FINAL STATUS
========================= */

function updateFinalStatus() {

  const knockout =
    championsData.knockoutRound;


  if (!knockout) {
    return;
  }


  if (
    knockout.round !==
    "Final"
  ) {

    return;

  }


  if (
    !Array.isArray(
      knockout.matches
    ) ||
    knockout.matches.length !== 1
  ) {

    return;

  }


  const finalMatch =
    knockout.matches[0];


  if (
    finalMatch.completed !== true
  ) {

    return;

  }


  if (!finalMatch.winner) {
    return;
  }


  championsData.winner =
    finalMatch.winner;


  renderWinner();

}


/* =========================
   LOGOUT
========================= */

if (adminLogoutButton) {

  adminLogoutButton.addEventListener(
    "click",
    async () => {

      try {

        await signOut(
          championsAuth
        );

        window.location.reload();

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

      }

    }
  );

}


/* =========================
   FINAL ADMIN REFRESH
========================= */

function refreshAllAdminSections() {

  loadSettingsIntoForm();

  renderApprovedTeams();

  renderFixtures();

  renderLeagueResults();

  renderLeagueTable();

  renderKnockout();

  renderKnockoutResults();

  updateCompetitionStatus();

  updateFinalStatus();

  renderWinner();

}


/* =========================
   KEEP KNOCKOUT DISPLAY
   UPDATED
========================= */

function refreshKnockoutDisplay() {

  renderKnockout();

  renderKnockoutResults();

  updateFinalStatus();

  renderWinner();

}


/* =========================
   INITIAL DISPLAY HOOK
========================= */

window.addEventListener(
  "championsFirebaseReady",
  () => {

    if (!firebaseReady) {
      return;
    }

    loadSettingsIntoForm();

  }
);

