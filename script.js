import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

let teams = [];
let fixtures = [];

let season = {
  started: false,
  startDate: "",
  endDate: "",
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
   HELPERS
========================= */

function normalizeTeamName(name) {

  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

}

function teamKey(name) {

  return normalizeTeamName(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);

}

function escapeHTML(value) {

  const div =
    document.createElement("div");

  div.textContent =
    String(value ?? "");

  return div.innerHTML;

}

function getTeamName(team) {

  return team.teamName ||
    team.name ||
    "";

}

function getPlayerName(team) {

  return team.playerName ||
    team.player ||
    "";

}

function formatDate(date) {

  if (!date) {
    return "Date not set";
  }

  const parts =
    date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  const formatted =
    new Date(
      `${date}T00:00:00`
    );

  return formatted.toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

}


/* =========================
   LOAD COMPETITION
========================= */

async function loadCompetition() {

  if (!window.db) {
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
      await getDoc(
        competitionRef
      );

    if (!snapshot.exists()) {

      teams = [];
      fixtures = [];

      season = {
        started: false,
        startDate: "",
        endDate: "",
        legs: 1
      };

    } else {

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

      if (data.season) {

        season = {

          started:
            data.season.started || false,

          startDate:
            data.season.startDate || "",

          endDate:
            data.season.endDate || "",

          legs:
            data.season.legs || 1

        };

      } else {

        season = {

          started:
            data.seasonStarted || false,

          startDate:
            data.seasonStart || "",

          endDate:
            data.seasonEnd || "",

          legs:
            data.legFormat || 1

        };

      }

    }

    displayTeams();
    displayTable();
    displayFixtures();
    displaySeason();
    updateRegistrationStatus();

  } catch (error) {

    console.error(
      "Competition load failed:",
      error
    );

  }

}


/* =========================
   CHECK APPROVED TEAM
========================= */

function checkApprovedTeam(teamName) {

  const cleanName =
    normalizeTeamName(teamName);

  return teams.some(
    function(team) {

      return normalizeTeamName(
        getTeamName(team)
      ) === cleanName;

    }
  );

}


/* =========================
   REGISTRATION
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

      if (season.started) {

        registrationMessage.textContent =
          "🔒 Registration is closed.";

        return;

      }

      const teamName =
        document
          .getElementById("teamName")
          ?.value
          .trim() || "";

      const playerName =
        document
          .getElementById("playerName")
          ?.value
          .trim() || "";

      if (!teamName || !playerName) {

        registrationMessage.textContent =
          "⚠️ Please fill in all fields.";

        return;

      }

      if (
        teamName.length < 2 ||
        teamName.length > 40
      ) {

        registrationMessage.textContent =
          "⚠️ Team name must be 2-40 characters.";

        return;

      }

      if (
        playerName.length < 2 ||
        playerName.length > 60
      ) {

        registrationMessage.textContent =
          "⚠️ Player name must be 2-60 characters.";

        return;

      }

      registrationMessage.textContent =
        "⏳ Submitting registration...";

      try {

        if (
          checkApprovedTeam(
            teamName
          )
        ) {

          registrationMessage.textContent =
            "⚠️ This team name is already registered or waiting for approval.";

          return;

        }

        const registrationId =
          teamKey(teamName);

        if (!registrationId) {

          registrationMessage.textContent =
            "⚠️ Please enter a valid team name.";

          return;

        }

        const registrationRef =
          doc(
            window.db,
            "registrations",
            registrationId
          );

        await setDoc(
          registrationRef,
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

        if (
          error.code ===
            "permission-denied" ||
          error.code ===
            "already-exists"
        ) {

          registrationMessage.textContent =
            "⚠️ This team name is already registered or waiting for approval.";

        } else {

          registrationMessage.textContent =
            "❌ Registration failed: " +
            (
              error.message ||
              "Please try again."
            );

        }

      }

    }
  );

}


/* =========================
   DISPLAY TEAMS
========================= */

function displayTeams() {

  if (!teamList) {
    return;
  }

  teamList.innerHTML = "";

  if (teams.length === 0) {

    teamList.innerHTML =
      "<p>No approved teams yet.</p>";

    return;

  }

  teams.forEach(
    function(team) {

      const card =
        document.createElement("div");

      card.className =
        "team-card";

      const title =
        document.createElement("h3");

      title.textContent =
        "⚽ " +
        getTeamName(team);

      const player =
        document.createElement("p");

      player.textContent =
        getPlayerName(team);

      card.appendChild(
        title
      );

      card.appendChild(
        player
      );

      teamList.appendChild(
        card
      );

    }
  );

}

/* =========================
   SEASON DISPLAY
========================= */

function displaySeason() {

  if (!seasonDetails) {
    return;
  }

  if (!season.startDate || !season.endDate) {

    seasonDetails.innerHTML =
      "<p>📅 Season dates have not been set yet.</p>";

    return;

  }

  const status =
    season.started
      ? "🟢 Season is currently active."
      : "🟡 Season has not started yet.";

  const legText =
    Number(season.legs) === 2
      ? "2 Legs"
      : "1 Leg";

  seasonDetails.innerHTML = `
    <div class="season-card">

      <p>
        <strong>Status:</strong>
        ${status}
      </p>

      <p>
        <strong>Start:</strong>
        ${escapeHTML(
          formatDate(season.startDate)
        )}
      </p>

      <p>
        <strong>End:</strong>
        ${escapeHTML(
          formatDate(season.endDate)
        )}
      </p>

      <p>
        <strong>Format:</strong>
        ${legText}
      </p>

    </div>
  `;

}


/* =========================
   REGISTRATION STATUS
========================= */

function updateRegistrationStatus() {

  if (!form) {
    return;
  }

  const inputs =
    form.querySelectorAll(
      "input, button"
    );

  if (season.started) {

    inputs.forEach(
      function(element) {
        element.disabled = true;
      }
    );

    if (registrationMessage) {

      registrationMessage.textContent =
        "🔒 Registration is closed because the season has started.";

    }

  } else {

    inputs.forEach(
      function(element) {
        element.disabled = false;
      }
    );

  }

}


/* =========================
   SHOW REGISTRATION
========================= */

window.showRegister =
  function() {

    const registerSection =
      document.getElementById(
        "register"
      );

    if (!registerSection) {
      return;
    }

    registerSection.scrollIntoView({
      behavior: "smooth"
    });

  };


/* =========================
   FIXTURE HELPERS
========================= */

function getFixtureHome(fixture) {

  return fixture.home ||
    fixture.homeTeam ||
    fixture.team1 ||
    "";

}

function getFixtureAway(fixture) {

  return fixture.away ||
    fixture.awayTeam ||
    fixture.team2 ||
    "";

}

function getFixtureDate(fixture) {

  return fixture.date ||
    fixture.matchDate ||
    "";

}

function getFixtureResult(fixture) {

  if (
    fixture.result &&
    typeof fixture.result === "object"
  ) {

    return fixture.result;

  }

  return null;

}


/* =========================
   DISPLAY FIXTURES
========================= */

function displayFixtures() {

  if (!fixtureList) {
    return;
  }

  fixtureList.innerHTML = "";

  if (fixtures.length === 0) {

    fixtureList.innerHTML =
      "<p>📅 No fixtures available yet.</p>";

    return;

  }

  const groupedFixtures = {};

  fixtures.forEach(
    function(fixture) {

      const date =
        getFixtureDate(fixture) ||
        "No Date";

      if (
        !groupedFixtures[date]
      ) {

        groupedFixtures[date] = [];

      }

      groupedFixtures[date].push(
        fixture
      );

    }
  );

  Object.keys(
    groupedFixtures
  ).forEach(
    function(date) {

      const day =
        document.createElement("div");

      day.className =
        "fixture-day";

      const heading =
        document.createElement("h3");

      heading.textContent =
        "📅 " +
        formatDate(date);

      day.appendChild(
        heading
      );

      const matches =
        groupedFixtures[date];

      matches.forEach(
        function(fixture) {

          const home =
            getFixtureHome(fixture);

          const away =
            getFixtureAway(fixture);

          const result =
            getFixtureResult(
              fixture
            );

          const match =
            document.createElement("div");

          match.className =
            "fixture-card";

          let resultText =
            "⏳ Not played";

          if (result) {

            resultText =
              `${result.homeGoals} - ${result.awayGoals}`;

          }

          match.innerHTML = `
            <div class="fixture-teams">

              <strong>
                ${escapeHTML(home)}
              </strong>

              <span>vs</span>

              <strong>
                ${escapeHTML(away)}
              </strong>

            </div>

            <div class="fixture-result">
              ${escapeHTML(resultText)}
            </div>
          `;

          day.appendChild(
            match
          );

        }
      );

      fixtureList.appendChild(
        day
      );

    }
  );

}


/* =========================
   CREATE EMPTY TABLE
========================= */

function createTableData() {

  const table = {};

  teams.forEach(
    function(team) {

      const name =
        getTeamName(team);

      if (!name) {
        return;
      }

      table[name] = {

        team:
          name,

        played:
          0,

        wins:
          0,

        draws:
          0,

        losses:
          0,

        gf:
          0,

        ga:
          0,

        gd:
          0,

        points:
          0

      };

    }
  );

  return table;

}


/* =========================
   APPLY MATCH RESULT
========================= */

function applyResult(
  table,
  fixture
) {

  const home =
    getFixtureHome(fixture);

  const away =
    getFixtureAway(fixture);

  const result =
    getFixtureResult(fixture);

  if (
    !home ||
    !away ||
    !result
  ) {

    return;

  }

  const homeGoals =
    Number(
      result.homeGoals
    );

  const awayGoals =
    Number(
      result.awayGoals
    );

  if (
    !Number.isFinite(homeGoals) ||
    !Number.isFinite(awayGoals) ||
    homeGoals < 0 ||
    awayGoals < 0
  ) {

    return;

  }

  if (
    !table[home] ||
    !table[away]
  ) {

    return;

  }

  table[home].played++;
  table[away].played++;

  table[home].gf += homeGoals;
  table[home].ga += awayGoals;

  table[away].gf += awayGoals;
  table[away].ga += homeGoals;

  if (
    homeGoals > awayGoals
  ) {

    table[home].wins++;
    table[away].losses++;

    table[home].points += 3;

  } else if (
    homeGoals < awayGoals
  ) {

    table[away].wins++;
    table[home].losses++;

    table[away].points += 3;

  } else {

    table[home].draws++;
    table[away].draws++;

    table[home].points++;
    table[away].points++;

  }

}


/* =========================
   SORT TABLE
========================= */

function sortTable(table) {

  return Object.values(table)
    .map(
      function(team) {

        team.gd =
          team.gf - team.ga;

        return team;

      }
    )
    .sort(
      function(a, b) {

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
          b.gd !==
          a.gd
        ) {

          return (
            b.gd -
            a.gd
          );

        }

        if (
          b.gf !==
          a.gf
        ) {

          return (
            b.gf -
            a.gf
          );

        }

        return a.team.localeCompare(
          b.team
        );

      }
    );

}


/* =========================
   DISPLAY LEAGUE TABLE
========================= */

function displayTable() {

  if (!leagueTable) {
    return;
  }

  const table =
    createTableData();

  fixtures.forEach(
    function(fixture) {

      applyResult(
        table,
        fixture
      );

    }
  );

  const standings =
    sortTable(table);

  leagueTable.innerHTML = "";

  if (
    standings.length === 0
  ) {

    leagueTable.innerHTML = `
      <tr>
        <td colspan="10">
          No teams available yet.
        </td>
      </tr>
    `;

    return;

  }

  standings.forEach(
    function(team, index) {

      const row =
        document.createElement("tr");

      row.innerHTML = `

        <td>
          ${index + 1}
        </td>

        <td>
          ⚽ ${escapeHTML(team.team)}
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
          ${team.gf}
        </td>

        <td>
          ${team.ga}
        </td>

        <td>
          ${team.gd}
        </td>

        <td>
          <strong>
            ${team.points}
          </strong>
        </td>

      `;

      leagueTable.appendChild(
        row
      );

    }
  );

}

/* =========================
   WAIT FOR FIREBASE
========================= */

function waitForFirebase() {

  if (window.firebaseReady) {

    loadCompetition();

    return;

  }

  let attempts = 0;

  const timer =
    setInterval(
      function() {

        attempts++;

        if (window.firebaseReady) {

          clearInterval(timer);

          loadCompetition();

        }

        if (attempts >= 100) {

          clearInterval(timer);

          console.error(
            "Firebase failed to initialize."
          );

          if (registrationMessage) {

            registrationMessage.textContent =
              "❌ Database connection failed.";

          }

        }

      },
      100
    );

}


/* =========================
   PAGE START
========================= */

waitForFirebase();