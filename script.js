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

const form = document.getElementById("registrationForm");
const teamList = document.getElementById("teamList");
const fixtureList = document.getElementById("fixtureList");
const leagueTable = document.getElementById("leagueTable");
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
  const div = document.createElement("div");

  div.textContent = String(value ?? "");

  return div.innerHTML;
}


function getTeamName(team) {
  return team.teamName || team.name || "";
}


function getPlayerName(team) {
  return team.playerName || team.player || "";
}


function formatDate(date) {
  if (!date) return "Not set";

  return new Date(date + "T00:00:00").toLocaleDateString(
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

  if (!window.db) return;

  try {

    const competitionRef =
      doc(window.db, "competition", "main");

    const snapshot =
      await getDoc(competitionRef);

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

      const data = snapshot.data();

      teams = Array.isArray(data.teams)
        ? data.teams
        : [];

      fixtures = Array.isArray(data.fixtures)
        ? data.fixtures
        : [];

      /*
        Supports both:
        old nested season format
        and new admin format
      */

      if (data.season) {

        season = {
          started: data.season.started || false,
          startDate: data.season.startDate || "",
          endDate: data.season.endDate || "",
          legs: data.season.legs || 1
        };

      } else {

        season = {
          started: data.seasonStarted || false,
          startDate: data.seasonStart || "",
          endDate: data.seasonEnd || "",
          legs: data.legFormat || 1
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

  return teams.some(function(team) {

    return normalizeTeamName(
      getTeamName(team)
    ) === cleanName;

  });
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

        /*
          First check approved teams locally.
          We DO NOT read the registrations collection
          from the public website because the Firebase
          security rules correctly block public reads.
        */

        if (checkApprovedTeam(teamName)) {

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


        /*
          The Firestore security rule prevents overwriting
          an existing registration document.
        */

        await setDoc(
          registrationRef,
          {
            teamName: teamName,
            playerName: playerName,
            createdAt: Date.now(),
            status: "pending"
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


        /*
          If the registration document already exists,
          the secure rule blocks the new registration.
        */

        if (
          error.code === "permission-denied" ||
          error.code === "already-exists"
        ) {

          registrationMessage.textContent =
            "⚠️ This team name is already registered or waiting for approval.";

        } else {

          registrationMessage.textContent =
            "❌ Registration failed: " +
            (error.message || "Please try again.");

        }

      }

    }
  );

}


/* =========================
   DISPLAY TEAMS
========================= */

function displayTeams() {

  if (!teamList) return;

  teamList.innerHTML = "";


  if (teams.length === 0) {

    teamList.innerHTML =
      "<p>No approved teams yet.</p>";

    return;
  }


  teams.forEach(function(team) {

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


    card.appendChild(title);
    card.appendChild(player);

    teamList.appendChild(card);

  });

}


/* =========================
   LEAGUE TABLE
========================= */

function calculateTable() {

  const table = {};

  teams.forEach(function(team) {

    const name =
      getTeamName(team);

    table[name] = {
      name: name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    };

  });


  fixtures.forEach(function(match) {

    if (
      match.homeScore === null ||
      match.homeScore === undefined ||
      match.awayScore === null ||
      match.awayScore === undefined
    ) {
      return;
    }


    const home =
      table[match.home];

    const away =
      table[match.away];


    if (!home || !away) return;


    const homeScore =
      Number(match.homeScore);

    const awayScore =
      Number(match.awayScore);


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


  return Object.values(table).sort(
    function(a, b) {

      const aGD =
        a.goalsFor -
        a.goalsAgainst;

      const bGD =
        b.goalsFor -
        b.goalsAgainst;


      if (b.points !== a.points) {
        return b.points - a.points;
      }


      if (bGD !== aGD) {
        return bGD - aGD;
      }


      return b.goalsFor - a.goalsFor;

    }
  );

}


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


  const table =
    calculateTable();


  table.forEach(
    function(team, index) {

      const gd =
        team.goalsFor -
        team.goalsAgainst;


      leagueTable.innerHTML += `
        <tr>
          <td>${index + 1}</td>

          <td>
            ${escapeHTML(team.name)}
          </td>

          <td>${team.played}</td>

          <td>${team.wins}</td>

          <td>${team.draws}</td>

          <td>${team.losses}</td>

          <td>${team.goalsFor}</td>

          <td>${team.goalsAgainst}</td>

          <td>${gd}</td>

          <td>${team.points}</td>
        </tr>
      `;

    }
  );

}


/* =========================
   FIXTURES
========================= */

function displayFixtures() {

  if (!fixtureList) return;

  fixtureList.innerHTML = "";


  if (fixtures.length === 0) {

    fixtureList.innerHTML =
      "<p>No fixtures available yet.</p>";

    return;
  }


  fixtures.forEach(
    function(fixture, index) {

      const match =
        document.createElement("div");

      match.className =
        "fixture";


      const heading =
        document.createElement("h3");

      heading.textContent =
        fixture.day
          ? "📅 Match Day " + fixture.day
          : "⚽ Match " + (index + 1);


      const teamsText =
        document.createElement("p");

      teamsText.textContent =
        fixture.home +
        " 🆚 " +
        fixture.away;


      match.appendChild(heading);
      match.appendChild(teamsText);


      if (
        fixture.homeScore !== null &&
        fixture.homeScore !== undefined &&
        fixture.awayScore !== null &&
        fixture.awayScore !== undefined
      ) {

        const score =
          document.createElement("strong");

        score.textContent =
          fixture.homeScore +
          " - " +
          fixture.awayScore;


        const done =
          document.createElement("span");

        done.textContent =
          " ✅ Completed";


        match.appendChild(score);
        match.appendChild(done);

      } else {

        const waiting =
          document.createElement("span");

        waiting.textContent =
          " ⏳ Awaiting Result";


        match.appendChild(waiting);

      }


      fixtureList.appendChild(match);

    }
  );

}


/* =========================
   SEASON
========================= */

function displaySeason() {

  if (!seasonDetails) return;


  if (!season.started) {

    seasonDetails.innerHTML = `
      <p>
        🟡 Season has not started.
      </p>
    `;

    return;
  }


  seasonDetails.innerHTML = `
    <p>
      🟢 <strong>Season Active</strong>
    </p>

    <p>
      📅 Start:
      ${formatDate(season.startDate)}
    </p>

    <p>
      📅 End:
      ${formatDate(season.endDate)}
    </p>

    <p>
      ⚽ Format:
      ${season.legs}
      Leg${Number(season.legs) === 1 ? "" : "s"}
    </p>
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


  inputs.forEach(function(element) {

    element.disabled =
      season.started;

  });


  if (season.started) {

    registrationMessage.textContent =
      "🔒 Registration is CLOSED.";

  } else {

    registrationMessage.textContent =
      "";

  }

}


/* =========================
   REGISTER BUTTON
========================= */

window.showRegister =
  function() {

    const register =
      document.getElementById("register");

    if (!register) return;

    register.scrollIntoView({
      behavior: "smooth"
    });

  };


/* =========================
   START WEBSITE
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