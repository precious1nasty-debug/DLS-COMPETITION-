import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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


function formatDate(date) {
  if (!date) return "Not set";

  return new Date(
    date + "T00:00:00"
  ).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );
}


async function loadCompetition() {

  if (!window.db) return;

  try {

    const ref =
      doc(
        window.db,
        "competition",
        "main"
      );

    const snapshot =
      await getDoc(ref);

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
      "Competition load failed:",
      error
    );

  }
}

async function checkTeamName() {

  if (!window.db) {
    throw new Error(
      "Database unavailable"
    );
  }

  const cleanName =
    normalizeTeamName(
      document.getElementById(
        "teamName"
      )?.value
    );

  if (!cleanName) return false;


  const approved =
    teams.some(
      function(team) {

        return (
          normalizeTeamName(
            team.teamName
          ) === cleanName
        );

      }
    );


  if (approved) {
    return true;
  }


  const registrationRef =
    doc(
      window.db,
      "registrations",
      teamKey(cleanName)
    );


  const snapshot =
    await getDoc(
      registrationRef
    );


  return snapshot.exists();
}


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
        document.getElementById(
          "teamName"
        )?.value.trim() || "";


      const playerName =
        document.getElementById(
          "playerName"
        )?.value.trim() || "";


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
        "⏳ Checking team name...";


      try {

        const exists =
          await checkTeamName();


        if (exists) {

          registrationMessage.textContent =
            "⚠️ This team name is already registered or waiting for approval.";

          return;
        }


        const registrationId =
          teamKey(teamName);


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
          "permission-denied"
        ) {

          registrationMessage.textContent =
            "⚠️ This team name is already registered or waiting for approval.";

        } else {

          registrationMessage.textContent =
            "❌ Registration failed. Please try again.";

        }
      }

    }
  );
}


function displayTeams() {

  if (!teamList) return;

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
        team.teamName;


      const player =
        document.createElement("p");

      player.textContent =
        team.playerName;


      card.appendChild(title);
      card.appendChild(player);

      teamList.appendChild(card);

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
          <td>${index + 1}</td>

          <td>
            ${escapeHTML(
              team.teamName
            )}
          </td>

          <td>${team.played || 0}</td>
          <td>${team.wins || 0}</td>
          <td>${team.draws || 0}</td>
          <td>${team.losses || 0}</td>
          <td>${gf}</td>
          <td>${ga}</td>
          <td>${gd}</td>
          <td>${team.points || 0}</td>
        </tr>
      `;

    }
  );
}

function displayFixtures() {

  if (!fixtureList) return;

  fixtureList.innerHTML = "";


  if (fixtures.length === 0) {

    fixtureList.innerHTML =
      "<p>No fixtures available yet.</p>";

    return;
  }


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
          document.createElement("h3");

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
        document.createElement("div");

      match.className =
        "fixture";


      const teamsText =
        document.createElement("span");

      teamsText.className =
        "teams";


      teamsText.textContent =
        fixture.home +
        " 🆚 " +
        fixture.away;


      match.appendChild(
        teamsText
      );


      if (fixture.completed) {

        const score =
          document.createElement("strong");

        score.textContent =
          fixture.homeScore +
          " - " +
          fixture.awayScore;


        match.appendChild(
          score
        );


        const done =
          document.createElement("span");

        done.textContent =
          " ✅ Completed";


        match.appendChild(
          done
        );

      } else {

        const waiting =
          document.createElement("span");

        waiting.textContent =
          " ⏳ Awaiting Result";


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
  `;
}


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