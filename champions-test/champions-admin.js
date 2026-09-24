/* =========================================================
   DLS COMPETITION
   CHAMPIONS LEAGUE TEST ADMIN
   champions-admin.js
   PART 1 — AUTHENTICATION + DATA FOUNDATION
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


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let db = null;

let auth = null;

let competition = {
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
   LOGIN
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
        ).value.trim();

      const password =
        document.getElementById(
          "adminPassword"
        ).value;

      const message =
        document.getElementById(
          "adminLoginMessage"
        );

      if (
        email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
      ) {

        message.textContent =
          "Unauthorized admin email.";

        return;
      }

      message.textContent =
        "Logging in...";

      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        message.textContent = "";

      } catch (error) {

        console.error(
          "Admin login error:",
          error
        );

        message.textContent =
          "Login failed. Check your email and password.";

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

}


/* =========================================================
   SHOW / HIDE UI
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
    dashboard.style.display = "none";
  }

}


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
    login.style.display = "none";
  }

  if (dashboard) {
    dashboard.style.display = "";
  }

}


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

      competition = {
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

      return;
    }

    const data =
      snapshot.data();

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
          Number(
            data.season?.leagueMatchesPerTeam
          ) || 1,

        knockoutLegs:
          Number(
            data.season?.knockoutLegs
          ) || 1,

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

  } catch (error) {

    console.error(
      "Load error:",
      error
    );

    showMessage(
      "seasonStatus",
      "Unable to load Champions League test data."
    );

  }

}


/* =========================================================
   SAVE COMPETITION
   ========================================================= */

async function saveCompetition() {

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
   TEAM DISPLAY
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
          <div class="team-card">

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
        `
      )
      .join("");

}


/* =========================================================
   SEASON STATUS
   ========================================================= */

function renderSeasonStatus() {

  const container =
    document.getElementById(
      "seasonStatus"
    );

  if (!container) {
    return;
  }

  if (!competition.season.started) {

    container.innerHTML = `
      <p>
        🟡 Season has not started.
      </p>
    `;

    return;
  }

  container.innerHTML = `
    <p>
      🟢 Champions League season is active.
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

  if (total < 9) {

    element.textContent =
      "At least 9 teams are required.";

    return;
  }

  let qualified = 0;

  if (total >= 33) {
    qualified = 32;
  } else if (total >= 17) {
    qualified = 16;
  } else {
    qualified = 8;
  }

  let stage = "";

  if (qualified === 32) {
    stage = "Round of 32";
  } else if (qualified === 16) {
    stage = "Round of 16";
  } else {
    stage = "Quarter-finals";
  }

  element.textContent =
    `${total} teams registered → ` +
    `top ${qualified} qualify → ${stage}.`;

}


/* =========================================================
   UTILITY
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


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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
   PART 2 — TEST TEAMS + SEASON START + LEAGUE FIXTURES
   ========================================================= */


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

    const confirmAdd =
      confirm(
        "Test teams already exist. Add another set?"
      );

    if (!confirmAdd) {
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
   CLEAR TEST TEAMS
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
      "Clear all Champions League test teams?"
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

  if (totalTeams < 9) {

    alert(
      "At least 9 teams are required."
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
    Number(
      matchesInput?.value
    ) || 1;

  const legs =
    Number(
      legsInput?.value
    ) || 1;

  if (
    matches < 1 ||
    matches > 8
  ) {

    alert(
      "League matches per team must be between 1 and 8."
    );

    return;
  }

  const confirmed =
    confirm(
      `Start the Champions League season with ${matches} league-phase match${matches === 1 ? "" : "es"} per team and ${legs} knockout leg${legs === 1 ? "" : "s"}?`
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
    "Champions League season started."
  );

}


/* =========================================================
   GENERATE LEAGUE FIXTURES
   ========================================================= */

async function generateLeagueFixtures() {

  if (!competition.season.started) {

    alert(
      "Start the season first."
    );

    return;
  }

  if (
    competition.teams.length < 9
  ) {

    alert(
      "At least 9 teams are required."
    );

    return;
  }

  if (
    competition.fixtures.length
  ) {

    const existingLeagueFixtures =
      competition.fixtures.filter(
        fixture =>
          fixture.type === "league"
      );

    if (
      existingLeagueFixtures.length
    ) {

      alert(
        "League fixtures have already been generated."
      );

      return;
    }

  }

  const matchesPerTeam =
    Math.min(
      8,
      Math.max(
        1,
        Number(
          competition.season
            .leagueMatchesPerTeam
        ) || 1
      )
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

  competition.fixtures =
    fixtures;

  await saveCompetition();

  renderDashboard();

  alert(
    `${fixtures.length} league fixtures generated.`
  );

}


/* =========================================================
   CREATE LEAGUE FIXTURES
   ========================================================= */

function createLeagueFixtures(
  teams,
  matchesPerTeam
) {

  const fixtures = [];

  const total =
    teams.length;

  const playedAgainst = {};

  teams.forEach(team => {

    playedAgainst[team.id] = [];

  });


  /*
    The generator walks through the teams
    and gives each team the requested
    number of different opponents.

    It does not create duplicate
    team-vs-team fixtures.
  */

  for (
    let i = 0;
    i < total;
    i++
  ) {

    const home =
      teams[i];

    for (
      let step = 1;
      step <= total;
      step++
    ) {

      if (
        playedAgainst[home.id].length >=
        matchesPerTeam
      ) {
        break;
      }

      const opponentIndex =
        (i + step) % total;

      const away =
        teams[opponentIndex];

      if (!away) {
        continue;
      }

      if (
        home.id === away.id
      ) {
        continue;
      }

      if (
        playedAgainst[home.id]
          .includes(away.id)
      ) {
        continue;
      }

      if (
        playedAgainst[away.id]
          .includes(home.id)
      ) {
        continue;
      }

      playedAgainst[home.id]
        .push(away.id);

      playedAgainst[away.id]
        .push(home.id);

      fixtures.push({

        id:
          `league-${fixtures.length + 1}`,

        type:
          "league",

        round:
          "league",

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

  }


  /*
    The first pass above may leave a team
    short when the requested match count
    is high.

    This second pass fills any remaining
    valid pairings.
  */

  let changed = true;

  while (changed) {

    changed = false;

    for (
      let i = 0;
      i < total;
      i++
    ) {

      const home =
        teams[i];

      if (
        playedAgainst[home.id].length >=
        matchesPerTeam
      ) {
        continue;
      }

      for (
        let j = 0;
        j < total;
        j++
      ) {

        if (i === j) {
          continue;
        }

        const away =
          teams[j];

        if (
          playedAgainst[home.id]
            .includes(away.id)
        ) {
          continue;
        }

        if (
          playedAgainst[away.id]
            .includes(home.id)
        ) {
          continue;
        }

        if (
          playedAgainst[away.id].length >=
          matchesPerTeam
        ) {
          continue;
        }

        playedAgainst[home.id]
          .push(away.id);

        playedAgainst[away.id]
          .push(home.id);

        fixtures.push({

          id:
            `league-${fixtures.length + 1}`,

          type:
            "league",

          round:
            "league",

          homeId:
            home.id,

          awayId:
            away.id,

          homeScore:
            null,

          awayScore:
            null

        });

        changed = true;

        break;

      }

    }

  }


  return fixtures;

}


/* =========================================================
   FINISH LEAGUE PHASE
   ========================================================= */

async function finishLeaguePhase() {

  if (!competition.season.started) {

    alert(
      "The season has not started."
    );

    return;
  }

  if (
    competition.teams.length < 9
  ) {

    alert(
      "At least 9 teams are required."
    );

    return;
  }

  const leagueFixtures =
    competition.fixtures.filter(
      fixture =>
        fixture.type === "league"
    );

  if (!leagueFixtures.length) {

    alert(
      "Generate league fixtures first."
    );

    return;
  }

  const incomplete =
    leagueFixtures.some(
      fixture =>
        fixture.homeScore === null ||
        fixture.homeScore === undefined ||
        fixture.awayScore === null ||
        fixture.awayScore === undefined
    );

  if (incomplete) {

    alert(
      "All league-phase matches must have results before the knockout stage can start."
    );

    return;
  }

  const confirmed =
    confirm(
      "Finish the league phase and create the fixed knockout bracket?"
    );

  if (!confirmed) {
    return;
  }

  createKnockoutFromStandings();

  await saveCompetition();

  renderDashboard();

  alert(
    "League phase completed and knockout bracket created."
  );

}


/* =========================================================
   CREATE KNOCKOUT FROM STANDINGS
   ========================================================= */

function createKnockoutFromStandings() {

  const standings =
    calculateStandings();

  const total =
    standings.length;

  let qualificationSize = 0;

  if (total >= 33) {

    qualificationSize = 32;

  } else if (total >= 17) {

    qualificationSize = 16;

  } else if (total >= 9) {

    qualificationSize = 8;

  }

  if (!qualificationSize) {
    return;
  }

  const qualified =
    standings.slice(
      0,
      qualificationSize
    );

  const bracket =
    buildInitialKnockoutBracket(
      qualified,
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

}


/* =========================================================
   FIRST KNOCKOUT STAGE
   ========================================================= */

function getFirstKnockoutStage(
  qualificationSize
) {

  if (qualificationSize === 32) {
    return "Round of 32";
  }

  if (qualificationSize === 16) {
    return "Round of 16";
  }

  return "Quarter-finals";

}


/* =========================================================
   INITIAL KNOCKOUT BRACKET
   ========================================================= */

function buildInitialKnockoutBracket(
  teams,
  qualificationSize
) {

  const bracket = [];

  let round = "";

  if (qualificationSize === 32) {

    round = "round32";

  } else if (qualificationSize === 16) {

    round = "round16";

  } else {

    round = "quarterFinal";

  }

  for (
    let i = 0;
    i < teams.length;
    i += 2
  ) {

    bracket.push({

      id:
        `${round}-${i / 2 + 1}`,

      round,

      number:
        i / 2 + 1,

      homeTeam:
        teams[i]?.name || "TBD",

      awayTeam:
        teams[i + 1]?.name || "TBD",

      homeId:
        teams[i]?.id || null,

      awayId:
        teams[i + 1]?.id || null,

      homeScore:
        null,

      awayScore:
        null,

      winner:
        null

    });

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

  if (firstRound === "round32") {

    rounds.push(
      "round16",
      "quarterFinal",
      "semiFinal",
      "final"
    );

  } else if (firstRound === "round16") {

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

  rounds.forEach(round => {

    const count =
      Math.floor(
        previousCount / 2
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {

      bracket.push({

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

        sourceHome:
          `${previousRound}-${i * 2 + 1}`,

        sourceAway:
          `${previousRound}-${i * 2 + 2}`

      });

    }

    previousRound =
      round;

    previousCount =
      count;

  });

}


/* =========================================================
   STANDINGS CALCULATOR
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

  standings.forEach(team => {

    lookup[team.id] =
      team;

  });

  competition.fixtures
    .filter(
      fixture =>
        fixture.type === "league"
    )
    .forEach(fixture => {

      const home =
        lookup[fixture.homeId];

      const away =
        lookup[fixture.awayId];

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
        !Number.isFinite(homeScore) ||
        !Number.isFinite(awayScore)
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
        homeScore > awayScore
      ) {

        home.wins++;

        home.points += 3;

        away.losses++;

      } else if (
        awayScore > homeScore
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

    });

  standings.forEach(team => {

    team.goalDifference =
      team.goalsFor -
      team.goalsAgainst;

  });

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

      return (
        b.goalsFor -
        a.goalsFor
      );

    }
  );

  return standings;

}

/* =========================================================
   PART 3 — ADMIN RESULT ENTRY + KNOCKOUT MANAGEMENT
   ========================================================= */


/* =========================================================
   RENDER LEAGUE FIXTURES
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
    fixtures.map(
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
          fixture.homeScore ??
          "";

        const awayScore =
          fixture.awayScore ??
          "";

        return `
          <div
            class="fixture-card"
            data-fixture="${escapeHTML(
              fixture.id
            )}"
          >

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
              >

              <strong>
                ${escapeHTML(away)}
              </strong>

            </div>

            <button
              onclick="window.saveChampionsLeagueResult(${index})"
            >
              💾 Save Result
            </button>

          </div>
        `;

      }
    ).join("");

}


/* =========================================================
   SAVE LEAGUE RESULT
   ========================================================= */

async function saveLeagueResult(
  index
) {

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

  renderAdminFixtures();

  alert(
    "League result saved."
  );

}


/* =========================================================
   EXPOSE LEAGUE RESULT FUNCTION
   ========================================================= */

window.saveChampionsLeagueResult =
  saveLeagueResult;


/* =========================================================
   RENDER KNOCKOUT
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
        Top ${competition.knockout.qualificationSize}
      </strong>
    </p>

    <p>
      First stage:
      <strong>
        ${escapeHTML(
          competition.knockout.stage
        )}
      </strong>
    </p>
  `;

  const bracket =
    competition.knockout.bracket || [];

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
   ADMIN TIE
   ========================================================= */

function renderAdminTie(
  tie,
  index
) {

  const homeScore =
    tie.homeScore ??
    "";

  const awayScore =
    tie.awayScore ??
    "";

  const winner =
    tie.winner ||
    "";

  return `
    <div class="fixture-card">

      <h3>
        ${escapeHTML(
          getStageName(
            tie.round
          )
        )}
        ${tie.number}
      </h3>

      <div class="fixture-teams">

        <strong>
          ${escapeHTML(
            tie.homeTeam ||
            "TBD"
          )}
        </strong>

        <input
          type="number"
          min="0"
          id="ko-home-${index}"
          value="${homeScore}"
          placeholder="0"
        >

        <span>
          -
        </span>

        <input
          type="number"
          min="0"
          id="ko-away-${index}"
          value="${awayScore}"
          placeholder="0"
        >

        <strong>
          ${escapeHTML(
            tie.awayTeam ||
            "TBD"
          )}
        </strong>

      </div>

      ${
        winner
          ? `
            <p>
              🏆 Winner:
              <strong>
                ${escapeHTML(winner)}
              </strong>
            </p>
          `
          : ""
      }

      <button
        onclick="window.saveChampionsKnockoutResult(${index})"
      >
        💾 Save Knockout Result
      </button>

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
   SAVE KNOCKOUT RESULT
   ========================================================= */

async function saveKnockoutResult(
  index
) {

  const bracket =
    competition.knockout.bracket || [];

  const tie =
    bracket[index];

  if (!tie) {
    return;
  }

  if (
    !tie.homeTeam ||
    tie.homeTeam === "TBD" ||
    !tie.awayTeam ||
    tie.awayTeam === "TBD"
  ) {

    alert(
      "Both teams must be known before entering a result."
    );

    return;
  }

  const homeInput =
    document.getElementById(
      `ko-home-${index}`
    );

  const awayInput =
    document.getElementById(
      `ko-away-${index}`
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

  if (
    homeScore === awayScore
  ) {

    alert(
      "A tied knockout match requires a winner. For this test version, enter a result that produces a winner."
    );

    return;
  }

  tie.homeScore =
    homeScore;

  tie.awayScore =
    awayScore;

  tie.winner =
    homeScore > awayScore
      ? tie.homeTeam
      : tie.awayTeam;

  advanceAdminWinner(
    tie
  );

  updateKnockoutStage();

  await saveCompetition();

  renderAdminKnockout();

  alert(
    "Knockout result saved and winner advanced."
  );

}


/* =========================================================
   ADVANCE WINNER
   ========================================================= */

function advanceAdminWinner(
  completedTie
) {

  if (!completedTie.winner) {
    return;
  }

  const nextRound =
    getNextAdminRound(
      completedTie.round
    );

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

  if (
    completedTie.number % 2 === 1
  ) {

    nextTie.homeTeam =
      completedTie.winner;

  } else {

    nextTie.awayTeam =
      completedTie.winner;

  }

}


/* =========================================================
   NEXT ROUND
   ========================================================= */

function getNextAdminRound(
  round
) {

  if (round === "round32") {
    return "round16";
  }

  if (round === "round16") {
    return "quarterFinal";
  }

  if (round === "quarterFinal") {
    return "semiFinal";
  }

  if (round === "semiFinal") {
    return "final";
  }

  return null;

}


/* =========================================================
   UPDATE CURRENT STAGE
   ========================================================= */

function updateKnockoutStage() {

  const bracket =
    competition.knockout.bracket || [];

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

    if (
      ties.some(
        tie =>
          !tie.winner
      )
    ) {

      current =
        getStageName(round);

      break;

    }

  }

  competition.knockout.stage =
    current;

}


/* =========================================================
   EXPOSE KNOCKOUT RESULT
   ========================================================= */

window.saveChampionsKnockoutResult =
  saveKnockoutResult;


/* =========================================================
   PART 4 — TWO-LEG SUPPORT + TEST BRACKET + RESET
   ========================================================= */


/* =========================================================
   CREATE TEST BRACKET
   ========================================================= */

async function createTestBracket() {

  if (
    competition.teams.length < 9
  ) {

    alert(
      "Add at least 9 teams first."
    );

    return;
  }

  const standings =
    calculateStandings();

  const total =
    standings.length;

  let qualificationSize = 0;

  if (total >= 33) {

    qualificationSize = 32;

  } else if (total >= 17) {

    qualificationSize = 16;

  } else {

    qualificationSize = 8;

  }

  const qualified =
    standings.slice(
      0,
      qualificationSize
    );

  const bracket =
    buildInitialKnockoutBracket(
      qualified,
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

  await saveCompetition();

  renderDashboard();

  alert(
    "Test knockout bracket created."
  );

}


/* =========================================================
   RESET CHAMPIONS TEST
   ========================================================= */

async function resetChampionsTest() {

  const confirmed =
    confirm(
      "Reset the entire Champions League test?"
    );

  if (!confirmed) {
    return;
  }

  competition = {

    teams: [],

    fixtures: [],

    season: {

      started: false,

      format:
        "champions",

      leagueMatchesPerTeam:
        1,

      knockoutLegs:
        1,

      startDate:
        "",

      endDate:
        ""

    },

    knockout: {

      started:
        false,

      stage:
        "",

      qualificationSize:
        0,

      bracket:
        []

    }

  };

  await saveCompetition();

  renderDashboard();

}


/* =========================================================
   TWO-LEG RESULT HANDLING
   ========================================================= */

/*
  The test system stores each knockout tie
  as one bracket slot.

  When 2-leg mode is selected, the tie
  receives separate leg scores.

  The final remains one leg.
*/

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

  return competition.season.knockoutLegs === 2
    ? 2
    : 1;

}


/* =========================================================
   CREATE LEG STRUCTURE
   ========================================================= */

function ensureTieLegs(
  tie
) {

  const legs =
    getTieLegCount(tie);

  if (legs === 1) {

    tie.legs = [

      {
        homeScore: null,
        awayScore: null
      }

    ];

    return;
  }

  if (
    !Array.isArray(tie.legs) ||
    tie.legs.length !== 2
  ) {

    tie.legs = [

      {
        homeScore: null,
        awayScore: null
      },

      {
        homeScore: null,
        awayScore: null
      }

    ];

  }

}


/* =========================================================
   GET AGGREGATE
   ========================================================= */

function getAggregateScore(
  tie
) {

  ensureTieLegs(tie);

  let homeTotal = 0;

  let awayTotal = 0;

  tie.legs.forEach(
    leg => {

      if (
        Number.isFinite(
          Number(leg.homeScore)
        )
      ) {

        homeTotal +=
          Number(
            leg.homeScore
          );

      }

      if (
        Number.isFinite(
          Number(leg.awayScore)
        )
      ) {

        awayTotal +=
          Number(
            leg.awayScore
          );

      }

    }
  );

  return {

    home:
      homeTotal,

    away:
      awayTotal

  };

}


/* =========================================================
   GET TWO-LEG WINNER
   ========================================================= */

function getTwoLegWinner(
  tie
) {

  ensureTieLegs(tie);

  const complete =
    tie.legs.every(
      leg =>
        leg.homeScore !== null &&
        leg.awayScore !== null
    );

  if (!complete) {
    return null;
  }

  const aggregate =
    getAggregateScore(tie);

  if (
    aggregate.home >
    aggregate.away
  ) {

    return tie.homeTeam;

  }

  if (
    aggregate.away >
    aggregate.home
  ) {

    return tie.awayTeam;

  }

  /*
    No away-goals rule is assumed.
    A tied aggregate is left for the
    administrator to resolve later.
  */

  return null;

}


/* =========================================================
   UPDATE TWO-LEG WINNERS
   ========================================================= */

function updateTwoLegWinners() {

  const bracket =
    competition.knockout.bracket || [];

  bracket.forEach(
    tie => {

      const legs =
        getTieLegCount(tie);

      if (legs !== 2) {
        return;
      }

      const winner =
        getTwoLegWinner(tie);

      if (winner) {

        tie.winner =
          winner;

      }

    }
  );

}


/* =========================================================
   COMPLETE FINAL CHECK
   ========================================================= */

function getFinalWinner() {

  const final =
    competition.knockout.bracket
      ?.find(
        tie =>
          tie.round === "final" &&
          tie.number === 1
      );

  if (!final) {
    return null;
  }

  return final.winner || null;

}


/* =========================================================
   ADMIN TEST SUMMARY
   ========================================================= */

function getTestSummary() {

  return {

    teams:
      competition.teams.length,

    leagueFixtures:
      competition.fixtures.filter(
        fixture =>
          fixture.type === "league"
      ).length,

    knockoutTies:
      competition.knockout.bracket.length,

    qualificationSize:
      competition.knockout
        .qualificationSize,

    currentStage:
      competition.knockout.stage,

    champion:
      getFinalWinner()

  };

}


/* =========================================================
   EXPOSE TEST SUMMARY
   ========================================================= */

window.championsAdminTest = {

  getSummary:
    getTestSummary,

  getStandings:
    calculateStandings,

  getQualificationSize:
    () => {

      const total =
        competition.teams.length;

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

};