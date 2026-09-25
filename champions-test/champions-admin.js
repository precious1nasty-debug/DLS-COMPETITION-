/* =========================================================
   DLS CHAMPIONS LEAGUE
   SEPARATE TEST ADMIN
   PART 1 — FIREBASE + GLOBALS
   ========================================================= */


/* =========================
   FIREBASE AUTH IMPORTS
========================= */

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================
   FIRESTORE IMPORTS
========================= */

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================
   FIREBASE READY
========================= */

let firebaseReady = false;


/* =========================
   GLOBAL DATA
========================= */

const ADMIN_EMAIL =
  "obakimoprecious07@gmail.com";


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
   FIREBASE REFERENCES
========================= */

let championsAuth = null;

let championsDb = null;


/* =========================
   WAIT FOR FIREBASE
========================= */

function waitForFirebase() {

  return new Promise(
    resolve => {

      if (
        window.championsFirebaseReady
      ) {

        championsAuth =
          window.championsAuth;

        championsDb =
          window.championsDb;

        firebaseReady =
          true;

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

          firebaseReady =
            true;

          resolve();

        },
        {
          once: true
        }
      );

    }
  );

}


/* =========================
   LOGIN ELEMENTS
========================= */

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

const adminLoginMessage =
  document.getElementById("adminLoginMessage");


/* =========================
   SETTINGS ELEMENTS
========================= */

const matchesPerTeam =
  document.getElementById("matchesPerTeam");

const saveSettingsButton =
  document.getElementById("saveSettingsButton");

const generateFixturesButton =
  document.getElementById("generateFixturesButton");

const startCompetitionButton =
  document.getElementById("startCompetitionButton");

const settingsMessage =
  document.getElementById("settingsMessage");


/* =========================
   TEAM ELEMENTS
========================= */

const approvedTeamList =
  document.getElementById("approvedTeamList");

const teamCountMessage =
  document.getElementById("teamCountMessage");


/* =========================
   FIXTURE ELEMENTS
========================= */

const adminFixtureList =
  document.getElementById("adminFixtureList");

const leagueResultsList =
  document.getElementById("leagueResultsList");


/* =========================
   KNOCKOUT ELEMENTS
========================= */

const generateKnockoutButton =
  document.getElementById("generateKnockoutButton");

const knockoutResultsList =
  document.getElementById("knockoutResultsList");

const knockoutMessage =
  document.getElementById("knockoutMessage");


/* =========================
   STATUS
========================= */

const competitionStatus =
  document.getElementById("competitionStatus");


/* =========================
   LOGOUT
========================= */

const adminLogoutButton =
  document.getElementById("adminLogoutButton");

/* =========================================================
   PART 2 — HELPER FUNCTIONS + FIRESTORE DATA
   ========================================================= */


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================
   GET TEAM NAME
========================= */

function getTeamName(team) {

  return (
    team.name ||
    team.teamName ||
    team.player ||
    team.playerName ||
    "Unknown Team"
  );

}


/* =========================
   GET TEAM ID
========================= */

function getTeamId(team, index) {

  return String(
    team.id ||
    team.uid ||
    team.teamId ||
    team.name ||
    team.teamName ||
    `team-${index}`
  );

}


/* =========================
   SAVE CHAMPIONS DATA
========================= */

async function saveChampionsData() {

  if (!firebaseReady || !championsDb) {

    throw new Error(
      "Firebase is not ready."
    );

  }


  await setDoc(
    doc(
      championsDb,
      "championsLeague",
      "main"
    ),
    championsData
  );

}


/* =========================
   LOAD APPROVED TEAMS
   FROM EXISTING LEAGUE
========================= */

async function loadApprovedTeams() {

  const snapshot =
    await getDoc(
      doc(
        championsDb,
        "competition",
        "main"
      )
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
   LOAD CHAMPIONS DATA
========================= */

async function loadChampionsData() {

  const snapshot =
    await getDoc(
      doc(
        championsDb,
        "championsLeague",
        "main"
      )
    );


  if (!snapshot.exists()) {

    championsData = {

      started: false,

      matchesPerTeam: 1,

      teams: [],

      fixtures: [],

      knockoutRound: null,

      winner: null

    };


    matchesPerTeam.value = "1";

    return;

  }


  const data =
    snapshot.data();


  championsData = {

    started:
      data.started === true,

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

    knockoutRound:
      data.knockoutRound || null,

    winner:
      data.winner || null

  };


  matchesPerTeam.value =
    String(
      championsData.matchesPerTeam
    );

}

/* =========================================================
   PART 3 — TEAMS + SETTINGS
   ========================================================= */


/* =========================
   RENDER APPROVED TEAMS
========================= */

function renderApprovedTeams() {

  approvedTeamList.innerHTML = "";

  teamCountMessage.textContent =
    `Approved teams: ${approvedTeams.length}`;


  if (approvedTeams.length === 0) {

    approvedTeamList.innerHTML =
      "<p>No approved teams found.</p>";

    return;

  }


  approvedTeams.forEach(
    (team, index) => {

      const name =
        getTeamName(team);


      const item =
        document.createElement("div");


      item.className =
        "admin-team-item";


      item.innerHTML = `
        <strong>
          ${index + 1}.
          ${escapeHtml(name)}
        </strong>
      `;


      approvedTeamList.appendChild(item);

    }
  );

}


/* =========================
   VALIDATE MATCHES PER TEAM
========================= */

function validateMatchesPerTeam() {

  const teamCount =
    approvedTeams.length;

  const matches =
    Number(matchesPerTeam.value);


  if (teamCount < 9) {

    return {

      valid: false,

      message:
        "At least 9 approved teams are required."

    };

  }


  if (
    !Number.isInteger(matches) ||
    matches < 1 ||
    matches > 8
  ) {

    return {

      valid: false,

      message:
        "Matches per team must be between 1 and 8."

    };

  }


  if (
    matches > teamCount - 1
  ) {

    return {

      valid: false,

      message:
        "Matches per team cannot exceed the number of other teams."

    };

  }


  /*
     The total number of team-match
     appearances must be even because
     every match contains two teams.
  */

  if (
    (teamCount * matches) % 2 !== 0
  ) {

    return {

      valid: false,

      message:
        "This number of matches per team cannot be used with the current number of teams."

    };

  }


  return {

    valid: true,

    message: ""

  };

}


/* =========================
   SAVE SETTINGS
========================= */

saveSettingsButton.addEventListener(
  "click",
  async () => {

    const validation =
      validateMatchesPerTeam();


    if (!validation.valid) {

      settingsMessage.textContent =
        validation.message;

      return;

    }


    championsData.matchesPerTeam =
      Number(
        matchesPerTeam.value
      );


    try {

      await saveChampionsData();


      settingsMessage.textContent =
        "Champions League settings saved.";

    } catch (error) {

      console.error(error);

      settingsMessage.textContent =
        "Unable to save settings.";

    }

  }
);

/* =========================================================
   PART 4 — LEAGUE FIXTURE GENERATION
   ========================================================= */


/* =========================
   SHUFFLE TEAMS
========================= */

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
    ] =
    [
      result[j],
      result[i]
    ];

  }


  return result;

}


/* =========================
   GENERATE LEAGUE FIXTURES
========================= */

function generateLeagueFixtures() {

  const validation =
    validateMatchesPerTeam();


  if (!validation.valid) {

    settingsMessage.textContent =
      validation.message;

    return null;

  }


  const matchesPerTeamValue =
    Number(
      matchesPerTeam.value
    );


  const teams =
    shuffleArray(
      approvedTeams
    );


  const teamCount =
    teams.length;


  const fixtures = [];


  /*
     Track every pair of teams.

     This prevents the same two teams
     from being scheduled more than once.
  */

  const seenPairs =
    new Set();


  /* =========================
     ADD FIXTURE
  ========================= */

  function addFixture(
    firstIndex,
    secondIndex
  ) {

    if (
      firstIndex === secondIndex
    ) {

      return;

    }


    const first =
      Math.min(
        firstIndex,
        secondIndex
      );

    const second =
      Math.max(
        firstIndex,
        secondIndex
      );


    const pairKey =
      `${first}-${second}`;


    if (
      seenPairs.has(pairKey)
    ) {

      return;

    }


    seenPairs.add(pairKey);


    fixtures.push({

      id:
        `league-${fixtures.length + 1}`,

      phase:
        "league",

      home:
        getTeamId(
          teams[firstIndex],
          firstIndex
        ),

      away:
        getTeamId(
          teams[secondIndex],
          secondIndex
        ),

      homeName:
        getTeamName(
          teams[firstIndex]
        ),

      awayName:
        getTeamName(
          teams[secondIndex]
        ),

      homeScore:
        null,

      awayScore:
        null,

      completed:
        false

    });

  }


  /*
     =====================================================
     CYCLIC FIXTURE SYSTEM
     =====================================================

     For every distance:

       +distance
       -distance

     This gives each team two opponents
     for every distance.

     Example:

     8 matches per team
     = 4 distances × 2 opponents

     If the number of teams is even
     and matches per team is odd,
     the exact opposite team is added
     as the final opponent.
  */


  const pairedDistances =
    Math.floor(
      matchesPerTeamValue / 2
    );


  /* =========================
     ADD PAIRED DISTANCES
  ========================= */

  for (
    let distance = 1;
    distance <= pairedDistances;
    distance++
  ) {

    for (
      let i = 0;
      i < teamCount;
      i++
    ) {

      const forward =
        (i + distance) %
        teamCount;


      const backward =
        (
          i -
          distance +
          teamCount
        ) %
        teamCount;


      addFixture(
        i,
        forward
      );


      addFixture(
        i,
        backward
      );

    }

  }


  /*
     =====================================================
     ODD MATCH COUNT PER TEAM
     =====================================================

     An odd number of matches per team
     is only possible when the number
     of teams is even.

     The remaining opponent is the
     team directly opposite in the circle.
  */

  if (
    matchesPerTeamValue % 2 === 1
  ) {

    const oppositeDistance =
      teamCount / 2;


    for (
      let i = 0;
      i < teamCount;
      i++
    ) {

      const opponent =
        (
          i +
          oppositeDistance
        ) %
        teamCount;


      addFixture(
        i,
        opponent
      );

    }

  }


  /* =========================
     VERIFY FIXTURE COUNT
  ========================= */

  const expectedFixtureCount =
    (
      teamCount *
      matchesPerTeamValue
    ) / 2;


  if (
    fixtures.length !==
    expectedFixtureCount
  ) {

    settingsMessage.textContent =
      "Fixture generation failed. Please try again.";

    return null;

  }


  /* =========================
     VERIFY TEAM DISTRIBUTION
  ========================= */

  const counts = {};


  teams.forEach(
    (team, index) => {

      counts[
        getTeamId(
          team,
          index
        )
      ] = 0;

    }
  );


  fixtures.forEach(
    fixture => {

      counts[
        fixture.home
      ]++;

      counts[
        fixture.away
      ]++;

    }
  );


  const distributionValid =
    Object.values(counts)
      .every(
        count =>
          count ===
          matchesPerTeamValue
      );


  if (!distributionValid) {

    settingsMessage.textContent =
      "Fixture generation failed. Each team must have exactly the selected number of matches.";

    return null;

  }


  return fixtures;

}


/* =========================
   GENERATE FIXTURES BUTTON
========================= */

generateFixturesButton.addEventListener(
  "click",
  async () => {

    if (championsData.started) {

      settingsMessage.textContent =
        "Fixtures cannot be regenerated after the competition starts.";

      return;

    }


    const fixtures =
      generateLeagueFixtures();


    if (!fixtures) {

      return;

    }


    /*
       Store all approved teams.

       The shuffled order is used only
       for fixture generation.
    */

    championsData.teams =
      approvedTeams.map(
        (team, index) => ({

          ...team,

          id:
            getTeamId(
              team,
              index
            )

        })
      );


    championsData.fixtures =
      fixtures;


    championsData.knockoutRound =
      null;


    championsData.winner =
      null;


    try {

      await saveChampionsData();


      settingsMessage.textContent =
        `${fixtures.length} league fixtures generated successfully.`;


      renderAdminFixtures();

    } catch (error) {

      console.error(error);

      settingsMessage.textContent =
        "Unable to save generated fixtures.";

    }

  }
);

/* =========================================================
   PART 5 — FIXTURE DISPLAY + RESULTS
   ========================================================= */


/* =========================
   RENDER LEAGUE FIXTURES
========================= */

function renderAdminFixtures() {

  adminFixtureList.innerHTML = "";

  leagueResultsList.innerHTML = "";


  const fixtures =
    championsData.fixtures.filter(
      fixture =>
        fixture.phase === "league"
    );


  if (fixtures.length === 0) {

    adminFixtureList.innerHTML =
      "<p>No fixtures generated yet.</p>";

    return;

  }


  fixtures.forEach(
    (fixture, index) => {

      const card =
        document.createElement("div");


      card.className =
        "admin-fixture";


      const homeScore =
        fixture.homeScore ?? "";


      const awayScore =
        fixture.awayScore ?? "";


      card.innerHTML = `

        <div>

          <strong>
            ${index + 1}.
            ${escapeHtml(
              fixture.homeName
            )}
            vs
            ${escapeHtml(
              fixture.awayName
            )}
          </strong>

        </div>


        <div class="score-inputs">

          <input
            type="number"
            min="0"
            step="1"
            id="homeScore-${escapeHtml(
              fixture.id
            )}"
            value="${homeScore}"
            placeholder="Home"
          >


          <span>-</span>


          <input
            type="number"
            min="0"
            step="1"
            id="awayScore-${escapeHtml(
              fixture.id
            )}"
            value="${awayScore}"
            placeholder="Away"
          >


          <button
            type="button"
            class="save-result-button"
            data-fixture-id="${escapeHtml(
              fixture.id
            )}"
          >
            Save
          </button>

        </div>

      `;


      adminFixtureList.appendChild(
        card
      );

    }
  );


  document
    .querySelectorAll(
      ".save-result-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            saveLeagueResult(
              button.dataset.fixtureId
            );

          }
        );

      }
    );


  renderSavedLeagueResults();

}


/* =========================
   SAVE LEAGUE RESULT
========================= */

async function saveLeagueResult(
  fixtureId
) {

  const fixture =
    championsData.fixtures.find(
      item =>
        item.id === fixtureId
    );


  if (!fixture) {

    return;

  }


  const homeInput =
    document.getElementById(
      `homeScore-${fixtureId}`
    );


  const awayInput =
    document.getElementById(
      `awayScore-${fixtureId}`
    );


  if (
    !homeInput ||
    !awayInput
  ) {

    return;

  }


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
    awayInput.value === "" ||
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {

    alert(
      "Enter valid scores for both teams."
    );

    return;

  }


  fixture.homeScore =
    homeScore;


  fixture.awayScore =
    awayScore;


  fixture.completed =
    true;


  try {

    await saveChampionsData();


    renderAdminFixtures();


    alert(
      "Match result saved."
    );

  } catch (error) {

    console.error(error);


    alert(
      "Unable to save match result."
    );

  }

}


/* =========================
   RENDER SAVED RESULTS
========================= */

function renderSavedLeagueResults() {

  leagueResultsList.innerHTML = "";


  const completedFixtures =
    championsData.fixtures.filter(
      fixture =>
        fixture.phase === "league" &&
        fixture.completed === true
    );


  if (
    completedFixtures.length === 0
  ) {

    leagueResultsList.innerHTML =
      "<p>No results entered yet.</p>";

    return;

  }


  completedFixtures.forEach(
    fixture => {

      const item =
        document.createElement("div");


      item.className =
        "admin-result";


      item.innerHTML = `

        <strong>

          ${escapeHtml(
            fixture.homeName
          )}

          ${fixture.homeScore}

          -

          ${fixture.awayScore}

          ${escapeHtml(
            fixture.awayName
          )}

        </strong>

      `;


      leagueResultsList.appendChild(
        item
      );

    }
  );

}

/* =========================================================
   PART 6 — LEAGUE TABLE + QUALIFICATION
   ========================================================= */


/* =========================
   BUILD LEAGUE TABLE
========================= */

function buildLeagueTable() {

  const table = {};


  championsData.teams.forEach(
    (team, index) => {

      const id =
        getTeamId(
          team,
          index
        );


      table[id] = {

        id,

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


  championsData.fixtures
    .filter(
      fixture =>
        fixture.phase === "league" &&
        fixture.completed === true
    )
    .forEach(
      fixture => {

        const home =
          table[fixture.home];

        const away =
          table[fixture.away];


        if (
          !home ||
          !away
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

          home.points += 3;

          away.losses++;

        }

        else if (
          homeScore <
          awayScore
        ) {

          away.wins++;

          away.points += 3;

          home.losses++;

        }

        else {

          home.draws++;

          away.draws++;

          home.points++;

          away.points++;

        }

      }
    );


  Object.values(table)
    .forEach(
      team => {

        team.goalDifference =
          team.goalsFor -
          team.goalsAgainst;

      }
    );


  return Object.values(table)
    .sort(
      (a, b) =>

        b.points -
        a.points ||

        b.goalDifference -
        a.goalDifference ||

        b.goalsFor -
        a.goalsFor ||

        a.name.localeCompare(
          b.name
        )
    );

}


/* =========================
   GET QUALIFIED COUNT
========================= */

function getQualifiedCount() {

  const count =
    championsData.teams.length;


  if (
    count >= 9 &&
    count <= 16
  ) {

    return 8;

  }


  if (
    count >= 17 &&
    count <= 32
  ) {

    return 16;

  }


  if (
    count >= 33 &&
    count <= 128
  ) {

    return 32;

  }


  return 0;

}


/* =========================
   GET QUALIFIED TEAMS
========================= */

function getQualifiedTeams() {

  const table =
    buildLeagueTable();


  const qualifiedCount =
    getQualifiedCount();


  if (
    qualifiedCount === 0
  ) {

    return [];

  }


  return table.slice(
    0,
    qualifiedCount
  );

}


/* =========================
   CHECK LEAGUE COMPLETION
========================= */

function isLeagueComplete() {

  const requiredFixtures =
    championsData.fixtures.filter(
      fixture =>
        fixture.phase === "league"
    );


  if (
    requiredFixtures.length === 0
  ) {

    return false;

  }


  return requiredFixtures.every(
    fixture =>
      fixture.completed === true
  );

}

/* =========================================================
   PART 7 — KNOCKOUT RANDOM DRAW
   ========================================================= */


/* =========================
   GET KNOCKOUT ROUND
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


  if (teamCount === 32) {

    return "Round of 32";

  }


  return null;

}


/* =========================
   CREATE RANDOM DRAW
========================= */

function createKnockoutDraw(
  qualifiedTeams
) {

  const count =
    qualifiedTeams.length;


  const round =
    getKnockoutRoundName(
      count
    );


  if (!round) {

    return null;

  }


  /*
     Randomly shuffle the qualified
     teams before pairing them.
  */

  const shuffled =
    shuffleArray(
      qualifiedTeams
    );


  const matches = [];


  for (
    let i = 0;
    i < shuffled.length;
    i += 2
  ) {

    const home =
      shuffled[i];

    const away =
      shuffled[i + 1];


    matches.push({

      id:
        `knockout-${Date.now()}-${i}`,

      phase:
        "knockout",

      round,

      home:
        home.id,

      away:
        away.id,

      homeName:
        home.name,

      awayName:
        away.name,

      homeScore:
        null,

      awayScore:
        null,

      completed:
        false,

      winner:
        null

    });

  }


  return {

    round,

    matches

  };

}


/* =========================
   GENERATE KNOCKOUT
========================= */

generateKnockoutButton.addEventListener(
  "click",
  async () => {

    if (!championsData.started) {

      knockoutMessage.textContent =
        "Start the Champions League before generating the knockout draw.";

      return;

    }


    if (!isLeagueComplete()) {

      knockoutMessage.textContent =
        "All league matches must be completed first.";

      return;

    }


    if (
      championsData.knockoutRound
    ) {

      knockoutMessage.textContent =
        "The knockout draw has already been generated.";

      return;

    }


    const qualifiedTeams =
      getQualifiedTeams();


    if (
      qualifiedTeams.length !== 8 &&
      qualifiedTeams.length !== 16 &&
      qualifiedTeams.length !== 32
    ) {

      knockoutMessage.textContent =
        "Unable to determine the qualified teams.";

      return;

    }


    const draw =
      createKnockoutDraw(
        qualifiedTeams
      );


    if (!draw) {

      knockoutMessage.textContent =
        "Unable to generate knockout draw.";

      return;

    }


    championsData.knockoutRound = {

      currentRound:
        draw.round,

      matches:
        draw.matches,

      completed:
        false

    };


    try {

      await saveChampionsData();


      knockoutMessage.textContent =
        `${draw.round} draw generated randomly.`;

      renderKnockoutResults();

    } catch (error) {

      console.error(error);

      knockoutMessage.textContent =
        "Unable to save knockout draw.";

    }

  }
);

/* =========================================================
   PART 8 — KNOCKOUT RESULTS + NEXT ROUNDS
   ========================================================= */


/* =========================
   RENDER KNOCKOUT MATCHES
========================= */

function renderKnockoutResults() {

  knockoutResultsList.innerHTML = "";


  const knockout =
    championsData.knockoutRound;


  if (!knockout) {

    knockoutResultsList.innerHTML =
      "<p>No knockout draw generated yet.</p>";

    return;

  }


  const matches =
    Array.isArray(
      knockout.matches
    )
      ? knockout.matches
      : [];


  if (matches.length === 0) {

    knockoutResultsList.innerHTML =
      "<p>No knockout matches found.</p>";

    return;

  }


  matches.forEach(
    (match, index) => {

      const card =
        document.createElement("div");


      card.className =
        "admin-fixture";


      const homeScore =
        match.homeScore ?? "";


      const awayScore =
        match.awayScore ?? "";


      card.innerHTML = `

        <div>

          <strong>

            ${index + 1}.

            ${escapeHtml(
              match.homeName
            )}

            vs

            ${escapeHtml(
              match.awayName
            )}

          </strong>

        </div>


        <div>

          <small>

            ${escapeHtml(
              match.round
            )}

          </small>

        </div>


        <div class="score-inputs">

          <input
            type="number"
            min="0"
            step="1"
            id="knockout-home-${escapeHtml(
              match.id
            )}"
            value="${homeScore}"
            placeholder="Home"
          >


          <span>-</span>


          <input
            type="number"
            min="0"
            step="1"
            id="knockout-away-${escapeHtml(
              match.id
            )}"
            value="${awayScore}"
            placeholder="Away"
          >


          <button
            type="button"
            class="save-knockout-button"
            data-match-id="${escapeHtml(
              match.id
            )}"
          >
            Save
          </button>

        </div>

      `;


      knockoutResultsList.appendChild(
        card
      );

    }
  );


  document
    .querySelectorAll(
      ".save-knockout-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            saveKnockoutResult(
              button.dataset.matchId
            );

          }
        );

      }
    );

}


/* =========================
   SAVE KNOCKOUT RESULT
========================= */

async function saveKnockoutResult(
  matchId
) {

  const knockout =
    championsData.knockoutRound;


  if (!knockout) {

    return;

  }


  const match =
    knockout.matches.find(
      item =>
        item.id === matchId
    );


  if (!match) {

    return;

  }


  const homeInput =
    document.getElementById(
      `knockout-home-${matchId}`
    );


  const awayInput =
    document.getElementById(
      `knockout-away-${matchId}`
    );


  if (
    !homeInput ||
    !awayInput
  ) {

    return;

  }


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
    awayInput.value === "" ||
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {

    alert(
      "Enter valid scores for both teams."
    );

    return;

  }


  /*
     A knockout match must have
     one winner.
  */

  if (
    homeScore === awayScore
  ) {

    alert(
      "Knockout matches cannot end in a draw. Enter the final winning score."
    );

    return;

  }


  match.homeScore =
    homeScore;


  match.awayScore =
    awayScore;


  match.completed =
    true;


  match.winner =
    homeScore > awayScore
      ? match.home
      : match.away;


  try {

    await saveChampionsData();


    alert(
      "Knockout result saved."
    );


    /*
       If every match in the current
       round is complete, automatically
       create the next round.
    */

    if (
      knockout.matches.every(
        item =>
          item.completed === true
      )
    ) {

      await advanceKnockoutRound();

    }
    else {

      renderKnockoutResults();

    }

  } catch (error) {

    console.error(error);

    alert(
      "Unable to save knockout result."
    );

  }

}


/* =========================
   ADVANCE KNOCKOUT ROUND
========================= */

async function advanceKnockoutRound() {

  const knockout =
    championsData.knockoutRound;


  if (!knockout) {

    return;

  }


  const winners =
    knockout.matches
      .map(
        match =>
          match.winner
      )
      .filter(Boolean);


  if (
    winners.length !==
    knockout.matches.length
  ) {

    return;

  }


  /*
     Only one winner means the
     competition is complete.
  */

  if (
    winners.length === 1
  ) {

    championsData.winner =
      winners[0];


    knockout.completed =
      true;


    await saveChampionsData();


    renderKnockoutResults();

    updateCompetitionStatus();

    return;

  }


  const winnerObjects =
    winners.map(
      winnerId => {

        const team =
          championsData.teams.find(
            (item, index) =>
              getTeamId(
                item,
                index
              ) === winnerId
          );


        return {

          id:
            winnerId,

          name:
            team
              ? getTeamName(team)
              : "Unknown Team"

        };

      }
    );


  const nextRound =
    getNextKnockoutRound(
      winners.length
    );


  if (!nextRound) {

    return;

  }


  const nextRoundMatches =
    [];


  for (
    let i = 0;
    i < winnerObjects.length;
    i += 2
  ) {

    const home =
      winnerObjects[i];

    const away =
      winnerObjects[i + 1];


    nextRoundMatches.push({

      id:
        `knockout-${Date.now()}-${i}`,

      phase:
        "knockout",

      round:
        nextRound,

      home:
        home.id,

      away:
        away.id,

      homeName:
        home.name,

      awayName:
        away.name,

      homeScore:
        null,

      awayScore:
        null,

      completed:
        false,

      winner:
        null

    });

  }


  knockout.currentRound =
    nextRound;


  knockout.matches =
    nextRoundMatches;


  knockout.completed =
    false;


  await saveChampionsData();


  renderKnockoutResults();

  updateCompetitionStatus();

}


/* =========================
   NEXT ROUND NAME
========================= */

function getNextKnockoutRound(
  winnerCount
) {

  if (
    winnerCount === 16
  ) {

    return "Round of 16";

  }


  if (
    winnerCount === 8
  ) {

    return "Quarter-final";

  }


  if (
    winnerCount === 4
  ) {

    return "Semi-final";

  }


  if (
    winnerCount === 2
  ) {

    return "Final";

  }


  return null;

}

/* =========================================================
   PART 9 — STATUS + START COMPETITION
   ========================================================= */


/* =========================
   UPDATE COMPETITION STATUS
========================= */

function updateCompetitionStatus() {

  if (championsData.winner) {

    const winnerTeam =
      championsData.teams.find(
        (team, index) =>
          getTeamId(
            team,
            index
          ) === championsData.winner
      );


    competitionStatus.textContent =
      winnerTeam
        ? `Winner: ${getTeamName(winnerTeam)}`
        : "Competition completed.";


    return;

  }


  if (championsData.started) {

    if (
      championsData.knockoutRound &&
      championsData.knockoutRound.currentRound
    ) {

      competitionStatus.textContent =
        `Champions League active — ${championsData.knockoutRound.currentRound}.`;

    }
    else {

      competitionStatus.textContent =
        "Champions League is currently active.";

    }


    return;

  }


  if (
    championsData.fixtures.length > 0
  ) {

    competitionStatus.textContent =
      "Fixtures generated. Competition has not started.";

    return;

  }


  competitionStatus.textContent =
    "Champions League is ready for setup.";

}


/* =========================
   START COMPETITION
========================= */

startCompetitionButton.addEventListener(
  "click",
  async () => {

    if (championsData.started) {

      settingsMessage.textContent =
        "Competition has already started.";

      return;

    }


    if (
      championsData.fixtures.length === 0
    ) {

      settingsMessage.textContent =
        "Generate fixtures before starting the competition.";

      return;

    }


    const validation =
      validateMatchesPerTeam();


    if (!validation.valid) {

      settingsMessage.textContent =
        validation.message;

      return;

    }


    /*
       Make sure the generated fixtures
       still match the selected setting.
    */

    const expectedFixtureCount =
      (
        approvedTeams.length *
        championsData.matchesPerTeam
      ) / 2;


    if (
      championsData.fixtures.length !==
      expectedFixtureCount
    ) {

      settingsMessage.textContent =
        "The generated fixtures do not match the current settings. Generate fixtures again.";

      return;

    }


    championsData.started =
      true;


    try {

      await saveChampionsData();


      settingsMessage.textContent =
        "Champions League has started.";


      updateCompetitionStatus();


      updateControlState();

    } catch (error) {

      console.error(error);


      championsData.started =
        false;


      settingsMessage.textContent =
        "Unable to start competition.";

    }

  }
);


/* =========================
   INITIAL ADMIN RENDER
========================= */

function renderAdmin() {

  renderApprovedTeams();

  renderAdminFixtures();

  renderKnockoutResults();

  updateCompetitionStatus();

}


/* =========================
   LOCK SETTINGS AFTER START
========================= */

function updateControlState() {

  if (championsData.started) {

    matchesPerTeam.disabled =
      true;

    saveSettingsButton.disabled =
      true;

    generateFixturesButton.disabled =
      true;

    startCompetitionButton.disabled =
      true;

  }
  else {

    matchesPerTeam.disabled =
      false;

    saveSettingsButton.disabled =
      false;

    generateFixturesButton.disabled =
      false;

    startCompetitionButton.disabled =
      false;

  }

}


/* =========================
   LOAD ALL ADMIN DATA
========================= */

async function loadAdminData() {

  try {

    await loadApprovedTeams();

    await loadChampionsData();


    /*
       Keep the saved Champions
       teams if fixtures already exist.
       Otherwise show current approved
       League teams.
    */

    if (
      championsData.teams.length === 0 &&
      approvedTeams.length > 0
    ) {

      championsData.teams =
        approvedTeams.map(
          (team, index) => ({

            ...team,

            id:
              getTeamId(
                team,
                index
              )

          })
        );

    }


    renderAdmin();

    updateControlState();

  } catch (error) {

    console.error(error);


    settingsMessage.textContent =
      "Unable to load Champions League data.";

  }

}

/* =========================================================
   PART 10 — AUTHENTICATION + INITIALIZATION
   ========================================================= */


/* =========================
   START ADMIN
========================= */

async function startAdmin() {

  /*
     Wait until Firebase has finished
     initializing before using Auth.
  */

  await waitForFirebase();


  if (
    !championsAuth
  ) {

    console.error(
      "Champions Firebase Auth is unavailable."
    );

    adminLoginMessage.textContent =
      "Firebase authentication is unavailable.";

    return;

  }


  /* =========================
     ADMIN LOGIN
  ========================= */

  adminLoginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const email =
        adminEmail.value.trim();


      const password =
        adminPassword.value;


      adminLoginMessage.textContent =
        "Signing in...";


      if (
        email !== ADMIN_EMAIL
      ) {

        adminLoginMessage.textContent =
          "Invalid admin email.";

        return;

      }


      if (
        password === ""
      ) {

        adminLoginMessage.textContent =
          "Enter your password.";

        return;

      }


      try {

        await signInWithEmailAndPassword(
          championsAuth,
          email,
          password
        );


        adminLoginMessage.textContent =
          "Login successful.";

      } catch (error) {

        console.error(error);


        adminLoginMessage.textContent =
          "Login failed. Check your email and password.";

      }

    }
  );


  /* =========================
     AUTH STATE
  ========================= */

  onAuthStateChanged(
    championsAuth,
    async user => {

      if (!user) {

        adminLogin.style.display =
          "block";

        adminDashboard.style.display =
          "none";

        return;

      }


      /*
         Only the configured admin email
         may access this dashboard.
      */

      if (
        user.email !== ADMIN_EMAIL
      ) {

        await signOut(
          championsAuth
        );


        adminLogin.style.display =
          "block";

        adminDashboard.style.display =
          "none";


        adminLoginMessage.textContent =
          "This account is not authorized.";

        return;

      }


      adminLogin.style.display =
        "none";

      adminDashboard.style.display =
        "block";


      await loadAdminData();

    }
  );


  /* =========================
     LOGOUT
  ========================= */

  adminLogoutButton.addEventListener(
    "click",
    async () => {

      try {

        await signOut(
          championsAuth
        );

      } catch (error) {

        console.error(error);

      }

    }
  );


  /* =========================
     INITIAL UI STATE
  ========================= */

  adminDashboard.style.display =
    "none";

  adminLogin.style.display =
    "block";

}


/* =========================
   START APPLICATION
========================= */

startAdmin()
  .catch(
    error => {

      console.error(
        "Champions Admin initialization failed:",
        error
      );


      adminLogin.style.display =
        "block";

      adminDashboard.style.display =
        "none";


      adminLoginMessage.textContent =
        "Unable to initialize the admin dashboard.";

    }
  );