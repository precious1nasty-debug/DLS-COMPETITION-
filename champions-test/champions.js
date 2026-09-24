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
  initializeAdmin
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
        )?.value.trim();

      const password =
        document.getElementById(
          "adminPassword"
        )?.value;

      const message =
        document.getElementById(
          "adminLoginMessage"
        );

      if (
        !email ||
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

      competition =
        createEmptyCompetition();

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
          normalizeMatchCount(
            data.season?.leagueMatchesPerTeam
          ),

        knockoutLegs:
          Number(
            data.season?.knockoutLegs
          ) === 2
            ? 2
            : 1,

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
   EMPTY COMPETITION
   ========================================================= */

function createEmptyCompetition() {

  return {

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

}


/* =========================================================
   NORMALIZE MATCH COUNT
   ========================================================= */

function normalizeMatchCount(
  value
) {

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {

    return 1;

  }

  return Math.min(
    MAX_LEAGUE_MATCHES,
    Math.max(
      1,
      Math.floor(number)
    )
  );

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
      <p>No teams added.</p>
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
   IMPORTANT TEAM LOOKUP
   ========================================================= */

function getTeamName(
  teamId
) {

  const team =
    competition.teams.find(
      item =>
        item.id === teamId
    );

  if (team) {

    return (
      team.name ||
      "Unknown Team"
    );

  }

  return "Unknown Team";

}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHTML(
  value
) {

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
   MESSAGE
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
   END OF PART 1
   ========================================================= */

/* =========================================================
   PART 2 — TEST TEAMS + SEASON START + RANDOM FIXTURES
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
    normalizeMatchCount(
      matchesInput?.value
    );

  const legs =
    Number(
      legsInput?.value
    ) === 2
      ? 2
      : 1;

  const confirmed =
    confirm(
      `Start the Champions League season with ${matches} league-phase match${matches === 1 ? "" : "es"} per team and ${legs} knockout leg${legs === 1 ? "" : "s"}?`
    );

  if (!confirmed) {
    return;
  }

  competition.season = {

    started: true,

    format:
      "champions",

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

    started:
      false,

    stage:
      "",

    qualificationSize:
      0,

    bracket:
      []

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

  const matchesPerTeam =
    normalizeMatchCount(
      competition.season
        .leagueMatchesPerTeam
    );

  const fixtures =
    createRandomLeagueFixtures(
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
    `${fixtures.length} random league fixtures generated.`
  );

}


/* =========================================================
   RANDOMIZE ARRAY
   ========================================================= */

function shuffleArray(
  array
) {

  const result =
    [...array];

  /*
    Fisher-Yates shuffle.
    This creates a fresh randomized
    copy without changing the original
    team order stored in Firestore.
  */

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
   CREATE RANDOM LEAGUE FIXTURES
   ========================================================= */

function createRandomLeagueFixtures(
  teams,
  matchesPerTeam
) {

  const total =
    teams.length;

  const target =
    normalizeMatchCount(
      matchesPerTeam
    );

  if (total < 2) {
    return [];
  }

  /*
    We keep a randomized team order for
    each generation.

    Every pair can meet only once.

    Each team is allowed to have up to
    the requested number of opponents.
  */

  const randomizedTeams =
    shuffleArray(
      teams
    );

  const opponents =
    new Map();

  randomizedTeams.forEach(
    team => {

      opponents.set(
        team.id,
        new Set()
      );

    }
  );


  const candidates = [];

  /*
    Create every possible pairing.
    The pairing list itself is then
    shuffled so the selected opponents
    are genuinely random.
  */

  for (
    let i = 0;
    i < randomizedTeams.length;
    i++
  ) {

    for (
      let j = i + 1;
      j < randomizedTeams.length;
      j++
    ) {

      candidates.push({

        home:
          randomizedTeams[i],

        away:
          randomizedTeams[j]

      });

    }

  }


  const randomizedCandidates =
    shuffleArray(
      candidates
    );


  const selectedPairs = [];


  /*
    First pass:
    choose random pairs while both
    teams still need opponents.
  */

  for (
    const pair of randomizedCandidates
  ) {

    const homeId =
      pair.home.id;

    const awayId =
      pair.away.id;

    const homeOpponents =
      opponents.get(
        homeId
      );

    const awayOpponents =
      opponents.get(
        awayId
      );

    if (
      !homeOpponents ||
      !awayOpponents
    ) {
      continue;
    }

    if (
      homeOpponents.size >= target ||
      awayOpponents.size >= target
    ) {
      continue;
    }

    if (
      homeOpponents.has(awayId) ||
      awayOpponents.has(homeId)
    ) {
      continue;
    }

    homeOpponents.add(
      awayId
    );

    awayOpponents.add(
      homeId
    );

    selectedPairs.push(
      pair
    );

  }


  /*
    For an even number of teams, every
    team can be given exactly the same
    number of opponents when the target
    is achievable.

    The fallback pass handles cases where
    the random first pass leaves one or
    more teams short.
  */

  let progress =
    true;

  while (progress) {

    progress = false;

    const needingTeams =
      randomizedTeams.filter(
        team =>
          opponents.get(
            team.id
          ).size < target
      );

    if (!needingTeams.length) {
      break;
    }

    const shuffledNeeding =
      shuffleArray(
        needingTeams
      );

    for (
      const team of shuffledNeeding
    ) {

      if (
        opponents.get(
          team.id
        ).size >= target
      ) {
        continue;
      }

      const possibleOpponents =
        shuffleArray(
          randomizedTeams.filter(
            other => {

              if (
                other.id ===
                team.id
              ) {
                return false;
              }

              const teamOpponents =
                opponents.get(
                  team.id
                );

              const otherOpponents =
                opponents.get(
                  other.id
                );

              if (
                teamOpponents.has(
                  other.id
                )
              ) {
                return false;
              }

              if (
                otherOpponents.size >=
                target
              ) {
                return false;
              }

              return true;

            }
          )
        );

      const opponent =
        possibleOpponents[0];

      if (!opponent) {
        continue;
      }

      opponents.get(
        team.id
      ).add(
        opponent.id
      );

      opponents.get(
        opponent.id
      ).add(
        team.id
      );

      selectedPairs.push({

        home:
          team,

        away:
          opponent

      });

      progress = true;

    }

  }


  /*
    Randomize home/away assignment too.
  */

  const finalPairs =
    shuffleArray(
      selectedPairs
    );


  const fixtures =
    finalPairs.map(
      (pair, index) => {

        let home =
          pair.home;

        let away =
          pair.away;

        if (
          Math.random() < 0.5
        ) {

          [
            home,
            away
          ] = [
            away,
            home
          ];

        }

        return {

          id:
            `league-${index + 1}`,

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

        };

      }
    );


  /*
    Final safety check.
    A team must not appear in more
    than the requested number of matches.
  */

  const counts = {};

  teams.forEach(
    team => {

      counts[team.id] =
        0;

    }
  );

  fixtures.forEach(
    fixture => {

      counts[fixture.homeId]++;
      counts[fixture.awayId]++;

    }
  );


  const valid =
    teams.every(
      team =>
        counts[team.id] === target
    );


  if (!valid) {

    console.warn(
      "Random fixture generation could not give every team the exact requested match count.",
      counts
    );

  }

  return fixtures;

}


/* =========================================================
   END OF PART 2
   ========================================================= */

// =========================================================
// DLS CHAMPIONS LEAGUE TEST
// CHAMPIONS-ADMIN.JS — PART 3
// LEAGUE RESULTS, STANDINGS & KNOCKOUT CREATION
// =========================================================


// =========================================================
// FINISH LEAGUE PHASE
// =========================================================

async function finishLeaguePhase() {

  if (!competition) return;

  if (competition.status !== "league") {
    showMessage("The league phase is not currently active.", true);
    return;
  }

  const fixtures = Array.isArray(competition.fixtures)
    ? competition.fixtures
    : [];

  const leagueFixtures = fixtures.filter(
    fixture => fixture.type === "league"
  );

  if (!leagueFixtures.length) {
    showMessage("Generate league fixtures first.", true);
    return;
  }

  const unfinished = leagueFixtures.filter(
    fixture =>
      fixture.homeScore === null ||
      fixture.awayScore === null ||
      fixture.homeScore === undefined ||
      fixture.awayScore === undefined
  );

  if (unfinished.length > 0) {
    showMessage(
      `There are still ${unfinished.length} unfinished league matches.`,
      true
    );
    return;
  }

  const standings = calculateStandings();

  if (!standings.length) {
    showMessage("Unable to calculate league standings.", true);
    return;
  }

  competition.standings = standings;

  const qualifiedTeams = getQualifiedTeams(standings);

  if (qualifiedTeams.length < 2) {
    showMessage("Not enough qualified teams for a knockout stage.", true);
    return;
  }

  competition.status = "knockout";

  competition.leagueFinishedAt = new Date().toISOString();

  competition.knockout = {
    stage: null,
    currentStage: null,
    completed: false,
    ties: []
  };

  buildInitialKnockoutBracket(qualifiedTeams);

  addFutureBracketRounds();

  await saveCompetition();

  renderDashboard();

  showMessage(
    "League phase finished. The fixed knockout bracket has been created."
  );
}


// =========================================================
// CALCULATE LEAGUE STANDINGS
// =========================================================

function calculateStandings() {

  const teams = Array.isArray(competition?.teams)
    ? competition.teams
    : [];

  const fixtures = Array.isArray(competition?.fixtures)
    ? competition.fixtures
    : [];

  const table = {};

  teams.forEach(team => {

    table[team.id] = {
      teamId: team.id,
      teamName: team.name || "Unnamed Team",
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    };

  });

  fixtures
    .filter(fixture => fixture.type === "league")
    .forEach(fixture => {

      const home = table[fixture.homeId];
      const away = table[fixture.awayId];

      if (!home || !away) return;

      const homeScore = Number(fixture.homeScore);
      const awayScore = Number(fixture.awayScore);

      if (
        !Number.isFinite(homeScore) ||
        !Number.isFinite(awayScore)
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
        away.losses++;

        home.points += 3;

      } else if (homeScore < awayScore) {

        away.wins++;
        home.losses++;

        away.points += 3;

      } else {

        home.draws++;
        away.draws++;

        home.points++;
        away.points++;

      }

    });

  Object.values(table).forEach(team => {

    team.goalDifference =
      team.goalsFor - team.goalsAgainst;

  });

  return Object.values(table).sort((a, b) => {

    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }

    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }

    return a.teamName.localeCompare(b.teamName);

  });

}


// =========================================================
// GET QUALIFIED TEAMS
// =========================================================

function getQualifiedTeams(standings) {

  if (!Array.isArray(standings)) {
    return [];
  }

  const totalTeams = standings.length;

  let qualificationCount = 0;

  if (totalTeams >= 33) {

    qualificationCount = 32;

  } else if (totalTeams >= 17) {

    qualificationCount = 16;

  } else if (totalTeams >= 9) {

    qualificationCount = 8;

  }

  if (!qualificationCount) {
    return [];
  }

  return standings
    .slice(0, qualificationCount)
    .map(row => row.teamId);

}


// =========================================================
// GET FIRST KNOCKOUT STAGE
// =========================================================

function getFirstKnockoutStage(teamCount) {

  if (teamCount >= 32) {
    return "R32";
  }

  if (teamCount >= 16) {
    return "R16";
  }

  if (teamCount >= 8) {
    return "QF";
  }

  return null;

}


// =========================================================
// CREATE INITIAL FIXED KNOCKOUT BRACKET
// =========================================================

function buildInitialKnockoutBracket(qualifiedTeams) {

  if (!Array.isArray(qualifiedTeams)) {
    return;
  }

  const firstStage =
    getFirstKnockoutStage(qualifiedTeams.length);

  if (!firstStage) {
    showMessage(
      "Unable to determine the first knockout stage.",
      true
    );
    return;
  }

  const shuffledTeams = shuffleArray(
    [...qualifiedTeams]
  );

  const ties = [];

  for (
    let i = 0;
    i < shuffledTeams.length;
    i += 2
  ) {

    const homeId = shuffledTeams[i];
    const awayId = shuffledTeams[i + 1];

    if (!homeId || !awayId) continue;

    ties.push({

      id: `${firstStage.toLowerCase()}-tie-${ties.length + 1}`,

      stage: firstStage,

      homeId,
      awayId,

      homeScore: null,
      awayScore: null,

      leg1: null,
      leg2: null,

      winnerId: null,
      completed: false

    });

  }

  competition.knockout = {

    stage: firstStage,

    currentStage: firstStage,

    completed: false,

    ties

  };

}


// =========================================================
// ADD FUTURE FIXED BRACKET ROUNDS
// =========================================================

function addFutureBracketRounds() {

  if (!competition?.knockout) return;

  const firstStage =
    competition.knockout.currentStage;

  const allStages = [
    "R32",
    "R16",
    "QF",
    "SF",
    "FINAL"
  ];

  const startIndex =
    allStages.indexOf(firstStage);

  if (startIndex === -1) return;

  const existingTies =
    Array.isArray(competition.knockout.ties)
      ? competition.knockout.ties
      : [];

  const firstRoundTies = [...existingTies];

  competition.knockout.bracket = {};

  competition.knockout.bracket[firstStage] =
    firstRoundTies;

  let previousCount =
    firstRoundTies.length;

  for (
    let i = startIndex + 1;
    i < allStages.length;
    i++
  ) {

    const stage = allStages[i];

    const nextCount =
      Math.floor(previousCount / 2);

    const futureTies = [];

    for (let j = 0; j < nextCount; j++) {

      futureTies.push({

        id: `${stage.toLowerCase()}-tie-${j + 1}`,

        stage,

        homeId: null,
        awayId: null,

        homeScore: null,
        awayScore: null,

        leg1: null,
        leg2: null,

        winnerId: null,
        completed: false

      });

    }

    competition.knockout.bracket[stage] =
      futureTies;

    previousCount = nextCount;

  }

}


// =========================================================
// RENDER ADMIN LEAGUE FIXTURES
// =========================================================

function renderAdminFixtures() {

  const container =
    document.getElementById("adminFixtureList");

  if (!container) return;

  container.innerHTML = "";

  if (!competition) {
    container.innerHTML =
      "<p>No competition data available.</p>";
    return;
  }

  const fixtures = Array.isArray(competition.fixtures)
    ? competition.fixtures.filter(
        fixture => fixture.type === "league"
      )
    : [];

  if (!fixtures.length) {

    container.innerHTML =
      "<p>No league fixtures generated yet.</p>";

    return;
  }

  fixtures.forEach((fixture, index) => {

    const homeName =
      getTeamName(fixture.homeId);

    const awayName =
      getTeamName(fixture.awayId);

    const homeValue =
      fixture.homeScore === null ||
      fixture.homeScore === undefined
        ? ""
        : fixture.homeScore;

    const awayValue =
      fixture.awayScore === null ||
      fixture.awayScore === undefined
        ? ""
        : fixture.awayScore;

    const card =
      document.createElement("div");

    card.className = "admin-fixture-card";

    card.innerHTML = `

      <div class="fixture-number">
        Match ${index + 1}
      </div>

      <div class="fixture-teams">

        <strong>
          ${escapeHTML(homeName)}
        </strong>

        <span>vs</span>

        <strong>
          ${escapeHTML(awayName)}
        </strong>

      </div>

      <div class="fixture-score-inputs">

        <input
          type="number"
          min="0"
          step="1"
          id="league-home-${fixture.id}"
          value="${homeValue}"
          placeholder="Home"
        >

        <span>-</span>

        <input
          type="number"
          min="0"
          step="1"
          id="league-away-${fixture.id}"
          value="${awayValue}"
          placeholder="Away"
        >

      </div>

      <button
        type="button"
        class="save-fixture-button"
        onclick="saveChampionsLeagueResult('${fixture.id}')"
      >
        Save Result
      </button>

    `;

    container.appendChild(card);

  });

}


// =========================================================
// SAVE LEAGUE RESULT
// =========================================================

async function saveLeagueResult(fixtureId) {

  if (!competition) return;

  const fixture =
    (competition.fixtures || []).find(
      item => item.id === fixtureId
    );

  if (!fixture) {
    showMessage("Fixture not found.", true);
    return;
  }

  const homeInput =
    document.getElementById(
      `league-home-${fixtureId}`
    );

  const awayInput =
    document.getElementById(
      `league-away-${fixtureId}`
    );

  if (!homeInput || !awayInput) {
    showMessage("Score inputs not found.", true);
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

    showMessage(
      "Enter valid non-negative scores.",
      true
    );

    return;
  }

  fixture.homeScore = homeScore;
  fixture.awayScore = awayScore;

  await saveCompetition();

  competition.standings =
    calculateStandings();

  renderAdminFixtures();

  renderDashboard();

  showMessage("League result saved.");

}


// =========================================================
// GLOBAL FUNCTION FOR INLINE BUTTON
// =========================================================

window.saveChampionsLeagueResult =
  saveLeagueResult;

// =========================================================
// DLS CHAMPIONS LEAGUE TEST
// CHAMPIONS-ADMIN.JS — PART 4
// KNOCKOUT ADMIN, BRACKET RENDERING & RESULTS
// =========================================================


// =========================================================
// RENDER ADMIN KNOCKOUT
// =========================================================

function renderAdminKnockout() {

  const container =
    document.getElementById("adminKnockoutList");

  if (!container) return;

  container.innerHTML = "";

  if (!competition?.knockout) {

    container.innerHTML =
      "<p>No knockout bracket created yet.</p>";

    return;
  }

  const bracket =
    competition.knockout.bracket || {};

  const stages = [
    "R32",
    "R16",
    "QF",
    "SF",
    "FINAL"
  ];

  let hasTies = false;

  stages.forEach(stage => {

    const ties =
      Array.isArray(bracket[stage])
        ? bracket[stage]
        : [];

    if (!ties.length) return;

    hasTies = true;

    const section =
      document.createElement("div");

    section.className =
      "admin-knockout-stage";

    const title =
      document.createElement("h3");

    title.textContent =
      getStageName(stage);

    section.appendChild(title);

    ties.forEach(tie => {

      section.appendChild(
        renderAdminTie(tie)
      );

    });

    container.appendChild(section);

  });

  if (!hasTies) {

    container.innerHTML =
      "<p>No knockout ties available.</p>";

  }

}


// =========================================================
// RENDER ONE KNOCKOUT TIE
// =========================================================

function renderAdminTie(tie) {

  const card =
    document.createElement("div");

  card.className =
    "admin-knockout-tie";

  const homeName =
    tie.homeId
      ? getTeamName(tie.homeId)
      : "TBD";

  const awayName =
    tie.awayId
      ? getTeamName(tie.awayId)
      : "TBD";

  const isFinal =
    tie.stage === "FINAL";

  const legs =
    isFinal
      ? 1
      : Number(competition.knockoutLegs || 1);

  let html = `

    <div class="knockout-tie-title">
      ${escapeHTML(homeName)}
      <span>vs</span>
      ${escapeHTML(awayName)}
    </div>

  `;


  // -------------------------------------------------------
  // TWO LEG TIE
  // -------------------------------------------------------

  if (legs === 2 && !isFinal) {

    const leg1 =
      tie.leg1 || {};

    const leg2 =
      tie.leg2 || {};

    html += `

      <div class="knockout-leg">

        <strong>Leg 1</strong>

        <div class="knockout-score-inputs">

          <input
            type="number"
            min="0"
            step="1"
            id="knockout-home-${tie.id}-leg1"
            value="${
              leg1.homeScore ??
              ""
            }"
            placeholder="Home"
          >

          <span>-</span>

          <input
            type="number"
            min="0"
            step="1"
            id="knockout-away-${tie.id}-leg1"
            value="${
              leg1.awayScore ??
              ""
            }"
            placeholder="Away"
          >

        </div>

      </div>


      <div class="knockout-leg">

        <strong>Leg 2</strong>

        <div class="knockout-score-inputs">

          <input
            type="number"
            min="0"
            step="1"
            id="knockout-home-${tie.id}-leg2"
            value="${
              leg2.homeScore ??
              ""
            }"
            placeholder="Home"
          >

          <span>-</span>

          <input
            type="number"
            min="0"
            step="1"
            id="knockout-away-${tie.id}-leg2"
            value="${
              leg2.awayScore ??
              ""
            }"
            placeholder="Away"
          >

        </div>

      </div>

      <button
        type="button"
        class="save-knockout-button"
        onclick="saveChampionsKnockoutResult('${tie.id}')"
      >
        Save Tie
      </button>

    `;

  } else {

    // -----------------------------------------------------
    // ONE LEG TIE / FINAL
    // -----------------------------------------------------

    html += `

      <div class="knockout-score-inputs">

        <input
          type="number"
          min="0"
          step="1"
          id="knockout-home-${tie.id}"
          value="${
            tie.homeScore ??
            ""
          }"
          placeholder="Home"
        >

        <span>-</span>

        <input
          type="number"
          min="0"
          step="1"
          id="knockout-away-${tie.id}"
          value="${
            tie.awayScore ??
            ""
          }"
          placeholder="Away"
        >

      </div>

      <button
        type="button"
        class="save-knockout-button"
        onclick="saveChampionsKnockoutResult('${tie.id}')"
      >
        Save Result
      </button>

    `;

  }


  if (tie.completed && tie.winnerId) {

    html += `

      <div class="knockout-winner">

        Winner:
        <strong>
          ${escapeHTML(
            getTeamName(tie.winnerId)
          )}
        </strong>

      </div>

    `;

  }

  card.innerHTML = html;

  return card;

}


// =========================================================
// STAGE NAME
// =========================================================

function getStageName(stage) {

  const names = {

    R32: "Round of 32",

    R16: "Round of 16",

    QF: "Quarter-Finals",

    SF: "Semi-Finals",

    FINAL: "Final"

  };

  return names[stage] || stage;

}


// =========================================================
// SAVE KNOCKOUT RESULT
// =========================================================

async function saveKnockoutResult(tieId) {

  if (!competition?.knockout) return;

  const bracket =
    competition.knockout.bracket || {};

  let tie = null;

  let stage = null;

  for (const stageName of Object.keys(bracket)) {

    const found =
      bracket[stageName].find(
        item => item.id === tieId
      );

    if (found) {

      tie = found;
      stage = stageName;

      break;

    }

  }

  if (!tie) {

    showMessage(
      "Knockout tie not found.",
      true
    );

    return;

  }


  if (!tie.homeId || !tie.awayId) {

    showMessage(
      "Both teams must be assigned before entering a result.",
      true
    );

    return;

  }


  const isFinal =
    stage === "FINAL";

  const legs =
    isFinal
      ? 1
      : Number(competition.knockoutLegs || 1);


  // =======================================================
  // TWO LEG RESULT
  // =======================================================

  if (legs === 2 && !isFinal) {

    const h1 =
      document.getElementById(
        `knockout-home-${tie.id}-leg1`
      );

    const a1 =
      document.getElementById(
        `knockout-away-${tie.id}-leg1`
      );

    const h2 =
      document.getElementById(
        `knockout-home-${tie.id}-leg2`
      );

    const a2 =
      document.getElementById(
        `knockout-away-${tie.id}-leg2`
      );

    if (!h1 || !a1 || !h2 || !a2) {

      showMessage(
        "Two-leg score inputs not found.",
        true
      );

      return;

    }


    const home1 = Number(h1.value);
    const away1 = Number(a1.value);
    const home2 = Number(h2.value);
    const away2 = Number(a2.value);


    if (
      !Number.isInteger(home1) ||
      !Number.isInteger(away1) ||
      !Number.isInteger(home2) ||
      !Number.isInteger(away2) ||
      home1 < 0 ||
      away1 < 0 ||
      home2 < 0 ||
      away2 < 0
    ) {

      showMessage(
        "Enter valid scores for both legs.",
        true
      );

      return;

    }


    tie.leg1 = {

      homeScore: home1,
      awayScore: away1

    };


    tie.leg2 = {

      homeScore: home2,
      awayScore: away2

    };


    const homeAggregate =
      home1 + home2;

    const awayAggregate =
      away1 + away2;


    if (homeAggregate === awayAggregate) {

      tie.completed = false;
      tie.winnerId = null;

      await saveCompetition();

      renderAdminKnockout();

      showMessage(
        "Aggregate score is tied. Admin resolution is required.",
        true
      );

      return;

    }


    tie.winnerId =
      homeAggregate > awayAggregate
        ? tie.homeId
        : tie.awayId;

    tie.completed = true;

    advanceKnockoutWinner(
      stage,
      tie
    );

    await saveCompetition();

    renderAdminKnockout();

    renderDashboard();

    showMessage(
      `${getTeamName(tie.winnerId)} advances.`
    );

    return;

  }


  // =======================================================
  // ONE LEG RESULT
  // =======================================================

  const homeInput =
    document.getElementById(
      `knockout-home-${tie.id}`
    );

  const awayInput =
    document.getElementById(
      `knockout-away-${tie.id}`
    );

  if (!homeInput || !awayInput) {

    showMessage(
      "Knockout score inputs not found.",
      true
    );

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

    showMessage(
      "Enter valid non-negative scores.",
      true
    );

    return;

  }


  if (homeScore === awayScore) {

    showMessage(
      "A tied knockout match requires an admin winner resolution.",
      true
    );

    return;

  }


  tie.homeScore = homeScore;
  tie.awayScore = awayScore;

  tie.winnerId =
    homeScore > awayScore
      ? tie.homeId
      : tie.awayId;

  tie.completed = true;


  advanceKnockoutWinner(
    stage,
    tie
  );


  await saveCompetition();

  renderAdminKnockout();

  renderDashboard();

  showMessage(
    `${getTeamName(tie.winnerId)} advances.`
  );

}


// =========================================================
// ADVANCE WINNER INTO NEXT FIXED BRACKET SLOT
// =========================================================

function advanceKnockoutWinner(stage, completedTie) {

  if (!completedTie?.winnerId) return;

  const stages = [
    "R32",
    "R16",
    "QF",
    "SF",
    "FINAL"
  ];

  const currentIndex =
    stages.indexOf(stage);

  if (currentIndex === -1) return;

  if (stage === "FINAL") {

    competition.knockout.completed = true;

    competition.championId =
      completedTie.winnerId;

    competition.knockout.currentStage =
      "FINAL";

    return;

  }


  const nextStage =
    stages[currentIndex + 1];

  const currentTies =
    competition.knockout.bracket[stage] || [];

  const nextTies =
    competition.knockout.bracket[nextStage] || [];

  const currentTieIndex =
    currentTies.findIndex(
      tie => tie.id === completedTie.id
    );

  if (currentTieIndex === -1) return;


  const nextTieIndex =
    Math.floor(currentTieIndex / 2);

  const nextTie =
    nextTies[nextTieIndex];

  if (!nextTie) return;


  if (currentTieIndex % 2 === 0) {

    nextTie.homeId =
      completedTie.winnerId;

  } else {

    nextTie.awayId =
      completedTie.winnerId;

  }


  const allCompleted =
    currentTies.every(
      tie => tie.completed
    );

  if (allCompleted) {

    competition.knockout.currentStage =
      nextStage;

  }

}


// =========================================================
// GLOBAL KNOCKOUT RESULT FUNCTION
// =========================================================

window.saveChampionsKnockoutResult =
  saveKnockoutResult;

// =========================================================
// DLS CHAMPIONS LEAGUE TEST
// CHAMPIONS-ADMIN.JS — PART 5
// TEST BRACKET, RESET, SUMMARY & FINAL INITIALIZATION
// =========================================================


// =========================================================
// CREATE TEST BRACKET
// =========================================================

async function createTestBracket() {

  if (!competition) {
    showMessage(
      "Competition data is not loaded.",
      true
    );
    return;
  }

  const teams = Array.isArray(competition.teams)
    ? competition.teams
    : [];

  if (teams.length < 9) {
    showMessage(
      "At least 9 teams are required.",
      true
    );
    return;
  }

  const testStandings = teams.map((team, index) => ({
    teamId: team.id,
    teamName: team.name || `Team ${index + 1}`,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  }));


  competition.standings =
    testStandings;


  const qualifiedTeams =
    getQualifiedTeams(testStandings);


  if (qualifiedTeams.length < 2) {

    showMessage(
      "Unable to create a test bracket.",
      true
    );

    return;

  }


  buildInitialKnockoutBracket(
    qualifiedTeams
  );

  addFutureBracketRounds();


  competition.status =
    "knockout";


  await saveCompetition();

  renderDashboard();

  showMessage(
    "Test knockout bracket created successfully."
  );

}


// =========================================================
// RESET CHAMPIONS TEST
// =========================================================

async function resetChampionsTest() {

  const confirmed =
    window.confirm(
      "Reset the Champions League test? This will remove the test teams, fixtures, standings and knockout bracket."
    );

  if (!confirmed) return;


  competition =
    createEmptyCompetition();


  await saveCompetition();

  renderDashboard();

  showMessage(
    "Champions League test has been reset."
  );

}


// =========================================================
// TEST SUMMARY
// =========================================================

function renderTestSummary() {

  const summary =
    document.getElementById(
      "adminKnockoutStatus"
    );

  if (!summary) return;


  if (!competition) {

    summary.textContent =
      "No competition data.";

    return;

  }


  const teamCount =
    Array.isArray(competition.teams)
      ? competition.teams.length
      : 0;


  const leagueFixtures =
    Array.isArray(competition.fixtures)
      ? competition.fixtures.filter(
          fixture =>
            fixture.type === "league"
        ).length
      : 0;


  const completedLeagueFixtures =
    Array.isArray(competition.fixtures)
      ? competition.fixtures.filter(
          fixture =>
            fixture.type === "league" &&
            fixture.homeScore !== null &&
            fixture.awayScore !== null &&
            fixture.homeScore !== undefined &&
            fixture.awayScore !== undefined
        ).length
      : 0;


  const knockoutStage =
    competition.knockout?.currentStage ||
    competition.knockout?.stage ||
    "Not created";


  const championName =
    competition.championId
      ? getTeamName(
          competition.championId
        )
      : "Not decided";


  summary.innerHTML = `

    <div class="test-summary">

      <p>
        <strong>Teams:</strong>
        ${teamCount}
      </p>

      <p>
        <strong>League Fixtures:</strong>
        ${completedLeagueFixtures}
        / ${leagueFixtures}
      </p>

      <p>
        <strong>Status:</strong>
        ${escapeHTML(
          competition.status || "setup"
        )}
      </p>

      <p>
        <strong>Knockout Stage:</strong>
        ${escapeHTML(
          getStageName(knockoutStage)
        )}
      </p>

      <p>
        <strong>Champion:</strong>
        ${escapeHTML(championName)}
      </p>

    </div>

  `;

}


// =========================================================
// UPDATE ALL ADMIN DISPLAYS
// =========================================================

function renderAllAdminSections() {

  renderDashboard();

  renderAdminFixtures();

  renderAdminKnockout();

  renderTestSummary();

}


// =========================================================
// PATCH DASHBOARD RENDER UPDATE
// =========================================================
//
// The main renderDashboard() function from Part 1
// remains the central renderer.
// This helper keeps all Champions test sections
// synchronized after changes.
//

const originalChampionsRenderDashboard =
  renderDashboard;


// =========================================================
// SAFE REFRESH AFTER SAVE
// =========================================================

async function refreshChampionsAdmin() {

  await loadCompetition();

  renderAllAdminSections();

}


// =========================================================
// TEST CONTROLS
// =========================================================

function setupChampionsTestControls() {

  const createButton =
    document.getElementById(
      "createTestBracketButton"
    );

  if (createButton) {

    createButton.addEventListener(
      "click",
      createTestBracket
    );

  }


  const resetButton =
    document.getElementById(
      "resetChampionsButton"
    );

  if (resetButton) {

    resetButton.addEventListener(
      "click",
      resetChampionsTest
    );

  }

}


// =========================================================
// FINAL ADMIN BUTTON HOOKS
// =========================================================

function setupChampionsFinalControls() {

  const finishButton =
    document.getElementById(
      "finishLeagueButton"
    );

  if (finishButton) {

    finishButton.addEventListener(
      "click",
      finishLeaguePhase
    );

  }


  const generateButton =
    document.getElementById(
      "generateLeagueButton"
    );

  if (generateButton) {

    generateButton.addEventListener(
      "click",
      generateLeagueFixtures
    );

  }

}


// =========================================================
// FINAL TEST API
// =========================================================

window.championsAdminTest = {

  createTestBracket,

  resetChampionsTest,

  finishLeaguePhase,

  calculateStandings,

  getQualifiedTeams,

  renderAdminFixtures,

  renderAdminKnockout,

  saveLeagueResult,

  saveKnockoutResult

};


// =========================================================
// FINAL STARTUP EXTENSION
// =========================================================
//
// This runs after the previous DOMContentLoaded
// setup from Part 1 and adds only the controls
// that were not already registered there.
//

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupChampionsTestControls();

    setupChampionsFinalControls();

    setTimeout(() => {

      if (competition) {
        renderAllAdminSections();
      }

    }, 300);

  }
);