/* =========================================================
   DLS CHAMPIONS LEAGUE
   SEPARATE TEST ADMIN
   PART 1 — FIREBASE + GLOBALS
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
   STATUS ELEMENT
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


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


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
   SAVE CHAMPIONS DATA
========================= */

async function saveChampionsData() {

  await setDoc(
    doc(
      window.championsDb,
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
        window.championsDb,
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
        window.championsDb,
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


  approvedTeams.forEach((team, index) => {

    const name =
      getTeamName(team);


    const item =
      document.createElement("div");

    item.className =
      "admin-team-item";


    item.innerHTML = `
      <strong>${index + 1}. ${escapeHtml(name)}</strong>
    `;


    approvedTeamList.appendChild(item);

  });

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


  if (matches > teamCount - 1) {

    return {
      valid: false,
      message:
        "Matches per team cannot exceed the number of other teams."
    };

  }


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
      Number(matchesPerTeam.value);


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
   CREATE TEAM IDS
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
   GENERATE FIXTURES
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
    Number(matchesPerTeam.value);


  const teams =
    shuffleArray(
      approvedTeams
    );


  const teamCount =
    teams.length;


  const fixtures = [];


  /*
     Each team receives exactly K opponents.

     The cyclic method guarantees:
     - no team plays itself
     - no duplicate opponent
     - every team gets exactly K matches
  */


  const opponentDistances = [];


  for (
    let distance = 1;
    distance <= Math.floor(teamCount / 2);
    distance++
  ) {

    if (
      opponentDistances.length <
      matchesPerTeamValue
    ) {

      opponentDistances.push(
        distance
      );

    }

  }


  const seenPairs =
    new Set();


  function addFixture(
    homeIndex,
    awayIndex
  ) {

    const a =
      Math.min(
        homeIndex,
        awayIndex
      );

    const b =
      Math.max(
        homeIndex,
        awayIndex
      );


    const pairKey =
      `${a}-${b}`;


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
          teams[homeIndex],
          homeIndex
        ),

      away:
        getTeamId(
          teams[awayIndex],
          awayIndex
        ),

      homeName:
        getTeamName(
          teams[homeIndex]
        ),

      awayName:
        getTeamName(
          teams[awayIndex]
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
     EVEN number of teams
  */

  if (teamCount % 2 === 0) {

    for (
      let i = 0;
      i < teamCount;
      i++
    ) {

      for (
        const distance
        of opponentDistances
      ) {

        const opponent =
          (i + distance) %
          teamCount;


        addFixture(
          i,
          opponent
        );

      }

    }

  }


  /*
     ODD number of teams

     The validation guarantees K is even.
  */

  else {

    for (
      let i = 0;
      i < teamCount;
      i++
    ) {

      for (
        const distance
        of opponentDistances
      ) {

        const forward =
          (i + distance) %
          teamCount;

        const backward =
          (
            i - distance +
            teamCount
          ) %
          teamCount;


        addFixture(
          i,
          forward
        );


        if (
          fixtures.length <
          (teamCount * matchesPerTeamValue) / 2
        ) {

          addFixture(
            i,
            backward
          );

        }

      }

    }

  }


  /*
     Verify every team has
     exactly the requested number
     of matches.
  */

  const counts =
    {};


  teams.forEach(
    (team, index) => {

      counts[
        getTeamId(team, index)
      ] = 0;

    }
  );


  fixtures.forEach(
    fixture => {

      counts[fixture.home]++;
      counts[fixture.away]++;

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
      "Fixture generation failed. Please try again.";

    return null;

  }


  return fixtures;

}


/* =========================
   GENERATE BUTTON
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
    championsData.fixtures
      .filter(
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
            ${escapeHtml(fixture.homeName)}
            vs
            ${escapeHtml(fixture.awayName)}
          </strong>
        </div>

        <div class="score-inputs">

          <input
            type="number"
            min="0"
            step="1"
            id="homeScore-${escapeHtml(fixture.id)}"
            value="${homeScore}"
            placeholder="Home"
          >

          <span>-</span>

          <input
            type="number"
            min="0"
            step="1"
            id="awayScore-${escapeHtml(fixture.id)}"
            value="${awayScore}"
            placeholder="Away"
          >

          <button
            type="button"
            class="save-result-button"
            data-fixture-id="${escapeHtml(fixture.id)}"
          >
            Save
          </button>

        </div>
      `;


      adminFixtureList.appendChild(card);

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


  const homeScore =
    Number(homeInput.value);


  const awayScore =
    Number(awayInput.value);


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
          ${escapeHtml(fixture.homeName)}
          ${fixture.homeScore}
          -
          ${fixture.awayScore}
          ${escapeHtml(fixture.awayName)}
        </strong>
      `;


      leagueResultsList.appendChild(item);

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
        getTeamId(team, index);


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


        if (!home || !away) {

          return;

        }


        const homeScore =
          Number(fixture.homeScore);

        const awayScore =
          Number(fixture.awayScore);


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
    .forEach(team => {

      team.goalDifference =
        team.goalsFor -
        team.goalsAgainst;

    });


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
    count >= 33
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


  return table
    .slice(0, qualifiedCount);

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
   SHUFFLE QUALIFIED TEAMS
========================= */

function shuffleQualifiedTeams(
  teams
) {

  return shuffleArray(teams);

}


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


  const shuffled =
    shuffleQualifiedTeams(
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
   GENERATE KNOCKOUT BUTTON
========================= */

generateKnockoutButton.addEventListener(
  "click",
  async () => {

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


    championsData.knockoutRound =
      {

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
    Array.isArray(knockout.matches)
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
            ${escapeHtml(match.homeName)}
            vs
            ${escapeHtml(match.awayName)}
          </strong>
        </div>

        <div>
          <small>
            ${escapeHtml(match.round)}
          </small>
        </div>

        <div class="score-inputs">

          <input
            type="number"
            min="0"
            step="1"
            id="knockout-home-${escapeHtml(match.id)}"
            value="${homeScore}"
            placeholder="Home"
          >

          <span>-</span>

          <input
            type="number"
            min="0"
            step="1"
            id="knockout-away-${escapeHtml(match.id)}"
            value="${awayScore}"
            placeholder="Away"
          >

          <button
            type="button"
            class="save-knockout-button"
            data-match-id="${escapeHtml(match.id)}"
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


  const homeScore =
    Number(homeInput.value);


  const awayScore =
    Number(awayInput.value);


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

    renderKnockoutResults();

    alert(
      "Knockout result saved."
    );


    if (
      knockout.matches.every(
        item =>
          item.completed === true
      )
    ) {

      await advanceKnockoutRound();

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


  if (winners.length === 1) {

    championsData.winner =
      winners[0];

    knockout.completed =
      true;

    try {

      await saveChampionsData();

      renderKnockoutResults();

      updateCompetitionStatus();

    } catch (error) {

      console.error(error);

    }

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

          id: winnerId,

          name:
            team
              ? getTeamName(team)
              : "Unknown Team"

        };

      }
    );


  const nextRoundMatches = [];


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
        getNextKnockoutRound(
          winners.length
        ),

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
    getNextKnockoutRound(
      winners.length
    );

  knockout.matches =
    nextRoundMatches;

  knockout.completed =
    false;


  try {

    await saveChampionsData();

    renderKnockoutResults();

    updateCompetitionStatus();

  } catch (error) {

    console.error(error);

  }

}


/* =========================
   NEXT ROUND NAME
========================= */

function getNextKnockoutRound(
  winnerCount
) {

  if (winnerCount === 16) {

    return "Round of 16";

  }


  if (winnerCount === 8) {

    return "Quarter-final";

  }


  if (winnerCount === 4) {

    return "Semi-final";

  }


  if (winnerCount === 2) {

    return "Final";

  }


  return null;

}


/* =========================================================
   PART 9 — STATUS + RENDERING + START
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

    competitionStatus.textContent =
      "Champions League is currently active.";

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


    championsData.started =
      true;


    try {

      await saveChampionsData();


      settingsMessage.textContent =
        "Champions League has started.";

      updateCompetitionStatus();

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

}


/* =========================
   LOAD ALL ADMIN DATA
========================= */

async function loadAdminData() {

  try {

    await loadApprovedTeams();

    await loadChampionsData();

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


    try {

      await signInWithEmailAndPassword(
        window.championsAuth,
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
  window.championsAuth,
  async user => {

    if (!user) {

      adminLogin.style.display =
        "block";

      adminDashboard.style.display =
        "none";

      return;

    }


    if (
      user.email !== ADMIN_EMAIL
    ) {

      await signOut(
        window.championsAuth
      );

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
        window.championsAuth
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