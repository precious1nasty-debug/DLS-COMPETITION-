/* =========================================================
   DLS CHAMPIONS LEAGUE
   champions.js
   PART 5 — FIREBASE + PUBLIC DATA LOADING
   ========================================================= */

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================
   FIREBASE CHECK
========================= */

if (!window.championsFirebaseReady) {

  throw new Error(
    "Champions League Firebase has not finished loading."
  );

}


const db = window.championsDb;


/* =========================
   PAGE ELEMENTS
========================= */

const competitionStatus =
  document.getElementById("competitionStatus");

const teamList =
  document.getElementById("teamList");

const groupsContainer =
  document.getElementById("groupsContainer");

const fixtureList =
  document.getElementById("fixtureList");

const tablesContainer =
  document.getElementById("tablesContainer");

const knockoutContainer =
  document.getElementById("knockoutContainer");

const finalContainer =
  document.getElementById("finalContainer");


/* =========================
   EMPTY STATE
========================= */

function showEmptyState(element, message) {

  if (!element) {
    return;
  }

  element.innerHTML = `
    <p class="empty-message">
      ${message}
    </p>
  `;
}


/* =========================
   LOAD CHAMPIONS DATA
========================= */

async function loadChampionsLeague() {

  try {

    competitionStatus.textContent =
      "Loading Champions League...";


    /*
      IMPORTANT:

      Champions League uses its own Firestore
      document.

      Existing league data remains in:

      competition/main

      Champions League data uses:

      championsLeague/main
    */

    const competitionRef =
      doc(
        db,
        "championsLeague",
        "main"
      );


    const competitionSnapshot =
      await getDoc(competitionRef);


    /* =========================
       NO CHAMPIONS DATA YET
    ========================= */

    if (!competitionSnapshot.exists()) {

      competitionStatus.textContent =
        "Champions League has not been configured yet.";

      showEmptyState(
        teamList,
        "No participating teams yet."
      );

      showEmptyState(
        groupsContainer,
        "Groups have not been created yet."
      );

      showEmptyState(
        fixtureList,
        "Fixtures have not been created yet."
      );

      showEmptyState(
        tablesContainer,
        "Tables are not available yet."
      );

      showEmptyState(
        knockoutContainer,
        "The knockout stage has not started yet."
      );

      showEmptyState(
        finalContainer,
        "The final has not been created yet."
      );

      return;
    }


    /* =========================
       DATA FOUND
    ========================= */

    const data =
      competitionSnapshot.data();


    competitionStatus.textContent =
      data.status ||
      "Champions League configured.";


    renderTeams(
      data.teams || []
    );


    renderGroups(
      data.groups || []
    );


    renderFixtures(
      data.fixtures || []
    );


    renderTables(
      data.tables || []
    );


    renderKnockout(
      data.knockout || null
    );


    renderFinal(
      data.final || null,
      data.champion || null
    );


  } catch (error) {

    console.error(
      "Champions League loading error:",
      error
    );


    competitionStatus.textContent =
      "Unable to load Champions League data.";


    showError(
      teamList
    );

    showError(
      groupsContainer
    );

    showError(
      fixtureList
    );

    showError(
      tablesContainer
    );

    showError(
      knockoutContainer
    );

    showError(
      finalContainer
    );

  }

}


/* =========================
   ERROR DISPLAY
========================= */

function showError(element) {

  if (!element) {
    return;
  }

  element.innerHTML = `
    <p class="error-message">
      There was a problem loading this section.
    </p>
  `;
}


/* =========================
   TEAMS
========================= */

function renderTeams(teams) {

  if (!teams.length) {

    showEmptyState(
      teamList,
      "No participating teams yet."
    );

    return;
  }


  teamList.innerHTML = "";


  teams.forEach(team => {

    const card =
      document.createElement("div");

    card.className =
      "team-card";


    const teamName =
      team.name || "Unnamed Team";

    const playerName =
      team.player || "";


    card.innerHTML = `
      <h3>${teamName}</h3>
      ${
        playerName
          ? `<p>${playerName}</p>`
          : ""
      }
    `;


    teamList.appendChild(card);

  });

}


/* =========================
   GROUPS
========================= */

function renderGroups(groups) {

  if (!groups.length) {

    showEmptyState(
      groupsContainer,
      "Groups have not been created yet."
    );

    return;
  }


  groupsContainer.innerHTML = "";


  groups.forEach(group => {

    const groupCard =
      document.createElement("div");

    groupCard.className =
      "group-card";


    const title =
      group.name || "Group";


    groupCard.innerHTML = `
      <div class="group-title">
        ${title}
      </div>

      <div class="group-content">
        <p class="empty-message">
          Group information will appear here.
        </p>
      </div>
    `;


    groupsContainer.appendChild(
      groupCard
    );

  });

}


/* =========================
   FIXTURES
========================= */

function renderFixtures(fixtures) {

  if (!fixtures.length) {

    showEmptyState(
      fixtureList,
      "Fixtures have not been created yet."
    );

    return;
  }


  fixtureList.innerHTML = "";


  fixtures.forEach(fixture => {

    const card =
      document.createElement("div");

    card.className =
      "fixture-card";


    const home =
      fixture.home || "Home";

    const away =
      fixture.away || "Away";


    const score =
      fixture.homeScore !== undefined &&
      fixture.awayScore !== undefined

        ? `${fixture.homeScore} - ${fixture.awayScore}`

        : "Not played";


    card.innerHTML = `
      <div class="fixture-stage">
        ${fixture.stage || ""}
      </div>

      <div class="fixture-teams">
        ${home} vs ${away}
      </div>

      <div class="fixture-score">
        ${score}
      </div>
    `;


    fixtureList.appendChild(card);

  });

}


/* =========================
   TABLES
========================= */

function renderTables(tables) {

  if (!tables.length) {

    showEmptyState(
      tablesContainer,
      "Tables are not available yet."
    );

    return;
  }


  tablesContainer.innerHTML = "";


  tables.forEach(table => {

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "table-wrapper";


    const title =
      document.createElement("h3");

    title.textContent =
      table.name || "Group";


    const html = `
      <table>

        <thead>

          <tr>

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

          <tr>

            <td colspan="9">
              Table data will appear here.
            </td>

          </tr>

        </tbody>

      </table>
    `;


    wrapper.innerHTML =
      html;


    tablesContainer.appendChild(
      title
    );

    tablesContainer.appendChild(
      wrapper
    );

  });

}


/* =========================
   KNOCKOUT
========================= */

function renderKnockout(knockout) {

  if (!knockout) {

    showEmptyState(
      knockoutContainer,
      "The knockout stage has not started yet."
    );

    return;
  }


  knockoutContainer.innerHTML = "";


  const message =
    document.createElement("div");


  message.className =
    "knockout-round";


  message.innerHTML = `
    <h3>
      ${knockout.stage || "Knockout Stage"}
    </h3>

    <p>
      Knockout information will appear here.
    </p>
  `;


  knockoutContainer.appendChild(
    message
  );

}


/* =========================
   FINAL
========================= */

function renderFinal(finalData, champion) {

  if (!finalData) {

    showEmptyState(
      finalContainer,
      "The final has not been created yet."
    );

    return;
  }


  finalContainer.innerHTML = "";


  const finalBox =
    document.createElement("div");


  finalBox.className =
    "final-box";


  finalBox.innerHTML = `
    <h3>Champions League Final</h3>

    <p>
      ${
        finalData.home || "Team 1"
      }

      vs

      ${
        finalData.away || "Team 2"
      }
    </p>

    ${
      champion
        ? `
          <div class="champion-box">
            <h3>🏆 ${champion}</h3>
            <p>Champions League Winner</p>
          </div>
        `
        : ""
    }
  `;


  finalContainer.appendChild(
    finalBox
  );

}


/* =========================
   START
========================= */

loadChampionsLeague();