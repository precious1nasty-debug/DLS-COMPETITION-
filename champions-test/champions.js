/* =========================================================
   DLS CHAMPIONS LEAGUE
   champions.js
   PART 5 — PUBLIC PAGE
   ========================================================= */

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================
   ELEMENTS
========================= */

const competitionStatus =
  document.getElementById("competitionStatus");

const teamList =
  document.getElementById("teamList");

const leagueTableContainer =
  document.getElementById("leagueTableContainer");

const fixtureList =
  document.getElementById("fixtureList");

const knockoutContainer =
  document.getElementById("knockoutContainer");

const finalContainer =
  document.getElementById("finalContainer");

const winnerContainer =
  document.getElementById("winnerContainer");


/* =========================
   EMPTY STATE
========================= */

function showEmptyState(element, message) {

  if (!element) {
    return;
  }

  element.innerHTML = `
    <div class="empty-message">
      ${message}
    </div>
  `;
}


/* =========================
   ERROR STATE
========================= */

function showErrorState(element, message) {

  if (!element) {
    return;
  }

  element.innerHTML = `
    <div class="error-message">
      ${message}
    </div>
  `;
}


/* =========================
   WAIT FOR FIREBASE
========================= */

function waitForFirebase() {

  return new Promise((resolve, reject) => {

    let attempts = 0;

    const maxAttempts = 100;

    const timer = setInterval(() => {

      attempts++;

      if (
        window.championsFirebaseReady === true &&
        window.championsDb
      ) {

        clearInterval(timer);

        resolve(window.championsDb);

        return;
      }


      if (attempts >= maxAttempts) {

        clearInterval(timer);

        reject(
          new Error(
            "Firebase could not be initialized."
          )
        );

      }

    }, 100);

  });

}


/* =========================
   RENDER TEAMS
========================= */

function renderTeams(teams) {

  if (!Array.isArray(teams) || teams.length === 0) {

    showEmptyState(
      teamList,
      "No Champions League teams have been registered yet."
    );

    return;
  }


  teamList.innerHTML = "";


  teams.forEach((team) => {

    const card =
      document.createElement("div");

    card.className =
      "team-card";


    const teamName =
      document.createElement("h3");

    teamName.textContent =
      team.name || "Unnamed Team";


    const playerName =
      document.createElement("p");

    playerName.textContent =
      team.player
        ? `Player: ${team.player}`
        : "Player not available";


    card.appendChild(teamName);

    card.appendChild(playerName);

    teamList.appendChild(card);

  });

}


/* =========================
   LOAD CHAMPIONS LEAGUE
========================= */

async function loadChampionsLeague() {

  try {

    const db =
      await waitForFirebase();


    /* =========================
       CHAMPIONS DOCUMENT
    ========================= */

    const championsRef =
      doc(
        db,
        "championsLeague",
        "main"
      );


    const championsSnapshot =
      await getDoc(championsRef);


    /* =========================
       NO COMPETITION YET
    ========================= */

    if (!championsSnapshot.exists()) {

      competitionStatus.textContent =
        "Champions League has not been started yet.";

      showEmptyState(
        teamList,
        "Teams will appear here when the Champions League is started."
      );

      showEmptyState(
        leagueTableContainer,
        "League table is not available yet."
      );

      showEmptyState(
        fixtureList,
        "League-phase fixtures are not available yet."
      );

      showEmptyState(
        knockoutContainer,
        "Knockout phase has not started."
      );

      showEmptyState(
        finalContainer,
        "The final has not been created."
      );

      showEmptyState(
        winnerContainer,
        "The champion will appear here after the final."
      );

      return;
    }


    /* =========================
       READ DATA
    ========================= */

    const data =
      championsSnapshot.data();


    /* =========================
       STATUS
    ========================= */

    competitionStatus.textContent =
      data.status ||
      "Champions League is active.";


    /* =========================
       TEAMS
    ========================= */

    renderTeams(
      Array.isArray(data.teams)
        ? data.teams
        : []
    );


    /* =========================
       LEAGUE TABLE
    ========================= */

    if (
      Array.isArray(data.tables) &&
      data.tables.length > 0
    ) {

      leagueTableContainer.innerHTML =
        "League table data is available.";

    } else {

      showEmptyState(
        leagueTableContainer,
        "League table is not available yet."
      );

    }


    /* =========================
       FIXTURES
    ========================= */

    if (
      Array.isArray(data.fixtures) &&
      data.fixtures.length > 0
    ) {

      fixtureList.innerHTML =
        "League-phase fixtures are available.";

    } else {

      showEmptyState(
        fixtureList,
        "League-phase fixtures are not available yet."
      );

    }


    /* =========================
       KNOCKOUT
    ========================= */

    if (data.knockout) {

      knockoutContainer.innerHTML =
        "Knockout phase information is available.";

    } else {

      showEmptyState(
        knockoutContainer,
        "Knockout phase has not started."
      );

    }


    /* =========================
       FINAL
    ========================= */

    if (data.final) {

      finalContainer.innerHTML =
        "Champions League final information is available.";

    } else {

      showEmptyState(
        finalContainer,
        "The final has not been created."
      );

    }


    /* =========================
       WINNER
    ========================= */

    if (data.champion) {

      winnerContainer.innerHTML = `
        <div class="winner-card">

          <div class="trophy">
            🏆
          </div>

          <h3>
            ${data.champion.name || "Champion"}
          </h3>

          <p>
            ${
              data.champion.player
                ? `Player: ${data.champion.player}`
                : ""
            }
          </p>

        </div>
      `;

    } else {

      showEmptyState(
        winnerContainer,
        "The champion will appear here after the final."
      );

    }

  } catch (error) {

    console.error(
      "Champions League loading error:",
      error
    );


    competitionStatus.textContent =
      "Unable to load the Champions League.";


    showErrorState(
      teamList,
      "There was a problem loading the competition."
    );

  }

}


/* =========================
   START
========================= */

loadChampionsLeague();