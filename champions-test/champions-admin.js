/* =========================================================
   DLS COMPETITION
   CHAMPIONS LEAGUE TEST ADMIN
   champions-admin.js
   COMPLETE REBUILD — PART 1 OF 10

   AUTHENTICATION
   FIREBASE DATA
   GLOBAL STATE
   INITIALIZATION
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

const ADMIN_EMAIL =
  "obakimoprecious07@gmail.com";

const TEST_COLLECTION =
  "championsTest";

const TEST_DOCUMENT =
  "main";

const MAX_LEAGUE_MATCHES =
  8;

const MIN_TEAMS =
  9;


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let db = null;

let auth = null;


/* =========================================================
   DEFAULT COMPETITION
   ========================================================= */

function createDefaultCompetition() {

  return {

    teams: [],

    fixtures: [],

    season: {

      started: false,

      format: "champions",

      leagueMatchesPerTeam: 1,

      knockoutLegs: 1,

      startDate: "",

      endDate: ""

    },

    knockout: {

      started: false,

      stage: "",

      qualificationSize: 0,

      bracket: []

    }

  };

}


/* =========================================================
   GLOBAL COMPETITION STATE
   ========================================================= */

let competition =
  createDefaultCompetition();


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeAdmin();

  }
);


/* =========================================================
   INITIALIZE ADMIN
   ========================================================= */

function initializeAdmin() {

  if (!window.firebaseReady) {

    showMessage(
      "adminLoginMessage",
      "Firebase is not ready."
    );

    return;
  }

  db = window.db;

  auth = window.auth;

  setupLogin();

  setupButtons();

  watchAuthentication();

}


/* =========================================================
   AUTHENTICATION WATCHER
   ========================================================= */

function watchAuthentication() {

  onAuthStateChanged(
    auth,
    async user => {

      if (!user) {

        showLogin();

        return;
      }


      if (
        user.email?.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
      ) {

        await signOut(auth);

        showMessage(
          "adminLoginMessage",
          "This account is not authorized."
        );

        showLogin();

        return;
      }


      showDashboard();

      await loadCompetition();

      renderDashboard();

    }
  );

}


/* =========================================================
   LOGIN SETUP
   ========================================================= */

function setupLogin() {

  const form =
    document.getElementById(
      "adminLoginForm"
    );

  if (!form) {
    return;
  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const email =
        document.getElementById(
          "adminEmail"
        )?.value.trim() || "";


      const password =
        document.getElementById(
          "adminPassword"
        )?.value || "";


      const message =
        document.getElementById(
          "adminLoginMessage"
        );


      if (
        email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
      ) {

        if (message) {

          message.textContent =
            "Unauthorized admin email.";

        }

        return;
      }


      if (message) {

        message.textContent =
          "Logging in...";

      }


      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        if (message) {

          message.textContent = "";

        }

      } catch (error) {

        console.error(
          "Admin login error:",
          error
        );

        if (message) {

          message.textContent =
            "Login failed. Check your email and password.";

        }

      }

    }
  );

}


/* =========================================================
   BUTTON SETUP
   ========================================================= */

function setupButtons() {

  document
    .getElementById(
      "startSeasonButton"
    )
    ?.addEventListener(
      "click",
      startSeason
    );


  document
    .getElementById(
      "generateLeagueButton"
    )
    ?.addEventListener(
      "click",
      generateLeagueFixtures
    );


  document
    .getElementById(
      "finishLeagueButton"
    )
    ?.addEventListener(
      "click",
      finishLeaguePhase
    );


  document
    .getElementById(
      "addTestTeamsButton"
    )
    ?.addEventListener(
      "click",
      addTestTeams
    );


  document
    .getElementById(
      "clearTestTeamsButton"
    )
    ?.addEventListener(
      "click",
      clearTestTeams
    );


  document
    .getElementById(
      "createTestBracketButton"
    )
    ?.addEventListener(
      "click",
      createTestBracket
    );


  document
    .getElementById(
      "resetChampionsButton"
    )
    ?.addEventListener(
      "click",
      resetChampionsTest
    );


  document
    .getElementById(
      "logoutButton"
    )
    ?.addEventListener(
      "click",
      logoutAdmin
    );


  document
    .getElementById(
      "leagueMatchesPerTeam"
    )
    ?.addEventListener(
      "change",
      updateQualificationPreview
    );


  document
    .getElementById(
      "knockoutLegs"
    )
    ?.addEventListener(
      "change",
      updateQualificationPreview
    );

}


/* =========================================================
   SHOW LOGIN
   ========================================================= */

function showLogin() {

  const login =
    document.getElementById(
      "adminLogin"
    );

  const dashboard =
    document.getElementById(
      "adminDashboard"
    );


  if (login) {

    login.style.display = "";

  }


  if (dashboard) {

    dashboard.style.display =
      "none";

  }

}


/* =========================================================
   SHOW DASHBOARD
   ========================================================= */

function showDashboard() {

  const login =
    document.getElementById(
      "adminLogin"
    );

  const dashboard =
    document.getElementById(
      "adminDashboard"
    );


  if (login) {

    login.style.display =
      "none";

  }


  if (dashboard) {

    dashboard.style.display =
      "";

  }

}

/* =========================================================
   PART 2 OF 10
   DATA LOADING
   DATA SAVING
   DASHBOARD RENDERING
   FORM STATE
   ========================================================= */


/* =========================================================
   LOAD COMPETITION
   ========================================================= */

async function loadCompetition() {

  try {

    const reference =
      doc(
        db,
        TEST_COLLECTION,
        TEST_DOCUMENT
      );

    const snapshot =
      await getDoc(reference);


    if (!snapshot.exists()) {

      competition =
        createDefaultCompetition();

      return;
    }


    const data =
      snapshot.data() || {};


    competition = {

      teams:
        Array.isArray(data.teams)
          ? data.teams
          : [],

      fixtures:
        Array.isArray(data.fixtures)
          ? data.fixtures
          : [],

      season: {

        started:
          data.season?.started === true,

        format:
          data.season?.format ||
          "champions",

        leagueMatchesPerTeam:
          clampNumber(
            data.season?.leagueMatchesPerTeam,
            1,
            MAX_LEAGUE_MATCHES
          ),

        knockoutLegs:
          Number(data.season?.knockoutLegs) === 2
            ? 2
            : 1,

        startDate:
          data.season?.startDate || "",

        endDate:
          data.season?.endDate || ""

      },

      knockout: {

        started:
          data.knockout?.started === true,

        stage:
          data.knockout?.stage || "",

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


    normalizeLoadedData();

  } catch (error) {

    console.error(
      "Champions data load error:",
      error
    );

    showMessage(
      "seasonStatus",
      "Unable to load Champions League test data."
    );

  }

}


/* =========================================================
   NORMALIZE LOADED DATA
   ========================================================= */

function normalizeLoadedData() {

  competition.teams =
    competition.teams
      .filter(team => team && team.id)
      .map(team => ({
        id: String(team.id),
        name:
          team.name ||
          "Unnamed Team",
        playerName:
          team.playerName ||
          ""
      }));


  competition.fixtures =
    competition.fixtures
      .filter(fixture => fixture && fixture.id)
      .map(fixture => ({

        ...fixture,

        homeScore:
          fixture.homeScore === undefined
            ? null
            : fixture.homeScore,

        awayScore:
          fixture.awayScore === undefined
            ? null
            : fixture.awayScore

      }));


  competition.knockout.bracket =
    competition.knockout.bracket
      .filter(tie => tie && tie.id)
      .map(tie => {

        const normalized = {

          ...tie,

          homeTeam:
            tie.homeTeam || "TBD",

          awayTeam:
            tie.awayTeam || "TBD",

          homeId:
            tie.homeId || null,

          awayId:
            tie.awayId || null,

          winner:
            tie.winner || null,

          winnerId:
            tie.winnerId || null

        };


        if (
          Array.isArray(tie.legs)
        ) {

          normalized.legs =
            tie.legs.map(leg => ({
              homeScore:
                leg.homeScore === undefined
                  ? null
                  : leg.homeScore,
              awayScore:
                leg.awayScore === undefined
                  ? null
                  : leg.awayScore
            }));

        }


        return normalized;

      });

}


/* =========================================================
   SAVE COMPETITION
   ========================================================= */

async function saveCompetition() {

  if (!db) {

    throw new Error(
      "Firestore is not initialized."
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
   DASHBOARD RENDER
   ========================================================= */

function renderDashboard() {

  renderAdminTeams();

  renderSeasonStatus();

  renderAdminFixtures();

  renderAdminKnockout();

  updateQualificationPreview();

  setFormValues();

  updateControlState();

}


/* =========================================================
   SET FORM VALUES
   ========================================================= */

function setFormValues() {

  const matches =
    document.getElementById(
      "leagueMatchesPerTeam"
    );

  const legs =
    document.getElementById(
      "knockoutLegs"
    );

  const start =
    document.getElementById(
      "seasonStart"
    );

  const end =
    document.getElementById(
      "seasonEnd"
    );


  if (matches) {

    matches.value =
      String(
        competition.season
          .leagueMatchesPerTeam
      );

  }


  if (legs) {

    legs.value =
      String(
        competition.season
          .knockoutLegs
      );

  }


  if (start) {

    start.value =
      competition.season.startDate;

  }


  if (end) {

    end.value =
      competition.season.endDate;

  }

}


/* =========================================================
   UPDATE CONTROL STATE
   ========================================================= */

function updateControlState() {

  const started =
    competition.season.started;


  const generate =
    document.getElementById(
      "generateLeagueButton"
    );

  const start =
    document.getElementById(
      "startSeasonButton"
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


  if (generate) {

    generate.disabled =
      started ||
      hasLeagueFixtures();

  }


  if (start) {

    start.disabled =
      started;

  }


  if (matches) {

    matches.disabled =
      started;

  }


  if (legs) {

    legs.disabled =
      started;

  }


  if (startDate) {

    startDate.disabled =
      started;

  }


  if (endDate) {

    endDate.disabled =
      started;

  }

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


  const total =
    competition.teams.length;


  if (total < MIN_TEAMS) {

    element.textContent =
      "At least 9 teams are required.";

    return;
  }


  const qualificationSize =
    getQualificationSize(
      total
    );


  const stage =
    getFirstKnockoutStage(
      qualificationSize
    );


  element.textContent =
    `${total} teams registered → ` +
    `top ${qualificationSize} qualify → ` +
    `${stage}.`;

}


/* =========================================================
   TEAM NAME LOOKUP
   ========================================================= */

function getTeamName(teamId) {

  const team =
    competition.teams.find(
      item =>
        item.id === teamId
    );

  return (
    team?.name ||
    "Unknown Team"
  );

}


/* =========================================================
   TEAM LOOKUP
   ========================================================= */

function getTeam(teamId) {

  return competition.teams.find(
    team =>
      team.id === teamId
  ) || null;

}


/* =========================================================
   HAS LEAGUE FIXTURES
   ========================================================= */

function hasLeagueFixtures() {

  return competition.fixtures.some(
    fixture =>
      fixture.type === "league"
  );

}


/* =========================================================
   UTILITY — NUMBER CLAMP
   ========================================================= */

function clampNumber(
  value,
  minimum,
  maximum
) {

  const number =
    Number(value);


  if (!Number.isFinite(number)) {

    return minimum;

  }


  return Math.min(
    maximum,
    Math.max(
      minimum,
      number
    )
  );

}

/* =========================================================
   PART 3 OF 10
   TEAM MANAGEMENT
   REMOVE TEAM
   SEASON START
   ========================================================= */


/* =========================================================
   RENDER ADMIN TEAMS
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

    container.innerHTML = `
      <p>
        No teams added.
      </p>
    `;

    return;
  }


  container.innerHTML =
    competition.teams
      .map(
        (team, index) => `

          <div
            class="team-card"
            data-team-id="${escapeHTML(team.id)}"
          >

            <div>

              <h3>
                ${escapeHTML(
                  team.name ||
                  `Team ${index + 1}`
                )}
              </h3>

              ${
                team.playerName
                  ? `
                    <p>
                      ${escapeHTML(
                        team.playerName
                      )}
                    </p>
                  `
                  : ""
              }

            </div>

            ${
              !competition.season.started
                ? `
                  <button
                    type="button"
                    onclick="window.removeChampionsTeam('${escapeHTML(team.id)}')"
                  >
                    🗑 Remove
                  </button>
                `
                : ""
            }

          </div>

        `
      )
      .join("");

}


/* =========================================================
   ADD TEST TEAMS
   ========================================================= */

async function addTestTeams() {

  if (competition.season.started) {

    alert(
      "Teams cannot be changed after the season starts."
    );

    return;
  }


  if (competition.teams.length > 0) {

    const confirmed =
      confirm(
        "Test teams already exist. Add another set of 36 teams?"
      );

    if (!confirmed) {
      return;
    }

  }


  const startIndex =
    competition.teams.length + 1;


  const testTeams = [];


  for (
    let i = 0;
    i < 36;
    i++
  ) {

    const number =
      startIndex + i;


    testTeams.push({

      id:
        `test-team-${number}`,

      name:
        `DLS Team ${number}`,

      playerName:
        `Test Player ${number}`

    });

  }


  competition.teams =
    competition.teams.concat(
      testTeams
    );


  await saveCompetition();

  renderDashboard();


  alert(
    `${testTeams.length} test teams added.`
  );

}


/* =========================================================
   REMOVE TEAM
   ========================================================= */

async function removeTeam(teamId) {

  if (competition.season.started) {

    alert(
      "Teams cannot be removed after the season starts."
    );

    return;
  }


  const team =
    getTeam(teamId);


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
      item =>
        item.id !== teamId
    );


  /*
    Fixtures must be regenerated after
    a team is removed.
  */

  competition.fixtures = [];


  competition.knockout = {

    started: false,

    stage: "",

    qualificationSize: 0,

    bracket: []

  };


  await saveCompetition();

  renderDashboard();


  alert(
    `${team.name} was removed. Generate the league fixtures again.`
  );

}


/* =========================================================
   EXPOSE REMOVE TEAM
   ========================================================= */

window.removeChampionsTeam =
  removeTeam;


/* =========================================================
   CLEAR ALL TEST TEAMS
   ========================================================= */

async function clearTestTeams() {

  if (competition.season.started) {

    alert(
      "Stop/reset the test season before clearing teams."
    );

    return;
  }


  const confirmed =
    confirm(
      "Clear all Champions League test teams and fixtures?"
    );


  if (!confirmed) {
    return;
  }


  competition.teams = [];

  competition.fixtures = [];

  competition.knockout = {

    started: false,

    stage: "",

    qualificationSize: 0,

    bracket: []

  };


  await saveCompetition();

  renderDashboard();

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


  const totalTeams =
    competition.teams.length;


  if (totalTeams < MIN_TEAMS) {

    alert(
      "At least 9 teams are required."
    );

    return;
  }


  /*
    Fixtures MUST exist before the
    season can start.
  */

  if (!hasLeagueFixtures()) {

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


  const matches =
    clampNumber(
      matchesInput?.value,
      1,
      MAX_LEAGUE_MATCHES
    );


  const legs =
    Number(
      legsInput?.value
    ) === 2
      ? 2
      : 1;


  const confirmed =
    confirm(
      `Start the Champions League season with ${matches} league match${matches === 1 ? "" : "es"} per team and ${legs} knockout leg${legs === 1 ? "" : "s"}?`
    );


  if (!confirmed) {
    return;
  }


  competition.season = {

    started: true,

    format: "champions",

    leagueMatchesPerTeam:
      matches,

    knockoutLegs:
      legs,

    startDate:
      startInput?.value || "",

    endDate:
      endInput?.value || ""

  };


  competition.knockout = {

    started: false,

    stage: "",

    qualificationSize: 0,

    bracket: []

  };


  await saveCompetition();

  renderDashboard();


  alert(
    "Champions League season started. Teams and settings are now locked."
  );

}


/* =========================================================
   RENDER SEASON STATUS
   ========================================================= */

function renderSeasonStatus() {

  const container =
    document.getElementById(
      "seasonStatus"
    );

  if (!container) {
    return;
  }


  const leagueFixtures =
    competition.fixtures.filter(
      fixture =>
        fixture.type === "league"
    );


  const completed =
    leagueFixtures.filter(
      fixture =>
        isValidScore(
          fixture.homeScore
        ) &&
        isValidScore(
          fixture.awayScore
        )
    ).length;


  if (!competition.season.started) {

    container.innerHTML = `

      <p>
        🟡 Season has not started.
      </p>

      <p>
        ${competition.teams.length}
        teams registered.
      </p>

      <p>
        ${
          leagueFixtures.length
            ? `${leagueFixtures.length} league fixtures generated.`
            : "League fixtures have not been generated."
        }
      </p>

    `;

    return;
  }


  if (competition.knockout.started) {

    container.innerHTML = `

      <p>
        🟢 Knockout stage is active.
      </p>

      <p>
        League fixtures completed:
        <strong>
          ${completed}/${leagueFixtures.length}
        </strong>
      </p>

      <p>
        Current stage:
        <strong>
          ${escapeHTML(
            competition.knockout.stage
          )}
        </strong>
      </p>

    `;

    return;
  }


  container.innerHTML = `

    <p>
      🟢 Champions League season is active.
    </p>

    <p>
      League matches completed:
      <strong>
        ${completed}/${leagueFixtures.length}
      </strong>
    </p>

    <p>
      League matches per team:
      <strong>
        ${competition.season.leagueMatchesPerTeam}
      </strong>
    </p>

    <p>
      Knockout legs:
      <strong>
        ${competition.season.knockoutLegs}
      </strong>
    </p>

  `;

}


/* =========================================================
   VALID SCORE
   ========================================================= */

function isValidScore(value) {

  return (
    Number.isInteger(
      Number(value)
    ) &&
    Number(value) >= 0
  );

}

/* =========================================================
   PART 4 OF 10
   RANDOM LEAGUE FIXTURE GENERATOR
   ========================================================= */


/* =========================================================
   GENERATE LEAGUE FIXTURES
   ========================================================= */

async function generateLeagueFixtures() {

  /*
    Fixtures are generated BEFORE
    the season starts.
  */

  if (competition.season.started) {

    alert(
      "The season has already started. League fixtures can no longer be generated."
    );

    return;
  }


  if (
    competition.teams.length < MIN_TEAMS
  ) {

    alert(
      "At least 9 teams are required."
    );

    return;
  }


  if (hasLeagueFixtures()) {

    alert(
      "League fixtures have already been generated. Remove a team or reset the test before generating a new fixture list."
    );

    return;
  }


  const matchesPerTeam =
    clampNumber(
      document.getElementById(
        "leagueMatchesPerTeam"
      )?.value,
      1,
      MAX_LEAGUE_MATCHES
    );


  const fixtures =
    createLeagueFixtures(
      competition.teams,
      matchesPerTeam
    );


  if (!fixtures.length) {

    alert(
      "Unable to generate league fixtures."
    );

    return;
  }


  competition.season
    .leagueMatchesPerTeam =
      matchesPerTeam;


  competition.fixtures =
    fixtures;


  competition.knockout = {

    started: false,

    stage: "",

    qualificationSize: 0,

    bracket: []

  };


  await saveCompetition();

  renderDashboard();


  alert(
    `${fixtures.length} random league fixtures generated. Review them, then click Start Season.`
  );

}


/* =========================================================
   RANDOMIZE ARRAY
   ========================================================= */

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
        Math.random() * (i + 1)
      );


    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];

  }


  return result;

}


/* =========================================================
   CREATE RANDOM LEAGUE FIXTURES
   ========================================================= */

function createLeagueFixtures(
  teams,
  matchesPerTeam
) {

  const fixtures = [];


  if (
    !Array.isArray(teams) ||
    teams.length < 2
  ) {

    return fixtures;

  }


  const requestedRounds =
    clampNumber(
      matchesPerTeam,
      1,
      MAX_LEAGUE_MATCHES
    );


  /*
    Randomize the initial team order.

    The circle method then creates
    valid pairings without duplicates.
  */

  let rotation =
    shuffleArray(
      teams
    );


  /*
    For an odd number of teams,
    add a bye.
  */

  if (
    rotation.length % 2 !== 0
  ) {

    rotation.push(null);

  }


  const total =
    rotation.length;


  for (
    let round = 0;
    round < requestedRounds;
    round++
  ) {

    for (
      let i = 0;
      i < total / 2;
      i++
    ) {

      const first =
        rotation[i];

      const second =
        rotation[
          total - 1 - i
        ];


      if (
        !first ||
        !second
      ) {

        continue;

      }


      let home =
        first;

      let away =
        second;


      /*
        Randomly reverse home/away.
      */

      if (
        Math.random() < 0.5
      ) {

        home = second;

        away = first;

      }


      fixtures.push({

        id:
          `league-${fixtures.length + 1}`,

        type:
          "league",

        round:
          "league",

        matchday:
          round + 1,

        homeId:
          home.id,

        awayId:
          away.id,

        homeScore:
          null,

        awayScore:
          null

      });

    }


    /*
      Circle-method rotation.

      Keep the first team fixed.
      Rotate all remaining teams.
    */

    const fixed =
      rotation[0];

    const rotating =
      rotation.slice(1);


    rotating.unshift(
      rotating.pop()
    );


    rotation = [
      fixed,
      ...rotating
    ];

  }


  return fixtures;

}


/* =========================================================
   CALCULATE EXPECTED LEAGUE MATCHES
   ========================================================= */

function getExpectedLeagueMatchCount() {

  const teams =
    competition.teams.length;


  const rounds =
    competition.season
      .leagueMatchesPerTeam;


  /*
    With an even number of teams,
    every team plays once per round.

    With an odd number, one team has
    a bye each round.
  */

  return Math.floor(
    teams * rounds / 2
  );

}

/* =========================================================
   PART 5 OF 10
   ADMIN LEAGUE FIXTURES
   RESULT ENTRY
   AUTOMATIC LEAGUE COMPLETION
   ========================================================= */


/* =========================================================
   RENDER ADMIN FIXTURES
   ========================================================= */

function renderAdminFixtures() {

  const container =
    document.getElementById(
      "adminFixtureList"
    );

  if (!container) {
    return;
  }


  const fixtures =
    competition.fixtures.filter(
      fixture =>
        fixture.type === "league"
    );


  if (!fixtures.length) {

    container.innerHTML = `
      <p>
        No league fixtures generated.
      </p>
    `;

    return;
  }


  container.innerHTML =
    fixtures
      .map(
        (fixture, index) => {

          const home =
            getTeamName(
              fixture.homeId
            );

          const away =
            getTeamName(
              fixture.awayId
            );


          const homeScore =
            fixture.homeScore ?? "";

          const awayScore =
            fixture.awayScore ?? "";


          const completed =
            isValidScore(
              fixture.homeScore
            ) &&
            isValidScore(
              fixture.awayScore
            );


          return `

            <div
              class="fixture-card"
              data-fixture="${escapeHTML(
                fixture.id
              )}"
            >

              <h3>
                Matchday
                ${fixture.matchday || 1}
              </h3>

              <div class="fixture-teams">

                <strong>
                  ${escapeHTML(home)}
                </strong>

                <input
                  type="number"
                  min="0"
                  id="league-home-${index}"
                  value="${homeScore}"
                  placeholder="0"
                  ${competition.knockout.started ? "disabled" : ""}
                >

                <span>
                  -
                </span>

                <input
                  type="number"
                  min="0"
                  id="league-away-${index}"
                  value="${awayScore}"
                  placeholder="0"
                  ${competition.knockout.started ? "disabled" : ""}
                >

                <strong>
                  ${escapeHTML(away)}
                </strong>

              </div>

              <button
                type="button"
                onclick="window.saveChampionsLeagueResult(${index})"
                ${competition.knockout.started ? "disabled" : ""}
              >
                💾
                ${completed ? "Update Result" : "Save Result"}
              </button>

            </div>

          `;

        }
      )
      .join("");

}


/* =========================================================
   SAVE LEAGUE RESULT
   ========================================================= */

async function saveLeagueResult(
  index
) {

  if (
    competition.knockout.started
  ) {

    alert(
      "The league phase is already complete."
    );

    return;
  }


  const fixtures =
    competition.fixtures.filter(
      fixture =>
        fixture.type === "league"
    );


  const fixture =
    fixtures[index];


  if (!fixture) {
    return;
  }


  const homeInput =
    document.getElementById(
      `league-home-${index}`
    );

  const awayInput =
    document.getElementById(
      `league-away-${index}`
    );


  const homeScore =
    Number(
      homeInput?.value
    );

  const awayScore =
    Number(
      awayInput?.value
    );


  if (
    !Number.isInteger(homeScore) ||
    homeScore < 0 ||
    !Number.isInteger(awayScore) ||
    awayScore < 0
  ) {

    alert(
      "Enter valid whole-number scores."
    );

    return;
  }


  const original =
    competition.fixtures.find(
      item =>
        item.id === fixture.id
    );


  if (!original) {
    return;
  }


  original.homeScore =
    homeScore;

  original.awayScore =
    awayScore;


  await saveCompetition();

  renderDashboard();


  /*
    Automatic league completion.
  */

  if (
    areAllLeagueMatchesComplete()
  ) {

    await automaticallyStartKnockout();

    return;
  }


  alert(
    "League result saved."
  );

}


/* =========================================================
   EXPOSE LEAGUE RESULT
   ========================================================= */

window.saveChampionsLeagueResult =
  saveLeagueResult;


/* =========================================================
   CHECK ALL LEAGUE MATCHES
   ========================================================= */

function areAllLeagueMatchesComplete() {

  const fixtures =
    competition.fixtures.filter(
      fixture =>
        fixture.type === "league"
    );


  if (!fixtures.length) {
    return false;
  }


  return fixtures.every(
    fixture =>
      isValidScore(
        fixture.homeScore
      ) &&
      isValidScore(
        fixture.awayScore
      )
  );

}


/* =========================================================
   AUTOMATICALLY START KNOCKOUT
   ========================================================= */

async function automaticallyStartKnockout() {

  if (
    competition.knockout.started
  ) {
    return;
  }


  const qualificationSize =
    getQualificationSize(
      competition.teams.length
    );


  if (!qualificationSize) {

    alert(
      "The league is complete, but there are not enough teams for a knockout stage."
    );

    return;
  }


  createKnockoutFromStandings();


  await saveCompetition();

  renderDashboard();


  alert(
    "All league matches are complete. The knockout stage has now started automatically."
  );

}


/* =========================================================
   LEGACY FINISH BUTTON
   ========================================================= */

async function finishLeaguePhase() {

  if (
    competition.knockout.started
  ) {

    alert(
      "The knockout stage has already started."
    );

    return;
  }


  if (
    !competition.season.started
  ) {

    alert(
      "Start the season first."
    );

    return;
  }


  if (
    !hasLeagueFixtures()
  ) {

    alert(
      "No league fixtures have been generated."
    );

    return;
  }


  if (
    !areAllLeagueMatchesComplete()
  ) {

    alert(
      "All league matches must have results first."
    );

    return;
  }


  await automaticallyStartKnockout();

}

/* =========================================================
   PART 6 OF 10
   STANDINGS
   QUALIFICATION
   RANDOM KNOCKOUT DRAW
   FIXED BRACKET
   ========================================================= */


/* =========================================================
   CALCULATE STANDINGS
   ========================================================= */

function calculateStandings() {

  const standings =
    competition.teams.map(
      (team, index) => ({

        id:
          team.id ||
          `team-${index}`,

        name:
          team.name ||
          `Team ${index + 1}`,

        played: 0,

        wins: 0,

        draws: 0,

        losses: 0,

        goalsFor: 0,

        goalsAgainst: 0,

        goalDifference: 0,

        points: 0

      })
    );


  const lookup = {};


  standings.forEach(
    team => {

      lookup[team.id] =
        team;

    }
  );


  competition.fixtures
    .filter(
      fixture =>
        fixture.type === "league"
    )
    .forEach(
      fixture => {

        const home =
          lookup[
            fixture.homeId
          ];

        const away =
          lookup[
            fixture.awayId
          ];


        if (!home || !away) {
          return;
        }


        if (
          !isValidScore(
            fixture.homeScore
          ) ||
          !isValidScore(
            fixture.awayScore
          )
        ) {

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

        } else if (
          awayScore >
          homeScore
        ) {

          away.wins++;

          home.losses++;

          away.points += 3;

        } else {

          home.draws++;

          away.draws++;

          home.points++;

          away.points++;

        }

      }
    );


  standings.forEach(
    team => {

      team.goalDifference =
        team.goalsFor -
        team.goalsAgainst;

    }
  );


  standings.sort(
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


  return standings;

}


/* =========================================================
   GET QUALIFICATION SIZE
   ========================================================= */

function getQualificationSize(
  total
) {

  if (total >= 33) {

    return 32;

  }


  if (total >= 17) {

    return 16;

  }


  if (total >= 9) {

    return 8;

  }


  return 0;

}


/* =========================================================
   FIRST KNOCKOUT STAGE
   ========================================================= */

function getFirstKnockoutStage(
  qualificationSize
) {

  if (
    qualificationSize === 32
  ) {

    return "Round of 32";

  }


  if (
    qualificationSize === 16
  ) {

    return "Round of 16";

  }


  if (
    qualificationSize === 8
  ) {

    return "Quarter-finals";

  }


  return "";

}


/* =========================================================
   CREATE KNOCKOUT FROM STANDINGS
   ========================================================= */

function createKnockoutFromStandings() {

  const standings =
    calculateStandings();


  const qualificationSize =
    getQualificationSize(
      standings.length
    );


  if (!qualificationSize) {
    return false;
  }


  const qualified =
    standings.slice(
      0,
      qualificationSize
    );


  /*
    IMPORTANT:
    League position decides who
    qualifies.

    League position does NOT decide
    the knockout pairing.

    Qualified teams are shuffled
    before the bracket is created.
  */

  const randomQualified =
    shuffleArray(
      qualified
    );


  const bracket =
    buildInitialKnockoutBracket(
      randomQualified,
      qualificationSize
    );


  competition.knockout = {

    started: true,

    stage:
      getFirstKnockoutStage(
        qualificationSize
      ),

    qualificationSize,

    bracket

  };


  return true;

}


/* =========================================================
   BUILD INITIAL KNOCKOUT BRACKET
   ========================================================= */

function buildInitialKnockoutBracket(
  teams,
  qualificationSize
) {

  const bracket = [];


  let round = "";


  if (
    qualificationSize === 32
  ) {

    round = "round32";

  } else if (
    qualificationSize === 16
  ) {

    round = "round16";

  } else {

    round = "quarterFinal";

  }


  for (
    let i = 0;
    i < teams.length;
    i += 2
  ) {

    const home =
      teams[i];

    const away =
      teams[i + 1];


    const tie = {

      id:
        `${round}-${i / 2 + 1}`,

      round,

      number:
        i / 2 + 1,

      homeTeam:
        home?.name ||
        "TBD",

      awayTeam:
        away?.name ||
        "TBD",

      homeId:
        home?.id ||
        null,

      awayId:
        away?.id ||
        null,

      homeScore:
        null,

      awayScore:
        null,

      winner:
        null,

      winnerId:
        null,

      legs:
        null,

      sourceHome:
        null,

      sourceAway:
        null

    };


    ensureTieLegs(
      tie
    );


    bracket.push(
      tie
    );

  }


  addFutureBracketRounds(
    bracket,
    round
  );


  return bracket;

}


/* =========================================================
   ADD FUTURE BRACKET ROUNDS
   ========================================================= */

function addFutureBracketRounds(
  bracket,
  firstRound
) {

  const rounds = [];


  if (
    firstRound === "round32"
  ) {

    rounds.push(
      "round16",
      "quarterFinal",
      "semiFinal",
      "final"
    );

  } else if (
    firstRound === "round16"
  ) {

    rounds.push(
      "quarterFinal",
      "semiFinal",
      "final"
    );

  } else {

    rounds.push(
      "semiFinal",
      "final"
    );

  }


  let previousCount =
    bracket.filter(
      tie =>
        tie.round === firstRound
    ).length;


  let previousRound =
    firstRound;


  rounds.forEach(
    round => {

      const count =
        Math.floor(
          previousCount / 2
        );


      for (
        let i = 0;
        i < count;
        i++
      ) {

        const tie = {

          id:
            `${round}-${i + 1}`,

          round,

          number:
            i + 1,

          homeTeam:
            "TBD",

          awayTeam:
            "TBD",

          homeId:
            null,

          awayId:
            null,

          homeScore:
            null,

          awayScore:
            null,

          winner:
            null,

          winnerId:
            null,

          legs:
            null,

          sourceHome:
            `${previousRound}-${i * 2 + 1}`,

          sourceAway:
            `${previousRound}-${i * 2 + 2}`

        };


        ensureTieLegs(
          tie
        );


        bracket.push(
          tie
        );

      }


      previousRound =
        round;

      previousCount =
        count;

    }
  );

}

/* =========================================================
   PART 7 OF 10
   KNOCKOUT DISPLAY
   ONE-LEG / TWO-LEG RESULT ENTRY
   ========================================================= */


/* =========================================================
   RENDER ADMIN KNOCKOUT
   ========================================================= */

function renderAdminKnockout() {

  const status =
    document.getElementById(
      "adminKnockoutStatus"
    );

  const container =
    document.getElementById(
      "adminKnockoutList"
    );


  if (!status || !container) {
    return;
  }


  if (
    !competition.knockout.started
  ) {

    status.innerHTML = `
      <p>
        🟡 Knockout stage has not started.
      </p>
    `;


    container.innerHTML = `
      <p>
        No knockout fixtures available.
      </p>
    `;


    return;
  }


  status.innerHTML = `

    <p>
      🟢 Knockout stage active.
    </p>

    <p>
      Qualification:
      <strong>
        Top
        ${competition.knockout.qualificationSize}
      </strong>
    </p>

    <p>
      Current stage:
      <strong>
        ${escapeHTML(
          competition.knockout.stage
        )}
      </strong>
    </p>

    <p>
      Knockout legs:
      <strong>
        ${competition.season.knockoutLegs}
      </strong>
      <span>
        (Final is always one leg)
      </span>
    </p>

  `;


  const bracket =
    competition.knockout.bracket ||
    [];


  /*
    Show only ties whose teams are known,
    plus completed ties.

    Future TBD ties remain visible but
    cannot receive results.
  */

  container.innerHTML =
    bracket
      .map(
        (tie, index) =>
          renderAdminTie(
            tie,
            index
          )
      )
      .join("");

}


/* =========================================================
   RENDER ADMIN TIE
   ========================================================= */

function renderAdminTie(
  tie,
  index
) {

  ensureTieLegs(
    tie
  );


  const legs =
    getTieLegCount(
      tie
    );


  const ready =
    isTieReady(
      tie
    );


  const completed =
    Boolean(
      tie.winner
    );


  let legsHTML = "";


  for (
    let legIndex = 0;
    legIndex < legs;
    legIndex++
  ) {

    const leg =
      tie.legs[
        legIndex
      ];


    legsHTML += `

      <div class="fixture-card">

        ${
          legs === 2
            ? `
              <h4>
                Leg ${legIndex + 1}
              </h4>
            `
            : ""
        }

        <div class="fixture-teams">

          <strong>
            ${escapeHTML(
              tie.homeTeam
            )}
          </strong>

          <input
            type="number"
            min="0"
            id="ko-home-${index}-${legIndex}"
            value="${
              leg.homeScore ?? ""
            }"
            placeholder="0"
            ${
              !ready ||
              completed
                ? "disabled"
                : ""
            }
          >

          <span>
            -
          </span>

          <input
            type="number"
            min="0"
            id="ko-away-${index}-${legIndex}"
            value="${
              leg.awayScore ?? ""
            }"
            placeholder="0"
            ${
              !ready ||
              completed
                ? "disabled"
                : ""
            }
          >

          <strong>
            ${escapeHTML(
              tie.awayTeam
            )}
          </strong>

        </div>

      </div>

    `;

  }


  const aggregate =
    legs === 2
      ? getAggregateScore(
          tie
        )
      : null;


  return `

    <div
      class="fixture-card"
      data-knockout-id="${escapeHTML(
        tie.id
      )}"
    >

      <h3>
        ${escapeHTML(
          getStageName(
            tie.round
          )
        )}
        ${tie.number}
      </h3>


      ${
        !ready
          ? `
            <p>
              ⏳ Waiting for both teams to qualify.
            </p>
          `
          : ""
      }


      ${legsHTML}


      ${
        aggregate
          ? `
            <p>
              Aggregate:
              <strong>
                ${escapeHTML(
                  tie.homeTeam
                )}
                ${aggregate.home}
                -
                ${aggregate.away}
                ${escapeHTML(
                  tie.awayTeam
                )}
              </strong>
            </p>
          `
          : ""
      }


      ${
        tie.winner
          ? `
            <p>
              🏆 Winner:
              <strong>
                ${escapeHTML(
                  tie.winner
                )}
              </strong>
            </p>
          `
          : ""
      }


      ${
        ready && !completed
          ? `
            <button
              type="button"
              onclick="window.saveChampionsKnockoutResult(${index})"
            >
              💾 Save Knockout Result
            </button>
          `
          : ""
      }


      ${
        ready &&
        legs === 2 &&
        !completed &&
        hasAggregateTie(
          tie
        )
          ? `
            <button
              type="button"
              onclick="window.resolveChampionsKnockoutTie(${index})"
            >
              ⚖️ Resolve Aggregate Tie
            </button>
          `
          : ""
      }

    </div>

  `;

}


/* =========================================================
   STAGE NAME
   ========================================================= */

function getStageName(
  round
) {

  const names = {

    round32:
      "Round of 32",

    round16:
      "Round of 16",

    quarterFinal:
      "Quarter-final",

    semiFinal:
      "Semi-final",

    final:
      "Final"

  };


  return (
    names[round] ||
    "Knockout"
  );

}


/* =========================================================
   GET TIE LEG COUNT
   ========================================================= */

function getTieLegCount(
  tie
) {

  if (!tie) {
    return 1;
  }


  if (
    tie.round === "final"
  ) {

    return 1;

  }


  return (
    competition.season.knockoutLegs === 2
      ? 2
      : 1
  );

}


/* =========================================================
   ENSURE LEG STRUCTURE
   ========================================================= */

function ensureTieLegs(
  tie
) {

  const count =
    getTieLegCount(
      tie
    );


  if (
    !Array.isArray(tie.legs) ||
    tie.legs.length !== count
  ) {

    tie.legs =
      Array.from(
        {
          length: count
        },
        () => ({

          homeScore:
            null,

          awayScore:
            null

        })
      );

  }


  /*
    Keep the old one-leg fields synchronized
    for compatibility.
  */

  if (count === 1) {

    tie.homeScore =
      tie.legs[0].homeScore;

    tie.awayScore =
      tie.legs[0].awayScore;

  }

}


/* =========================================================
   TIE READY
   ========================================================= */

function isTieReady(
  tie
) {

  return (
    Boolean(
      tie.homeId
    ) &&
    Boolean(
      tie.awayId
    ) &&
    tie.homeTeam !== "TBD" &&
    tie.awayTeam !== "TBD"
  );

}


/* =========================================================
   GET AGGREGATE
   ========================================================= */

function getAggregateScore(
  tie
) {

  ensureTieLegs(
    tie
  );


  let home =
    0;

  let away =
    0;


  tie.legs.forEach(
    leg => {

      if (
        isValidScore(
          leg.homeScore
        )
      ) {

        home +=
          Number(
            leg.homeScore
          );

      }


      if (
        isValidScore(
          leg.awayScore
        )
      ) {

        away +=
          Number(
            leg.awayScore
          );

      }

    }
  );


  return {
    home,
    away
  };

}


/* =========================================================
   SAVE KNOCKOUT RESULT
   ========================================================= */

async function saveKnockoutResult(
  index
) {

  const bracket =
    competition.knockout.bracket ||
    [];


  const tie =
    bracket[index];


  if (!tie) {
    return;
  }


  if (
    !isTieReady(
      tie
    )
  ) {

    alert(
      "Both teams must be known before entering a result."
    );

    return;
  }


  ensureTieLegs(
    tie
  );


  const legs =
    getTieLegCount(
      tie
    );


  for (
    let legIndex = 0;
    legIndex < legs;
    legIndex++
  ) {

    const homeInput =
      document.getElementById(
        `ko-home-${index}-${legIndex}`
      );

    const awayInput =
      document.getElementById(
        `ko-away-${index}-${legIndex}`
      );


    const homeScore =
      Number(
        homeInput?.value
      );

    const awayScore =
      Number(
        awayInput?.value
      );


    if (
      !Number.isInteger(
        homeScore
      ) ||
      homeScore < 0 ||
      !Number.isInteger(
        awayScore
      ) ||
      awayScore < 0
    ) {

      alert(
        `Enter valid scores for Leg ${legIndex + 1}.`
      );

      return;
    }


    tie.legs[
      legIndex
    ].homeScore =
      homeScore;


    tie.legs[
      legIndex
    ].awayScore =
      awayScore;

  }


  if (
    legs === 1
  ) {

    tie.homeScore =
      tie.legs[0].homeScore;

    tie.awayScore =
      tie.legs[0].awayScore;


    if (
      tie.homeScore ===
      tie.awayScore
    ) {

      alert(
        "A tied knockout match requires a winner. Enter a result with a winner."
      );

      return;
    }


    if (
      tie.homeScore >
      tie.awayScore
    ) {

      tie.winner =
        tie.homeTeam;

      tie.winnerId =
        tie.homeId;

    } else {

      tie.winner =
        tie.awayTeam;

      tie.winnerId =
        tie.awayId;

    }

  } else {

    const aggregate =
      getAggregateScore(
        tie
      );


    if (
      aggregate.home ===
      aggregate.away
    ) {

      tie.winner = null;

      tie.winnerId = null;

      await saveCompetition();

      renderDashboard();


      alert(
        "The aggregate score is tied. Use Resolve Aggregate Tie to select the winner."
      );

      return;
    }


    if (
      aggregate.home >
      aggregate.away
    ) {

      tie.winner =
        tie.homeTeam;

      tie.winnerId =
        tie.homeId;

    } else {

      tie.winner =
        tie.awayTeam;

      tie.winnerId =
        tie.awayId;

    }

  }


  advanceAdminWinner(
    tie
  );


  updateKnockoutStage();


  await saveCompetition();

  renderDashboard();


  alert(
    "Knockout result saved and winner advanced."
  );

}


/* =========================================================
   EXPOSE KNOCKOUT RESULT
   ========================================================= */

window.saveChampionsKnockoutResult =
  saveKnockoutResult;

/* =========================================================
   PART 8 OF 10
   WINNER ADVANCEMENT
   TIE RESOLUTION
   STAGE MANAGEMENT
   CHAMPION DETECTION
   ========================================================= */


/* =========================================================
   ADVANCE WINNER
   ========================================================= */

function advanceAdminWinner(
  completedTie
) {

  if (
    !completedTie.winnerId
  ) {

    return;

  }


  const nextRound =
    getNextAdminRound(
      completedTie.round
    );


  /*
    No next round means this was
    the final.
  */

  if (!nextRound) {

    return;

  }


  const nextNumber =
    Math.ceil(
      completedTie.number / 2
    );


  const nextTie =
    competition.knockout.bracket
      .find(
        tie =>
          tie.round === nextRound &&
          tie.number === nextNumber
      );


  if (!nextTie) {
    return;
  }


  const isFirstSlot =
    completedTie.number % 2 === 1;


  if (isFirstSlot) {

    /*
      Do not overwrite a different
      winner if this slot has already
      been correctly populated.
    */

    nextTie.homeTeam =
      completedTie.winner;

    nextTie.homeId =
      completedTie.winnerId;

  } else {

    nextTie.awayTeam =
      completedTie.winner;

    nextTie.awayId =
      completedTie.winnerId;

  }


  /*
    Prepare the next tie for its
    correct number of legs.
  */

  ensureTieLegs(
    nextTie
  );

}


/* =========================================================
   NEXT ROUND
   ========================================================= */

function getNextAdminRound(
  round
) {

  if (
    round === "round32"
  ) {

    return "round16";

  }


  if (
    round === "round16"
  ) {

    return "quarterFinal";

  }


  if (
    round === "quarterFinal"
  ) {

    return "semiFinal";

  }


  if (
    round === "semiFinal"
  ) {

    return "final";

  }


  return null;

}


/* =========================================================
   UPDATE KNOCKOUT STAGE
   ========================================================= */

function updateKnockoutStage() {

  const bracket =
    competition.knockout.bracket ||
    [];


  const order = [

    "round32",

    "round16",

    "quarterFinal",

    "semiFinal",

    "final"

  ];


  let current =
    "completed";


  for (
    const round of order
  ) {

    const ties =
      bracket.filter(
        tie =>
          tie.round === round
      );


    if (!ties.length) {
      continue;
    }


    /*
      A round becomes active when its
      teams are available.

      It remains the current stage
      until every tie in that round
      has a winner.
    */

    const hasReadyTie =
      ties.some(
        tie =>
          isTieReady(
            tie
          )
      );


    const incomplete =
      ties.some(
        tie =>
          !tie.winner
      );


    if (
      hasReadyTie &&
      incomplete
    ) {

      current =
        getStageName(
          round
        );

      break;

    }

  }


  competition.knockout.stage =
    current;


  /*
    If final has a winner, the entire
    competition is complete.
  */

  const final =
    bracket.find(
      tie =>
        tie.round === "final" &&
        tie.number === 1
    );


  if (
    final?.winner
  ) {

    competition.knockout.stage =
      "Completed";

  }

}


/* =========================================================
   AGGREGATE TIE CHECK
   ========================================================= */

function hasAggregateTie(
  tie
) {

  if (
    getTieLegCount(tie) !== 2
  ) {

    return false;

  }


  ensureTieLegs(
    tie
  );


  const complete =
    tie.legs.every(
      leg =>
        isValidScore(
          leg.homeScore
        ) &&
        isValidScore(
          leg.awayScore
        )
    );


  if (!complete) {
    return false;
  }


  const aggregate =
    getAggregateScore(
      tie
    );


  return (
    aggregate.home ===
    aggregate.away
  );

}


/* =========================================================
   RESOLVE AGGREGATE TIE
   ========================================================= */

async function resolveAggregateTie(
  index
) {

  const tie =
    competition.knockout.bracket[
      index
    ];


  if (!tie) {
    return;
  }


  if (
    !hasAggregateTie(
      tie
    )
  ) {

    alert(
      "This tie does not require aggregate-tie resolution."
    );

    return;
  }


  const choice =
    prompt(
      `Aggregate is tied.

Type 1 for ${tie.homeTeam}
Type 2 for ${tie.awayTeam}`
    );


  if (
    choice !== "1" &&
    choice !== "2"
  ) {

    alert(
      "No winner selected."
    );

    return;
  }


  if (
    choice === "1"
  ) {

    tie.winner =
      tie.homeTeam;

    tie.winnerId =
      tie.homeId;

  } else {

    tie.winner =
      tie.awayTeam;

    tie.winnerId =
      tie.awayId;

  }


  advanceAdminWinner(
    tie
  );


  updateKnockoutStage();


  await saveCompetition();

  renderDashboard();


  alert(
    `Winner recorded: ${tie.winner}`
  );

}


/* =========================================================
   EXPOSE TIE RESOLUTION
   ========================================================= */

window.resolveChampionsKnockoutTie =
  resolveAggregateTie;


/* =========================================================
   GET FINAL
   ========================================================= */

function getFinalTie() {

  return (
    competition.knockout.bracket
      ?.find(
        tie =>
          tie.round === "final" &&
          tie.number === 1
      ) ||
    null
  );

}


/* =========================================================
   GET CHAMPION
   ========================================================= */

function getFinalWinner() {

  const final =
    getFinalTie();


  return (
    final?.winner ||
    null
  );

}


/* =========================================================
   GET QUALIFIED TEAMS
   ========================================================= */

function getQualifiedTeams() {

  const standings =
    calculateStandings();


  const size =
    getQualificationSize(
      standings.length
    );


  if (!size) {
    return [];
  }


  return standings.slice(
    0,
    size
  );

}


/* =========================================================
   TEST BRACKET CREATION
   ========================================================= */

async function createTestBracket() {

  if (
    competition.teams.length <
    MIN_TEAMS
  ) {

    alert(
      "Add at least 9 teams first."
    );

    return;
  }


  if (
    competition.knockout.started
  ) {

    alert(
      "The knockout stage already exists."
    );

    return;
  }


  const created =
    createKnockoutFromStandings();


  if (!created) {

    alert(
      "Unable to create the test bracket."
    );

    return;
  }


  await saveCompetition();

  renderDashboard();


  alert(
    "Test knockout bracket created."
  );

}

/* =========================================================
   PART 9 OF 10
   RESET
   TEST SUMMARY
   PUBLIC ADMIN DATA
   LOGOUT
   ========================================================= */


/* =========================================================
   RESET CHAMPIONS TEST
   ========================================================= */

async function resetChampionsTest() {

  const confirmed =
    confirm(
      "Reset the entire Champions League test? This will remove all teams, fixtures, results and the knockout bracket."
    );


  if (!confirmed) {
    return;
  }


  competition =
    createDefaultCompetition();


  await saveCompetition();

  renderDashboard();


  alert(
    "Champions League test has been reset."
  );

}


/* =========================================================
   GET TEST SUMMARY
   ========================================================= */

function getTestSummary() {

  const leagueFixtures =
    competition.fixtures.filter(
      fixture =>
        fixture.type === "league"
    );


  const completedLeagueFixtures =
    leagueFixtures.filter(
      fixture =>
        isValidScore(
          fixture.homeScore
        ) &&
        isValidScore(
          fixture.awayScore
        )
    );


  const standings =
    calculateStandings();


  return {

    teams:
      competition.teams.length,

    leagueFixtures:
      leagueFixtures.length,

    completedLeagueFixtures:
      completedLeagueFixtures.length,

    leagueComplete:
      leagueFixtures.length > 0 &&
      completedLeagueFixtures.length ===
        leagueFixtures.length,

    knockoutTies:
      competition.knockout.bracket.length,

    qualificationSize:
      competition.knockout
        .qualificationSize,

    currentStage:
      competition.knockout.stage,

    champion:
      getFinalWinner(),

    seasonStarted:
      competition.season.started,

    standings

  };

}


/* =========================================================
   EXPOSE ADMIN TEST API
   ========================================================= */

window.championsAdminTest = {

  getSummary:
    getTestSummary,


  getStandings:
    calculateStandings,


  getQualifiedTeams:
    getQualifiedTeams,


  getQualificationSize:
    () =>
      getQualificationSize(
        competition.teams.length
      ),


  getChampion:
    getFinalWinner

};


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutAdmin() {

  try {

    await signOut(
      auth
    );

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }

}


/* =========================================================
   STANDINGS TABLE HTML
   ========================================================= */

function createStandingsHTML() {

  const standings =
    calculateStandings();


  if (!standings.length) {

    return `
      <p>
        No standings available.
      </p>
    `;

  }


  return `

    <div class="fixture-card">

      <h3>
        League Table
      </h3>

      <div style="overflow-x:auto;">

        <table>

          <thead>

            <tr>

              <th>
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

            ${
              standings
                .map(
                  (team, index) => `

                    <tr>

                      <td>
                        ${index + 1}
                      </td>

                      <td>
                        ${escapeHTML(
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

                  `
                )
                .join("")
            }

          </tbody>

        </table>

      </div>

    </div>

  `;

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}

/* =========================================================
   PART 10 OF 10
   FINAL SAFETY
   INITIAL RENDER HELPERS
   ========================================================= */


/* =========================================================
   FINAL DATA SAFETY CHECK
   ========================================================= */

function validateCompetitionState() {

  if (!competition) {

    competition =
      createDefaultCompetition();

  }


  if (
    !Array.isArray(
      competition.teams
    )
  ) {

    competition.teams = [];

  }


  if (
    !Array.isArray(
      competition.fixtures
    )
  ) {

    competition.fixtures = [];

  }


  if (
    !competition.season
  ) {

    competition.season = {

      started: false,

      format: "champions",

      leagueMatchesPerTeam: 1,

      knockoutLegs: 1,

      startDate: "",

      endDate: ""

    };

  }


  if (
    !competition.knockout
  ) {

    competition.knockout = {

      started: false,

      stage: "",

      qualificationSize: 0,

      bracket: []

    };

  }


  competition.season
    .leagueMatchesPerTeam =
      clampNumber(
        competition.season
          .leagueMatchesPerTeam,
        1,
        MAX_LEAGUE_MATCHES
      );


  competition.season
    .knockoutLegs =
      Number(
        competition.season
          .knockoutLegs
      ) === 2
        ? 2
        : 1;

}


/* =========================================================
   SAFE RENDER
   ========================================================= */

function safeRenderDashboard() {

  try {

    validateCompetitionState();

    renderDashboard();

  } catch (error) {

    console.error(
      "Dashboard render error:",
      error
    );

    showMessage(
      "seasonStatus",
      "Unable to render Champions League dashboard."
    );

  }

}


/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showMessage(
  elementId,
  message
) {

  const element =
    document.getElementById(
      elementId
    );


  if (element) {

    element.textContent =
      message;

  }

}


/* =========================================================
   FINAL ADMIN STATE ACCESS
   ========================================================= */

window.championsAdminState = {

  getCompetition:
    () => competition,

  getTeams:
    () =>
      [...competition.teams],

  getFixtures:
    () =>
      [...competition.fixtures],

  getKnockout:
    () =>
      ({
        ...competition.knockout
      })

};


/* =========================================================
   FINAL INITIAL STATE CHECK
   ========================================================= */

if (
  document.readyState !==
  "loading"
) {

  /*
    The main DOMContentLoaded listener
    in Part 1 handles initialization.

    This block intentionally does not
    initialize Firebase a second time.
  */

}


/* =========================================================
   END OF CHAMPIONS ADMIN
   ========================================================= */