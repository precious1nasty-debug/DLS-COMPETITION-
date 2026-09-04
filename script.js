import {
  collection,
  doc,
  getDocs,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


let teams = [];
let fixtures = [];

let season = {
  started: false,
  startDate: null,
  endDate: null,
  legs: 1
};

let adminLoggedIn = false;
let currentAdmin = null;


/* =========================
   PAGE ELEMENTS
========================= */

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
   FIREBASE
========================= */

async function saveCompetition() {

  if (!window.db) {
    console.error("Firebase database unavailable.");
    return;
  }

  try {

    await setDoc(
      doc(window.db, "competition", "main"),
      {
        teams: teams,
        fixtures: fixtures,
        season: season
      }
    );

    console.log("Competition saved.");

  } catch (error) {

    console.error("Save failed:", error);

    alert("❌ Unable to save competition data.");

  }

}


async function loadCompetition() {

  if (!window.db) {
    console.error("Firebase database unavailable.");
    return;
  }

  try {

    const snapshot =
      await getDocs(
        collection(window.db, "competition")
      );

    snapshot.forEach(function(item) {

      if (item.id === "main") {

        const data = item.data();

        teams = data.teams || [];

        fixtures = data.fixtures || [];

        season =
          data.season || {
            started: false,
            startDate: null,
            endDate: null,
            legs: 1
          };

      }

    });

    displayTeams();
    displayFixtures();
    displayTable();
    displaySeason();
    updateRegistrationStatus();

  } catch (error) {

    console.error("Load failed:", error);

  }

}


/* =========================
   REGISTRATION
========================= */

form.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();

    if (season.started) {

      registrationMessage.textContent =
        "🔒 Registration is closed.";

      return;

    }

    const teamName =
      document
        .getElementById("teamName")
        .value
        .trim();

    const playerName =
      document
        .getElementById("playerName")
        .value
        .trim();


    if (!teamName || !playerName) {

      registrationMessage.textContent =
        "⚠️ Please fill in all fields.";

      return;

    }


    const cleanName =
      teamName
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();


    const duplicate =
      teams.some(function(team) {

        return team.teamName
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim() === cleanName;

      });


    if (duplicate) {

      registrationMessage.textContent =
        "⚠️ This team name is already registered.";

      return;

    }


    teams.push({

      id: Date.now().toString(),

      teamName: teamName,

      playerName: playerName,

      played: 0,

      wins: 0,

      draws: 0,

      losses: 0,

      goalsFor: 0,

      goalsAgainst: 0,

      points: 0

    });


    await saveCompetition();

    displayTeams();

    displayTable();

    registrationMessage.textContent =
      "✅ Team registered successfully!";

    form.reset();

  }
);


/* =========================
   DISPLAY TEAMS
========================= */

function displayTeams() {

  if (teams.length === 0) {

    teamList.innerHTML =
      "<p>No teams registered yet.</p>";

    return;

  }


  teamList.innerHTML = "";


  teams.forEach(function(team) {

    const card =
      document.createElement("div");

    card.className = "team-card";


    card.innerHTML = `
      <h3>⚽ ${escapeHTML(team.teamName)}</h3>
      <p>${escapeHTML(team.playerName)}</p>
    `;


    teamList.appendChild(card);

  });

}


/* =========================
   TABLE
========================= */

function displayTable() {

  leagueTable.innerHTML = "";


  if (teams.length === 0) {

    leagueTable.innerHTML = `
      <tr>
        <td colspan="10">
          No teams registered yet.
        </td>
      </tr>
    `;

    return;

  }


  const sorted =
    [...teams].sort(function(a, b) {

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

    });


  sorted.forEach(function(team, index) {

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
          ${escapeHTML(team.teamName)}
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

  });

}


/* =========================
   FIXTURE GENERATION
========================= */

function generateFixtures() {

  if (!adminLoggedIn) {

    alert("🔒 Admin login required.");

    return;

  }


  if (season.started) {

    alert(
      "🔒 The season has already started."
    );

    return;

  }


  if (teams.length < 2) {

    alert(
      "❌ You need at least 2 teams."
    );

    return;

  }


  fixtures = [];


  let list =
    teams.map(function(team) {
      return team.teamName;
    });


  if (list.length % 2 !== 0) {

    list.push("BYE");

  }


  const total = list.length;

  const rounds = total - 1;

  const matches = total / 2;


  for (
    let round = 0;
    round < rounds;
    round++
  ) {

    for (
      let i = 0;
      i < matches;
      i++
    ) {

      const home = list[i];

      const away =
        list[total - 1 - i];


      if (
        home !== "BYE" &&
        away !== "BYE"
      ) {

        fixtures.push({

          id:
            "fixture-" +
            Date.now() +
            "-" +
            fixtures.length,

          day: round + 1,

          home: home,

          away: away,

          completed: false,

          homeScore: null,

          awayScore: null

        });

      }

    }


    list.splice(
      1,
      0,
      list.pop()
    );

  }


  if (season.legs === 2) {

    const firstLeg =
      [...fixtures];


    firstLeg.forEach(function(fixture) {

      fixtures.push({

        id:
          "fixture-" +
          Date.now() +
          "-" +
          fixtures.length,

        day:
          fixture.day + rounds,

        home:
          fixture.away,

        away:
          fixture.home,

        completed: false,

        homeScore: null,

        awayScore: null

      });

    });

  }


  displayFixtures();

  saveCompetition();


  alert(
    "✅ " +
    fixtures.length +
    " fixtures generated."
  );

}


/* =========================
   DISPLAY FIXTURES
========================= */

function displayFixtures() {

  if (fixtures.length === 0) {

    fixtureList.innerHTML =
      "<p>No fixtures available yet.</p>";

    return;

  }


  fixtureList.innerHTML = "";

  let currentDay = 0;


  fixtures.forEach(function(fixture, index) {

    if (fixture.day !== currentDay) {

      currentDay = fixture.day;


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


    if (fixture.completed) {

      match.innerHTML = `

        <span class="teams">

          ${escapeHTML(fixture.home)}

          🆚

          ${escapeHTML(fixture.away)}

        </span>

        <strong>

          ${fixture.homeScore}
          -
          ${fixture.awayScore}

        </strong>

        <span class="completed">

          ✅ Completed

        </span>

      `;

    } else {

      match.innerHTML = `

        <span class="teams">

          ${escapeHTML(fixture.home)}

          🆚

          ${escapeHTML(fixture.away)}

        </span>

        ${
          adminLoggedIn
            ? `
              <button
                onclick="enterResult(${index})"
              >
                🏆 Enter Result
              </button>
            `
            : `
              <span>
                ⏳ Awaiting Result
              </span>
            `
        }

      `;

    }


    fixtureList.appendChild(match);

  });

}


/* =========================
   ENTER RESULT
========================= */

async function enterResult(index) {

  if (!adminLoggedIn) {

    alert(
      "🔒 Admin login required."
    );

    return;

  }


  const fixture =
    fixtures[index];


  if (
    !fixture ||
    fixture.completed
  ) {

    alert(
      "⚠️ This match is already completed."
    );

    return;

  }


  const homeScore =
    Number(
      prompt(
        fixture.home + " score:"
      )
    );


  const awayScore =
    Number(
      prompt(
        fixture.away + " score:"
      )
    );


  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {

    alert(
      "⚠️ Enter valid scores."
    );

    return;

  }


  const homeTeam =
    teams.find(function(team) {

      return (
        team.teamName ===
        fixture.home
      );

    });


  const awayTeam =
    teams.find(function(team) {

      return (
        team.teamName ===
        fixture.away
      );

    });


  if (!homeTeam || !awayTeam) {

    alert(
      "❌ Team not found."
    );

    return;

  }


  homeTeam.played++;
  awayTeam.played++;


  homeTeam.goalsFor +=
    homeScore;

  homeTeam.goalsAgainst +=
    awayScore;


  awayTeam.goalsFor +=
    awayScore;

  awayTeam.goalsAgainst +=
    homeScore;


  if (homeScore > awayScore) {

    homeTeam.wins++;

    homeTeam.points += 3;

    awayTeam.losses++;

  }

  else if (homeScore < awayScore) {

    awayTeam.wins++;

    awayTeam.points += 3;

    homeTeam.losses++;

  }

  else {

    homeTeam.draws++;

    awayTeam.draws++;

    homeTeam.points++;

    awayTeam.points++;

  }


  fixture.homeScore =
    homeScore;

  fixture.awayScore =
    awayScore;

  fixture.completed =
    true;


  await saveCompetition();


  displayFixtures();

  displayTable();


  alert(
    "✅ Match result saved!"
  );

}

/* =========================
   SEASON DISPLAY
========================= */

function displaySeason() {

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
        Leg${season.legs === 1 ? "" : "s"}
      </p>

    </div>

  `;

}


/* =========================
   START SEASON
========================= */

async function startSeason() {

  if (!adminLoggedIn) {

    alert(
      "🔒 Admin login required."
    );

    return;

  }


  if (season.started) {

    alert(
      "⚠️ Season already started."
    );

    return;

  }


  if (teams.length < 2) {

    alert(
      "❌ Register at least 2 teams."
    );

    return;

  }


  const startDate =
    document.getElementById(
      "seasonStart"
    ).value;


  const endDate =
    document.getElementById(
      "seasonEnd"
    ).value;


  const legs =
    Number(
      document.getElementById(
        "legFormat"
      ).value
    );


  if (!startDate || !endDate) {

    alert(
      "⚠️ Select both season dates."
    );

    return;

  }


  if (
    new Date(endDate) <
    new Date(startDate)
  ) {

    alert(
      "⚠️ End date cannot be before start date."
    );

    return;

  }


  if (fixtures.length === 0) {

    season.legs = legs;

    generateFixtures();

  }


  if (fixtures.length === 0) {

    return;

  }


  season = {

    started: true,

    startDate: startDate,

    endDate: endDate,

    legs: legs

  };


  await saveCompetition();


  displaySeason();

  updateRegistrationStatus();

  displayFixtures();


  alert(
    "🏆 SEASON STARTED!\n\n" +
    "🔒 Registration is now closed."
  );

}


/* =========================
   REOPEN REGISTRATION
========================= */

async function reopenRegistration() {

  if (!adminLoggedIn) {

    alert(
      "🔒 Admin login required."
    );

    return;

  }


  season.started = false;


  await saveCompetition();


  updateRegistrationStatus();

  displaySeason();


  alert(
    "🔓 Registration reopened."
  );

}


/* =========================
   REGISTRATION STATUS
========================= */

function updateRegistrationStatus() {

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

  }

  else {

    registrationMessage.textContent =
      "";

  }

}


/* =========================
   MANAGE TEAMS
========================= */

async function manageTeams() {

  if (!adminLoggedIn) {

    alert(
      "🔒 Admin login required."
    );

    return;

  }


  if (season.started) {

    alert(
      "🔒 Teams cannot be edited after the season starts."
    );

    return;

  }


  if (teams.length === 0) {

    alert(
      "⚠️ No teams registered."
    );

    return;

  }


  let list =
    "👥 REGISTERED TEAMS\n\n";


  teams.forEach(function(team, index) {

    list +=
      (index + 1) +
      ". " +
      team.teamName +
      " — " +
      team.playerName +
      "\n";

  });


  const choice =
    prompt(
      list +
      "\n\nEnter team number:"
    );


  if (choice === null) {
    return;
  }


  const index =
    Number(choice) - 1;


  if (
    index < 0 ||
    index >= teams.length
  ) {

    alert(
      "❌ Invalid team number."
    );

    return;

  }


  const action =
    prompt(
      "1 = Edit Team\n" +
      "2 = Remove Team"
    );


  if (action === "1") {

    const newName =
      prompt(
        "New team name:",
        teams[index].teamName
      );


    const newPlayer =
      prompt(
        "New player name:",
        teams[index].playerName
      );


    if (
      !newName ||
      !newPlayer
    ) {

      return;

    }


    teams[index].teamName =
      newName.trim();

    teams[index].playerName =
      newPlayer.trim();


    fixtures = [];


    await saveCompetition();


    displayTeams();

    displayTable();

    displayFixtures();


    alert(
      "✅ Team updated."
    );

  }


  if (action === "2") {

    const confirmed =
      confirm(
        "Remove " +
        teams[index].teamName +
        "?"
      );


    if (!confirmed) {
      return;
    }


    teams.splice(index, 1);


    fixtures = [];


    await saveCompetition();


    displayTeams();

    displayTable();

    displayFixtures();


    alert(
      "🗑️ Team removed."
    );

  }

}


/* =========================
   CLEAR COMPETITION
========================= */

async function clearCompetition() {

  if (!adminLoggedIn) {

    alert(
      "🔒 Admin login required."
    );

    return;

  }


  const confirmed =
    confirm(
      "⚠️ CLEAR EVERYTHING?\n\n" +
      "This will remove teams, fixtures and season data."
    );


  if (!confirmed) {
    return;
  }


  teams = [];

  fixtures = [];


  season = {

    started: false,

    startDate: null,

    endDate: null,

    legs: 1

  };


  await saveCompetition();


  displayTeams();

  displayFixtures();

  displayTable();

  displaySeason();

  updateRegistrationStatus();


  alert(
    "🗑️ Competition cleared."
  );

}


/* =========================
   FIREBASE ADMIN LOGIN
========================= */

async function adminLogin() {
alert("NEW ADMIN LOGIN CODE IS RUNNING");

  if (!window.auth) {
  alert("❌ Firebase Authentication is not ready.");
  return;
}


  if (adminLoggedIn) {

    displayAdminDashboard();

    return;

  }


  const email =
    prompt(
      "📧 Enter Admin Email:"
    );


  if (!email) {
    return;
  }


  const password =
    prompt(
      "🔐 Enter Admin Password:"
    );


  if (!password) {
    return;
  }


  try {

    const result =
      await signInWithEmailAndPassword(
        window.auth,
        email.trim(),
        password
      );


    currentAdmin =
      result.user;

    adminLoggedIn = true;


    alert(
      "✅ Admin login successful!"
    );


    displayAdminDashboard();

    displayFixtures();

  } catch (error) {
  console.error("ADMIN LOGIN ERROR:", error);

  alert(
    "FIREBASE ERROR:\n\n" +
    "Code: " + error.code + "\n\n" +
    "Message: " + error.message
  );
}

}


/* =========================
   ADMIN LOGOUT
========================= */

async function adminLogout() {

  if (!window.auth) {
    return;
  }


  try {

    await signOut(
      window.auth
    );


    adminLoggedIn = false;

    currentAdmin = null;


    alert(
      "👋 Admin logged out."
    );


    displayFixtures();

    const adminContent =
      document.getElementById(
        "adminContent"
      );


    adminContent.innerHTML =
      "<p>🔐 Admin login required.</p>";

  } catch (error) {

    console.error(
      "Logout failed:",
      error
    );

  }

}


/* =========================
   AUTH STATE
========================= */

function setupAuthListener() {

  if (!window.auth) {

    console.error(
      "Firebase Authentication unavailable."
    );

    return;

  }


  onAuthStateChanged(
    window.auth,
    function(user) {

      if (user) {

        adminLoggedIn = true;

        currentAdmin = user;

        displayAdminDashboard();

        displayFixtures();

      } else {

        adminLoggedIn = false;

        currentAdmin = null;

        displayFixtures();

      }

    }
  );

}


/* =========================
   ADMIN DASHBOARD
========================= */

function displayAdminDashboard() {

  if (!adminLoggedIn) {
    return;
  }


  const adminContent =
    document.getElementById(
      "adminContent"
    );


  adminContent.innerHTML = `

    <div class="admin-box">

      <h3>
        👋 Welcome, Admin
      </h3>

      <p>
        Admin:
        <strong>
          ${escapeHTML(
            currentAdmin?.email || ""
          )}
        </strong>
      </p>

      <p>
        Registered Teams:
        <strong>
          ${teams.length}
        </strong>
      </p>


      <label>
        📅 Season Start Date
      </label>

      <input
        type="date"
        id="seasonStart"
      >


      <label>
        📅 Season End Date
      </label>

      <input
        type="date"
        id="seasonEnd"
      >


      <label>
        ⚽ League Format
      </label>

      <select id="legFormat">

        <option value="1">
          1 Leg
        </option>

        <option value="2">
          2 Legs
        </option>

      </select>


      <div class="admin-buttons">

        <button
          onclick="generateFixtures()"
        >
          📅 Generate Fixtures
        </button>


        <button
          onclick="startSeason()"
        >
          🏆 Start Season
        </button>


        <button
          onclick="manageTeams()"
        >
          👥 Manage Teams
        </button>


        <button
          onclick="reopenRegistration()"
        >
          🔓 Reopen Registration
        </button>


        <button
          onclick="clearCompetition()"
        >
          🗑️ Clear Competition
        </button>


        <button
          onclick="adminLogout()"
        >
          🚪 Logout
        </button>

      </div>

    </div>

  `;


  if (season.startDate) {

    document.getElementById(
      "seasonStart"
    ).value =
      season.startDate;

  }


  if (season.endDate) {

    document.getElementById(
      "seasonEnd"
    ).value =
      season.endDate;

  }


  document.getElementById(
    "legFormat"
  ).value =
    season.legs || 1;

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
    document.createElement("div");

  div.textContent =
    String(value ?? "");

  return div.innerHTML;

}


/* =========================
   STARTUP
========================= */

displayTeams();

displayFixtures();

displayTable();

displaySeason();


window.showRegister =
  function() {

    document
      .getElementById("register")
      .scrollIntoView({
        behavior: "smooth"
      });

  };


window.adminLogin =
  adminLogin;

window.adminLogout =
  adminLogout;

window.generateFixtures =
  generateFixtures;

window.startSeason =
  startSeason;

window.reopenRegistration =
  reopenRegistration;

window.manageTeams =
  manageTeams;

window.clearCompetition =
  clearCompetition;

window.enterResult =
  enterResult;


/* =========================
   WAIT FOR FIREBASE
========================= */

setTimeout(
  setupAuthListener,
  1000
);

setTimeout(
  loadCompetition,
  1000
);