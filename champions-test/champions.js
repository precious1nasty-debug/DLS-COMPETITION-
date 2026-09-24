/* =========================================================
   DLS COMPETITION
   CHAMPIONS LEAGUE TEST SYSTEM
   champions.js
   CLEAN REBUILD — PART 1
   FIREBASE + DATA + TEAMS + TABLE
   ========================================================= */

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const TEST_COLLECTION = "championsTest";
const TEST_DOCUMENT = "main";

const MAX_LEAGUE_MATCHES = 8;


/* =========================================================
   GLOBAL COMPETITION DATA
   ========================================================= */

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
   FIREBASE
   ========================================================= */

let db = null;


/* =========================================================
   PAGE START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeChampionsPage
);


async function initializeChampionsPage() {

  try {

    if (!window.firebaseReady) {

      showMessage(
        "seasonDetails",
        "Firebase is not ready yet."
      );

      return;
    }

    db = window.db;

    await loadCompetition();

    refreshAllDisplays();

  } catch (error) {

    console.error(
      "Champions League initialization error:",
      error
    );

    showMessage(
      "seasonDetails",
      "Unable to load the Champions League test."
    );

  }

}


/* =========================================================
   LOAD COMPETITION FROM FIRESTORE
   ========================================================= */

async function loadCompetition() {

  const reference = doc(
    db,
    TEST_COLLECTION,
    TEST_DOCUMENT
  );

  const snapshot =
    await getDoc(reference);

  if (!snapshot.exists()) {

    competition = createEmptyCompetition();

    return;
  }

  const data =
    snapshot.data() || {};

  competition = normalizeCompetition(
    data
  );

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
   NORMALIZE FIRESTORE DATA
   ========================================================= */

function normalizeCompetition(data) {

  return {

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
        data.season?.format || "champions",

      leagueMatchesPerTeam:
        normalizeMatchCount(
          data.season?.leagueMatchesPerTeam
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

}


/* =========================================================
   MATCH COUNT NORMALIZER
   ========================================================= */

function normalizeMatchCount(value) {

  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.min(
    MAX_LEAGUE_MATCHES,
    Math.max(1, Math.floor(number))
  );

}


/* =========================================================
   REFRESH EVERYTHING
   ========================================================= */

function refreshAllDisplays() {

  renderSeason();

  renderTeams();

  renderTable();

  renderFixtures();

  renderKnockout();

  renderWinners();

}


/* =========================================================
   SEASON DISPLAY
   ========================================================= */

function renderSeason() {

  const element =
    document.getElementById(
      "seasonDetails"
    );

  if (!element) {
    return;
  }

  if (!competition.season.started) {

    element.innerHTML = `
      <p>
        🟡 Champions League season has not started.
      </p>

      <p>
        The administrator will select the league-phase
        matches and knockout format before starting.
      </p>
    `;

    return;
  }

  const matches =
    normalizeMatchCount(
      competition.season
        .leagueMatchesPerTeam
    );

  const legs =
    competition.season.knockoutLegs === 2
      ? "2 Legs"
      : "1 Leg";

  element.innerHTML = `
    <p>
      🟢 Champions League season is active.
    </p>

    <p>
      <strong>League-phase matches per team:</strong>
      ${matches}
    </p>

    <p>
      <strong>Knockout legs:</strong>
      ${legs}
    </p>
  `;

}


/* =========================================================
   TEAM DISPLAY
   ========================================================= */

function renderTeams() {

  const container =
    document.getElementById(
      "teamList"
    );

  if (!container) {
    return;
  }

  if (!competition.teams.length) {

    container.innerHTML = `
      <p>
        No teams available yet.
      </p>
    `;

    return;
  }

  container.innerHTML =
    competition.teams
      .map(
        (team, index) => {

          const name =
            getTeamNameFromObject(
              team,
              index
            );

          const player =
            team?.playerName ||
            "";

          return `
            <div class="team-card">

              <h3>
                ${escapeHTML(name)}
              </h3>

              ${
                player
                  ? `
                    <p>
                      ${escapeHTML(player)}
                    </p>
                  `
                  : ""
              }

            </div>
          `;

        }
      )
      .join("");

}


/* =========================================================
   TEAM NAME FROM OBJECT
   ========================================================= */

function getTeamNameFromObject(
  team,
  index = 0
) {

  if (!team) {
    return `Team ${index + 1}`;
  }

  return (
    team.name ||
    team.teamName ||
    `Team ${index + 1}`
  );

}


/* =========================================================
   LEAGUE TABLE
   ========================================================= */

function renderTable() {

  const table =
    document.getElementById(
      "leagueTable"
    );

  const info =
    document.getElementById(
      "qualificationInfo"
    );

  if (!table) {
    return;
  }

  const standings =
    buildStandings();

  const qualificationSize =
    getQualificationSize();


  /* -------------------------------------------------------
     QUALIFICATION INFORMATION
     ------------------------------------------------------- */

  if (info) {

    if (!qualificationSize) {

      info.textContent =
        "At least 9 teams are required for the Champions League knockout stage.";

    } else {

      info.textContent =
        `Top ${qualificationSize} qualify for the knockout stage.`;

    }

  }


  /* -------------------------------------------------------
     NO TEAMS
     ------------------------------------------------------- */

  if (!standings.length) {

    table.innerHTML = `
      <tr>
        <td colspan="10">
          No teams available yet.
        </td>
      </tr>
    `;

    return;
  }


  /* -------------------------------------------------------
     BUILD TABLE
     ------------------------------------------------------- */

  let html = "";

  standings.forEach(
    (team, index) => {

      const position =
        index + 1;

      const qualifies =
        qualificationSize > 0 &&
        position <= qualificationSize;


      html += `
        <tr class="
          ${
            qualifies
              ? "qualifying-team"
              : "non-qualifying-team"
          }
        ">

          <td>
            ${position}
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


      /* -----------------------------------------------------
         QUALIFICATION LINE
         ----------------------------------------------------- */

      if (
        qualificationSize > 0 &&
        position === qualificationSize
      ) {

        html += `
          <tr class="qualification-row">

            <td colspan="10">

              🏆 KNOCKOUT QUALIFICATION LINE
              — TOP ${qualificationSize} QUALIFY

            </td>

          </tr>
        `;

      }

    }
  );


  table.innerHTML = html;

}


/* =========================================================
   BUILD STANDINGS
   ========================================================= */

function buildStandings() {

  const standings =
    competition.teams.map(
      (team, index) => {

        return {

          id:
            team?.id != null
              ? String(team.id)
              : String(index),

          name:
            getTeamNameFromObject(
              team,
              index
            ),

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


  const lookup = {};

  standings.forEach(
    team => {

      lookup[
        String(team.id)
      ] = team;

    }
  );


  /* -------------------------------------------------------
     PROCESS LEAGUE RESULTS
     ------------------------------------------------------- */

  competition.fixtures.forEach(
    fixture => {

      if (!fixture) {
        return;
      }

      const home =
        lookup[
          String(fixture.homeId)
        ];

      const away =
        lookup[
          String(fixture.awayId)
        ];

      if (!home || !away) {
        return;
      }


      if (
        fixture.homeScore === undefined ||
        fixture.homeScore === null ||
        fixture.awayScore === undefined ||
        fixture.awayScore === null
      ) {
        return;
      }


      const homeScore =
        Number(fixture.homeScore);

      const awayScore =
        Number(fixture.awayScore);


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

    }
  );


  /* -------------------------------------------------------
     GOAL DIFFERENCE
     ------------------------------------------------------- */

  standings.forEach(
    team => {

      team.goalDifference =
        team.goalsFor -
        team.goalsAgainst;

    }
  );


  /* -------------------------------------------------------
     SORT
     ------------------------------------------------------- */

  standings.sort(
    (a, b) => {

      if (
        b.points !== a.points
      ) {
        return b.points - a.points;
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
   QUALIFICATION SIZE
   ========================================================= */

function getQualificationSize() {

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


/* =========================================================
   QUALIFICATION MESSAGE
   ========================================================= */

function getQualificationMessage() {

  const total =
    competition.teams.length;

  if (total < 9) {

    return (
      "At least 9 teams are required " +
      "for the Champions League format."
    );

  }

  const qualified =
    getQualificationSize();

  return (
    `Top ${qualified} teams qualify for ` +
    "the knockout stage."
  );

}


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   SAFE MESSAGE
   ========================================================= */

function showMessage(
  elementId,
  message
) {

  const element =
    document.getElementById(
      elementId
    );

  if (!element) {
    return;
  }

  element.innerHTML = `
    <p>
      ${escapeHTML(message)}
    </p>
  `;

}


/* =========================================================
   PART 1 COMPLETE
   ========================================================= */

/* =========================================================
   PART 2 — LEAGUE FIXTURES + KNOCKOUT BRACKET
   ========================================================= */


/* =========================================================
   LEAGUE FIXTURES DISPLAY
   ========================================================= */

function renderFixtures() {

  const container =
    document.getElementById(
      "fixtureList"
    );

  if (!container) {
    return;
  }

  if (!competition.fixtures.length) {

    container.innerHTML = `
      <p>
        No league-phase fixtures available.
      </p>
    `;

    return;
  }

  container.innerHTML =
    competition.fixtures
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

          const hasResult =
            fixture.homeScore !== undefined &&
            fixture.homeScore !== null &&
            fixture.awayScore !== undefined &&
            fixture.awayScore !== null;

          const result =
            hasResult
              ? `${fixture.homeScore} - ${fixture.awayScore}`
              : "vs";


          return `
            <div class="fixture-card">

              <div class="fixture-number">
                Match ${index + 1}
              </div>

              <div class="fixture-teams">

                <strong>
                  ${escapeHTML(home)}
                </strong>

                <span>
                  ${result}
                </span>

                <strong>
                  ${escapeHTML(away)}
                </strong>

              </div>

            </div>
          `;

        }
      )
      .join("");

}


/* =========================================================
   TEAM NAME BY ID
   ========================================================= */

function getTeamName(id) {

  const team =
    competition.teams.find(
      item =>
        String(item?.id) === String(id)
    );

  if (!team) {
    return "TBD";
  }

  return getTeamNameFromObject(
    team
  );

}


/* =========================================================
   KNOCKOUT DISPLAY
   ========================================================= */

function renderKnockout() {

  const container =
    document.getElementById(
      "knockoutBracket"
    );

  const label =
    document.getElementById(
      "knockoutStageLabel"
    );


  if (!container) {
    return;
  }


  /* -------------------------------------------------------
     NOT STARTED
     ------------------------------------------------------- */

  if (!competition.knockout.started) {

    if (label) {

      label.textContent =
        "Knockout stage has not started.";

    }

    container.innerHTML = `
      <div class="knockout-placeholder">

        <div class="placeholder-icon">
          🌳
        </div>

        <h3>
          Knockout bracket
        </h3>

        <p>
          The bracket will appear automatically
          when the league phase is complete.
        </p>

      </div>
    `;

    return;
  }


  /* -------------------------------------------------------
     STAGE LABEL
     ------------------------------------------------------- */

  if (label) {

    label.textContent =
      competition.knockout.stage
        ? `Current stage: ${escapeHTML(
            competition.knockout.stage
          )}`
        : "Knockout stage";

  }


  const bracket =
    Array.isArray(
      competition.knockout.bracket
    )
      ? competition.knockout.bracket
      : [];


  /* -------------------------------------------------------
     EMPTY BRACKET
     ------------------------------------------------------- */

  if (!bracket.length) {

    container.innerHTML = `
      <div class="knockout-placeholder">

        <div class="placeholder-icon">
          🌳
        </div>

        <h3>
          Knockout bracket
        </h3>

        <p>
          Knockout fixtures are being prepared.
        </p>

      </div>
    `;

    return;
  }


  renderBracket(
    container,
    bracket
  );

}


/* =========================================================
   BRACKET RENDERER
   ========================================================= */

function renderBracket(
  container,
  bracket
) {

  const rounds = [

    {
      key: "round32",
      title: "Round of 32",
      className: "r32"
    },

    {
      key: "round16",
      title: "Round of 16",
      className: "r16"
    },

    {
      key: "quarterFinal",
      title: "Quarter-finals",
      className: "qf"
    },

    {
      key: "semiFinal",
      title: "Semi-finals",
      className: "sf"
    },

    {
      key: "final",
      title: "Final",
      className: "final"
    }

  ];


  const availableRounds =
    rounds.filter(
      round =>
        bracket.some(
          tie =>
            tie?.round === round.key
        )
    );


  if (!availableRounds.length) {

    container.innerHTML = `
      <div class="knockout-placeholder">

        <h3>
          No knockout rounds available.
        </h3>

      </div>
    `;

    return;
  }


  container.innerHTML = `
    <div class="bracket-container">

      ${
        availableRounds
          .map(
            round => {

              const ties =
                bracket.filter(
                  tie =>
                    tie?.round ===
                    round.key
                );


              return `
                <div
                  class="
                    bracket-column
                    bracket-${round.className}
                  "
                >

                  <div class="bracket-title">
                    ${round.title}
                  </div>

                  <div class="bracket-ties">

                    ${
                      ties
                        .map(
                          renderTie
                        )
                        .join("")
                    }

                  </div>

                </div>
              `;

            }
          )
          .join("")
      }

    </div>
  `;

}


/* =========================================================
   KNOCKOUT TIE DISPLAY
   ========================================================= */

function renderTie(tie) {

  const home =
    tie?.homeTeam ||
    "TBD";

  const away =
    tie?.awayTeam ||
    "TBD";


  const homeScore =
    tie?.homeScore !== undefined &&
    tie?.homeScore !== null
      ? tie.homeScore
      : "";


  const awayScore =
    tie?.awayScore !== undefined &&
    tie?.awayScore !== null
      ? tie.awayScore
      : "";


  const winner =
    tie?.winner ||
    "";


  const homeWinner =
    winner &&
    String(winner) === String(home);


  const awayWinner =
    winner &&
    String(winner) === String(away);


  return `
    <div
      class="bracket-match"
      data-tie-id="${escapeHTML(
        tie?.id || ""
      )}"
    >

      <div
        class="
          bracket-team
          ${
            homeWinner
              ? "bracket-winner"
              : ""
          }
        "
      >

        <span class="bracket-team-name">
          ${escapeHTML(home)}
        </span>

        <span class="bracket-score">
          ${homeScore}
        </span>

      </div>


      <div
        class="
          bracket-team
          ${
            awayWinner
              ? "bracket-winner"
              : ""
          }
        "
      >

        <span class="bracket-team-name">
          ${escapeHTML(away)}
        </span>

        <span class="bracket-score">
          ${awayScore}
        </span>

      </div>

    </div>
  `;

}


/* =========================================================
   GET QUALIFIED TEAMS
   ========================================================= */

function getQualifiedTeams() {

  const standings =
    buildStandings();

  const qualificationSize =
    getQualificationSize();


  if (!qualificationSize) {
    return [];
  }


  return standings
    .slice(
      0,
      qualificationSize
    )
    .map(
      team => ({
        id: team.id,
        name: team.name
      })
    );

}


/* =========================================================
   BUILD FIXED KNOCKOUT BRACKET
   ========================================================= */

function buildFixedBracket() {

  const qualified =
    getQualifiedTeams();


  if (!qualified.length) {
    return [];
  }


  const size =
    qualified.length;


  const bracket = [];


  /* -------------------------------------------------------
     ROUND OF 32
     ------------------------------------------------------- */

  if (size === 32) {

    for (
      let i = 0;
      i < 32;
      i += 2
    ) {

      bracket.push(
        createTie(
          "round32",
          i / 2 + 1,
          qualified[i],
          qualified[i + 1]
        )
      );

    }

  }


  /* -------------------------------------------------------
     ROUND OF 16
     ------------------------------------------------------- */

  else if (size === 16) {

    for (
      let i = 0;
      i < 16;
      i += 2
    ) {

      bracket.push(
        createTie(
          "round16",
          i / 2 + 1,
          qualified[i],
          qualified[i + 1]
        )
      );

    }

  }


  /* -------------------------------------------------------
     QUARTER-FINALS
     ------------------------------------------------------- */

  else if (size === 8) {

    for (
      let i = 0;
      i < 8;
      i += 2
    ) {

      bracket.push(
        createTie(
          "quarterFinal",
          i / 2 + 1,
          qualified[i],
          qualified[i + 1]
        )
      );

    }

  }


  return addFutureRounds(
    bracket,
    size
  );

}


/* =========================================================
   CREATE KNOCKOUT TIE
   ========================================================= */

function createTie(
  round,
  number,
  home,
  away
) {

  return {

    id:
      `${round}-${number}`,

    round,

    number,

    homeTeam:
      home?.name || "TBD",

    awayTeam:
      away?.name || "TBD",

    homeId:
      home?.id || null,

    awayId:
      away?.id || null,

    homeScore:
      null,

    awayScore:
      null,

    winner:
      null,

    sourceHome:
      null,

    sourceAway:
      null

  };

}


/* =========================================================
   ADD FUTURE ROUNDS
   ========================================================= */

function addFutureRounds(
  bracket,
  size
) {

  let previousRound;


  if (size === 32) {

    previousRound =
      "round32";

  } else if (size === 16) {

    previousRound =
      "round16";

  } else {

    previousRound =
      "quarterFinal";

  }


  let previousCount =
    bracket.filter(
      tie =>
        tie.round ===
        previousRound
    ).length;


  let currentRound =
    getNextRound(
      previousRound
    );


  while (
    currentRound &&
    previousCount > 1
  ) {

    const currentCount =
      Math.ceil(
        previousCount / 2
      );


    for (
      let i = 0;
      i < currentCount;
      i++
    ) {

      bracket.push({

        id:
          `${currentRound}-${i + 1}`,

        round:
          currentRound,

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
      currentRound;

    previousCount =
      currentCount;

    currentRound =
      getNextRound(
        currentRound
      );

  }


  return bracket;

}


/* =========================================================
   NEXT ROUND
   ========================================================= */

function getNextRound(round) {

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
   PART 2 COMPLETE
   ========================================================= */

/* =========================================================
   PART 3 — KNOCKOUT PROGRESSION + WINNERS
   ========================================================= */


/* =========================================================
   CURRENT KNOCKOUT ROUND
   ========================================================= */

function getCurrentKnockoutRound() {

  const bracket =
    Array.isArray(
      competition.knockout?.bracket
    )
      ? competition.knockout.bracket
      : [];


  const order = [
    "round32",
    "round16",
    "quarterFinal",
    "semiFinal",
    "final"
  ];


  for (const round of order) {

    const ties =
      bracket.filter(
        tie =>
          tie?.round === round
      );


    if (!ties.length) {
      continue;
    }


    const unfinished =
      ties.some(
        tie =>
          !tie?.winner
      );


    if (unfinished) {
      return round;
    }

  }


  return bracket.length
    ? "completed"
    : null;

}


/* =========================================================
   STAGE LABEL
   ========================================================= */

function getStageLabel(round) {

  const labels = {

    round32:
      "Round of 32",

    round16:
      "Round of 16",

    quarterFinal:
      "Quarter-finals",

    semiFinal:
      "Semi-finals",

    final:
      "Final",

    completed:
      "Competition completed"

  };


  return (
    labels[round] ||
    "Knockout Stage"
  );

}


/* =========================================================
   REFRESH KNOCKOUT STAGE LABEL
   ========================================================= */

function refreshKnockoutLabel() {

  const label =
    document.getElementById(
      "knockoutStageLabel"
    );


  if (!label) {
    return;
  }


  if (!competition.knockout.started) {

    label.textContent =
      "Knockout stage has not started.";

    return;
  }


  const currentRound =
    getCurrentKnockoutRound();


  label.textContent =
    `Current stage: ${
      getStageLabel(
        currentRound
      )
    }`;

}


/* =========================================================
   FIND KNOCKOUT TIE
   ========================================================= */

function findKnockoutTie(
  round,
  number
) {

  const bracket =
    Array.isArray(
      competition.knockout?.bracket
    )
      ? competition.knockout.bracket
      : [];


  return bracket.find(
    tie =>
      tie?.round === round &&
      Number(tie?.number) ===
        Number(number)
  );

}


/* =========================================================
   GET SINGLE-LEG TIE WINNER
   ========================================================= */

function getSingleLegWinner(tie) {

  if (!tie) {
    return null;
  }


  if (tie.winner) {
    return tie.winner;
  }


  if (
    tie.homeScore === null ||
    tie.homeScore === undefined ||
    tie.awayScore === null ||
    tie.awayScore === undefined
  ) {

    return null;

  }


  const homeScore =
    Number(tie.homeScore);

  const awayScore =
    Number(tie.awayScore);


  if (
    !Number.isFinite(homeScore) ||
    !Number.isFinite(awayScore)
  ) {

    return null;

  }


  if (homeScore > awayScore) {
    return tie.homeTeam;
  }


  if (awayScore > homeScore) {
    return tie.awayTeam;
  }


  return null;

}


/* =========================================================
   GET TIE WINNER
   SUPPORTS 1 OR 2 LEGS
   ========================================================= */

function getTieWinner(tie) {

  if (!tie) {
    return null;
  }


  if (tie.winner) {
    return tie.winner;
  }


  /*
   * Two-leg ties may contain:
   *
   * leg1HomeScore
   * leg1AwayScore
   * leg2HomeScore
   * leg2AwayScore
   *
   * If those values exist, use aggregate.
   */

  const hasLeg1 =
    tie.leg1HomeScore !== undefined &&
    tie.leg1HomeScore !== null &&
    tie.leg1AwayScore !== undefined &&
    tie.leg1AwayScore !== null;


  const hasLeg2 =
    tie.leg2HomeScore !== undefined &&
    tie.leg2HomeScore !== null &&
    tie.leg2AwayScore !== undefined &&
    tie.leg2AwayScore !== null;


  if (hasLeg1 && hasLeg2) {

    const leg1Home =
      Number(tie.leg1HomeScore);

    const leg1Away =
      Number(tie.leg1AwayScore);

    const leg2Home =
      Number(tie.leg2HomeScore);

    const leg2Away =
      Number(tie.leg2AwayScore);


    if (
      !Number.isFinite(leg1Home) ||
      !Number.isFinite(leg1Away) ||
      !Number.isFinite(leg2Home) ||
      !Number.isFinite(leg2Away)
    ) {

      return null;

    }


    const homeAggregate =
      leg1Home + leg2Away;

    const awayAggregate =
      leg1Away + leg2Home;


    if (
      homeAggregate >
      awayAggregate
    ) {

      return tie.homeTeam;

    }


    if (
      awayAggregate >
      homeAggregate
    ) {

      return tie.awayTeam;

    }


    /*
     * Aggregate draw.
     *
     * No automatic away-goals rule.
     * Admin must resolve the tie.
     */

    return null;

  }


  return getSingleLegWinner(
    tie
  );

}


/* =========================================================
   ADVANCE WINNER
   ========================================================= */

function advanceWinner(
  completedTie
) {

  if (!completedTie) {
    return;
  }


  const winner =
    getTieWinner(
      completedTie
    );


  if (!winner) {
    return;
  }


  const nextRound =
    getNextRound(
      completedTie.round
    );


  if (!nextRound) {
    return;
  }


  const nextNumber =
    Math.ceil(
      Number(
        completedTie.number
      ) / 2
    );


  const nextTie =
    findKnockoutTie(
      nextRound,
      nextNumber
    );


  if (!nextTie) {
    return;
  }


  const goesHome =
    Number(
      completedTie.number
    ) % 2 === 1;


  if (goesHome) {

    nextTie.homeTeam =
      winner;

  } else {

    nextTie.awayTeam =
      winner;

  }

}


/* =========================================================
   UPDATE BRACKET PROGRESSION
   ========================================================= */

function updateBracketProgression() {

  const bracket =
    Array.isArray(
      competition.knockout?.bracket
    )
      ? competition.knockout.bracket
      : [];


  const order = [
    "round32",
    "round16",
    "quarterFinal",
    "semiFinal",
    "final"
  ];


  order.forEach(
    round => {

      const ties =
        bracket.filter(
          tie =>
            tie?.round === round
        );


      ties.forEach(
        tie => {

          const winner =
            getTieWinner(tie);


          if (!winner) {
            return;
          }


          const nextRound =
            getNextRound(
              round
            );


          if (!nextRound) {
            return;
          }


          const nextNumber =
            Math.ceil(
              Number(tie.number) / 2
            );


          const nextTie =
            findKnockoutTie(
              nextRound,
              nextNumber
            );


          if (!nextTie) {
            return;
          }


          if (
            Number(tie.number) % 2 === 1
          ) {

            nextTie.homeTeam =
              winner;

          } else {

            nextTie.awayTeam =
              winner;

          }

        }
      );

    }
  );

}


/* =========================================================
   GET CHAMPION
   ========================================================= */

function getChampion() {

  const finalTie =
    findKnockoutTie(
      "final",
      1
    );


  if (!finalTie) {
    return null;
  }


  return getTieWinner(
    finalTie
  );

}


/* =========================================================
   WINNERS DISPLAY
   ========================================================= */

function renderWinners() {

  const container =
    document.getElementById(
      "winnerDisplay"
    );


  if (!container) {
    return;
  }


  const standings =
    buildStandings();


  if (!standings.length) {

    container.innerHTML = `
      <p>
        Season results will appear here.
      </p>
    `;

    return;
  }


  const topThree =
    standings.slice(
      0,
      3
    );


  let html = "";


  topThree.forEach(
    (team, index) => {

      const classes = [
        "winner-first",
        "winner-second",
        "winner-third"
      ];


      html += `
        <div
          class="
            winner-card
            ${classes[index]}
          "
        >

          ${index + 1}.
          ${escapeHTML(team.name)}

        </div>
      `;

    }
  );


  const champion =
    getChampion();


  if (champion) {

    html += `
      <div class="champion-card">

        🏆 Champions League Champion:
        <strong>
          ${escapeHTML(champion)}
        </strong>

      </div>
    `;

  }


  if (
    getCurrentKnockoutRound() ===
    "completed"
  ) {

    html = `
      <p class="season-complete-message">
        🎉🏆 Champions League season complete! 🏆🎉
      </p>
      ${html}
    `;

    container.classList.add(
      "season-complete"
    );

  } else {

    container.classList.remove(
      "season-complete"
    );

  }


  container.innerHTML =
    html;

}


/* =========================================================
   BRACKET STATUS
   ========================================================= */

function getBracketStatus() {

  const bracket =
    Array.isArray(
      competition.knockout?.bracket
    )
      ? competition.knockout.bracket
      : [];


  if (!bracket.length) {

    return {

      total: 0,

      completed: 0,

      remaining: 0

    };

  }


  const completed =
    bracket.filter(
      tie =>
        Boolean(
          tie?.winner
        )
    ).length;


  return {

    total:
      bracket.length,

    completed,

    remaining:
      bracket.length -
      completed

  };

}


/* =========================================================
   TEST HELPERS
   ========================================================= */

window.championsTest = {

  getStandings:
    () => buildStandings(),

  getQualifiedTeams:
    () => getQualifiedTeams(),

  getQualificationSize:
    () => getQualificationSize(),

  buildFixedBracket:
    () => buildFixedBracket(),

  getBracketStatus:
    () => getBracketStatus(),

  getCurrentRound:
    () => getCurrentKnockoutRound(),

  getChampion:
    () => getChampion(),

  refresh:
    () => refreshAllDisplays()

};


/* =========================================================
   PART 3 COMPLETE
   ========================================================= */

// =========================================================
// CHAMPIONS TEST — PART 4
// FINAL PUBLIC DISPLAY HELPERS
// =========================================================

/*
  This is the final part of the public Champions League
  test script.

  Part 1 already handles page initialization.
  Therefore, we do NOT add another DOMContentLoaded listener
  here. This prevents duplicate loading and rendering.
*/

// ---------------------------------------------------------
// FINAL DISPLAY REFRESH
// ---------------------------------------------------------

async function finalizeChampionsDisplay() {

  try {

    if (!competition) {
      competition = createEmptyCompetition();
    }

    updateBracketProgression();

    refreshAllDisplays();

  } catch (error) {

    console.error(
      "Champions display refresh error:",
      error
    );

  }

}


// ---------------------------------------------------------
// PUBLIC TEST ACCESS
// ---------------------------------------------------------

window.championsTest = {

  refresh: finalizeChampionsDisplay,

  getCompetition: function () {
    return competition;
  },

  getStandings: function () {
    return buildStandings();
  },

  getQualifiedTeams: function () {
    return getQualifiedTeams();
  },

  getChampion: function () {
    return getChampion();
  },

  getCurrentRound: function () {
    return getCurrentKnockoutRound();
  }

};


// =========================================================
// END OF CHAMPIONS.JS
// =========================================================