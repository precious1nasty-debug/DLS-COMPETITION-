import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const ADMIN_EMAIL = "obakimoprecious07@gmail.com";

let teams = [];
let fixtures = [];

let season = {
  started: false,
  startDate: null,
  endDate: null,
  legs: 1
};

const form =
  document.getElementById("registrationForm");

const teamList =
  document.getElementById("teamList");

const fixtureList =
  document.getElementById("fixtureList");

const leagueTable =
  document.getElementById("leagueTable");

const registrationMessage =
  document.getElementById("registrationMessage");

const seasonDetails =
  document.getElementById("seasonDetails");


/* =========================
   FIREBASE DATA
========================= */

async function loadCompetition() {

  if (!window.db) {
    console.error("Firebase database unavailable.");
    return;
  }

  try {

    const competitionRef =
      doc(
        window.db,
        "competition",
        "main"
      );

    const snapshot =
      await getDoc(competitionRef);

    if (snapshot.exists()) {

      const data =
        snapshot.data();

      teams =
        Array.isArray(data.teams)
          ? data.teams
          : [];

      fixtures =
        Array.isArray(data.fixtures)
          ? data.fixtures
          : [];

      season =
        data.season || {
          started: false,
          startDate: null,
          endDate: null,
          legs: 1
        };

    } else {

      teams = [];
      fixtures = [];

      season = {
        started: false,
        startDate: null,
        endDate: null,
        legs: 1
      };
    }

    displayTeams();
    displayTable();
    displayFixtures();
    displaySeason();
    updateRegistrationStatus();

  } catch (error) {

    console.error(
      "Unable to load competition:",
      error
    );
  }
}


/* =========================
   SAVE COMPETITION
   ADMIN ONLY
========================= */

async function saveCompetition() {

  console.error(
    "Public website cannot save competition data."
  );

  return false;
}


/* =========================
   NORMALIZE TEAM NAME
========================= */

function normalizeTeamName(name) {

  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}


/* =========================
   CHECK TEAM NAME
========================= */

async function teamNameExists(teamName) {

  const cleanName =
    normalizeTeamName(teamName);

  /* Check approved teams */

  const approvedExists =
    teams.some(function(team) {

      return (
        normalizeTeamName(
          team.teamName
        ) === cleanName
      );
    });

  if (approvedExists) {
    return true;
  }


  /* Check pending registrations */

  try {

    const snapshot =
      await getDocs(
        collection(
          window.db,
          "registrations"
        )
      );

    let pendingExists = false;

    snapshot.forEach(function(item) {

      const data =
        item.data();

      if (
        (data.status || "pending") ===
        "pending"
      ) {

        if (
          normalizeTeamName(
            data.teamName
          ) === cleanName
        ) {

          pendingExists = true;
        }
      }
    });

    return pendingExists;

  } catch (error) {

    console.error(
      "Unable to check team names:",
      error
    );

    return false;
  }
}


/* =========================
   TEAM REGISTRATION
========================= */

if (form) {

  form.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      if (!window.db) {

        registrationMessage.textContent =
          "❌ Database is unavailable.";

        return;
      }


      /* Registration closed */

      if (season.started) {

        registrationMessage.textContent =
          "🔒 Registration is currently closed.";

        return;
      }


      const teamInput =
        document.getElementById(
          "teamName"
        );

      const playerInput =
        document.getElementById(
          "playerName"
        );


      const teamName =
        teamInput
          ? teamInput.value.trim()
          : "";

      const playerName =
        playerInput
          ? playerInput.value.trim()
          : "";


      /* Empty fields */

      if (!teamName || !playerName) {

        registrationMessage.textContent =
          "⚠️ Please fill in all fields.";

        return;
      }


      /* Team name length */

      if (
        teamName.length < 2 ||
        teamName.length > 40
      ) {

        registrationMessage.textContent =
          "⚠️ Team name must be 2-40 characters.";

        return;
      }


      /* Player name length */

      if (
        playerName.length < 2 ||
        playerName.length > 60
      ) {

        registrationMessage.textContent =
          "⚠️ Player name must be 2-60 characters.";

        return;
      }


      registrationMessage.textContent =
        "⏳ Checking team name...";


      /* Duplicate check */

      const exists =
        await teamNameExists(
          teamName
        );


      if (exists) {

        registrationMessage.textContent =
          "⚠️ This team name is already registered or waiting for approval.";

        return;
      }


      /* Create registration */

      try {

        await addDoc(
          collection(
            window.db,
            "registrations"
          ),
          {
            teamName:
              teamName,

            playerName:
              playerName,

            createdAt:
              Date.now(),

            status:
              "pending"
          }
        );


        registrationMessage.textContent =
          "✅ Registration submitted! Waiting for admin approval.";

        form.reset();

      } catch (error) {

        console.error(
          "Registration failed:",
          error
        );

        registrationMessage.textContent =
          "❌ Registration failed. Please try again.";
      }

    }
  );
}


/* =========================
   DISPLAY TEAMS
========================= */

function displayTeams() {

  if (!teamList) return;


  if (teams.length === 0) {

    teamList.innerHTML =
      "<p>No approved teams yet.</p>";

    return;
  }


  teamList.innerHTML = "";


  teams.forEach(function(team) {

    const card =
      document.createElement("div");

    card.className =
      "team-card";


    const title =
      document.createElement("h3");

    title.textContent =
      "⚽ " +
      team.teamName;


    const player =
      document.createElement("p");

    player.textContent =
      team.playerName;


    card.appendChild(title);
    card.appendChild(player);

    teamList.appendChild(card);

  });
}


/* =========================
   DISPLAY LEAGUE TABLE
========================= */

function displayTable() {

  if (!leagueTable) return;


  leagueTable.innerHTML = "";


  if (teams.length === 0) {

    leagueTable.innerHTML = `
      <tr>
        <td colspan="10">
          No approved teams yet.
        </td>
      </tr>
    `;

    return;
  }


  const sorted =
    [...teams].sort(
      function(a, b) {

        const aGD =
          (a.goalsFor || 0) -
          (a.goalsAgainst || 0);

        const bGD =
          (b.goalsFor || 0) -
          (b.goalsAgainst || 0);


        if (
          (b.points || 0) !==
          (a.points || 0)
        ) {

          return (
            (b.points || 0) -
            (a.points || 0)
          );
        }


        if (bGD !== aGD) {

          return bGD - aGD;
        }


        return (
          (b.goalsFor || 0) -
          (a.goalsFor || 0)
        );

      }
    );


  sorted.forEach(
    function(team, index) {

      const gf =
        team.goalsFor || 0;

      const ga =
        team.goalsAgainst || 0;

      const gd =
        gf - ga;


      leagueTable.innerHTML += `
        <tr>

          <td>
            ${index + 1}
          </td>

          <td>
            ${escapeHTML(
              team.teamName
            )}
          </td>

          <td>
            ${team.played || 0}
          </td>

          <td>
            ${team.wins || 0}
          </td>

          <td>
            ${team.draws || 0}
          </td>

          <td>
            ${team.losses || 0}
          </td>

          <td>
            ${gf}
          </td>

          <td>
            ${ga}
          </td>

          <td>
            ${gd}
          </td>

          <td>
            ${team.points || 0}
          </td>

        </tr>
      `;
    }
  );
}


/* =========================
   DISPLAY SEASON
========================= */

function displaySeason() {

  if (!seasonDetails) return;


  if (!season.started) {

    seasonDetails.innerHTML = `
      <div class="season-status">

        <p class="warning">
          🟡 Season has not started.
        </p>

      </div>
    `;

    return;
  }


  seasonDetails.innerHTML = `
    <div class="season-status">

      <p>
        🟢
        <strong>
          Season Active
        </strong>
      </p>

      <p>
        📅 Start:
        ${formatDate(
          season.startDate
        )}
      </p>

      <p>
        📅 End:
        ${formatDate(
          season.endDate
        )}
      </p>

      <p>
        ⚽ Format:
        ${season.legs}
        Leg${season.legs === 1 ? "" : "s"}
      </p>

    </div>
  `;
}


/* =========================
   REGISTRATION STATUS
========================= */

function updateRegistrationStatus() {

  if (!form) return;


  const inputs =
    form.querySelectorAll(
      "input, button"
    );


  inputs.forEach(
    function(element) {

      element.disabled =
        season.started;

    }
  );


  if (season.started) {

    registrationMessage.textContent =
      "🔒 Registration is CLOSED.";

  } else {

    registrationMessage.textContent =
      "";

  }
}


/* =========================
   DISPLAY FIXTURES
========================= */

function displayFixtures() {

  if (!fixtureList) return;


  if (fixtures.length === 0) {

    fixtureList.innerHTML =
      "<p>No fixtures available yet.</p>";

    return;
  }


  fixtureList.innerHTML = "";


  let currentDay = 0;


  fixtures.forEach(
    function(fixture) {

      if (
        fixture.day !==
        currentDay
      ) {

        currentDay =
          fixture.day;


        const heading =
          document.createElement(
            "h3"
          );

        heading.className =
          "match-day";

        heading.textContent =
          "📅 Match Day " +
          fixture.day;

        fixtureList.appendChild(
          heading
        );
      }


      const match =
        document.createElement(
          "div"
        );

      match.className =
        "fixture";


      const teamsText =
        document.createElement(
          "span"
        );

      teamsText.className =
        "teams";


      if (fixture.completed) {

        teamsText.textContent =
          fixture.home +
          " 🆚 " +
          fixture.away;


        const score =
          document.createElement(
            "strong"
          );

        score.textContent =
          fixture.homeScore +
          " - " +
          fixture.awayScore;


        const completed =
          document.createElement(
            "span"
          );

        completed.className =
          "completed";

        completed.textContent =
          " ✅ Completed";


        match.appendChild(
          teamsText
        );

        match.appendChild(
          score
        );

        match.appendChild(
          completed
        );

      } else {

        teamsText.textContent =
          fixture.home +
          " 🆚 " +
          fixture.away;


        const waiting =
          document.createElement(
            "span"
          );

        waiting.textContent =
          " ⏳ Awaiting Result";


        match.appendChild(
          teamsText
        );

        match.appendChild(
          waiting
        );
      }


      fixtureList.appendChild(
        match
      );

    }
  );
}


/* =========================
   HELPERS
========================= */

function formatDate(date) {

  if (!date) {
    return "Not set";
  }


  const value =
    new Date(
      date + "T00:00:00"
    );


  return value.toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );
}


function escapeHTML(value) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    String(value ?? "");

  return div.innerHTML;
}


/* =========================
   REGISTER BUTTON
========================= */

window.showRegister =
  function() {

    const register =
      document.getElementById(
        "register"
      );


    if (!register) return;


    register.scrollIntoView({
      behavior: "smooth"
    });

  };


/* =========================
   START PUBLIC WEBSITE
========================= */

async function startWebsite() {

  if (!window.db) {

    setTimeout(
      startWebsite,
      500
    );

    return;
  }


  await loadCompetition();

}


startWebsite();