/* =========================================================
   DLS COMPETITION
   CHAMPIONS LEAGUE TEST ADMIN
   champions-admin.js

   PART 1
   FIREBASE
   AUTHENTICATION
   GLOBAL DATA
   INITIAL DASHBOARD
   ========================================================= */

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADMIN_EMAIL = "obakimoprecious07@gmail.com";

const TEST_COLLECTION = "championsTest";
const TEST_DOCUMENT = "main";

const MAX_LEAGUE_MATCHES = 8;


/* =========================================================
   FIREBASE
   ========================================================= */

let db = null;
let auth = null;


/* =========================================================
   COMPETITION DATA
   ========================================================= */

let competition = {
  teams: [],

  fixtures: [],

  season: {
    started: false,
    completed: false,

    format: "champions",

    leagueMatchesPerTeam: 1,

    knockoutLegs: 1,

    startDate: "",
    endDate: ""
  },

  knockout: {
    started: false,

    completed: false,

    stage: "",

    qualificationSize: 0,

    bracket: []
  }
};


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeChampionsAdmin();

});


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeChampionsAdmin() {

  try {

    if (!window.firebaseReady) {

      showMessage(
        "adminLoginMessage",
        "Waiting for Firebase...",
        "info"
      );

      await waitForFirebase();

    }

    db = window.db;
    auth = window.auth;

    if (!db || !auth) {

      throw new Error(
        "Firebase database or authentication is unavailable."
      );

    }

    setupButtons();

    watchAdminAuth();

  } catch (error) {

    console.error(
      "Champions Admin initialization error:",
      error
    );

    showMessage(
      "adminLoginMessage",
      "Unable to initialize the admin system.",
      "error"
    );

  }

}


/* =========================================================
   WAIT FOR FIREBASE
   ========================================================= */

function waitForFirebase() {

  return new Promise((resolve, reject) => {

    let attempts = 0;

    const timer = setInterval(() => {

      attempts++;

      if (
        window.firebaseReady &&
        window.db &&
        window.auth
      ) {

        clearInterval(timer);

        resolve();

        return;

      }

      if (attempts >= 100) {

        clearInterval(timer);

        reject(
          new Error(
            "Firebase initialization timed out."
          )
        );

      }

    }, 100);

  });

}


/* =========================================================
   BUTTON SETUP
   ========================================================= */

function setupButtons() {

  const loginForm =
    document.getElementById("adminLoginForm");

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      handleAdminLogin
    );

  }


  const startSeasonButton =
    document.getElementById("startSeasonButton");

  if (startSeasonButton) {

    startSeasonButton.addEventListener(
      "click",
      startSeason
    );

  }


  const generateLeagueButton =
    document.getElementById("generateLeagueButton");

  if (generateLeagueButton) {

    generateLeagueButton.addEventListener(
      "click",
      generateLeagueFixtures
    );

  }


  const finishLeagueButton =
    document.getElementById("finishLeagueButton");

  if (finishLeagueButton) {

    finishLeagueButton.addEventListener(
      "click",
      finishLeaguePhase
    );

  }


  const addTestTeamsButton =
    document.getElementById("addTestTeamsButton");

  if (addTestTeamsButton) {

    addTestTeamsButton.addEventListener(
      "click",
      addTestTeams
    );

  }


  const clearTestTeamsButton =
    document.getElementById("clearTestTeamsButton");

  if (clearTestTeamsButton) {

    clearTestTeamsButton.addEventListener(
      "click",
      clearTestTeams
    );

  }


  const createTestBracketButton =
    document.getElementById("createTestBracketButton");

  if (createTestBracketButton) {

    createTestBracketButton.addEventListener(
      "click",
      createTestBracket
    );

  }


  const resetChampionsButton =
    document.getElementById("resetChampionsButton");

  if (resetChampionsButton) {

    resetChampionsButton.addEventListener(
      "click",
      resetChampionsTest
    );

  }


  const logoutButton =
    document.getElementById("logoutButton");

  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      logoutAdmin
    );

  }


  const leagueMatchesInput =
    document.getElementById("leagueMatchesPerTeam");

  if (leagueMatchesInput) {

    leagueMatchesInput.addEventListener(
      "change",
      updateQualificationPreview
    );

  }


  const knockoutLegsInput =
    document.getElementById("knockoutLegs");

  if (knockoutLegsInput) {

    knockoutLegsInput.addEventListener(
      "change",
      updateQualificationPreview
    );

  }

}


/* =========================================================
   ADMIN AUTH
   ========================================================= */

function watchAdminAuth() {

  onAuthStateChanged(
    auth,
    async (user) => {

      if (!user) {

        showAdminLogin();

        return;

      }

      if (
        !user.email ||
        user.email.toLowerCase() !==
          ADMIN_EMAIL.toLowerCase()
      ) {

        await signOut(auth);

        showAdminLogin();

        showMessage(
          "adminLoginMessage",
          "This account is not authorized to access the Champions League admin.",
          "error"
        );

        return;

      }

      try {

        await loadCompetition();

        showAdminDashboard();

      } catch (error) {

        console.error(
          "Admin verification error:",
          error
        );

        await signOut(auth);

        showAdminLogin();

        showMessage(
          "adminLoginMessage",
          "Unable to verify the admin account.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleAdminLogin(event) {

  event.preventDefault();

  const emailInput =
    document.getElementById("adminEmail");

  const passwordInput =
    document.getElementById("adminPassword");

  const message =
    document.getElementById("adminLoginMessage");

  const email =
    emailInput?.value.trim() || "";

  const password =
    passwordInput?.value || "";

  if (!email || !password) {

    showMessage(
      "adminLoginMessage",
      "Enter your email and password.",
      "error"
    );

    return;

  }

  if (
    email.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {

    showMessage(
      "adminLoginMessage",
      "This email is not authorized.",
      "error"
    );

    return;

  }

  if (message) {

    message.textContent =
      "Signing in...";

  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    console.error(
      "Admin login error:",
      error
    );

    let text =
      "Login failed. Check your email and password.";

    if (error.code === "auth/invalid-credential") {

      text =
        "Incorrect email or password.";

    }

    if (error.code === "auth/too-many-requests") {

      text =
        "Too many attempts. Please try again later.";

    }

    showMessage(
      "adminLoginMessage",
      text,
      "error"
    );

  }

}


/* =========================================================
   SHOW LOGIN
   ========================================================= */

function showAdminLogin() {

  const login =
    document.getElementById("adminLogin");

  const dashboard =
    document.getElementById("adminDashboard");

  if (login) {

    login.style.display = "block";

  }

  if (dashboard) {

    dashboard.style.display = "none";

  }

}


/* =========================================================
   SHOW DASHBOARD
   ========================================================= */

function showAdminDashboard() {

  const login =
    document.getElementById("adminLogin");

  const dashboard =
    document.getElementById("adminDashboard");

  if (login) {

    login.style.display = "none";

  }

  if (dashboard) {

    dashboard.style.display = "block";

  }

  renderDashboard();

}


/* =========================================================
   LOAD COMPETITION
   ========================================================= */

async function loadCompetition() {

  const reference =
    doc(
      db,
      TEST_COLLECTION,
      TEST_DOCUMENT
    );

  const snapshot =
    await getDoc(reference);

  if (!snapshot.exists()) {

    competition = {

      teams: [],

      fixtures: [],

      season: {
        started: false,
        completed: false,
        format: "champions",
        leagueMatchesPerTeam: 1,
        knockoutLegs: 1,
        startDate: "",
        endDate: ""
      },

      knockout: {
        started: false,
        completed: false,
        stage: "",
        qualificationSize: 0,
        bracket: []
      }

    };

    return;

  }

  const data =
    snapshot.data();

  competition = {

    teams: Array.isArray(data.teams)
      ? data.teams
      : [],

    fixtures: Array.isArray(data.fixtures)
      ? data.fixtures
      : [],

    season: {

      started:
        data.season?.started === true,

      completed:
        data.season?.completed === true,

      format:
        data.season?.format ||
        "champions",

      leagueMatchesPerTeam:
        Number(
          data.season?.leagueMatchesPerTeam
        ) || 1,

      knockoutLegs:
        Number(
          data.season?.knockoutLegs
        ) || 1,

      startDate:
        data.season?.startDate ||
        "",

      endDate:
        data.season?.endDate ||
        ""

    },

    knockout: {

      started:
        data.knockout?.started === true,

      completed:
        data.knockout?.completed === true,

      stage:
        data.knockout?.stage ||
        "",

      qualificationSize:
        Number(
          data.knockout?.qualificationSize
        ) || 0,

      bracket:
        Array.isArray(
          data.knockout?.bracket
        )
          ? data.knockout.bracket
          : []

    }

  };

}


/* =========================================================
   SAVE COMPETITION
   ========================================================= */

async function saveCompetition() {

  if (!db) {

    throw new Error(
      "Firebase database is not ready."
    );

  }

  const reference =
    doc(
      db,
      TEST_COLLECTION,
      TEST_DOCUMENT
    );

  await setDoc(
    reference,
    competition
  );

}


/* =========================================================
   RENDER DASHBOARD
   ========================================================= */

function renderDashboard() {

  renderAdminTeams();

  renderSeasonStatus();

  renderAdminFixtures();

  renderAdminKnockout();

  updateQualificationPreview();

}


/* =========================================================
   FORM VALUES
   ========================================================= */

function setFormValues() {

  const format =
    document.getElementById(
      "competitionFormat"
    );

  const matches =
    document.getElementById(
      "leagueMatchesPerTeam"
    );

  const legs =
    document.getElementById(
      "knockoutLegs"
    );

  const startDate =
    document.getElementById(
      "seasonStart"
    );

  const endDate =
    document.getElementById(
      "seasonEnd"
    );


  if (format) {

    format.value =
      competition.season.format;

  }

  if (matches) {

    matches.value =
      competition.season.leagueMatchesPerTeam;

  }

  if (legs) {

    legs.value =
      competition.season.knockoutLegs;

  }

  if (startDate) {

    startDate.value =
      competition.season.startDate;

  }

  if (endDate) {

    endDate.value =
      competition.season.endDate;

  }

}


/* =========================================================
   INITIAL TEAM RENDER
   ========================================================= */

function renderAdminTeams() {

  const container =
    document.getElementById(
      "adminTeamList"
    );

  if (!container) {

    return;

  }

  if (!competition.teams.length) {

    container.innerHTML =
      "<p>No test teams have been added.</p>";

    return;

  }

  container.innerHTML =
    competition.teams
      .map(
        (team, index) => `
          <div class="admin-team-row">
            <span>
              ${index + 1}. ${escapeHTML(team.name)}
            </span>
          </div>
        `
      )
      .join("");

}


/* =========================================================
   SEASON STATUS
   ========================================================= */

function renderSeasonStatus() {

  const element =
    document.getElementById(
      "seasonStatus"
    );

  if (!element) {

    return;

  }

  if (competition.season.completed) {

    element.textContent =
      "Season completed.";

    return;

  }

  if (competition.knockout.started) {

    element.textContent =
      `Knockout stage active — ${competition.knockout.stage || "Knockout"}.`;

    return;

  }

  if (competition.season.started) {

    element.textContent =
      "League phase active.";

    return;

  }

  if (competition.fixtures.length) {

    element.textContent =
      "Fixtures generated. Season is ready to start.";

    return;

  }

  element.textContent =
    "Season has not started.";

}


/* =========================================================
   QUALIFICATION PREVIEW
   ========================================================= */

function updateQualificationPreview() {

  const element =
    document.getElementById(
      "qualificationPreview"
    );

  if (!element) {

    return;

  }

  const count =
    competition.teams.length;

  let qualification = 0;
  let round = "";

  if (count >= 33) {

    qualification = 32;
    round = "Round of 32";

  } else if (count >= 17) {

    qualification = 16;
    round = "Round of 16";

  } else if (count >= 9) {

    qualification = 8;
    round = "Quarter-finals";

  }

  if (!qualification) {

    element.textContent =
      "At least 9 teams are required for the knockout stage.";

    return;

  }

  element.textContent =
    `${qualification} teams qualify for ${round}.`;

}


/* =========================================================
   MESSAGE HELPER
   ========================================================= */

function showMessage(
  elementId,
  message,
  type = "info"
) {

  const element =
    document.getElementById(elementId);

  if (!element) {

    return;

  }

  element.textContent =
    message;

  element.className =
    `message ${type}`;

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutAdmin() {

  try {

    await signOut(auth);

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }

}

/* =========================================================
   DLS COMPETITION
   CHAMPIONS LEAGUE TEST ADMIN
   champions-admin.js

   PART 2
   TEAM MANAGEMENT
   REMOVE TEAM
   SEASON CONTROLS
   START SEASON
   ========================================================= */


/* =========================================================
   GET TEAM NAME
   ========================================================= */

function getTeamName(teamId) {

  const team =
    competition.teams.find(
      team => team.id === teamId
    );

  return team?.name || "Unknown Team";

}


/* =========================================================
   RESET KNOCKOUT DATA
   ========================================================= */

function resetKnockoutData() {

  competition.knockout = {

    started: false,

    completed: false,

    stage: "",

    qualificationSize: 0,

    bracket: []

  };

}


/* =========================================================
   RENDER TEAMS
   ========================================================= */

renderAdminTeams = function () {

  const container =
    document.getElementById(
      "adminTeamList"
    );

  if (!container) {

    return;

  }


  if (!competition.teams.length) {

    container.innerHTML = `
      <p class="empty-message">
        No test teams have been added.
      </p>
    `;

    return;

  }


  const canRemove =
    !competition.season.started &&
    !competition.knockout.started;


  container.innerHTML =
    competition.teams
      .map(
        (team, index) => {

          const removeButton =
            canRemove
              ? `
                <button
                  type="button"
                  class="remove-team-button"
                  data-team-id="${escapeHTML(team.id)}"
                >
                  Remove
                </button>
              `
              : `
                <span class="team-locked">
                  Locked
                </span>
              `;


          return `
            <div
              class="admin-team-row"
              data-team-row="${escapeHTML(team.id)}"
            >

              <div class="admin-team-name">

                <strong>
                  ${index + 1}.
                </strong>

                <span>
                  ${escapeHTML(team.name)}
                </span>

              </div>

              <div class="admin-team-action">

                ${removeButton}

              </div>

            </div>
          `;

        }
      )
      .join("");


  if (canRemove) {

    container
      .querySelectorAll(
        ".remove-team-button"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const teamId =
              button.dataset.teamId;

            removeTeam(teamId);

          }
        );

      });

  }

};


/* =========================================================
   REMOVE TEAM
   ========================================================= */

async function removeTeam(teamId) {

  if (competition.season.started) {

    alert(
      "Teams cannot be removed after the season has started."
    );

    return;

  }


  if (competition.knockout.started) {

    alert(
      "Teams cannot be removed after the knockout stage has started."
    );

    return;

  }


  const team =
    competition.teams.find(
      item => item.id === teamId
    );

  if (!team) {

    return;

  }


  const confirmed =
    confirm(
      `Remove "${team.name}" from the Champions League test?`
    );

  if (!confirmed) {

    return;

  }


  competition.teams =
    competition.teams.filter(
      item => item.id !== teamId
    );


  /*
   * Any existing league fixture schedule
   * is no longer valid after a team is removed.
   *
   * Therefore the schedule is cleared and
   * can be generated again before the season.
   */

  competition.fixtures = [];


  resetKnockoutData();


  competition.season.completed =
    false;


  try {

    await saveCompetition();

    renderDashboard();

    alert(
      `"${team.name}" has been removed.\n\n` +
      "The previous fixture schedule was cleared. " +
      "Generate the fixtures again before starting the season."
    );

  } catch (error) {

    console.error(
      "Remove team error:",
      error
    );

    alert(
      "The team could not be removed. Please try again."
    );

  }

}


/* =========================================================
   ADD TEST TEAMS
   ========================================================= */

async function addTestTeams() {

  if (competition.season.started) {

    alert(
      "Teams cannot be added after the season has started."
    );

    return;

  }


  if (competition.knockout.started) {

    alert(
      "Teams cannot be added after the knockout stage has started."
    );

    return;

  }


  if (competition.fixtures.length) {

    alert(
      "Fixtures have already been generated.\n\n" +
      "Remove or reset the current teams before adding more teams."
    );

    return;

  }


  const confirmed =
    confirm(
      "Add 36 test teams to the Champions League test?"
    );

  if (!confirmed) {

    return;

  }


  const existingNames =
    new Set(
      competition.teams.map(
        team => team.name
      )
    );


  const newTeams = [];


  for (
    let number = 1;
    number <= 36;
    number++
  ) {

    const name =
      `Test Team ${number}`;


    if (existingNames.has(name)) {

      continue;

    }


    newTeams.push({

      id:
        `champions-team-${Date.now()}-${number}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      name,

      createdAt:
        Date.now()

    });

  }


  competition.teams.push(
    ...newTeams
  );


  resetKnockoutData();


  try {

    await saveCompetition();

    renderDashboard();

    alert(
      `${newTeams.length} test team(s) added.`
    );

  } catch (error) {

    console.error(
      "Add test teams error:",
      error
    );

    alert(
      "The test teams could not be added."
    );

  }

}


/* =========================================================
   CLEAR TEST TEAMS
   ========================================================= */

async function clearTestTeams() {

  if (competition.season.started) {

    alert(
      "Teams cannot be cleared after the season has started."
    );

    return;

  }


  if (competition.knockout.started) {

    alert(
      "The competition has already entered the knockout stage."
    );

    return;

  }


  if (!competition.teams.length) {

    alert(
      "There are no teams to clear."
    );

    return;

  }


  const confirmed =
    confirm(
      "Clear ALL Champions League test teams and fixtures?"
    );

  if (!confirmed) {

    return;

  }


  competition.teams = [];

  competition.fixtures = [];


  competition.season = {

    started: false,

    completed: false,

    format: "champions",

    leagueMatchesPerTeam: 1,

    knockoutLegs: 1,

    startDate: "",

    endDate: ""

  };


  resetKnockoutData();


  try {

    await saveCompetition();

    renderDashboard();

    alert(
      "All Champions League test data has been cleared."
    );

  } catch (error) {

    console.error(
      "Clear teams error:",
      error
    );

    alert(
      "The test data could not be cleared."
    );

  }

}


/* =========================================================
   START SEASON
   ========================================================= */

async function startSeason() {

  if (competition.season.started) {

    alert(
      "The season has already started."
    );

    return;

  }


  if (competition.knockout.started) {

    alert(
      "The knockout stage has already started."
    );

    return;

  }


  if (competition.teams.length < 9) {

    alert(
      "At least 9 teams are required."
    );

    return;

  }


  /*
   * IMPORTANT:
   *
   * Fixtures MUST already exist.
   *
   * The season does NOT generate fixtures.
   */

  const leagueFixtures =
    competition.fixtures.filter(
      fixture =>
        fixture.type === "league"
    );


  if (!leagueFixtures.length) {

    alert(
      "Generate the league fixtures before starting the season."
    );

    return;

  }


  const matchesInput =
    document.getElementById(
      "leagueMatchesPerTeam"
    );

  const legsInput =
    document.getElementById(
      "knockoutLegs"
    );

  const startInput =
    document.getElementById(
      "seasonStart"
    );

  const endInput =
    document.getElementById(
      "seasonEnd"
    );


  const matchesPerTeam =
    Math.max(
      1,
      Math.min(
        MAX_LEAGUE_MATCHES,
        Number(
          matchesInput?.value || 1
        )
      )
    );


  const knockoutLegs =
    Number(
      legsInput?.value || 1
    ) === 2
      ? 2
      : 1;


  /*
   * The fixture generator in Part 3
   * provides this validation function.
   */

  const validation =
    validateLeagueSchedule(
      matchesPerTeam
    );


  if (!validation.valid) {

    alert(
      validation.message
    );

    return;

  }


  const confirmed =
    confirm(
      "Start the Champions League season?\n\n" +
      "After starting:\n" +
      "• Teams cannot be removed.\n" +
      "• Teams cannot be added.\n" +
      "• League settings will be locked.\n" +
      "• Fixtures cannot be regenerated."
    );

  if (!confirmed) {

    return;

  }


  competition.season.started =
    true;

  competition.season.completed =
    false;

  competition.season.format =
    "champions";

  competition.season.leagueMatchesPerTeam =
    matchesPerTeam;

  competition.season.knockoutLegs =
    knockoutLegs;

  competition.season.startDate =
    startInput?.value || "";

  competition.season.endDate =
    endInput?.value || "";


  resetKnockoutData();


  try {

    await saveCompetition();

    renderDashboard();

    alert(
      "Champions League season started successfully."
    );

  } catch (error) {

    /*
     * Roll back the local change if Firebase
     * fails, so the screen does not falsely
     * show an active season.
     */

    competition.season.started =
      false;

    console.error(
      "Start season error:",
      error
    );

    alert(
      "The season could not be started. Please try again."
    );

  }

}


/* =========================================================
   SEASON STATUS
   ========================================================= */

renderSeasonStatus = function () {

  const element =
    document.getElementById(
      "seasonStatus"
    );

  if (!element) {

    return;

  }


  if (competition.season.completed) {

    element.textContent =
      "Season completed.";

  } else if (competition.knockout.started) {

    element.textContent =
      `Knockout stage active — ${
        competition.knockout.stage ||
        "Knockout"
      }.`;

  } else if (competition.season.started) {

    element.textContent =
      "League phase active.";

  } else if (competition.fixtures.length) {

    element.textContent =
      "Fixtures generated. Season is ready to start.";

  } else if (competition.teams.length) {

    element.textContent =
      "Teams added. Generate fixtures before starting the season.";

  } else {

    element.textContent =
      "Add teams to begin the Champions League test.";

  }

};


/* =========================================================
   FORM VALUES
   ========================================================= */

setFormValues = function () {

  const format =
    document.getElementById(
      "competitionFormat"
    );

  const matches =
    document.getElementById(
      "leagueMatchesPerTeam"
    );

  const legs =
    document.getElementById(
      "knockoutLegs"
    );

  const startDate =
    document.getElementById(
      "seasonStart"
    );

  const endDate =
    document.getElementById(
      "seasonEnd"
    );


  if (format) {

    format.value =
      competition.season.format;

  }

  if (matches) {

    matches.value =
      competition.season.leagueMatchesPerTeam;

  }

  if (legs) {

    legs.value =
      competition.season.knockoutLegs;

  }

  if (startDate) {

    startDate.value =
      competition.season.startDate;

  }

  if (endDate) {

    endDate.value =
      competition.season.endDate;

  }

};


/* =========================================================
   END PART 2
   ========================================================= */

/* =========================================================
   DLS COMPETITION
   CHAMPIONS LEAGUE TEST ADMIN
   champions-admin.js

   PART 3
   RANDOMIZED LEAGUE FIXTURES
   FIXTURE VALIDATION
   ========================================================= */


/* =========================================================
   SHUFFLE ARRAY
   ========================================================= */

function shuffleArray(array) {

  const result =
    [...array];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    const randomIndex =
      Math.floor(
        Math.random() * (i + 1)
      );

    [
      result[i],
      result[randomIndex]
    ] = [
      result[randomIndex],
      result[i]
    ];

  }

  return result;

}


/* =========================================================
   GENERATE LEAGUE FIXTURES
   ========================================================= */

async function generateLeagueFixtures() {

  /*
   * Fixtures are generated BEFORE
   * the season starts.
   */

  if (competition.season.started) {

    alert(
      "Fixtures cannot be generated after the season has started."
    );

    return;

  }


  if (competition.knockout.started) {

    alert(
      "The knockout stage has already started."
    );

    return;

  }


  if (competition.teams.length < 9) {

    alert(
      "At least 9 teams are required before fixtures can be generated."
    );

    return;

  }


  if (competition.fixtures.length) {

    alert(
      "League fixtures have already been generated.\n\n" +
      "They cannot be regenerated unless the competition is reset or a team is removed."
    );

    return;

  }


  const matchesInput =
    document.getElementById(
      "leagueMatchesPerTeam"
    );


  const matchesPerTeam =
    Math.max(
      1,
      Math.min(
        MAX_LEAGUE_MATCHES,
        Number(
          matchesInput?.value || 1
        )
      )
    );


  if (
    !Number.isInteger(
      matchesPerTeam
    )
  ) {

    alert(
      "Enter a valid number of league matches per team."
    );

    return;

  }


  const confirmed =
    confirm(
      `Generate ${matchesPerTeam} league match${
        matchesPerTeam === 1
          ? ""
          : "es"
      } per team?\n\n` +
      "The fixtures will be randomized and each opponent pairing will appear only once."
    );


  if (!confirmed) {

    return;

  }


  let fixtures;

  try {

    fixtures =
      createLeagueFixtures(
        matchesPerTeam
      );

  } catch (error) {

    console.error(
      "Fixture generation error:",
      error
    );

    alert(
      error.message ||
      "The league fixtures could not be generated."
    );

    return;

  }


  if (!fixtures.length) {

    alert(
      "No league fixtures were generated."
    );

    return;

  }


  competition.fixtures =
    fixtures;


  /*
   * Store the selected number now.
   * Starting the season later will lock it.
   */

  competition.season.leagueMatchesPerTeam =
    matchesPerTeam;


  resetKnockoutData();


  try {

    await saveCompetition();

    renderDashboard();

    alert(
      `${fixtures.length} league fixtures generated successfully.\n\n` +
      "You can now start the season."
    );

  } catch (error) {

    console.error(
      "Save fixture error:",
      error
    );

    /*
     * Do not leave unsaved fixtures
     * appearing on screen.
     */

    competition.fixtures = [];

    renderDashboard();

    alert(
      "The fixtures could not be saved. Please try again."
    );

  }

}


/* =========================================================
   CREATE LEAGUE FIXTURES
   ========================================================= */

function createLeagueFixtures(
  matchesPerTeam
) {

  const teams =
    shuffleArray(
      competition.teams
    );


  if (teams.length < 2) {

    throw new Error(
      "There are not enough teams to create fixtures."
    );

  }


  /*
   * Circle-method scheduling.
   *
   * The teams are shuffled first, so the
   * resulting fixture order is randomized.
   *
   * Every round creates one match per
   * available team.
   *
   * No pair is repeated until the full
   * round-robin cycle has been exhausted.
   */


  const workingTeams =
    [...teams];


  /*
   * An odd number of teams requires
   * a BYE position.
   */

  if (
    workingTeams.length % 2 !== 0
  ) {

    workingTeams.push(null);

  }


  const totalTeams =
    workingTeams.length;


  const roundsAvailable =
    totalTeams - 1;


  if (
    matchesPerTeam > roundsAvailable
  ) {

    throw new Error(
      `With ${competition.teams.length} teams, ` +
      `a maximum of ${roundsAvailable} unique opponents ` +
      `is available per team.`
    );

  }


  const fixedTeam =
    workingTeams[0];


  let rotatingTeams =
    workingTeams.slice(1);


  const fixtures = [];

  const usedPairs =
    new Set();


  /*
   * Only the requested number of rounds
   * is generated.
   */

  for (
    let roundIndex = 0;
    roundIndex < matchesPerTeam;
    roundIndex++
  ) {

    const roundTeams = [
      fixedTeam,
      ...rotatingTeams
    ];


    for (
      let matchIndex = 0;
      matchIndex < totalTeams / 2;
      matchIndex++
    ) {

      const firstTeam =
        roundTeams[matchIndex];


      const secondTeam =
        roundTeams[
          totalTeams - 1 - matchIndex
        ];


      /*
       * BYE
       */

      if (
        !firstTeam ||
        !secondTeam
      ) {

        continue;

      }


      const sortedIds = [
        firstTeam.id,
        secondTeam.id
      ].sort();


      const pairKey =
        sortedIds.join("::");


      if (
        usedPairs.has(pairKey)
      ) {

        continue;

      }


      usedPairs.add(pairKey);


      /*
       * Randomize home and away.
       */

      const firstIsHome =
        Math.random() >= 0.5;


      const homeTeam =
        firstIsHome
          ? firstTeam
          : secondTeam;


      const awayTeam =
        firstIsHome
          ? secondTeam
          : firstTeam;


      fixtures.push({

        id:
          `league-${Date.now()}-${fixtures.length + 1}`,

        type:
          "league",

        round:
          "league",

        roundNumber:
          roundIndex + 1,

        homeId:
          homeTeam.id,

        awayId:
          awayTeam.id,

        homeScore:
          null,

        awayScore:
          null,

        played:
          false

      });

    }


    /*
     * Circle rotation.
     *
     * The first team stays fixed.
     * The remaining teams rotate.
     */

    rotatingTeams = [
      rotatingTeams[
        rotatingTeams.length - 1
      ],
      ...rotatingTeams.slice(
        0,
        rotatingTeams.length - 1
      )
    ];

  }


  /*
   * Randomize the final fixture order as well.
   *
   * This prevents the admin page from always
   * displaying fixtures round-by-round.
   */

  return shuffleArray(
    fixtures
  );

}


/* =========================================================
   VALIDATE LEAGUE SCHEDULE
   ========================================================= */

function validateLeagueSchedule(
  matchesPerTeam
) {

  const teams =
    competition.teams;


  if (teams.length < 9) {

    return {

      valid: false,

      message:
        "At least 9 teams are required."

    };

  }


  const leagueFixtures =
    competition.fixtures.filter(
      fixture =>
        fixture.type === "league"
    );


  if (!leagueFixtures.length) {

    return {

      valid: false,

      message:
        "No league fixtures have been generated."

    };

  }


  /*
   * Count matches for every team.
   */

  const matchCounts =
    new Map();


  teams.forEach(team => {

    matchCounts.set(
      team.id,
      0
    );

  });


  const usedPairs =
    new Set();


  for (
    const fixture of leagueFixtures
  ) {

    if (
      !fixture.homeId ||
      !fixture.awayId
    ) {

      return {

        valid: false,

        message:
          "A league fixture contains a missing team."

      };

    }


    if (
      !matchCounts.has(
        fixture.homeId
      ) ||
      !matchCounts.has(
        fixture.awayId
      )
    ) {

      return {

        valid: false,

        message:
          "A league fixture contains a team that no longer exists."

      };

    }


    if (
      fixture.homeId ===
      fixture.awayId
    ) {

      return {

        valid: false,

        message:
          "A team cannot play against itself."

      };

    }


    matchCounts.set(
      fixture.homeId,
      matchCounts.get(
        fixture.homeId
      ) + 1
    );


    matchCounts.set(
      fixture.awayId,
      matchCounts.get(
        fixture.awayId
      ) + 1
    );


    /*
     * Detect duplicate opponent pairings.
     */

    const pair =
      [
        fixture.homeId,
        fixture.awayId
      ].sort().join("::");


    if (
      usedPairs.has(pair)
    ) {

      return {

        valid: false,

        message:
          "Duplicate opponent pairing detected in the league fixtures."

      };

    }


    usedPairs.add(pair);

  }


  /*
   * Even team counts:
   *
   * Every team must have exactly the
   * requested number of matches.
   *
   * Odd team counts:
   *
   * A bye is mathematically necessary,
   * so match counts can differ by one.
   */

  const counts =
    [...matchCounts.values()];


  const minimum =
    Math.min(...counts);


  const maximum =
    Math.max(...counts);


  if (
    teams.length % 2 === 0
  ) {

    const incorrect =
      counts.some(
        count =>
          count !== matchesPerTeam
      );


    if (incorrect) {

      return {

        valid: false,

        message:
          "The generated fixture schedule does not give every team the requested number of matches."

      };

    }

  } else {

    if (
      maximum > matchesPerTeam ||
      minimum < matchesPerTeam - 1 ||
      maximum - minimum > 1
    ) {

      return {

        valid: false,

        message:
          "The fixture schedule is not balanced correctly for the number of teams."

      };

    }

  }


  return {

    valid: true,

    message:
      "League fixture schedule is valid."

  };

}


/* =========================================================
   GET TEAM MATCH COUNT
   ========================================================= */

function getTeamLeagueMatchCount(
  teamId
) {

  return competition.fixtures.filter(
    fixture =>
      fixture.type === "league" &&
      (
        fixture.homeId === teamId ||
        fixture.awayId === teamId
      )
  ).length;

}


/* =========================================================
   GET TOTAL LEAGUE FIXTURES
   ========================================================= */

function getLeagueFixtures() {

  return competition.fixtures.filter(
    fixture =>
      fixture.type === "league"
  );

}


/* =========================================================
   GET COMPLETED LEAGUE FIXTURES
   ========================================================= */

function getCompletedLeagueFixtures() {

  return getLeagueFixtures().filter(
    fixture =>
      fixture.played === true &&
      Number.isFinite(
        Number(fixture.homeScore)
      ) &&
      Number.isFinite(
        Number(fixture.awayScore)
      )
  );

}


/* =========================================================
   GET PENDING LEAGUE FIXTURES
   ========================================================= */

function getPendingLeagueFixtures() {

  return getLeagueFixtures().filter(
    fixture =>
      !(
        fixture.played === true &&
        Number.isFinite(
          Number(fixture.homeScore)
        ) &&
        Number.isFinite(
          Number(fixture.awayScore)
        )
      )
  );

}


/* =========================================================
   END PART 3
   ========================================================= */

/* =========================================================
   DLS COMPETITION
   CHAMPIONS LEAGUE TEST ADMIN
   champions-admin.js

   PART 4
   LEAGUE FIXTURE DISPLAY
   INDIVIDUAL SCORE ENTRY
   LEAGUE COMPLETION CHECK
   AUTOMATIC KNOCKOUT TRIGGER
   ========================================================= */


/* =========================================================
   RENDER ADMIN LEAGUE FIXTURES
   ========================================================= */

renderAdminFixtures = function () {

  const container =
    document.getElementById(
      "adminFixtureList"
    );

  if (!container) {

    return;

  }


  const fixtures =
    getLeagueFixtures();


  if (!fixtures.length) {

    container.innerHTML = `
      <div class="empty-message">
        No league fixtures have been generated yet.
      </div>
    `;

    return;

  }


  const sortedFixtures =
    [...fixtures].sort(
      (a, b) => {

        const roundA =
          Number(
            a.roundNumber || 0
          );

        const roundB =
          Number(
            b.roundNumber || 0
          );

        if (
          roundA !== roundB
        ) {

          return roundA - roundB;

        }

        return String(a.id)
          .localeCompare(
            String(b.id)
          );

      }
    );


  container.innerHTML =
    sortedFixtures
      .map(
        fixture => {

          const originalIndex =
            competition.fixtures.findIndex(
              item =>
                item.id === fixture.id
            );


          const homeName =
            getTeamName(
              fixture.homeId
            );


          const awayName =
            getTeamName(
              fixture.awayId
            );


          const hasScore =
            fixture.played === true &&
            Number.isFinite(
              Number(
                fixture.homeScore
              )
            ) &&
            Number.isFinite(
              Number(
                fixture.awayScore
              )
            );


          const homeValue =
            hasScore
              ? fixture.homeScore
              : "";


          const awayValue =
            hasScore
              ? fixture.awayScore
              : "";


          const status =
            hasScore
              ? `
                <span class="fixture-status played">
                  Played
                </span>
              `
              : `
                <span class="fixture-status pending">
                  Pending
                </span>
              `;


          return `
            <div
              class="admin-fixture-card"
              data-fixture-id="${escapeHTML(
                fixture.id
              )}"
            >

              <div class="fixture-header">

                <span>
                  Match ${escapeHTML(
                    String(
                      originalIndex + 1
                    )
                  )}
                </span>

                <span>
                  League
                </span>

                ${status}

              </div>


              <div class="fixture-teams">

                <div class="fixture-team">

                  <span class="fixture-team-name">
                    ${escapeHTML(
                      homeName
                    )}
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    class="league-score-input"
                    data-score-fixture="${escapeHTML(
                      fixture.id
                    )}"
                    data-score-side="home"
                    value="${escapeHTML(
                      String(homeValue)
                    )}"
                    ${competition.knockout.started
                      ? "disabled"
                      : ""}
                  >

                </div>


                <div class="fixture-separator">
                  -
                </div>


                <div class="fixture-team">

                  <input
                    type="number"
                    min="0"
                    step="1"
                    class="league-score-input"
                    data-score-fixture="${escapeHTML(
                      fixture.id
                    )}"
                    data-score-side="away"
                    value="${escapeHTML(
                      String(awayValue)
                    )}"
                    ${competition.knockout.started
                      ? "disabled"
                      : ""}
                  >

                  <span class="fixture-team-name">
                    ${escapeHTML(
                      awayName
                    )}
                  </span>

                </div>

              </div>


              <div class="fixture-actions">

                <button
                  type="button"
                  class="save-league-result-button"
                  data-save-fixture="${escapeHTML(
                    fixture.id
                  )}"
                  ${competition.knockout.started
                    ? "disabled"
                    : ""}
                >
                  ${hasScore
                    ? "Update Score"
                    : "Save Score"}
                </button>

              </div>

            </div>
          `;

        }
      )
      .join("");


  /*
   * Attach an event to EACH fixture's
   * own Save Score button.
   *
   * The fixture ID is used.
   *
   * We NEVER save all fixtures at once.
   */

  container
    .querySelectorAll(
      "[data-save-fixture]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const fixtureId =
            button.dataset.saveFixture;

          saveLeagueResultById(
            fixtureId
          );

        }
      );

    });

};


/* =========================================================
   FIND LEAGUE FIXTURE BY ID
   ========================================================= */

function getLeagueFixtureById(
  fixtureId
) {

  return competition.fixtures.find(
    fixture =>
      fixture.id === fixtureId &&
      fixture.type === "league"
  );

}


/* =========================================================
   SAVE LEAGUE RESULT BY FIXTURE ID
   ========================================================= */

async function saveLeagueResultById(
  fixtureId
) {

  if (!competition.season.started) {

    alert(
      "The season has not started yet."
    );

    return;

  }


  if (competition.knockout.started) {

    alert(
      "The league phase is already finished."
    );

    return;

  }


  const fixture =
    getLeagueFixtureById(
      fixtureId
    );


  if (!fixture) {

    alert(
      "The selected fixture could not be found."
    );

    return;

  }


  /*
   * Find ONLY this fixture's inputs.
   *
   * This is deliberately scoped to the
   * selected fixture card.
   */

  const fixtureCard =
    document.querySelector(
      `[data-fixture-id="${CSS.escape(
        fixtureId
      )}"]`
    );


  if (!fixtureCard) {

    alert(
      "The selected fixture is not visible."
    );

    return;

  }


  const homeInput =
    fixtureCard.querySelector(
      '[data-score-side="home"]'
    );


  const awayInput =
    fixtureCard.querySelector(
      '[data-score-side="away"]'
    );


  if (!homeInput || !awayInput) {

    alert(
      "The score fields could not be found."
    );

    return;

  }


  const homeText =
    homeInput.value.trim();


  const awayText =
    awayInput.value.trim();


  if (
    homeText === "" ||
    awayText === ""
  ) {

    alert(
      "Enter both scores before saving."
    );

    return;

  }


  const homeScore =
    Number(homeText);


  const awayScore =
    Number(awayText);


  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore)
  ) {

    alert(
      "Scores must be whole numbers."
    );

    return;

  }


  if (
    homeScore < 0 ||
    awayScore < 0
  ) {

    alert(
      "Scores cannot be negative."
    );

    return;

  }


  const confirmed =
    confirm(
      `${getTeamName(
        fixture.homeId
      )} ${homeScore} - ${awayScore} ${getTeamName(
        fixture.awayId
      )}\n\nSave this result?`
    );


  if (!confirmed) {

    return;

  }


  /*
   * IMPORTANT:
   *
   * Only the selected fixture is modified.
   *
   * No other fixture is touched.
   */

  fixture.homeScore =
    homeScore;

  fixture.awayScore =
    awayScore;

  fixture.played =
    true;


  try {

    await saveCompetition();


    /*
     * Re-render the league so the saved
     * result is visible.
     */

    renderAdminFixtures();


    /*
     * Update standings immediately.
     */

    renderAdminKnockout();


    /*
     * Check whether ALL league matches
     * are actually complete.
     *
     * The knockout is NOT created after
     * one result.
     */

    await checkLeaguePhaseCompletion();

  } catch (error) {

    console.error(
      "Save league result error:",
      error
    );

    /*
     * Roll back ONLY this fixture.
     */

    fixture.homeScore = null;

    fixture.awayScore = null;

    fixture.played = false;


    alert(
      "The result could not be saved. Please try again."
    );


    renderAdminFixtures();

  }

}


/* =========================================================
   CHECK LEAGUE COMPLETION
   ========================================================= */

async function checkLeaguePhaseCompletion() {

  if (!competition.season.started) {

    return false;

  }


  if (competition.knockout.started) {

    return true;

  }


  const leagueFixtures =
    getLeagueFixtures();


  if (!leagueFixtures.length) {

    return false;

  }


  /*
   * Every fixture must have:
   *
   * played === true
   * valid home score
   * valid away score
   */

  const allComplete =
    leagueFixtures.every(
      fixture =>
        fixture.played === true &&
        Number.isInteger(
          Number(
            fixture.homeScore
          )
        ) &&
        Number.isInteger(
          Number(
            fixture.awayScore
          )
        ) &&
        Number(
          fixture.homeScore
        ) >= 0 &&
        Number(
          fixture.awayScore
        ) >= 0
    );


  if (!allComplete) {

    return false;

  }


  /*
   * EVERYTHING is complete.
   *
   * Only now can the knockout be created.
   */

  const pending =
    getPendingLeagueFixtures();


  if (pending.length > 0) {

    return false;

  }


  try {

    const created =
      createKnockoutFromStandings();


    if (!created) {

      return false;

    }


    await saveCompetition();


    renderDashboard();


    alert(
      "All league fixtures have been completed.\n\n" +
      "The final league table has been calculated and the knockout bracket has been created."
    );


    return true;

  } catch (error) {

    console.error(
      "Automatic knockout creation error:",
      error
    );

    alert(
      "The league is complete, but the knockout bracket could not be created. " +
      "Please use Finish League to try again."
    );

    return false;

  }

}


/* =========================================================
   MANUAL FINISH LEAGUE SAFETY BUTTON
   ========================================================= */

async function finishLeaguePhase() {

  if (!competition.season.started) {

    alert(
      "The season has not started."
    );

    return;

  }


  if (competition.knockout.started) {

    alert(
      "The knockout stage has already been created."
    );

    return;

  }


  const pending =
    getPendingLeagueFixtures();


  if (pending.length) {

    alert(
      `The league is not finished yet.\n\n` +
      `${pending.length} fixture${
        pending.length === 1
          ? ""
          : "s"
      } still need a result.`
    );

    return;

  }


  await checkLeaguePhaseCompletion();

}


/* =========================================================
   GET LEAGUE COMPLETION STATUS
   ========================================================= */

function getLeagueCompletionStatus() {

  const fixtures =
    getLeagueFixtures();


  const completed =
    getCompletedLeagueFixtures();


  return {

    total:
      fixtures.length,

    completed:
      completed.length,

    remaining:
      fixtures.length -
      completed.length,

    complete:
      fixtures.length > 0 &&
      completed.length === fixtures.length

  };

}


/* =========================================================
   GLOBAL RESULT FUNCTIONS
   ========================================================= */

window.saveChampionsLeagueResult =
  saveLeagueResultById;


/* =========================================================
   END PART 4
   ========================================================= */

// =========================================================
// DLS COMPETITION
// CHAMPIONS LEAGUE TEST ADMIN
// champions-admin.js
//
// PART 5 — STANDINGS, RANDOM KNOCKOUT DRAW
//          & BRACKET DATA
// =========================================================


// =========================================================
// CALCULATE FINAL LEAGUE STANDINGS
// =========================================================

function calculateStandings() {

  const standings = competition.teams.map(team => ({
    id: team.id,
    name: team.name,

    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,

    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,

    points: 0
  }));


  const teamMap = new Map(
    standings.map(team => [team.id, team])
  );


  competition.fixtures
    .filter(fixture =>
      fixture.type === "league" &&
      fixture.played === true
    )
    .forEach(fixture => {

      const home = teamMap.get(fixture.homeId);
      const away = teamMap.get(fixture.awayId);

      if (!home || !away) {
        return;
      }


      const homeScore = Number(fixture.homeScore);
      const awayScore = Number(fixture.awayScore);


      if (
        !Number.isInteger(homeScore) ||
        !Number.isInteger(awayScore) ||
        homeScore < 0 ||
        awayScore < 0
      ) {
        return;
      }


      home.played++;
      away.played++;


      home.goalsFor += homeScore;
      home.goalsAgainst += awayScore;

      away.goalsFor += awayScore;
      away.goalsAgainst += homeScore;


      if (homeScore > awayScore) {

        home.wins++;
        home.points += 3;

        away.losses++;

      } else if (homeScore < awayScore) {

        away.wins++;
        away.points += 3;

        home.losses++;

      } else {

        home.draws++;
        away.draws++;

        home.points++;
        away.points++;
      }
    });


  standings.forEach(team => {

    team.goalDifference =
      team.goalsFor - team.goalsAgainst;

  });


  // -------------------------------------------------------
  // SORTING
  //
  // 1. Points
  // 2. Goal difference
  // 3. Goals scored
  // 4. Team name
  // -------------------------------------------------------

  standings.sort((a, b) => {

    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }

    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }

    return a.name.localeCompare(b.name);
  });


  standings.forEach((team, index) => {
    team.position = index + 1;
  });


  return standings;
}


// =========================================================
// DETERMINE QUALIFICATION SIZE
// =========================================================

function getQualificationSize(teamCount) {

  if (teamCount >= 33) {
    return 32;
  }

  if (teamCount >= 17) {
    return 16;
  }

  if (teamCount >= 9) {
    return 8;
  }

  return 0;
}


// =========================================================
// GET FIRST KNOCKOUT ROUND
// =========================================================

function getFirstKnockoutStage(qualificationSize) {

  if (qualificationSize === 32) {
    return "R32";
  }

  if (qualificationSize === 16) {
    return "R16";
  }

  if (qualificationSize === 8) {
    return "QF";
  }

  return "";
}


// =========================================================
// ROUND DISPLAY HELPERS
// =========================================================

function getRoundCode(round) {

  const validRounds = [
    "R32",
    "R16",
    "QF",
    "SF",
    "F"
  ];

  return validRounds.includes(round)
    ? round
    : "";
}


function getNextRoundCode(round) {

  switch (round) {

    case "R32":
      return "R16";

    case "R16":
      return "QF";

    case "QF":
      return "SF";

    case "SF":
      return "F";

    default:
      return "";
  }
}


function getRoundDisplayName(round) {

  switch (round) {

    case "R32":
      return "Round of 32";

    case "R16":
      return "Round of 16";

    case "QF":
      return "Quarter-finals";

    case "SF":
      return "Semi-finals";

    case "F":
      return "Final";

    default:
      return round;
  }
}


// =========================================================
// RANDOMIZE ARRAY
//
// Uses Fisher-Yates so every qualified team has a
// genuine random position in the knockout draw.
// =========================================================

function randomizeKnockoutTeams(teams) {

  const shuffled = [...teams];


  for (let i = shuffled.length - 1; i > 0; i--) {

    const randomIndex =
      Math.floor(Math.random() * (i + 1));


    [
      shuffled[i],
      shuffled[randomIndex]
    ] = [
      shuffled[randomIndex],
      shuffled[i]
    ];
  }


  return shuffled;
}


// =========================================================
// RESET KNOCKOUT DATA
// =========================================================

function resetKnockoutData() {

  competition.knockout = {

    started: false,
    completed: false,

    stage: "",

    qualificationSize: 0,

    bracket: []
  };
}


// =========================================================
// CREATE KNOCKOUT FROM FINAL STANDINGS
//
// IMPORTANT:
//
// Qualification is based on league position.
//
// Pairing is RANDOM.
//
// The random draw happens ONCE when the knockout
// is created. After that the bracket is fixed.
// =========================================================

function createKnockoutFromStandings() {

  if (competition.knockout.started) {
    return false;
  }


  const standings = calculateStandings();


  const qualificationSize =
    getQualificationSize(competition.teams.length);


  if (!qualificationSize) {

    showMessage(
      "Not enough teams to create the knockout stage.",
      "error"
    );

    return false;
  }


  if (standings.length < qualificationSize) {

    showMessage(
      "There are not enough teams to complete qualification.",
      "error"
    );

    return false;
  }


  // -------------------------------------------------------
  // TOP TEAMS QUALIFY FROM THE FINAL LEAGUE TABLE
  // -------------------------------------------------------

  const qualifiedTeams =
    standings.slice(0, qualificationSize);


  // -------------------------------------------------------
  // RANDOM KNOCKOUT DRAW
  //
  // The league positions are NOT used to determine
  // the knockout pairings.
  // -------------------------------------------------------

  const randomlyDrawnTeams =
    randomizeKnockoutTeams(qualifiedTeams);


  const firstRound =
    getFirstKnockoutStage(qualificationSize);


  if (!firstRound) {
    return false;
  }


  // -------------------------------------------------------
  // CREATE RANDOM FIRST ROUND
  // -------------------------------------------------------

  const firstRoundBracket =
    buildRandomKnockoutBracket(
      randomlyDrawnTeams,
      firstRound
    );


  // -------------------------------------------------------
  // SAVE KNOCKOUT STATE
  // -------------------------------------------------------

  competition.knockout = {

    started: true,

    completed: false,

    stage: firstRound,

    qualificationSize,

    bracket: firstRoundBracket
  };


  // -------------------------------------------------------
  // PRE-BUILD FUTURE BRACKET ROUNDS
  // -------------------------------------------------------

  addFutureBracketRounds(
    competition.knockout.bracket,
    firstRound
  );


  return true;
}


// =========================================================
// BUILD RANDOM FIRST ROUND
//
// Teams are already randomized before reaching this
// function, so each pair is a random pairing.
// =========================================================

function buildRandomKnockoutBracket(
  qualifiedTeams,
  firstRound
) {

  const bracket = [];


  for (
    let i = 0;
    i < qualifiedTeams.length;
    i += 2
  ) {

    const homeTeam = qualifiedTeams[i];
    const awayTeam = qualifiedTeams[i + 1];


    if (!homeTeam || !awayTeam) {
      continue;
    }


    bracket.push({

      id: `${firstRound}-${i / 2 + 1}`,

      round: firstRound,

      number: i / 2 + 1,


      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,


      homeId: homeTeam.id,
      awayId: awayTeam.id,


      // Keep league positions for information only.
      homeSeed: homeTeam.position,
      awaySeed: awayTeam.position,


      homeScore: null,
      awayScore: null,


      winner: null,

      resolution: null,


      legs: [],


      sourceHome: null,
      sourceAway: null
    });
  }


  return bracket;
}


// =========================================================
// ADD FUTURE BRACKET ROUNDS
//
// The future rounds are created now so the knockout
// tree is fixed immediately after the random draw.
//
// The teams in these rounds remain TBD until the
// previous round produces its winners.
// =========================================================

function addFutureBracketRounds(
  bracket,
  firstRound
) {

  let currentRound = firstRound;


  while (currentRound !== "F") {

    const nextRound =
      getNextRoundCode(currentRound);


    if (!nextRound) {
      break;
    }


    const currentRoundTies =
      bracket.filter(
        tie => tie.round === currentRound
      );


    const nextRoundTieCount =
      Math.floor(currentRoundTies.length / 2);


    for (
      let i = 0;
      i < nextRoundTieCount;
      i++
    ) {

      const sourceHome =
        currentRoundTies[i * 2];

      const sourceAway =
        currentRoundTies[i * 2 + 1];


      bracket.push({

        id: `${nextRound}-${i + 1}`,

        round: nextRound,

        number: i + 1,


        homeTeam: null,
        awayTeam: null,


        homeId: null,
        awayId: null,


        homeSeed: null,
        awaySeed: null,


        homeScore: null,
        awayScore: null,


        winner: null,

        resolution: null,


        legs: [],


        sourceHome: sourceHome
          ? sourceHome.id
          : null,

        sourceAway: sourceAway
          ? sourceAway.id
          : null
      });
    }


    currentRound = nextRound;
  }
}


// =========================================================
// GET QUALIFIED TEAMS
// =========================================================

function getQualifiedTeams() {

  const qualificationSize =
    competition.knockout.qualificationSize;


  if (!qualificationSize) {
    return [];
  }


  return calculateStandings()
    .slice(0, qualificationSize);
}


// =========================================================
// GET LEAGUE POSITION
// =========================================================

function getLeaguePosition(teamId) {

  const standings =
    calculateStandings();


  const team =
    standings.find(
      item => item.id === teamId
    );


  return team
    ? team.position
    : null;
}


// =========================================================
// GET CURRENT KNOCKOUT ROUND
// =========================================================

function getCurrentKnockoutRound() {

  if (!competition.knockout.started) {
    return "";
  }


  const rounds = [
    "R32",
    "R16",
    "QF",
    "SF",
    "F"
  ];


  for (const round of rounds) {

    const ties =
      competition.knockout.bracket
        .filter(
          tie => tie.round === round
        );


    if (!ties.length) {
      continue;
    }


    const incompleteTie =
      ties.find(
        tie => !tie.winner
      );


    if (incompleteTie) {
      return round;
    }
  }


  return "F";
}


// =========================================================
// GET FINAL LEAGUE TABLE
// =========================================================

function getFinalLeagueTable() {

  return calculateStandings();
}


// =========================================================
// CONFIRM RANDOM DRAW RESULT
// =========================================================

function getRandomDrawSummary() {

  if (!competition.knockout.started) {
    return [];
  }


  const firstRound =
    getFirstKnockoutStage(
      competition.knockout.qualificationSize
    );


  if (!firstRound) {
    return [];
  }


  return competition.knockout.bracket
    .filter(
      tie => tie.round === firstRound
    )
    .map(tie => ({
      number: tie.number,
      homeTeam: tie.homeTeam,
      awayTeam: tie.awayTeam
    }));
}

// =========================================================
// DLS COMPETITION
// CHAMPIONS LEAGUE TEST ADMIN
// champions-admin.js
//
// PART 6 — KNOCKOUT BRACKET + LEAGUE TABLE
// =========================================================


// =========================================================
// KNOCKOUT LEG COUNT
// =========================================================
//
// R32 / R16 / QF / SF use the selected knockout setting.
// Final is ALWAYS one leg.
// =========================================================

function getKnockoutLegCount(round) {

  if (round === "F") {
    return 1;
  }

  return competition.season.knockoutLegs === 2
    ? 2
    : 1;
}


// =========================================================
// ENSURE TIE LEG DATA EXISTS
// =========================================================

function ensureTieLegs(tie) {

  const legCount =
    getKnockoutLegCount(tie.round);


  if (!Array.isArray(tie.legs)) {
    tie.legs = [];
  }


  while (tie.legs.length < legCount) {

    const legNumber =
      tie.legs.length + 1;


    let homeId = tie.homeId;
    let awayId = tie.awayId;

    let homeTeam = tie.homeTeam;
    let awayTeam = tie.awayTeam;


    // -----------------------------------------------------
    // SECOND LEG
    //
    // Home and away are reversed.
    // -----------------------------------------------------

    if (legNumber === 2) {

      homeId = tie.awayId;
      awayId = tie.homeId;

      homeTeam = tie.awayTeam;
      awayTeam = tie.homeTeam;
    }


    tie.legs.push({

      leg: legNumber,

      homeId: homeId || null,
      awayId: awayId || null,

      homeTeam: homeTeam || null,
      awayTeam: awayTeam || null,

      homeScore: null,
      awayScore: null,

      played: false
    });
  }


  // -------------------------------------------------------
  // IF THE NUMBER OF LEGS WAS REDUCED, TRIM OLD DATA.
  // -------------------------------------------------------

  if (tie.legs.length > legCount) {

    tie.legs =
      tie.legs.slice(0, legCount);
  }


  return tie.legs;
}


// =========================================================
// INJECT BRACKET CSS
//
// This keeps the bracket styling inside JavaScript.
// No separate CSS file needs to be edited.
// =========================================================

function ensureKnockoutStyles() {

  if (
    document.getElementById(
      "champions-knockout-inline-style"
    )
  ) {
    return;
  }


  const style =
    document.createElement("style");


  style.id =
    "champions-knockout-inline-style";


  style.textContent = `

    /* =====================================================
       CHAMPIONS LEAGUE BRACKET
    ===================================================== */

    .champions-knockout-wrapper {
      width: 100%;
      box-sizing: border-box;
      margin-top: 24px;
    }


    .champions-knockout-header {
      margin-bottom: 18px;
    }


    .champions-knockout-header h3 {
      margin: 0 0 6px;
      font-size: 22px;
    }


    .champions-knockout-subtitle {
      margin: 0;
      opacity: 0.75;
      font-size: 14px;
    }


    /* =====================================================
       LEAGUE TABLE
    ===================================================== */

    .champions-standings-wrapper {
      width: 100%;
      overflow-x: auto;
      margin-bottom: 30px;
      border-radius: 12px;
    }


    .champions-standings {
      width: 100%;
      min-width: 720px;
      border-collapse: collapse;
    }


    .champions-standings th,
    .champions-standings td {
      padding: 10px 8px;
      text-align: center;
      border-bottom: 1px solid rgba(128,128,128,0.18);
      white-space: nowrap;
    }


    .champions-standings th:nth-child(2),
    .champions-standings td:nth-child(2) {
      text-align: left;
    }


    .champions-standings th {
      font-size: 12px;
      text-transform: uppercase;
      opacity: 0.7;
    }


    .champions-standings tr.qualified-team {
      font-weight: 700;
    }


    .champions-standings tr.qualified-team td:first-child {
      border-left: 4px solid currentColor;
    }


    .champions-qualification-line td {
      border-bottom: 3px solid currentColor !important;
      padding: 3px !important;
    }


    .champions-position {
      width: 42px;
    }


    /* =====================================================
       BRACKET SCROLL AREA
    ===================================================== */

    .champions-bracket-scroll {
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 10px 6px 24px;
      box-sizing: border-box;
      -webkit-overflow-scrolling: touch;
    }


    .champions-bracket {
      display: flex;
      align-items: stretch;
      gap: 24px;
      min-width: max-content;
      padding: 10px 10px 30px;
    }


    /* =====================================================
       ROUND COLUMN
    ===================================================== */

    .bracket-round {
      width: 230px;
      min-width: 230px;
      display: flex;
      flex-direction: column;
    }


    .bracket-round-title {
      text-align: center;
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }


    .bracket-round-count {
      display: block;
      font-size: 11px;
      font-weight: 400;
      opacity: 0.65;
      margin-top: 3px;
      text-transform: none;
    }


    .bracket-matches {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      gap: 14px;
    }


    /* =====================================================
       MATCH WRAPPER
    ===================================================== */

    .bracket-match-wrap {
      position: relative;
      display: flex;
      align-items: center;
      min-height: 92px;
    }


    /* =====================================================
       MATCH CARD
    ===================================================== */

    .bracket-match {
      width: 100%;
      border: 1px solid rgba(128,128,128,0.30);
      border-radius: 10px;
      overflow: hidden;
      background: rgba(128,128,128,0.06);
      box-sizing: border-box;
      position: relative;
      z-index: 2;
    }


    .bracket-match.final-match {
      border-width: 2px;
    }


    .bracket-match.completed-match {
      border-color: currentColor;
    }


    .bracket-match.needs-resolution {
      border-width: 2px;
    }


    .bracket-match-number {
      padding: 6px 9px;
      font-size: 10px;
      text-transform: uppercase;
      opacity: 0.65;
      border-bottom: 1px solid rgba(128,128,128,0.18);
    }


    .bracket-team {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 31px;
      padding: 5px 9px;
      box-sizing: border-box;
    }


    .bracket-team + .bracket-team {
      border-top: 1px solid rgba(128,128,128,0.16);
    }


    .bracket-team-name {
      min-width: 0;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
    }


    .bracket-team-name.winner {
      font-weight: 800;
    }


    .bracket-score {
      min-width: 24px;
      text-align: center;
      font-weight: 800;
    }


    .bracket-tbd {
      opacity: 0.5;
      font-style: italic;
    }


    /* =====================================================
       TWO-LEG INFORMATION
    ===================================================== */

    .bracket-leg-info {
      padding: 5px 9px;
      font-size: 10px;
      opacity: 0.65;
      border-top: 1px solid rgba(128,128,128,0.16);
    }


    .bracket-aggregate {
      padding: 5px 9px;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      border-top: 1px solid rgba(128,128,128,0.16);
    }


    /* =====================================================
       CONNECTING LINES
    ===================================================== */

    .bracket-match-wrap::after {
      content: "";
      position: absolute;
      top: 50%;
      right: -24px;
      width: 24px;
      border-top: 1px solid rgba(128,128,128,0.45);
      z-index: 1;
    }


    .bracket-round:not(:last-child)
      .bracket-match-wrap:nth-child(odd)::before {

      content: "";
      position: absolute;
      right: -24px;
      top: 50%;
      height: calc(50% + 46px);
      border-right: 1px solid rgba(128,128,128,0.45);
      z-index: 1;
    }


    .bracket-round:not(:last-child)
      .bracket-match-wrap:nth-child(even)::before {

      content: "";
      position: absolute;
      right: -24px;
      bottom: 50%;
      height: calc(50% + 46px);
      border-right: 1px solid rgba(128,128,128,0.45);
      z-index: 1;
    }


    /* =====================================================
       MOBILE
    ===================================================== */

    @media (max-width: 700px) {

      .bracket-round {
        width: 205px;
        min-width: 205px;
      }


      .champions-bracket {
        gap: 18px;
      }


      .bracket-match-wrap::after {
        right: -18px;
        width: 18px;
      }


      .bracket-round:not(:last-child)
        .bracket-match-wrap:nth-child(odd)::before,
      .bracket-round:not(:last-child)
        .bracket-match-wrap:nth-child(even)::before {

        right: -18px;
      }


      .champions-knockout-header h3 {
        font-size: 19px;
      }
    }

  `;


  document.head.appendChild(style);
}


// =========================================================
// RENDER ADMIN KNOCKOUT
// =========================================================

function renderAdminKnockout() {

  ensureKnockoutStyles();


  const statusElement =
    document.getElementById(
      "adminKnockoutStatus"
    );


  const listElement =
    document.getElementById(
      "adminKnockoutList"
    );


  if (!statusElement || !listElement) {
    return;
  }


  // -------------------------------------------------------
  // NO KNOCKOUT YET
  // -------------------------------------------------------

  if (!competition.knockout.started) {

    statusElement.innerHTML = `
      <div class="champions-knockout-header">
        <h3>Knockout Stage</h3>

        <p class="champions-knockout-subtitle">
          The knockout bracket will be created automatically
          after every scheduled league fixture has a valid result.
        </p>
      </div>
    `;


    listElement.innerHTML =
      renderStandingsTable();


    return;
  }


  const currentRound =
    getCurrentKnockoutRound();


  const currentRoundName =
    currentRound === "F"
      ? "Final"
      : getRoundDisplayName(currentRound);


  const qualificationSize =
    competition.knockout.qualificationSize;


  const completed =
    competition.knockout.completed === true;


  statusElement.innerHTML = `
    <div class="champions-knockout-header">

      <h3>
        ${completed
          ? "Knockout Stage Completed"
          : "Champions League Knockout Stage"}
      </h3>

      <p class="champions-knockout-subtitle">
        ${completed
          ? "The final has been completed."
          : `Current round: ${escapeHTML(currentRoundName)}`
        }
        · ${qualificationSize} teams qualified
        · ${competition.season.knockoutLegs === 2
            ? "Two legs"
            : "One leg"
          }
        · Final is one leg
      </p>

    </div>
  `;


  listElement.innerHTML =
    renderStandingsTable() +
    renderChampionsBracket();
}


// =========================================================
// RENDER LEAGUE TABLE
// =========================================================

function renderStandingsTable() {

  const standings =
    calculateStandings();


  if (!standings.length) {

    return `
      <div class="champions-standings-wrapper">
        No teams available.
      </div>
    `;
  }


  const qualificationSize =
    competition.knockout.started
      ? competition.knockout.qualificationSize
      : getQualificationSize(
          competition.teams.length
        );


  let html = `

    <div class="champions-standings-wrapper">

      <table class="champions-standings">

        <thead>
          <tr>

            <th class="champions-position">
              #
            </th>

            <th>
              Team
            </th>

            <th>
              P
            </th>

            <th>
              W
            </th>

            <th>
              D
            </th>

            <th>
              L
            </th>

            <th>
              GF
            </th>

            <th>
              GA
            </th>

            <th>
              GD
            </th>

            <th>
              Pts
            </th>

          </tr>
        </thead>

        <tbody>
  `;


  standings.forEach((team, index) => {

    const isQualified =
      qualificationSize > 0 &&
      index < qualificationSize;


    html += `

      <tr class="${
        isQualified
          ? "qualified-team"
          : ""
      }">

        <td>
          ${team.position}
        </td>

        <td>
          ${escapeHTML(team.name)}
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
          ${team.points}
        </td>

      </tr>
    `;


    if (
      qualificationSize > 0 &&
      index === qualificationSize - 1 &&
      index < standings.length - 1
    ) {

      html += `

        <tr class="champions-qualification-line">

          <td colspan="10">
            Qualification boundary
          </td>

        </tr>

      `;
    }

  });


  html += `

        </tbody>

      </table>

    </div>
  `;


  return html;
}


// =========================================================
// RENDER FULL HORIZONTAL BRACKET
// =========================================================

function renderChampionsBracket() {

  const rounds = [
    "R32",
    "R16",
    "QF",
    "SF",
    "F"
  ];


  const availableRounds =
    rounds.filter(round =>
      competition.knockout.bracket.some(
        tie => tie.round === round
      )
    );


  if (!availableRounds.length) {

    return `
      <div class="champions-bracket-wrapper">
        No knockout bracket available.
      </div>
    `;
  }


  let html = `

    <div class="champions-knockout-wrapper">

      <div class="champions-bracket-scroll">

        <div class="champions-bracket">
  `;


  availableRounds.forEach(round => {

    const ties =
      competition.knockout.bracket
        .filter(
          tie => tie.round === round
        )
        .sort(
          (a, b) =>
            a.number - b.number
        );


    html += `

      <section class="bracket-round">

        <div class="bracket-round-title">

          ${escapeHTML(
            getRoundDisplayName(round)
          )}

          <span class="bracket-round-count">
            ${ties.length} ${
              ties.length === 1
                ? "tie"
                : "ties"
            }
          </span>

        </div>

        <div class="bracket-matches">
    `;


    ties.forEach(tie => {

      html +=
        renderKnockoutTieCard(tie);

    });


    html += `

        </div>

      </section>
    `;

  });


  html += `

        </div>

      </div>

    </div>
  `;


  return html;
}


// =========================================================
// RENDER ONE KNOCKOUT TIE
// =========================================================

function renderKnockoutTieCard(tie) {

  const legCount =
    getKnockoutLegCount(tie.round);


  const legs =
    ensureTieLegs(tie);


  const winnerId =
    tie.winner || null;


  const isResolved =
    Boolean(winnerId);


  const isFinal =
    tie.round === "F";


  const needsResolution =
    tie.resolution === "required";


  const homeName =
    tie.homeTeam || "TBD";


  const awayName =
    tie.awayTeam || "TBD";


  const homeWinner =
    winnerId &&
    winnerId === tie.homeId;


  const awayWinner =
    winnerId &&
    winnerId === tie.awayId;


  let aggregateHtml = "";


  if (legCount === 2) {

    const aggregate =
      calculateTieAggregate(tie);


    aggregateHtml = `

      <div class="bracket-aggregate">

        Aggregate:
        ${aggregate.homeGoals}
        -
        ${aggregate.awayGoals}

      </div>
    `;
  }


  let legInfoHtml = "";


  if (legCount === 2) {

    legInfoHtml = `

      <div class="bracket-leg-info">

        Leg 1:
        ${formatLegScore(legs[0])}

        <br>

        Leg 2:
        ${formatLegScore(legs[1])}

      </div>
    `;
  }


  const statusClass =
    isResolved
      ? "completed-match"
      : needsResolution
        ? "needs-resolution"
        : "";


  return `

    <div class="bracket-match-wrap">

      <div class="
        bracket-match
        ${statusClass}
        ${isFinal ? "final-match" : ""}
      ">

        <div class="bracket-match-number">

          ${escapeHTML(
            getRoundDisplayName(tie.round)
          )}

          · Tie ${tie.number}

        </div>


        <div class="bracket-team">

          <span class="
            bracket-team-name
            ${homeWinner ? "winner" : ""}
            ${!tie.homeTeam ? "bracket-tbd" : ""}
          ">

            ${escapeHTML(homeName)}

          </span>


          <span class="bracket-score">

            ${isResolved
              ? getDisplayAggregateOrScore(
                  tie,
                  tie.homeId
                )
              : "–"
            }

          </span>

        </div>


        <div class="bracket-team">

          <span class="
            bracket-team-name
            ${awayWinner ? "winner" : ""}
            ${!tie.awayTeam ? "bracket-tbd" : ""}
          ">

            ${escapeHTML(awayName)}

          </span>


          <span class="bracket-score">

            ${isResolved
              ? getDisplayAggregateOrScore(
                  tie,
                  tie.awayId
                )
              : "–"
            }

          </span>

        </div>


        ${legInfoHtml}

        ${aggregateHtml}

        ${
          needsResolution
            ? `
              <div class="bracket-leg-info">
                Winner requires admin resolution.
              </div>
            `
            : ""
        }

      </div>

    </div>
  `;
}


// =========================================================
// CALCULATE TWO-LEG AGGREGATE
// =========================================================

function calculateTieAggregate(tie) {

  const result = {

    homeGoals: 0,

    awayGoals: 0
  };


  if (!Array.isArray(tie.legs)) {
    return result;
  }


  tie.legs.forEach(leg => {

    if (!leg.played) {
      return;
    }


    const homeScore =
      Number(leg.homeScore);

    const awayScore =
      Number(leg.awayScore);


    if (
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore)
    ) {
      return;
    }


    if (leg.homeId === tie.homeId) {

      result.homeGoals += homeScore;
      result.awayGoals += awayScore;

    } else {

      result.homeGoals += awayScore;
      result.awayGoals += homeScore;
    }

  });


  return result;
}


// =========================================================
// FORMAT LEG SCORE
// =========================================================

function formatLegScore(leg) {

  if (!leg || !leg.played) {
    return "not played";
  }


  return `${leg.homeScore} - ${leg.awayScore}`;
}


// =========================================================
// DISPLAY WINNER SCORE
// =========================================================

function getDisplayAggregateOrScore(
  tie,
  teamId
) {

  const legCount =
    getKnockoutLegCount(tie.round);


  if (legCount === 2) {

    const aggregate =
      calculateTieAggregate(tie);


    if (teamId === tie.homeId) {
      return aggregate.homeGoals;
    }


    if (teamId === tie.awayId) {
      return aggregate.awayGoals;
    }
  }


  if (
    tie.homeId === teamId
  ) {
    return tie.homeScore ?? "–";
  }


  if (
    tie.awayId === teamId
  ) {
    return tie.awayScore ?? "–";
  }


  return "–";
}

// =========================================================
// DLS COMPETITION
// CHAMPIONS LEAGUE TEST ADMIN
// champions-admin.js
//
// PART 7 — KNOCKOUT RESULTS, AGGREGATES,
//          WINNERS & AUTOMATIC ADVANCEMENT
// =========================================================


// =========================================================
// GET KNOCKOUT TIE
// =========================================================

function getKnockoutTieById(tieId) {

  if (
    !competition.knockout ||
    !Array.isArray(
      competition.knockout.bracket
    )
  ) {
    return null;
  }


  return competition.knockout.bracket.find(
    tie => tie.id === tieId
  ) || null;
}


// =========================================================
// GET LEG
// =========================================================

function getTieLeg(tie, legNumber) {

  if (!tie) {
    return null;
  }


  ensureTieLegs(tie);


  return tie.legs.find(
    leg => leg.leg === legNumber
  ) || null;
}


// =========================================================
// PREPARE LEG TEAMS
//
// Leg 1:
//   original home vs original away
//
// Leg 2:
//   original away vs original home
// =========================================================

function prepareKnockoutLeg(tie, legNumber) {

  if (!tie) {
    return null;
  }


  if (!tie.homeId || !tie.awayId) {
    return null;
  }


  const legs =
    ensureTieLegs(tie);


  const leg =
    legs.find(
      item => item.leg === legNumber
    );


  if (!leg) {
    return null;
  }


  if (legNumber === 1) {

    leg.homeId =
      tie.homeId;

    leg.awayId =
      tie.awayId;

    leg.homeTeam =
      tie.homeTeam;

    leg.awayTeam =
      tie.awayTeam;

  } else {

    leg.homeId =
      tie.awayId;

    leg.awayId =
      tie.homeId;

    leg.homeTeam =
      tie.awayTeam;

    leg.awayTeam =
      tie.homeTeam;
  }


  return leg;
}


// =========================================================
// CHECK WHETHER A SCORE IS VALID
// =========================================================

function isValidKnockoutScore(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
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


// =========================================================
// SAVE KNOCKOUT LEG RESULT
// =========================================================
//
// This function updates ONLY the selected knockout leg.
// =========================================================

async function saveKnockoutLegResult(
  tieId,
  legNumber,
  homeScore,
  awayScore
) {

  if (!competition.season.started) {

    showMessage(
      "The season has not started.",
      "error"
    );

    return false;
  }


  if (
    !competition.knockout.started
  ) {

    showMessage(
      "The knockout stage has not started.",
      "error"
    );

    return false;
  }


  const tie =
    getKnockoutTieById(tieId);


  if (!tie) {

    showMessage(
      "Knockout tie not found.",
      "error"
    );

    return false;
  }


  if (tie.winner) {

    showMessage(
      "This tie has already been completed.",
      "error"
    );

    return false;
  }


  const legCount =
    getKnockoutLegCount(tie.round);


  if (
    legNumber < 1 ||
    legNumber > legCount
  ) {

    showMessage(
      "Invalid knockout leg.",
      "error"
    );

    return false;
  }


  if (
    !tie.homeId ||
    !tie.awayId
  ) {

    showMessage(
      "Both teams must be known before entering a result.",
      "error"
    );

    return false;
  }


  if (
    !isValidKnockoutScore(homeScore) ||
    !isValidKnockoutScore(awayScore)
  ) {

    showMessage(
      "Enter valid non-negative whole-number scores.",
      "error"
    );

    return false;
  }


  const leg =
    prepareKnockoutLeg(
      tie,
      legNumber
    );


  if (!leg) {

    showMessage(
      "Unable to prepare this knockout leg.",
      "error"
    );

    return false;
  }


  if (leg.played) {

    showMessage(
      "This leg has already been completed.",
      "error"
    );

    return false;
  }


  const confirmed =
    confirm(
      `Save result for ${leg.homeTeam} ${homeScore} - ${awayScore} ${leg.awayTeam}?`
    );


  if (!confirmed) {
    return false;
  }


  const oldLeg = {
    homeScore: leg.homeScore,
    awayScore: leg.awayScore,
    played: leg.played
  };


  leg.homeScore =
    Number(homeScore);

  leg.awayScore =
    Number(awayScore);

  leg.played = true;


  // -------------------------------------------------------
  // KEEP ONE-LEG TIE FIELDS IN SYNC
  // -------------------------------------------------------

  if (legCount === 1) {

    tie.homeScore =
      Number(homeScore);

    tie.awayScore =
      Number(awayScore);
  }


  try {

    await saveCompetition();


    const completed =
      await evaluateKnockoutTie(tie);


    await saveCompetition();


    renderAdminKnockout();


    if (completed) {

      if (
        competition.knockout.completed
      ) {

        renderDashboard();

        alert(
          `Champions League completed. Champion: ${
            competition.knockout.champion
          }`
        );

      } else {

        renderDashboard();
      }
    }


    return true;

  } catch (error) {

    console.error(
      "Failed to save knockout result:",
      error
    );


    leg.homeScore =
      oldLeg.homeScore;

    leg.awayScore =
      oldLeg.awayScore;

    leg.played =
      oldLeg.played;


    if (legCount === 1) {

      tie.homeScore =
        oldLeg.homeScore;

      tie.awayScore =
        oldLeg.awayScore;
    }


    showMessage(
      "Failed to save the knockout result.",
      "error"
    );


    return false;
  }
}


// =========================================================
// EVALUATE KNOCKOUT TIE
// =========================================================
//
// Returns true when the tie has been completed.
// =========================================================

async function evaluateKnockoutTie(tie) {

  if (!tie) {
    return false;
  }


  if (tie.winner) {
    return true;
  }


  const legCount =
    getKnockoutLegCount(tie.round);


  const legs =
    ensureTieLegs(tie);


  // -------------------------------------------------------
  // ONE LEG
  // -------------------------------------------------------

  if (legCount === 1) {

    const leg =
      legs[0];


    if (!leg || !leg.played) {
      return false;
    }


    const homeScore =
      Number(leg.homeScore);

    const awayScore =
      Number(leg.awayScore);


    if (homeScore > awayScore) {

      await completeKnockoutTie(
        tie,
        tie.homeId,
        "score"
      );


      return true;
    }


    if (awayScore > homeScore) {

      await completeKnockoutTie(
        tie,
        tie.awayId,
        "score"
      );


      return true;
    }


    // -----------------------------------------------------
    // DRAW
    //
    // No automatic winner.
    // Admin must resolve.
    // -----------------------------------------------------

    tie.resolution =
      "required";


    return false;
  }


  // -------------------------------------------------------
  // TWO LEGS
  // -------------------------------------------------------

  const firstLeg =
    legs[0];

  const secondLeg =
    legs[1];


  if (
    !firstLeg.played ||
    !secondLeg.played
  ) {

    return false;
  }


  const aggregate =
    calculateTieAggregate(tie);


  // -------------------------------------------------------
  // CLEAR AGGREGATE WINNER
  // -------------------------------------------------------

  if (
    aggregate.homeGoals >
    aggregate.awayGoals
  ) {

    await completeKnockoutTie(
      tie,
      tie.homeId,
      "aggregate"
    );


    return true;
  }


  if (
    aggregate.awayGoals >
    aggregate.homeGoals
  ) {

    await completeKnockoutTie(
      tie,
      tie.awayId,
      "aggregate"
    );


    return true;
  }


  // -------------------------------------------------------
  // AGGREGATE DRAW
  //
  // NO AWAY GOALS.
  // ADMIN MUST CHOOSE THE WINNER.
  // -------------------------------------------------------

  tie.resolution =
    "required";


  return false;
}


// =========================================================
// COMPLETE KNOCKOUT TIE
// =========================================================

async function completeKnockoutTie(
  tie,
  winnerId,
  method
) {

  if (!tie || !winnerId) {
    return false;
  }


  const winnerTeam =
    getKnockoutTeamNameById(
      winnerId
    );


  if (!winnerTeam) {
    return false;
  }


  tie.winner =
    winnerId;


  tie.resolution =
    method;


  // -------------------------------------------------------
  // FINAL
  // -------------------------------------------------------

  if (tie.round === "F") {

    competition.knockout.completed =
      true;

    competition.knockout.stage =
      "COMPLETED";

    competition.knockout.champion =
      winnerTeam;


    competition.season.completed =
      true;


    return true;
  }


  // -------------------------------------------------------
  // ADVANCE WINNER TO NEXT ROUND
  // -------------------------------------------------------

  advanceKnockoutWinner(tie);


  updateCurrentKnockoutStage();


  return true;
}


// =========================================================
// GET TEAM NAME BY ID
// =========================================================

function getKnockoutTeamNameById(teamId) {

  const team =
    competition.teams.find(
      item => item.id === teamId
    );


  return team
    ? team.name
    : null;
}


// =========================================================
// ADVANCE WINNER INTO NEXT TIE
// =========================================================

function advanceKnockoutWinner(completedTie) {

  if (
    !completedTie ||
    !completedTie.winner
  ) {
    return false;
  }


  const nextRound =
    getNextRoundCode(
      completedTie.round
    );


  if (!nextRound) {
    return false;
  }


  const nextTie =
    competition.knockout.bracket.find(
      tie =>
        tie.round === nextRound &&
        (
          tie.sourceHome ===
            completedTie.id ||
          tie.sourceAway ===
            completedTie.id
        )
    );


  if (!nextTie) {

    console.warn(
      "Next knockout tie not found:",
      completedTie.id
    );

    return false;
  }


  const winnerId =
    completedTie.winner;


  const winnerName =
    getKnockoutTeamNameById(
      winnerId
    );


  if (
    nextTie.sourceHome ===
    completedTie.id
  ) {

    nextTie.homeId =
      winnerId;

    nextTie.homeTeam =
      winnerName;

    nextTie.homeSeed =
      completedTie.homeId === winnerId
        ? completedTie.homeSeed
        : completedTie.awaySeed;
  }


  if (
    nextTie.sourceAway ===
    completedTie.id
  ) {

    nextTie.awayId =
      winnerId;

    nextTie.awayTeam =
      winnerName;

    nextTie.awaySeed =
      completedTie.homeId === winnerId
        ? completedTie.homeSeed
        : completedTie.awaySeed;
  }


  // -------------------------------------------------------
  // RESET ANY OLD LEG DATA
  //
  // This is important because the future tie was initially
  // created with TBD teams.
  // -------------------------------------------------------

  nextTie.homeScore =
    null;

  nextTie.awayScore =
    null;

  nextTie.winner =
    null;

  nextTie.resolution =
    null;

  nextTie.legs = [];


  return true;
}


// =========================================================
// UPDATE CURRENT KNOCKOUT STAGE
// =========================================================

function updateCurrentKnockoutStage() {

  if (
    competition.knockout.completed
  ) {
    competition.knockout.stage =
      "COMPLETED";

    return;
  }


  const rounds = [
    "R32",
    "R16",
    "QF",
    "SF",
    "F"
  ];


  for (const round of rounds) {

    const ties =
      competition.knockout.bracket
        .filter(
          tie => tie.round === round
        );


    if (!ties.length) {
      continue;
    }


    const unresolvedTie =
      ties.find(
        tie => !tie.winner
      );


    if (unresolvedTie) {

      competition.knockout.stage =
        round;

      return;
    }
  }


  competition.knockout.stage =
    "F";
}


// =========================================================
// GET TIES REQUIRING ADMIN RESOLUTION
// =========================================================

function getKnockoutResolutionTies() {

  if (
    !competition.knockout ||
    !Array.isArray(
      competition.knockout.bracket
    )
  ) {
    return [];
  }


  return competition.knockout.bracket.filter(
    tie =>
      !tie.winner &&
      tie.resolution === "required"
  );
}


// =========================================================
// RESOLVE TIED KNOCKOUT
//
// winnerSide must be:
// "home"
// OR
// "away"
// =========================================================

async function resolveKnockoutTie(
  tieId,
  winnerSide
) {

  const tie =
    getKnockoutTieById(
      tieId
    );


  if (!tie) {

    showMessage(
      "Knockout tie not found.",
      "error"
    );

    return false;
  }


  if (tie.winner) {

    showMessage(
      "This tie is already resolved.",
      "error"
    );

    return false;
  }


  if (
    tie.resolution !==
    "required"
  ) {

    showMessage(
      "This tie does not currently require resolution.",
      "error"
    );

    return false;
  }


  if (
    winnerSide !== "home" &&
    winnerSide !== "away"
  ) {

    showMessage(
      "Invalid winner selection.",
      "error"
    );

    return false;
  }


  const winnerId =
    winnerSide === "home"
      ? tie.homeId
      : tie.awayId;


  const winnerName =
    winnerSide === "home"
      ? tie.homeTeam
      : tie.awayTeam;


  if (!winnerId || !winnerName) {

    showMessage(
      "Winner information is incomplete.",
      "error"
    );

    return false;
  }


  const confirmed =
    confirm(
      `Resolve this tie in favour of ${winnerName}?`
    );


  if (!confirmed) {
    return false;
  }


  tie.winner =
    winnerId;


  tie.resolution =
    "admin";


  advanceKnockoutWinner(tie);


  updateCurrentKnockoutStage();


  if (tie.round === "F") {

    competition.knockout.completed =
      true;

    competition.knockout.stage =
      "COMPLETED";

    competition.knockout.champion =
      winnerName;

    competition.season.completed =
      true;
  }


  try {

    await saveCompetition();

    renderDashboard();

    return true;

  } catch (error) {

    console.error(
      "Failed to save knockout resolution:",
      error
    );

    showMessage(
      "Failed to save the knockout resolution.",
      "error"
    );

    return false;
  }
}


// =========================================================
// GET KNOCKOUT TIE STATUS
// =========================================================

function getKnockoutTieStatus(tie) {

  if (!tie) {
    return "unknown";
  }


  if (tie.winner) {
    return "completed";
  }


  if (
    tie.resolution ===
    "required"
  ) {
    return "needs-resolution";
  }


  if (
    !tie.homeId ||
    !tie.awayId
  ) {
    return "waiting";
  }


  const legCount =
    getKnockoutLegCount(
      tie.round
    );


  const legs =
    ensureTieLegs(tie);


  if (legCount === 1) {

    return legs[0] &&
      legs[0].played
      ? "played"
      : "pending";
  }


  const playedLegs =
    legs.filter(
      leg => leg.played
    ).length;


  if (playedLegs === 0) {
    return "pending";
  }


  if (playedLegs < legCount) {
    return "in-progress";
  }


  return "awaiting-resolution";
}


// =========================================================
// CREATE ADMIN KNOCKOUT ACTIONS
//
// The bracket renderer in Part 6 is intentionally visual.
// These controls are generated here and attached to the
// exact tie/leg being edited.
// =========================================================

function renderKnockoutAdminControls(
  tie
) {

  if (!tie) {
    return "";
  }


  if (tie.winner) {

    return `
      <div class="bracket-leg-info">
        Winner:
        ${escapeHTML(
          getKnockoutTeamNameById(
            tie.winner
          ) || "Unknown"
        )}
      </div>
    `;
  }


  if (
    !tie.homeId ||
    !tie.awayId
  ) {

    return `
      <div class="bracket-leg-info">
        Waiting for previous round.
      </div>
    `;
  }


  if (
    tie.resolution ===
    "required"
  ) {

    return `
      <div class="bracket-leg-info">

        <button
          type="button"
          data-resolve-knockout="${escapeHTML(tie.id)}"
          data-winner-side="home"
        >
          ${escapeHTML(tie.homeTeam)}
          wins
        </button>

        <button
          type="button"
          data-resolve-knockout="${escapeHTML(tie.id)}"
          data-winner-side="away"
        >
          ${escapeHTML(tie.awayTeam)}
          wins
        </button>

      </div>
    `;
  }


  const legCount =
    getKnockoutLegCount(
      tie.round
    );


  const legs =
    ensureTieLegs(tie);


  let html = "";


  for (
    let i = 0;
    i < legCount;
    i++
  ) {

    const leg =
      legs[i];


    if (
      !leg ||
      !leg.homeId ||
      !leg.awayId
    ) {
      continue;
    }


    if (leg.played) {
      continue;
    }


    html += `

      <div class="bracket-leg-info">

        <strong>
          Leg ${leg.leg}
        </strong>

        <br>

        ${escapeHTML(leg.homeTeam)}
        vs
        ${escapeHTML(leg.awayTeam)}

        <br><br>

        <input
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          id="knockout-home-${escapeHTML(tie.id)}-${leg.leg}"
          placeholder="Home"
        >

        <input
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          id="knockout-away-${escapeHTML(tie.id)}-${leg.leg}"
          placeholder="Away"
        >

        <button
          type="button"
          data-save-knockout="${escapeHTML(tie.id)}"
          data-leg="${leg.leg}"
        >
          Save
        </button>

      </div>
    `;

    // Only show the next unplayed leg.
    break;
  }


  return html;
}


// =========================================================
// ATTACH KNOCKOUT CONTROL EVENTS
// =========================================================

function setupKnockoutControls() {

  document
    .querySelectorAll(
      "[data-save-knockout]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const tieId =
            button.dataset.saveKnockout;

          const legNumber =
            Number(
              button.dataset.leg
            );


          const homeInput =
            document.getElementById(
              `knockout-home-${tieId}-${legNumber}`
            );


          const awayInput =
            document.getElementById(
              `knockout-away-${tieId}-${legNumber}`
            );


          if (
            !homeInput ||
            !awayInput
          ) {
            return;
          }


          await saveKnockoutLegResult(
            tieId,
            legNumber,
            homeInput.value,
            awayInput.value
          );
        }
      );
    });


  document
    .querySelectorAll(
      "[data-resolve-knockout]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const tieId =
            button.dataset.resolveKnockout;

          const winnerSide =
            button.dataset.winnerSide;


          await resolveKnockoutTie(
            tieId,
            winnerSide
          );
        }
      );
    });
}


// =========================================================
// WRAP KNOCKOUT RENDERER WITH ADMIN CONTROLS
//
// The visual bracket from Part 6 remains intact.
// This adds the score/resolution controls beneath
// the appropriate tie.
// =========================================================

const originalRenderKnockoutTieCard =
  renderKnockoutTieCard;


renderKnockoutTieCard = function(tie) {

  const original =
    originalRenderKnockoutTieCard(tie);


  return original.replace(
    `
      </div>

    </div>
  `,
    `
        ${renderKnockoutAdminControls(tie)}

      </div>

    </div>
  `
  );
};


// =========================================================
// REFRESH KNOCKOUT CONTROLS AFTER RENDER
// =========================================================

const originalRenderAdminKnockout =
  renderAdminKnockout;


renderAdminKnockout = function() {

  originalRenderAdminKnockout();

  setupKnockoutControls();
};

// =========================================================
// DLS COMPETITION
// CHAMPIONS LEAGUE TEST ADMIN
// champions-admin.js
//
// PART 8 — TEST BRACKET, RESET & CHAMPION SUMMARY
// =========================================================


// =========================================================
// CREATE TEST BRACKET
//
// This button is for testing the Champions League bracket
// before the real league phase is completed.
//
// IMPORTANT:
//
// It uses the SAME random-draw system as the real
// knockout stage.
//
// It does NOT use league-position pairing.
//
// It does NOT affect the live DLS competition.
// =========================================================

async function createTestBracket() {

  // -------------------------------------------------------
  // DO NOT CREATE A TEST BRACKET OVER A REAL SEASON
  // -------------------------------------------------------

  if (competition.season.started) {

    showMessage(
      "A season has already started. Reset the test first if you need to create a new test bracket.",
      "error"
    );

    return;
  }


  if (
    competition.knockout &&
    competition.knockout.started
  ) {

    const confirmed =
      confirm(
        "A test knockout bracket already exists. Replace it with a new random draw?"
      );


    if (!confirmed) {
      return;
    }


    resetKnockoutData();
  }


  // -------------------------------------------------------
  // CHECK TEAM COUNT
  // -------------------------------------------------------

  if (
    !Array.isArray(
      competition.teams
    ) ||
    competition.teams.length < 9
  ) {

    showMessage(
      "At least 9 teams are required to create a test bracket.",
      "error"
    );

    return;
  }


  // -------------------------------------------------------
  // DETERMINE QUALIFICATION SIZE
  // -------------------------------------------------------

  const qualificationSize =
    getQualificationSize(
      competition.teams.length
    );


  if (!qualificationSize) {

    showMessage(
      "The current number of teams cannot create a knockout bracket.",
      "error"
    );

    return;
  }


  // -------------------------------------------------------
  // SELECT TEAMS FOR THE TEST
  //
  // The first qualificationSize teams are selected.
  // The ACTUAL KNOCKOUT DRAW is then randomized.
  //
  // For a real season these teams will come from the
  // final league standings.
  // -------------------------------------------------------

  const testQualifiedTeams =
    competition.teams
      .slice(0, qualificationSize)
      .map(team => ({
        ...team,
        position:
          competition.teams.findIndex(
            item => item.id === team.id
          ) + 1
      }));


  // -------------------------------------------------------
  // RANDOM DRAW
  // -------------------------------------------------------

  const randomlyDrawnTeams =
    randomizeKnockoutTeams(
      testQualifiedTeams
    );


  const firstRound =
    getFirstKnockoutStage(
      qualificationSize
    );


  if (!firstRound) {

    showMessage(
      "Unable to determine the first knockout round.",
      "error"
    );

    return;
  }


  // -------------------------------------------------------
  // BUILD RANDOM FIRST ROUND
  // -------------------------------------------------------

  const firstRoundBracket =
    buildRandomKnockoutBracket(
      randomlyDrawnTeams,
      firstRound
    );


  // -------------------------------------------------------
  // CREATE KNOCKOUT STATE
  // -------------------------------------------------------

  competition.knockout = {

    started: true,

    completed: false,

    stage: firstRound,

    qualificationSize,

    bracket: firstRoundBracket
  };


  // -------------------------------------------------------
  // CREATE ALL FUTURE ROUNDS
  // -------------------------------------------------------

  addFutureBracketRounds(
    competition.knockout.bracket,
    firstRound
  );


  // -------------------------------------------------------
  // SAVE
  // -------------------------------------------------------

  try {

    await saveCompetition();


    renderDashboard();


    alert(
      `Random ${getRoundDisplayName(firstRound)} test bracket created successfully.`
    );

  } catch (error) {

    console.error(
      "Failed to create test bracket:",
      error
    );


    resetKnockoutData();


    showMessage(
      "Failed to save the test bracket.",
      "error"
    );
  }
}


// =========================================================
// RESET CHAMPIONS TEST
//
// This resets the Champions League test system only.
//
// It does NOT touch the main DLS competition.
// =========================================================

async function resetChampionsTest() {

  const confirmed =
    confirm(
      "Reset the Champions League test completely? This will remove the test teams, fixtures, season settings and knockout bracket."
    );


  if (!confirmed) {
    return;
  }


  const secondConfirmation =
    confirm(
      "This action cannot be undone. Continue?"
    );


  if (!secondConfirmation) {
    return;
  }


  // -------------------------------------------------------
  // RESET EVERYTHING IN THE TEST DOCUMENT
  // -------------------------------------------------------

  competition = {

    teams: [],

    fixtures: [],

    season: {

      started: false,

      completed: false,

      format: "champions",

      leagueMatchesPerTeam: 1,

      knockoutLegs: 1,

      startDate: "",

      endDate: ""
    },

    knockout: {

      started: false,

      completed: false,

      stage: "",

      qualificationSize: 0,

      bracket: []
    }
  };


  // -------------------------------------------------------
  // SAVE CLEAN TEST STATE
  // -------------------------------------------------------

  try {

    await saveCompetition();


    renderDashboard();


    showMessage(
      "Champions League test has been completely reset.",
      "success"
    );

  } catch (error) {

    console.error(
      "Failed to reset Champions League test:",
      error
    );


    showMessage(
      "Failed to reset the Champions League test.",
      "error"
    );
  }
}


// =========================================================
// GET CHAMPION
// =========================================================

function getChampionsLeagueChampion() {

  if (
    !competition.knockout ||
    !competition.knockout.completed
  ) {
    return "";
  }


  return (
    competition.knockout.champion ||
    ""
  );
}


// =========================================================
// RENDER CHAMPION SUMMARY
// =========================================================

function renderChampionSummary() {

  const champion =
    getChampionsLeagueChampion();


  if (!champion) {
    return "";
  }


  return `

    <div
      class="champions-knockout-header"
      style="
        margin:20px 0;
        padding:18px;
        border:2px solid currentColor;
        border-radius:12px;
        text-align:center;
      "
    >

      <div
        style="
          font-size:13px;
          text-transform:uppercase;
          letter-spacing:1px;
          opacity:0.7;
          margin-bottom:6px;
        "
      >
        Champions League Champion
      </div>


      <div
        style="
          font-size:24px;
          font-weight:800;
        "
      >
        ${escapeHTML(champion)}
      </div>

    </div>

  `;
}


// =========================================================
// UPDATE KNOCKOUT STATUS WITH CHAMPION
// =========================================================

function updateChampionStatus() {

  const statusElement =
    document.getElementById(
      "adminKnockoutStatus"
    );


  if (!statusElement) {
    return;
  }


  const champion =
    getChampionsLeagueChampion();


  if (!champion) {
    return;
  }


  statusElement.innerHTML +=
    renderChampionSummary();
}


// =========================================================
// SAFE TEST BRACKET CHECK
// =========================================================

function hasKnockoutBracket() {

  return Boolean(
    competition.knockout &&
    competition.knockout.started &&
    Array.isArray(
      competition.knockout.bracket
    ) &&
    competition.knockout.bracket.length
  );
}


// =========================================================
// GET KNOCKOUT BRACKET COUNT
// =========================================================

function getKnockoutBracketCount() {

  if (!hasKnockoutBracket()) {
    return 0;
  }


  return competition.knockout.bracket.length;
}


// =========================================================
// GET ROUND TIES
// =========================================================

function getKnockoutRoundTies(round) {

  if (!hasKnockoutBracket()) {
    return [];
  }


  return competition.knockout.bracket.filter(
    tie => tie.round === round
  );
}


// =========================================================
// CHECK WHETHER ALL TIES IN A ROUND ARE COMPLETE
// =========================================================

function isKnockoutRoundComplete(round) {

  const ties =
    getKnockoutRoundTies(round);


  if (!ties.length) {
    return false;
  }


  return ties.every(
    tie => Boolean(tie.winner)
  );
}


// =========================================================
// CHECK WHETHER FINAL IS COMPLETE
// =========================================================

function isChampionsLeagueComplete() {

  const finalTies =
    getKnockoutRoundTies("F");


  if (finalTies.length !== 1) {
    return false;
  }


  return Boolean(
    finalTies[0].winner
  );
}


// =========================================================
// TEST BRACKET INFORMATION
// =========================================================

function getTestBracketInformation() {

  if (!hasKnockoutBracket()) {

    return {
      started: false,
      round: "",
      qualificationSize: 0,
      totalTies: 0
    };
  }


  return {

    started: true,

    round:
      competition.knockout.stage,

    qualificationSize:
      competition.knockout.qualificationSize,

    totalTies:
      getKnockoutBracketCount(),

    completed:
      competition.knockout.completed === true,

    champion:
      getChampionsLeagueChampion()
  };
}


// =========================================================
// BUTTON EVENT SAFETY
//
// Part 1 already connects the buttons.
// These functions are provided for those handlers.
// =========================================================

window.createChampionsTestBracket =
  createTestBracket;


window.resetChampionsCompetition =
  resetChampionsTest;


// =========================================================
// REFRESH DASHBOARD AFTER CHAMPION UPDATE
// =========================================================

const previousRenderDashboard =
  renderDashboard;


renderDashboard = function() {

  previousRenderDashboard();


  if (
    competition.knockout &&
    competition.knockout.completed
  ) {

    updateChampionStatus();
  }
};

// =========================================================
// DLS COMPETITION
// CHAMPIONS LEAGUE TEST ADMIN
// champions-admin.js
//
// PART 9 — LOCKING, VALIDATION & COMPETITION SAFETY
// =========================================================


// =========================================================
// CHECK WHETHER SEASON IS LOCKED
// =========================================================

function isChampionsSeasonLocked() {

  return Boolean(
    competition.season &&
    competition.season.started
  );
}


// =========================================================
// CHECK WHETHER KNOCKOUT IS LOCKED
// =========================================================

function isChampionsKnockoutLocked() {

  return Boolean(
    competition.knockout &&
    competition.knockout.started
  );
}


// =========================================================
// CHECK WHETHER COMPETITION IS COMPLETELY LOCKED
// =========================================================

function isChampionsCompetitionLocked() {

  return Boolean(
    competition.season &&
    competition.season.completed
  );
}


// =========================================================
// VALIDATE TEAM LIST
// =========================================================

function validateChampionsTeams() {

  if (
    !Array.isArray(
      competition.teams
    )
  ) {

    return {
      valid: false,
      message: "Team list is invalid."
    };
  }


  if (
    competition.teams.length < 9
  ) {

    return {
      valid: false,
      message:
        "At least 9 teams are required."
    };
  }


  const ids =
    new Set();


  for (
    const team of competition.teams
  ) {

    if (
      !team ||
      !team.id ||
      !team.name
    ) {

      return {
        valid: false,
        message:
          "Every team must have a valid ID and name."
      };
    }


    if (ids.has(team.id)) {

      return {
        valid: false,
        message:
          "Duplicate team ID detected."
      };
    }


    ids.add(team.id);
  }


  return {
    valid: true,
    message: ""
  };
}


// =========================================================
// VALIDATE LEAGUE SETTINGS
// =========================================================

function validateChampionsLeagueSettings() {

  const matchesPerTeam =
    Number(
      competition.season
        .leagueMatchesPerTeam
    );


  const knockoutLegs =
    Number(
      competition.season
        .knockoutLegs
    );


  if (
    !Number.isInteger(matchesPerTeam) ||
    matchesPerTeam < 1 ||
    matchesPerTeam > MAX_LEAGUE_MATCHES
  ) {

    return {
      valid: false,
      message:
        "League matches per team must be between 1 and 8."
    };
  }


  if (
    knockoutLegs !== 1 &&
    knockoutLegs !== 2
  ) {

    return {
      valid: false,
      message:
        "Knockout legs must be 1 or 2."
    };
  }


  return {
    valid: true,
    message: ""
  };
}


// =========================================================
// VALIDATE EVERY LEAGUE FIXTURE
// =========================================================

function validateAllLeagueFixtures() {

  const teamIds =
    new Set(
      competition.teams.map(
        team => team.id
      )
    );


  const fixtures =
    getLeagueFixtures();


  if (!fixtures.length) {

    return {
      valid: false,
      message:
        "No league fixtures exist."
    };
  }


  const pairings =
    new Set();


  for (
    const fixture of fixtures
  ) {

    if (
      !fixture.id ||
      !fixture.homeId ||
      !fixture.awayId
    ) {

      return {
        valid: false,
        message:
          "A league fixture has missing team information."
      };
    }


    if (
      !teamIds.has(
        fixture.homeId
      ) ||
      !teamIds.has(
        fixture.awayId
      )
    ) {

      return {
        valid: false,
        message:
          "A league fixture contains a team that no longer exists."
      };
    }


    if (
      fixture.homeId ===
      fixture.awayId
    ) {

      return {
        valid: false,
        message:
          "A team cannot play itself."
      };
    }


    const pair =
      [
        fixture.homeId,
        fixture.awayId
      ]
      .sort()
      .join("|");


    if (
      pairings.has(pair)
    ) {

      return {
        valid: false,
        message:
          "Duplicate league pairing detected."
      };
    }


    pairings.add(pair);
  }


  return {
    valid: true,
    message: ""
  };
}


// =========================================================
// CHECK ALL LEAGUE RESULTS
// =========================================================

function areAllLeagueResultsComplete() {

  const fixtures =
    getLeagueFixtures();


  if (!fixtures.length) {
    return false;
  }


  return fixtures.every(
    fixture => {

      if (
        fixture.played !== true
      ) {
        return false;
      }


      return (
        isValidKnockoutScore(
          fixture.homeScore
        ) &&
        isValidKnockoutScore(
          fixture.awayScore
        )
      );
    }
  );
}


// =========================================================
// GET NUMBER OF COMPLETED LEAGUE MATCHES
// =========================================================

function getCompletedLeagueMatchCount() {

  return getLeagueFixtures()
    .filter(
      fixture =>
        fixture.played === true &&
        isValidKnockoutScore(
          fixture.homeScore
        ) &&
        isValidKnockoutScore(
          fixture.awayScore
        )
    )
    .length;
}


// =========================================================
// GET TOTAL LEAGUE MATCH COUNT
// =========================================================

function getTotalLeagueMatchCount() {

  return getLeagueFixtures().length;
}


// =========================================================
// GET LEAGUE PROGRESS
// =========================================================

function getLeagueProgress() {

  const total =
    getTotalLeagueMatchCount();


  const completed =
    getCompletedLeagueMatchCount();


  return {

    completed,

    total,

    remaining:
      Math.max(
        total - completed,
        0
      ),

    complete:
      total > 0 &&
      completed === total
  };
}


// =========================================================
// PROTECT LEAGUE FIXTURE GENERATION
// =========================================================

const originalGenerateLeagueFixtures =
  generateLeagueFixtures;


generateLeagueFixtures =
  async function() {

    if (
      isChampionsSeasonLocked() ||
      isChampionsKnockoutLocked()
    ) {

      showMessage(
        "League fixtures are locked after the season starts.",
        "error"
      );

      return false;
    }


    if (
      competition.fixtures &&
      competition.fixtures.some(
        fixture =>
          fixture.type === "league"
      )
    ) {

      showMessage(
        "League fixtures already exist. They cannot be regenerated.",
        "error"
      );

      return false;
    }


    return originalGenerateLeagueFixtures();
  };


// =========================================================
// PROTECT TEAM REMOVAL
// =========================================================

const originalRemoveTeam =
  removeTeam;


removeTeam =
  async function(teamId) {

    if (
      isChampionsSeasonLocked() ||
      isChampionsKnockoutLocked()
    ) {

      showMessage(
        "Teams are locked after the season starts.",
        "error"
      );

      return false;
    }


    return originalRemoveTeam(
      teamId
    );
  };


// =========================================================
// PROTECT TEST TEAM ADDITION
// =========================================================

const originalAddTestTeams =
  addTestTeams;


addTestTeams =
  async function() {

    if (
      isChampionsSeasonLocked() ||
      isChampionsKnockoutLocked()
    ) {

      showMessage(
        "Teams cannot be added after the season starts.",
        "error"
      );

      return false;
    }


    return originalAddTestTeams();
  };


// =========================================================
// PROTECT TEST TEAM CLEAR
// =========================================================

const originalClearTestTeams =
  clearTestTeams;


clearTestTeams =
  async function() {

    if (
      isChampionsSeasonLocked() ||
      isChampionsKnockoutLocked()
    ) {

      showMessage(
        "Teams cannot be cleared after the season starts.",
        "error"
      );

      return false;
    }


    return originalClearTestTeams();
  };


// =========================================================
// PROTECT SEASON START
// =========================================================

const originalStartSeason =
  startSeason;


startSeason =
  async function() {

    if (
      isChampionsSeasonLocked()
    ) {

      showMessage(
        "The season has already started.",
        "error"
      );

      return false;
    }


    const teamCheck =
      validateChampionsTeams();


    if (!teamCheck.valid) {

      showMessage(
        teamCheck.message,
        "error"
      );

      return false;
    }


    const settingsCheck =
      validateChampionsLeagueSettings();


    if (!settingsCheck.valid) {

      showMessage(
        settingsCheck.message,
        "error"
      );

      return false;
    }


    const fixtureCheck =
      validateAllLeagueFixtures();


    if (!fixtureCheck.valid) {

      showMessage(
        fixtureCheck.message,
        "error"
      );

      return false;
    }


    return originalStartSeason();
  };


// =========================================================
// PROTECT FINISH LEAGUE
// =========================================================

const originalFinishLeaguePhase =
  finishLeaguePhase;


finishLeaguePhase =
  async function() {

    if (
      !isChampionsSeasonLocked()
    ) {

      showMessage(
        "The season has not started.",
        "error"
      );

      return false;
    }


    if (
      isChampionsKnockoutLocked()
    ) {

      showMessage(
        "The knockout stage has already started.",
        "error"
      );

      return false;
    }


    if (
      !areAllLeagueResultsComplete()
    ) {

      const progress =
        getLeagueProgress();


      showMessage(
        `League is not complete. ${progress.remaining} match${
          progress.remaining === 1
            ? ""
            : "es"
        } remain.`,
        "error"
      );

      return false;
    }


    return originalFinishLeaguePhase();
  };


// =========================================================
// PROTECT LEAGUE RESULT SAVING
//
// A completed fixture cannot be overwritten.
// =========================================================

const originalSaveLeagueResultById =
  saveLeagueResultById;


saveLeagueResultById =
  async function(fixtureId) {

    if (
      isChampionsCompetitionLocked()
    ) {

      showMessage(
        "The competition is completely locked.",
        "error"
      );

      return false;
    }


    if (
      isChampionsKnockoutLocked()
    ) {

      showMessage(
        "League results are locked because the knockout stage has started.",
        "error"
      );

      return false;
    }


    const fixture =
      competition.fixtures.find(
        item =>
          item.id === fixtureId
      );


    if (!fixture) {

      showMessage(
        "League fixture not found.",
        "error"
      );

      return false;
    }


    if (
      fixture.played === true
    ) {

      showMessage(
        "This league result has already been saved and cannot be changed.",
        "error"
      );

      return false;
    }


    return originalSaveLeagueResultById(
      fixtureId
    );
  };


// =========================================================
// PROTECT TEST BRACKET CREATION
// =========================================================

const originalCreateTestBracket =
  createTestBracket;


createTestBracket =
  async function() {

    if (
      isChampionsCompetitionLocked()
    ) {

      showMessage(
        "The completed competition is locked.",
        "error"
      );

      return false;
    }


    return originalCreateTestBracket();
  };


// =========================================================
// PROTECT KNOCKOUT RESULT SAVING
// =========================================================

const originalSaveKnockoutLegResult =
  saveKnockoutLegResult;


saveKnockoutLegResult =
  async function(
    tieId,
    legNumber,
    homeScore,
    awayScore
  ) {

    if (
      isChampionsCompetitionLocked()
    ) {

      showMessage(
        "The completed competition is locked.",
        "error"
      );

      return false;
    }


    return originalSaveKnockoutLegResult(
      tieId,
      legNumber,
      homeScore,
      awayScore
    );
  };


// =========================================================
// PROTECT KNOCKOUT RESOLUTION
// =========================================================

const originalResolveKnockoutTie =
  resolveKnockoutTie;


resolveKnockoutTie =
  async function(
    tieId,
    winnerSide
  ) {

    if (
      isChampionsCompetitionLocked()
    ) {

      showMessage(
        "The completed competition is locked.",
        "error"
      );

      return false;
    }


    return originalResolveKnockoutTie(
      tieId,
      winnerSide
    );
  };


// =========================================================
// LOCK STATUS DISPLAY
// =========================================================

function getChampionsLockStatus() {

  return {

    teamsLocked:
      isChampionsSeasonLocked(),

    leagueSettingsLocked:
      isChampionsSeasonLocked(),

    fixturesLocked:
      isChampionsSeasonLocked(),

    knockoutLocked:
      isChampionsKnockoutLocked(),

    competitionCompleted:
      isChampionsCompetitionLocked()
  };
}


// =========================================================
// VALIDATE COMPLETE COMPETITION STATE
// =========================================================

function validateChampionsCompetitionState() {

  // -------------------------------------------------------
  // TEAM VALIDATION
  // -------------------------------------------------------

  const teams =
    validateChampionsTeams();


  if (
    competition.season.started &&
    !teams.valid
  ) {

    return {
      valid: false,
      message: teams.message
    };
  }


  // -------------------------------------------------------
  // FIXTURE VALIDATION
  // -------------------------------------------------------

  if (
    competition.season.started
  ) {

    const fixtures =
      validateAllLeagueFixtures();


    if (!fixtures.valid) {

      return {
        valid: false,
        message: fixtures.message
      };
    }
  }


  // -------------------------------------------------------
  // KNOCKOUT VALIDATION
  // -------------------------------------------------------

  if (
    competition.knockout.started
  ) {

    if (
      !Array.isArray(
        competition.knockout.bracket
      ) ||
      !competition.knockout.bracket.length
    ) {

      return {
        valid: false,
        message:
          "Knockout stage is marked started but contains no bracket."
      };
    }
  }


  // -------------------------------------------------------
  // COMPLETED COMPETITION VALIDATION
  // -------------------------------------------------------

  if (
    competition.season.completed
  ) {

    if (
      !competition.knockout.completed
    ) {

      return {
        valid: false,
        message:
          "Season is completed but knockout is not completed."
      };
    }


    if (
      !competition.knockout.champion
    ) {

      return {
        valid: false,
        message:
          "Competition is completed but no champion exists."
      };
    }
  }


  return {
    valid: true,
    message: ""
  };
}


// =========================================================
// FINAL SAFETY CHECK BEFORE SAVING
// =========================================================

const originalSaveCompetition =
  saveCompetition;


saveCompetition =
  async function() {

    const validation =
      validateChampionsCompetitionState();


    if (!validation.valid) {

      console.error(
        "Champions competition validation failed:",
        validation.message
      );


      showMessage(
        validation.message,
        "error"
      );


      throw new Error(
        validation.message
      );
    }


    return originalSaveCompetition();
  };


// =========================================================
// DISPLAY LOCKED STATE IN SEASON STATUS
// =========================================================

const originalRenderSeasonStatus =
  renderSeasonStatus;


renderSeasonStatus =
  function() {

    originalRenderSeasonStatus();


    const element =
      document.getElementById(
        "seasonStatus"
      );


    if (!element) {
      return;
    }


    if (
      isChampionsCompetitionLocked()
    ) {

      element.innerHTML += `
        <div style="
          margin-top:8px;
          font-weight:700;
        ">
          Competition locked — Champion:
          ${escapeHTML(
            competition.knockout.champion ||
            "Unknown"
          )}
        </div>
      `;

      return;
    }


    if (
      isChampionsKnockoutLocked()
    ) {

      element.innerHTML += `
        <div style="
          margin-top:8px;
          font-weight:700;
        ">
          Knockout bracket locked.
        </div>
      `;

      return;
    }


    if (
      isChampionsSeasonLocked()
    ) {

      const progress =
        getLeagueProgress();


      element.innerHTML += `
        <div style="
          margin-top:8px;
          font-weight:700;
        ">
          League fixtures locked.
          ${progress.completed}/${progress.total}
          completed.
        </div>
      `;
    }
  };

// =========================================================
// DLS CHAMPIONS LEAGUE TEST ADMIN
// PART 10 — FINAL INTEGRATION, STATE INTEGRITY & EXPORTS
// =========================================================


// =========================================================
// FINAL STATE NORMALIZER
// =========================================================

function normalizeChampionsCompetitionState() {

  if (!competition || typeof competition !== "object") {
    competition = {
      teams: [],
      fixtures: [],
      season: {
        started: false,
        completed: false,
        format: "champions",
        leagueMatchesPerTeam: 1,
        knockoutLegs: 1,
        startDate: "",
        endDate: ""
      },
      knockout: {
        started: false,
        completed: false,
        stage: "",
        qualificationSize: 0,
        bracket: []
      }
    };
  }


  // -------------------------------------------------------
  // TEAMS
  // -------------------------------------------------------

  if (!Array.isArray(competition.teams)) {
    competition.teams = [];
  }


  // -------------------------------------------------------
  // FIXTURES
  // -------------------------------------------------------

  if (!Array.isArray(competition.fixtures)) {
    competition.fixtures = [];
  }


  // -------------------------------------------------------
  // SEASON
  // -------------------------------------------------------

  if (!competition.season || typeof competition.season !== "object") {
    competition.season = {};
  }

  competition.season.started =
    competition.season.started === true;

  competition.season.completed =
    competition.season.completed === true;

  competition.season.format =
    competition.season.format || "champions";

  const matches =
    Number(competition.season.leagueMatchesPerTeam);

  competition.season.leagueMatchesPerTeam =
    Number.isInteger(matches) && matches >= 1 && matches <= 8
      ? matches
      : 1;

  const knockoutLegs =
    Number(competition.season.knockoutLegs);

  competition.season.knockoutLegs =
    knockoutLegs === 2 ? 2 : 1;

  competition.season.startDate =
    competition.season.startDate || "";

  competition.season.endDate =
    competition.season.endDate || "";


  // -------------------------------------------------------
  // KNOCKOUT
  // -------------------------------------------------------

  if (
    !competition.knockout ||
    typeof competition.knockout !== "object"
  ) {
    competition.knockout = {};
  }

  competition.knockout.started =
    competition.knockout.started === true;

  competition.knockout.completed =
    competition.knockout.completed === true;

  competition.knockout.stage =
    competition.knockout.stage || "";

  const qualificationSize =
    Number(competition.knockout.qualificationSize);

  competition.knockout.qualificationSize =
    Number.isInteger(qualificationSize) &&
    qualificationSize >= 0
      ? qualificationSize
      : 0;

  if (!Array.isArray(competition.knockout.bracket)) {
    competition.knockout.bracket = [];
  }


  // -------------------------------------------------------
  // COMPLETED COMPETITION CONSISTENCY
  // -------------------------------------------------------

  if (competition.knockout.completed) {

    competition.season.completed = true;
    competition.knockout.started = true;

  }


  // -------------------------------------------------------
  // KNOCKOUT STARTED CONSISTENCY
  // -------------------------------------------------------

  if (competition.knockout.started) {

    if (competition.knockout.bracket.length === 0) {

      competition.knockout.started = false;
      competition.knockout.completed = false;
      competition.knockout.stage = "";
      competition.knockout.qualificationSize = 0;

    }

  }


  return competition;
}


// =========================================================
// FINAL BRACKET INTEGRITY CHECK
// =========================================================

function validateChampionsBracketIntegrity() {

  if (!competition.knockout.started) {
    return {
      valid: true,
      message: "Knockout has not started."
    };
  }


  const bracket =
    competition.knockout.bracket;

  if (!Array.isArray(bracket) || bracket.length === 0) {

    return {
      valid: false,
      message: "Knockout bracket is missing."
    };

  }


  const validRounds = [
    "R32",
    "R16",
    "QF",
    "SF",
    "F"
  ];


  for (const tie of bracket) {

    if (!tie || typeof tie !== "object") {

      return {
        valid: false,
        message: "Invalid knockout tie detected."
      };

    }


    if (!tie.id) {

      return {
        valid: false,
        message: "A knockout tie is missing its ID."
      };

    }


    if (!validRounds.includes(tie.round)) {

      return {
        valid: false,
        message:
          `Invalid knockout round detected: ${tie.round || "unknown"}.`
      };

    }


    if (!Array.isArray(tie.legs)) {

      return {
        valid: false,
        message:
          `Knockout tie ${tie.id} has invalid leg data.`
      };

    }

  }


  return {
    valid: true,
    message: "Knockout bracket is valid."
  };
}


// =========================================================
// FINAL COMPETITION INTEGRITY CHECK
// =========================================================

function runChampionsIntegrityCheck() {

  normalizeChampionsCompetitionState();


  // -------------------------------------------------------
  // BASIC TEAM VALIDATION
  // -------------------------------------------------------

  const teamValidation =
    validateChampionsTeams();

  if (!teamValidation.valid) {
    return teamValidation;
  }


  // -------------------------------------------------------
  // SEASON VALIDATION
  // -------------------------------------------------------

  if (competition.season.started) {

    const settingsValidation =
      validateChampionsLeagueSettings();

    if (!settingsValidation.valid) {
      return settingsValidation;
    }


    const fixtureValidation =
      validateAllLeagueFixtures();

    if (!fixtureValidation.valid) {
      return fixtureValidation;
    }

  }


  // -------------------------------------------------------
  // KNOCKOUT VALIDATION
  // -------------------------------------------------------

  const bracketValidation =
    validateChampionsBracketIntegrity();

  if (!bracketValidation.valid) {
    return bracketValidation;
  }


  // -------------------------------------------------------
  // FINAL SEASON/KNOCKOUT CONSISTENCY
  // -------------------------------------------------------

  if (
    competition.season.completed &&
    !competition.knockout.completed
  ) {

    return {
      valid: false,
      message:
        "Season is marked completed but knockout is not completed."
    };

  }


  return {
    valid: true,
    message: "Competition integrity check passed."
  };
}


// =========================================================
// FINAL SAVE SAFETY WRAPPER
// =========================================================

const championsSaveCompetitionFinal =
  saveCompetition;

saveCompetition = async function () {

  normalizeChampionsCompetitionState();


  const integrity =
    runChampionsIntegrityCheck();


  if (!integrity.valid) {

    console.error(
      "Champions Competition integrity check failed:",
      integrity.message
    );

    throw new Error(
      integrity.message
    );

  }


  return championsSaveCompetitionFinal();

};


// =========================================================
// FINAL RENDER SAFETY
// =========================================================

const championsRenderDashboardFinal =
  renderDashboard;

renderDashboard = function () {

  normalizeChampionsCompetitionState();

  championsRenderDashboardFinal();

};


// =========================================================
// FINAL BROWSER EXPORTS
// IMPORTANT:
// These exports point to the FINAL wrapped functions.
// =========================================================

window.saveChampionsLeagueResult =
  saveLeagueResultById;

window.generateChampionsLeagueFixtures =
  generateLeagueFixtures;

window.finishChampionsLeague =
  finishLeaguePhase;

window.createChampionsKnockout =
  createKnockoutFromStandings;

window.saveChampionsKnockoutLeg =
  saveKnockoutLegResult;

window.resolveChampionsKnockoutTie =
  resolveKnockoutTie;

window.createChampionsTestBracket =
  createTestBracket;

window.resetChampionsCompetition =
  resetChampionsTest;

window.startChampionsSeason =
  startSeason;

window.addChampionsTestTeams =
  addTestTeams;

window.clearChampionsTestTeams =
  clearTestTeams;

window.runChampionsIntegrityCheck =
  runChampionsIntegrityCheck;


// =========================================================
// FINAL CONSOLE STATUS
// =========================================================

console.log(
  "DLS Champions League Test Admin loaded successfully."
);

console.log(
  "Champions Competition State:",
  competition
);