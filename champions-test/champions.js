/* =========================================================
   DLS CHAMPIONS LEAGUE
   PUBLIC PAGE
   ========================================================= */

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const competitionStatus =
  document.getElementById("competitionStatus");

const qualificationInfo =
  document.getElementById("qualificationInfo");

const teamList =
  document.getElementById("teamList");

const leagueTableBody =
  document.getElementById("leagueTableBody");

const fixtureList =
  document.getElementById("fixtureList");

const knockoutContainer =
  document.getElementById("knockoutContainer");

const finalContainer =
  document.getElementById("finalContainer");

const winnerContainer =
  document.getElementById("winnerContainer");


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function empty(element, message) {

  if (!element) return;

  element.innerHTML = `
    <div class="empty-message">
      ${escapeHtml(message)}
    </div>
  `;
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


function getQualifiedCount(teamCount) {

  if (teamCount >= 9 && teamCount <= 16) {
    return 8;
  }

  if (teamCount >= 17 && teamCount <= 32) {
    return 16;
  }

  if (teamCount >= 33 && teamCount <= 128) {
    return 32;
  }

  return 0;
}


function calculateTable(teams, fixtures) {

  const table = {};

  teams.forEach(team => {

    const name = getTeamName(team);

    table[name] = {
      team: name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0
    };

  });


  fixtures
    .filter(match =>
      match.phase === "league" &&
      match.status === "completed" &&
      match.homeScore !== null &&
      match.awayScore !== null
    )
    .forEach(match => {

      const home = match.home;
      const away = match.away;

      if (!table[home] || !table[away]) {
        return;
      }

      const hs = Number(match.homeScore);
      const as = Number(match.awayScore);

      table[home].played++;
      table[away].played++;

      table[home].gf += hs;
      table[home].ga += as;

      table[away].gf += as;
      table[away].ga += hs;

      if (hs > as) {

        table[home].wins++;
        table[home].points += 3;
        table[away].losses++;

      } else if (hs < as) {

        table[away].wins++;
        table[away].points += 3;
        table[home].losses++;

      } else {

        table[home].draws++;
        table[away].draws++;

        table[home].points++;
        table[away].points++;
      }

    });


  Object.values(table).forEach(row => {
    row.gd = row.gf - row.ga;
  });


  return Object.values(table).sort((a, b) => {

    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.gd !== a.gd) {
      return b.gd - a.gd;
    }

    if (b.gf !== a.gf) {
      return b.gf - a.gf;
    }

    return a.team.localeCompare(b.team);

  });
}


function renderTeams(teams) {

  if (!teams.length) {
    empty(teamList, "No Champions League teams.");
    return;
  }

  teamList.innerHTML = teams.map((team, index) => {

    const name = getTeamName(team);

    return `
      <div class="team-card">
        <h3>${index + 1}. ${escapeHtml(name)}</h3>
        <p>Champions League participant</p>
      </div>
    `;

  }).join("");
}


function renderTable(table, qualifiedCount) {

  if (!table.length) {
    leagueTableBody.innerHTML = `
      <tr>
        <td colspan="10">No table data available.</td>
      </tr>
    `;
    return;
  }


  leagueTableBody.innerHTML = table.map((row, index) => {

    const qualified =
      qualifiedCount > 0 &&
      index < qualifiedCount;

    return `
      <tr class="${qualified ? "qualified-row" : ""}">
        <td>${index + 1}</td>
        <td class="team-name">
          ${escapeHtml(row.team)}
        </td>
        <td>${row.played}</td>
        <td>${row.wins}</td>
        <td>${row.draws}</td>
        <td>${row.losses}</td>
        <td>${row.gf}</td>
        <td>${row.ga}</td>
        <td>${row.gd}</td>
        <td><strong>${row.points}</strong></td>
      </tr>
    `;

  }).join("");
}


function renderLeagueFixtures(fixtures) {

  const matches =
    fixtures.filter(match => match.phase === "league");

  if (!matches.length) {
    empty(fixtureList, "League Phase fixtures have not been generated.");
    return;
  }


  fixtureList.innerHTML = matches.map((match, index) => {

    let result = "Not played";

    if (
      match.status === "completed" &&
      match.homeScore !== null &&
      match.awayScore !== null
    ) {
      result =
        `${match.homeScore} - ${match.awayScore}`;
    }


    return `
      <div class="fixture-card">
        <h3>Match ${index + 1}</h3>

        <p>
          <strong>${escapeHtml(match.home)}</strong>
          vs
          <strong>${escapeHtml(match.away)}</strong>
        </p>

        <p class="result">${escapeHtml(result)}</p>

        <p>Status: ${escapeHtml(match.status || "scheduled")}</p>
      </div>
    `;

  }).join("");
}


function renderKnockout(fixtures) {

  const knockout =
    fixtures.filter(match => match.phase === "knockout");

  if (!knockout.length) {
    empty(
      knockoutContainer,
      "Knockout Phase has not started."
    );

    return;
  }


  const rounds = {};

  knockout.forEach(match => {

    const round =
      match.round || "Knockout";

    if (!rounds[round]) {
      rounds[round] = [];
    }

    rounds[round].push(match);
  });


  knockoutContainer.innerHTML =
    Object.entries(rounds).map(([round, matches]) => {

      return `
        <div class="knockout-round">

          <h3>${escapeHtml(round)}</h3>

          ${matches.map(match => {

            let result = "Not played";

            if (
              match.status === "completed" &&
              match.homeScore !== null &&
              match.awayScore !== null
            ) {
              result =
                `${match.homeScore} - ${match.awayScore}`;
            }

            return `
              <div class="knockout-match">

                <h3>
                  ${escapeHtml(match.home)}
                  vs
                  ${escapeHtml(match.away)}
                </h3>

                <p class="result">
                  ${escapeHtml(result)}
                </p>

                <p>
                  Status:
                  ${escapeHtml(match.status || "scheduled")}
                </p>

              </div>
            `;

          }).join("")}

        </div>
      `;

    }).join("");
}


function renderFinal(fixtures) {

  const final =
    fixtures.find(match =>
      match.phase === "knockout" &&
      match.round === "Final"
    );

  if (!final) {

    empty(
      finalContainer,
      "Final has not been generated."
    );

    return;
  }


  let result = "Not played";

  if (
    final.status === "completed" &&
    final.homeScore !== null &&
    final.awayScore !== null
  ) {
    result =
      `${final.homeScore} - ${final.awayScore}`;
  }


  finalContainer.innerHTML = `
    <div class="final-match">

      <h3>🏆 Champions League Final</h3>

      <p>
        <strong>${escapeHtml(final.home)}</strong>
        vs
        <strong>${escapeHtml(final.away)}</strong>
      </p>

      <p class="result">
        ${escapeHtml(result)}
      </p>

    </div>
  `;
}


function renderWinner(data) {

  if (!data.winner) {

    empty(
      winnerContainer,
      "Winner will appear here after the final."
    );

    return;
  }


  winnerContainer.innerHTML = `
    <div class="winner-card">

      <div class="trophy">🏆</div>

      <h3>
        ${escapeHtml(data.winner)}
      </h3>

      <p>
        DLS Champions League Winner
      </p>

    </div>
  `;
}


async function loadChampions() {

  try {

    if (!window.championsDb) {
      throw new Error("Firebase is not ready.");
    }


    const ref =
      doc(
        window.championsDb,
        "championsLeague",
        "main"
      );


    const snapshot =
      await getDoc(ref);


    if (!snapshot.exists()) {

      competitionStatus.textContent =
        "Champions League has not been configured yet.";

      qualificationInfo.textContent =
        "Waiting for the administrator.";

      empty(teamList, "No teams available.");
      empty(fixtureList, "No fixtures available.");
      empty(knockoutContainer, "Knockout has not started.");
      empty(finalContainer, "Final has not been generated.");
      empty(winnerContainer, "No winner yet.");

      return;
    }


    const data = snapshot.data();


    const teams =
      Array.isArray(data.teams)
        ? data.teams
        : [];


    const fixtures =
      Array.isArray(data.fixtures)
        ? data.fixtures
        : [];


    const table =
      calculateTable(teams, fixtures);


    const qualifiedCount =
      getQualifiedCount(teams.length);


    if (data.started) {

      competitionStatus.textContent =
        `Champions League is live with ${teams.length} teams.`;

    } else {

      competitionStatus.textContent =
        `Champions League is not started. ${teams.length} teams registered.`;
    }


    if (qualifiedCount) {

      qualificationInfo.textContent =
        `Top ${qualifiedCount} teams qualify for the Knockout Phase.`;

    } else {

      qualificationInfo.textContent =
        "Champions League requires between 9 and 128 teams.";
    }


    renderTeams(teams);

    renderTable(table, qualifiedCount);

    renderLeagueFixtures(fixtures);

    renderKnockout(fixtures);

    renderFinal(fixtures);

    renderWinner(data);

  } catch (error) {

    console.error(error);

    competitionStatus.textContent =
      "Unable to load Champions League.";

    qualificationInfo.textContent =
      error.message;

  }
}


loadChampions();