/* =========================================================
   DLS COMPETITION
   CHAMPIONS LEAGUE TEST SYSTEM
   champions.js
   PART 1 — FIREBASE + DATA + BASIC DISPLAY
   ========================================================= */

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const TEST_DOCUMENT = "championsTest/main";

const MAX_LEAGUE_MATCHES = 8;


/* =========================================================
   GLOBAL DATA
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
   START
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  if (!window.firebaseReady) {
    showMessage(
      "seasonDetails",
      "Firebase is not ready yet."
    );

    return;
  }

  db = window.db;

  await loadCompetition();

  renderSeason();

  renderTeams();

  renderTable();

  renderFixtures();

  renderKnockout();

  renderWinners();

});


/* =========================================================
   LOAD TEST COMPETITION
   ========================================================= */

async function loadCompetition() {

  try {

    const reference = doc(
      db,
      "championsTest",
      "main"
    );

    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) {

      showMessage(
        "seasonDetails",
        "Champions League test season has not been created yet."
      );

      return;
    }

    const data = snapshot.data();

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

        format:
          data.season?.format || "champions",

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
          Array.isArray(data.knockout?.bracket)
            ? data.knockout.bracket
            : []
      }
    };

  } catch (error) {

    console.error(
      "Champions League load error:",
      error
    );

    showMessage(
      "seasonDetails",
      "Unable to load the Champions League test data."
    );

  }

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
    Math.min(
      MAX_LEAGUE_MATCHES,
      Math.max(
        1,
        competition.season.leagueMatchesPerTeam
      )
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
      .map((team, index) => {

        const name =
          team.name ||
          team.teamName ||
          `Team ${index + 1}`;

        const player =
          team.playerName ||
          "";

        return `
          <div class="team-card">

            <h3>
              ${escapeHTML(name)}
            </h3>

            ${
              player
                ? `<p>${escapeHTML(player)}</p>`
                : ""
            }

          </div>
        `;

      })
      .join("");

}


/* =========================================================
   EMPTY TABLE DISPLAY
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

  if (info) {

    info.textContent =
      getQualificationMessage();

  }

  if (!competition.teams.length) {

    table.innerHTML = `
      <tr>
        <td colspan="10">
          No league results yet.
        </td>
      </tr>
    `;

    return;
  }

  const standings =
    buildStandings();

  table.innerHTML =
    standings
      .map((team, index) => {

        return `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${escapeHTML(team.name)}
            </td>

            <td>${team.played}</td>

            <td>${team.wins}</td>

            <td>${team.draws}</td>

            <td>${team.losses}</td>

            <td>${team.goalsFor}</td>

            <td>${team.goalsAgainst}</td>

            <td>${team.goalDifference}</td>

            <td>${team.points}</td>

          </tr>
        `;

      })
      .join("");

}


/* =========================================================
   STANDINGS
   ========================================================= */

function buildStandings() {

  const standings =
    competition.teams.map((team, index) => ({

      id:
        team.id ||
        String(index),

      name:
        team.name ||
        team.teamName ||
        `Team ${index + 1}`,

      played: 0,

      wins: 0,

      draws: 0,

      losses: 0,

      goalsFor: 0,

      goalsAgainst: 0,

      goalDifference: 0,

      points: 0

    }));

  const lookup = {};

  standings.forEach(team => {

    lookup[team.id] = team;

  });

  competition.fixtures.forEach(fixture => {

    const home =
      lookup[fixture.homeId];

    const away =
      lookup[fixture.awayId];

    if (!home || !away) {
      return;
    }

    if (
      fixture.homeScore === undefined ||
      fixture.awayScore === undefined ||
      fixture.homeScore === null ||
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

  });

  standings.forEach(team => {

    team.goalDifference =
      team.goalsFor -
      team.goalsAgainst;

  });

  standings.sort((a, b) => {

    if (b.points !== a.points) {
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

    return b.goalsFor - a.goalsFor;

  });

  return standings;

}


/* =========================================================
   QUALIFICATION RULE
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
    `${qualified} teams qualify for the ` +
    "knockout stage after the league phase."
  );

}


/* =========================================================
   FIXTURES
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
      .map((fixture, index) => {

        const home =
          getTeamName(fixture.homeId);

        const away =
          getTeamName(fixture.awayId);

        const result =
          fixture.homeScore !== undefined &&
          fixture.awayScore !== undefined
            ? `${fixture.homeScore} - ${fixture.awayScore}`
            : "vs";

        return `
          <div class="fixture-card">

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

      })
      .join("");

}


/* =========================================================
   TEAM HELPERS
   ========================================================= */

function getTeamName(id) {

  const team =
    competition.teams.find(
      item =>
        String(item.id) === String(id)
    );

  return (
    team?.name ||
    team?.teamName ||
    "TBD"
  );

}


/* =========================================================
   BASIC HTML SAFETY
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

  if (element) {
    element.innerHTML =
      `<p>${escapeHTML(message)}</p>`;
  }

}

/* =========================================================
   PART 2 — KNOCKOUT QUALIFICATION + FIXED BRACKET
   ========================================================= */


/* =========================================================
   KNOCKOUT DISPLAY
   ========================================================= */

function renderKnockout() {

  const container =
    document.getElementById("knockoutBracket");

  const label =
    document.getElementById("knockoutStageLabel");

  if (!container) {
    return;
  }

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

  if (label) {
    label.textContent =
      competition.knockout.stage
        ? `Current stage: ${competition.knockout.stage}`
        : "Knockout stage";
  }

  const bracket =
    competition.knockout.bracket || [];

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

  renderBracket(container, bracket);

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
      title: "Round of 32"
    },
    {
      key: "round16",
      title: "Round of 16"
    },
    {
      key: "quarterFinal",
      title: "Quarter-finals"
    },
    {
      key: "semiFinal",
      title: "Semi-finals"
    },
    {
      key: "final",
      title: "Final"
    }
  ];

  const availableRounds =
    rounds.filter(round =>
      bracket.some(
        tie => tie.round === round.key
      )
    );

  container.innerHTML = `
    <div class="bracket-container">

      ${availableRounds.map(round => {

        const ties =
          bracket.filter(
            tie => tie.round === round.key
          );

        return `
          <div
            class="bracket-column bracket-${round.key === "quarterFinal"
              ? "qf"
              : round.key === "semiFinal"
                ? "sf"
                : round.key === "final"
                  ? "final"
                  : round.key === "round16"
                    ? "r16"
                    : "r32"}"
          >

            <div class="bracket-title">
              ${round.title}
            </div>

            ${ties.map(renderTie).join("")}

          </div>
        `;

      }).join("")}

    </div>
  `;

}


/* =========================================================
   TIE DISPLAY
   ========================================================= */

function renderTie(tie) {

  const home =
    tie.homeTeam ||
    "TBD";

  const away =
    tie.awayTeam ||
    "TBD";

  const homeScore =
    tie.homeScore !== undefined &&
    tie.homeScore !== null
      ? tie.homeScore
      : "";

  const awayScore =
    tie.awayScore !== undefined &&
    tie.awayScore !== null
      ? tie.awayScore
      : "";

  const winner =
    tie.winner || "";

  return `
    <div class="bracket-match">

      <div class="
        bracket-team
        ${winner === home
          ? "bracket-winner"
          : ""}
      ">

        <span class="bracket-team-name">
          ${escapeHTML(home)}
        </span>

        <span class="bracket-score">
          ${homeScore}
        </span>

      </div>

      <div class="
        bracket-team
        ${winner === away
          ? "bracket-winner"
          : ""}
      ">

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
   BUILD QUALIFIED TEAMS
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
    .slice(0, qualificationSize)
    .map(team => ({
      id: team.id,
      name: team.name
    }));

}


/* =========================================================
   FIXED KNOCKOUT BRACKET
   ========================================================= */

function buildFixedBracket() {

  const qualified =
    getQualifiedTeams();

  if (!qualified.length) {
    return [];
  }

  const bracket = [];

  const size =
    qualified.length;

  if (size === 32) {

    for (let i = 0; i < 32; i += 2) {

      bracket.push(
        createTie(
          "round32",
          i / 2 + 1,
          qualified[i],
          qualified[i + 1]
        )
      );

    }

  } else if (size === 16) {

    for (let i = 0; i < 16; i += 2) {

      bracket.push(
        createTie(
          "round16",
          i / 2 + 1,
          qualified[i],
          qualified[i + 1]
        )
      );

    }

  } else if (size === 8) {

    for (let i = 0; i < 8; i += 2) {

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
   CREATE TIE
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
      null

  };

}


/* =========================================================
   ADD FIXED FUTURE ROUNDS
   ========================================================= */

function addFutureRounds(
  bracket,
  size
) {

  let previousRound;

  if (size === 32) {
    previousRound = "round32";
  } else if (size === 16) {
    previousRound = "round16";
  } else {
    previousRound = "quarterFinal";
  }

  let previousCount =
    bracket.filter(
      tie => tie.round === previousRound
    ).length;

  let currentRound =
    getNextRound(previousRound);

  while (
    currentRound &&
    previousCount > 1
  ) {

    const currentCount =
      Math.ceil(previousCount / 2);

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
      getNextRound(currentRound);

  }

  return bracket;

}


/* =========================================================
   ROUND ORDER
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
   SEASON WINNERS
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
    standings.slice(0, 3);

  container.innerHTML =
    topThree.map(
      (team, index) => {

        const classes = [
          "winner-first",
          "winner-second",
          "winner-third"
        ];

        return `
          <div class="
            winner-card
            ${classes[index]}
          ">

            ${index + 1}.
            ${escapeHTML(team.name)}

          </div>
        `;

      }
    ).join("");

}

/* =========================================================
   PART 3 — QUALIFICATION LINE + KNOCKOUT PROGRESS
   ========================================================= */


/* =========================================================
   ENHANCE LEAGUE TABLE
   ========================================================= */

function renderTable() {

  const table =
    document.getElementById("leagueTable");

  const info =
    document.getElementById("qualificationInfo");

  if (!table) {
    return;
  }

  const standings =
    buildStandings();

  const qualificationSize =
    getQualificationSize();

  if (info) {

    if (!qualificationSize) {

      info.textContent =
        "At least 9 teams are required for the Champions League knockout stage.";

    } else {

      info.textContent =
        `Top ${qualificationSize} qualify for the knockout stage.`;

    }

  }

  if (!standings.length) {

    table.innerHTML = `
      <tr>
        <td colspan="10">
          No league results yet.
        </td>
      </tr>
    `;

    return;
  }

  let html = "";

  standings.forEach((team, index) => {

    const position =
      index + 1;

    const qualifies =
      qualificationSize > 0 &&
      position <= qualificationSize;

    html += `
      <tr class="
        ${qualifies
          ? "qualifying-team"
          : "non-qualifying-team"}
      ">

        <td>
          ${position}
        </td>

        <td>
          ${escapeHTML(team.name)}
        </td>

        <td>${team.played}</td>
        <td>${team.wins}</td>
        <td>${team.draws}</td>
        <td>${team.losses}</td>
        <td>${team.goalsFor}</td>
        <td>${team.goalsAgainst}</td>
        <td>${team.goalDifference}</td>
        <td>${team.points}</td>

      </tr>
    `;

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

  });

  table.innerHTML = html;

}


/* =========================================================
   KNOCKOUT COMPLETION CHECK
   ========================================================= */

function isLeaguePhaseComplete() {

  if (
    competition.teams.length < 9
  ) {
    return false;
  }

  const matchesPerTeam =
    Math.min(
      MAX_LEAGUE_MATCHES,
      Math.max(
        1,
        Number(
          competition.season.leagueMatchesPerTeam
        ) || 1
      )
    );

  const standings =
    buildStandings();

  if (!standings.length) {
    return false;
  }

  return standings.every(
    team =>
      team.played >= matchesPerTeam
  );

}


/* =========================================================
   CURRENT KNOCKOUT ROUND
   ========================================================= */

function getCurrentKnockoutRound() {

  const bracket =
    competition.knockout.bracket || [];

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
        tie => tie.round === round
      );

    if (!ties.length) {
      continue;
    }

    const unfinished =
      ties.some(
        tie => !tie.winner
      );

    if (unfinished) {
      return round;
    }

  }

  return "completed";

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

  return labels[round] || "Knockout Stage";

}


/* =========================================================
   REFRESH KNOCKOUT LABEL
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

  label.textContent =
    `Current stage: ${
      getStageLabel(
        getCurrentKnockoutRound()
      )
    }`;

}


/* =========================================================
   END-OF-SEASON CELEBRATION
   ========================================================= */

function showCelebration() {

  const container =
    document.getElementById(
      "winnerDisplay"
    );

  if (!container) {
    return;
  }

  if (
    getCurrentKnockoutRound() !==
    "completed"
  ) {
    return;
  }

  container.classList.add(
    "season-complete"
  );

  const message =
    document.createElement("p");

  message.textContent =
    "🎉🏆 Champions League season complete! 🏆🎉";

  message.style.fontWeight = "800";

  container.prepend(message);

}


/* =========================================================
   INITIAL DISPLAY REFRESH
   ========================================================= */

function refreshAllDisplays() {

  renderSeason();

  renderTeams();

  renderTable();

  renderFixtures();

  renderKnockout();

  renderWinners();

  refreshKnockoutLabel();

  showCelebration();

}

/* =========================================================
   PART 4 — FIXED BRACKET ADVANCEMENT ENGINE
   ========================================================= */


/* =========================================================
   FIND TIE
   ========================================================= */

function findKnockoutTie(
  round,
  number
) {

  return (
    competition.knockout.bracket || []
  ).find(
    tie =>
      tie.round === round &&
      Number(tie.number) === Number(number)
  );

}


/* =========================================================
   GET TIE WINNER
   ========================================================= */

function getTieWinner(tie) {

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
   ADVANCE WINNER INTO NEXT SLOT
   ========================================================= */

function advanceWinner(
  completedTie
) {

  if (!completedTie) {
    return;
  }

  const winner =
    getTieWinner(completedTie);

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
      Number(completedTie.number) / 2
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
    Number(completedTie.number) % 2 === 1;

  if (goesHome) {

    nextTie.homeTeam =
      winner;

  } else {

    nextTie.awayTeam =
      winner;

  }

}


/* =========================================================
   UPDATE ALL BRACKET SLOTS
   ========================================================= */

function updateBracketProgression() {

  const bracket =
    competition.knockout.bracket || [];

  const order = [
    "round32",
    "round16",
    "quarterFinal",
    "semiFinal",
    "final"
  ];

  order.forEach(round => {

    const ties =
      bracket.filter(
        tie => tie.round === round
      );

    ties.forEach(tie => {

      const winner =
        getTieWinner(tie);

      if (!winner) {
        return;
      }

      const nextRound =
        getNextRound(round);

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

    });

  });

}


/* =========================================================
   FINAL WINNER
   ========================================================= */

function getChampion() {

  const final =
    findKnockoutTie(
      "final",
      1
    );

  if (!final) {
    return null;
  }

  return getTieWinner(final);

}


/* =========================================================
   CHAMPION DISPLAY
   ========================================================= */

function renderChampion() {

  const container =
    document.getElementById(
      "winnerDisplay"
    );

  if (!container) {
    return;
  }

  const champion =
    getChampion();

  if (!champion) {
    return;
  }

  const heading =
    document.createElement("h3");

  heading.textContent =
    `🏆 Champions League Champion: ${champion}`;

  heading.style.fontSize =
    "22px";

  heading.style.marginBottom =
    "10px";

  container.prepend(heading);

}


/* =========================================================
   BRACKET STATUS
   ========================================================= */

function getBracketStatus() {

  const bracket =
    competition.knockout.bracket || [];

  if (!bracket.length) {

    return {
      total: 0,
      completed: 0,
      remaining: 0
    };

  }

  const completed =
    bracket.filter(
      tie => Boolean(tie.winner)
    ).length;

  return {

    total:
      bracket.length,

    completed,

    remaining:
      bracket.length - completed

  };

}


/* =========================================================
   PUBLIC TEST HELPERS
   ========================================================= */

window.championsTest = {

  getStandings:
    buildStandings,

  getQualifiedTeams:
    getQualifiedTeams,

  getQualificationSize:
    getQualificationSize,

  buildFixedBracket:
    buildFixedBracket,

  getBracketStatus:
    getBracketStatus,

  getCurrentRound:
    getCurrentKnockoutRound,

  getChampion:
    getChampion

};

/* =========================================================
   PART 5 — FINAL INITIALIZATION
   ========================================================= */


/* =========================================================
   FINAL REFRESH
   ========================================================= */

function finalizeChampionsDisplay() {

  updateBracketProgression();

  refreshAllDisplays();

  renderChampion();

}


/* =========================================================
   RUN AFTER INITIAL LOAD
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setTimeout(
      finalizeChampionsDisplay,
      100
    );

  }
);