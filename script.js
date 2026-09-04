import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================
   ADMIN SETTINGS
========================= */

const ADMIN_EMAIL =
  "obakimoprecious07@gmail.com";


/* =========================
   COMPETITION DATA
========================= */

let teams = [];

let fixtures = [];

let season = {
  started: false,
  startDate: null,
  endDate: null,
  legs: 1
};


/* =========================
   ADMIN STATE
========================= */

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
   CHECK ADMIN
========================= */

function isAdminUser() {

  if (!currentAdmin) {
    return false;
  }

  if (!currentAdmin.email) {
    return false;
  }

  return (
    currentAdmin.email.toLowerCase() ===
    ADMIN_EMAIL.toLowerCase()
  );

}


/* =========================
   SAVE COMPETITION
========================= */

async function saveCompetition() {

  if (!window.db) {

    console.error(
      "Firebase database unavailable."
    );

    return false;

  }


  if (!isAdminUser()) {

    console.error(
      "Unauthorized competition save."
    );

    return false;

  }


  try {

    await setDoc(
      doc(
        window.db,
        "competition",
        "main"
      ),
      {
        teams: teams,
        fixtures: fixtures,
        season: season
      }
    );


    console.log(
      "Competition saved successfully."
    );


    return true;

  } catch (error) {

    console.error(
      "Save failed:",
      error
    );


    alert(
      "❌ Unable to save competition data."
    );


    return false;

  }

}


/* =========================
   LOAD COMPETITION
========================= */

async function loadCompetition() {

  if (!window.db) {

    console.error(
      "Firebase database unavailable."
    );

    return;

  }


  try {

    const snapshot =
      await getDocs(
        collection(
          window.db,
          "competition"
        )
      );


    snapshot.forEach(
      function(item) {

        if (item.id !== "main") {
          return;
        }


        const data =
          item.data();


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

      }
    );


    displayTeams();

    displayFixtures();

    displayTable();

    displaySeason();

    updateRegistrationStatus();


  } catch (error) {

    console.error(
      "Load failed:",
      error
    );

  }

}


/* =========================
   PUBLIC REGISTRATION
========================= */

if (form) {

  form.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      if (season.started) {

        registrationMessage.textContent =
          "🔒 Registration is closed.";

        return;

      }


      if (!window.db) {

        registrationMessage.textContent =
          "❌ Database is unavailable.";

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


      /* =========================
         VALIDATION
      ========================= */

      if (
        !teamName ||
        !playerName
      ) {

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


      /* =========================
         CHECK APPROVED TEAMS
      ========================= */

      const cleanName =
        teamName
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();


      const duplicate =
        teams.some(
          function(team) {

            const existingName =
              String(
                team.teamName || ""
              )
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();


            return (
              existingName ===
              cleanName
            );

          }
        );


      if (duplicate) {

        registrationMessage.textContent =
          "⚠️ This team name is already registered.";

        return;

      }


      /* =========================
         SEND REGISTRATION
      ========================= */

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

  if (!teamList) {
    return;
  }


  if (teams.length === 0) {

    teamList.innerHTML =
      "<p>No teams registered yet.</p>";

    return;

  }


  teamList.innerHTML = "";


  teams.forEach(
    function(team) {

      const card =
        document.createElement("div");


      card.className =
        "team-card";


      card.innerHTML = `

        <h3>
          ⚽ ${escapeHTML(
            team.teamName
          )}
        </h3>

        <p>
          ${escapeHTML(
            team.playerName
          )}
        </p>

      `;


      teamList.appendChild(
        card
      );

    }
  );

}


/* =========================
   DISPLAY TABLE
========================= */

function displayTable() {

  if (!leagueTable) {
    return;
  }


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


  inputs.forEach(
    function(element) {

      element.disabled =
        season.started;

    }
  );


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
   FIXTURE GENERATION
========================= */

async function generateFixtures() {

  if (!isAdminUser()) {
    alert("🔒 Admin login required.");
    return;
  }

  if (season.started) {
    alert("🔒 The season has already started.");
    return;
  }

  if (teams.length < 2) {
    alert("❌ You need at least 2 teams.");
    return;
  }

  fixtures = [];

  let list = teams.map(function(team) {
    return team.teamName;
  });

  if (list.length % 2 !== 0) {
    list.push("BYE");
  }

  const total = list.length;
  const rounds = total - 1;
  const matches = total / 2;

  for (let round = 0; round < rounds; round++) {

    for (let i = 0; i < matches; i++) {

      const home = list[i];
      const away = list[total - 1 - i];

      if (home !== "BYE" && away !== "BYE") {

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

    list.splice(1, 0, list.pop());

  }


  /* =========================
     SECOND LEG
  ========================= */

  if (season.legs === 2) {

    const firstLeg = [...fixtures];

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

  const saved = await saveCompetition();

  if (saved) {

    alert(
      "✅ " +
      fixtures.length +
      " fixtures generated."
    );

  }

}


/* =========================
   DISPLAY FIXTURES
========================= */

function displayFixtures() {

  if (!fixtureList) {
    return;
  }

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

          ${escapeHTML(
            fixture.home
          )}

          🆚

          ${escapeHTML(
            fixture.away
          )}

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


      if (adminLoggedIn) {

        const button =
          document.createElement("button");

        button.textContent =
          "🏆 Enter Result";

        button.onclick =
          function() {

            enterResult(index);

          };

        match.appendChild(
          button
        );

      } else {

        const waiting =
          document.createElement("span");

        waiting.textContent =
          "⏳ Awaiting Result";

        match.appendChild(
          waiting
        );

      }

    }


    fixtureList.appendChild(
      match
    );

  });

}


/* =========================
   ENTER RESULT
========================= */

async function enterResult(index) {

  if (!isAdminUser()) {

    alert(
      "🔒 Admin login required."
    );

    return;

  }

  const fixture =
    fixtures[index];

  if (!fixture) {

    alert(
      "❌ Fixture not found."
    );

    return;

  }

  if (fixture.completed) {

    alert(
      "⚠️ This match is already completed."
    );

    return;

  }


  const homeInput =
    prompt(
      fixture.home +
      " score:"
    );

  if (homeInput === null) {
    return;
  }


  const awayInput =
    prompt(
      fixture.away +
      " score:"
    );

  if (awayInput === null) {
    return;
  }


  const homeScore =
    Number(homeInput);

  const awayScore =
    Number(awayInput);


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


  homeTeam.played =
    (homeTeam.played || 0) + 1;

  awayTeam.played =
    (awayTeam.played || 0) + 1;


  homeTeam.goalsFor =
    (homeTeam.goalsFor || 0) +
    homeScore;

  homeTeam.goalsAgainst =
    (homeTeam.goalsAgainst || 0) +
    awayScore;


  awayTeam.goalsFor =
    (awayTeam.goalsFor || 0) +
    awayScore;

  awayTeam.goalsAgainst =
    (awayTeam.goalsAgainst || 0) +
    homeScore;


  if (homeScore > awayScore) {

    homeTeam.wins =
      (homeTeam.wins || 0) + 1;

    homeTeam.points =
      (homeTeam.points || 0) + 3;

    awayTeam.losses =
      (awayTeam.losses || 0) + 1;

  }

  else if (homeScore < awayScore) {

    awayTeam.wins =
      (awayTeam.wins || 0) + 1;

    awayTeam.points =
      (awayTeam.points || 0) + 3;

    homeTeam.losses =
      (homeTeam.losses || 0) + 1;

  }

  else {

    homeTeam.draws =
      (homeTeam.draws || 0) + 1;

    awayTeam.draws =
      (awayTeam.draws || 0) + 1;

    homeTeam.points =
      (homeTeam.points || 0) + 1;

    awayTeam.points =
      (awayTeam.points || 0) + 1;

  }


  fixture.homeScore =
    homeScore;

  fixture.awayScore =
    awayScore;

  fixture.completed =
    true;


  const saved =
    await saveCompetition();


  if (!saved) {
    return;
  }


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

  if (!seasonDetails) {
    return;
  }


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

        Leg${
          season.legs === 1
            ? ""
            : "s"
        }

      </p>

    </div>

  `;

}


/* =========================
   START SEASON
========================= */

async function startSeason() {

  if (!isAdminUser()) {

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
    )?.value;


  const endDate =
    document.getElementById(
      "seasonEnd"
    )?.value;


  const legs =
    Number(
      document.getElementById(
        "legFormat"
      )?.value
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


  if (
    legs !== 1 &&
    legs !== 2
  ) {

    alert(
      "⚠️ Invalid league format."
    );

    return;

  }


  season.legs =
    legs;


  if (fixtures.length === 0) {

    await generateFixtures();

  }


  if (fixtures.length === 0) {

    alert(
      "❌ Fixtures could not be generated."
    );

    return;

  }


  season = {

    started:
      true,

    startDate:
      startDate,

    endDate:
      endDate,

    legs:
      legs

  };


  const saved =
    await saveCompetition();


  if (!saved) {
    return;
  }


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

  if (!isAdminUser()) {

    alert(
      "🔒 Admin login required."
    );

    return;

  }


  season.started =
    false;


  const saved =
    await saveCompetition();


  if (!saved) {
    return;
  }


  updateRegistrationStatus();

  displaySeason();


  alert(
    "🔓 Registration reopened."
  );

}


/* =========================
   MANAGE TEAMS
========================= */

async function manageTeams() {

  if (!isAdminUser()) {

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
    "👥 APPROVED TEAMS\n\n";


  teams.forEach(
    function(team, index) {

      list +=
        (index + 1) +
        ". " +
        team.teamName +
        " — " +
        team.playerName +
        "\n";

    }
  );


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


    const saved =
      await saveCompetition();


    if (!saved) {
      return;
    }


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


    teams.splice(
      index,
      1
    );


    fixtures = [];


    const saved =
      await saveCompetition();


    if (!saved) {
      return;
    }


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

  if (!isAdminUser()) {

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

    started:
      false,

    startDate:
      null,

    endDate:
      null,

    legs:
      1

  };


  const saved =
    await saveCompetition();


  if (!saved) {
    return;
  }


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
   ADMIN LOGIN
========================= */

async function adminLogin() {

  if (!window.auth) {

    alert(
      "❌ Firebase Authentication is not ready."
    );

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


    /* =========================
       VERIFY ADMIN ACCOUNT
    ========================= */

    if (
      !result.user.email ||
      result.user.email.toLowerCase() !==
      ADMIN_EMAIL.toLowerCase()
    ) {

      await signOut(
        window.auth
      );


      alert(
        "❌ This account is not authorized as admin."
      );

      return;

    }


    currentAdmin =
      result.user;


    adminLoggedIn =
      true;


    alert(
      "✅ Admin login successful!"
    );


    displayAdminDashboard();

    displayFixtures();

    await loadRegistrations();


  } catch (error) {

    console.error(
      "ADMIN LOGIN ERROR:",
      error
    );


    alert(
      "❌ Login failed.\n\n" +
      "Code: " +
      error.code +
      "\n\n" +
      "Message: " +
      error.message
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


    adminLoggedIn =
      false;


    currentAdmin =
      null;


    alert(
      "👋 Admin logged out."
    );


    displayFixtures();


    const adminContent =
      document.getElementById(
        "adminContent"
      );


    if (adminContent) {

      adminContent.innerHTML =
        "<p>🔐 Admin login required.</p>";

    }


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
    async function(user) {

      /* =========================
         NO USER
      ========================= */

      if (!user) {

        adminLoggedIn =
          false;

        currentAdmin =
          null;


        displayFixtures();

        return;

      }


      /* =========================
         CHECK ADMIN EMAIL
      ========================= */

      if (
        !user.email ||
        user.email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
      ) {

        await signOut(
          window.auth
        );


        adminLoggedIn =
          false;

        currentAdmin =
          null;


        return;

      }


      /* =========================
         ADMIN AUTHENTICATED
      ========================= */

      adminLoggedIn =
        true;


      currentAdmin =
        user;


      displayAdminDashboard();

      displayFixtures();

      await loadRegistrations();

    }
  );

}


/* =========================
   LOAD REGISTRATIONS
========================= */

async function loadRegistrations() {

  if (!isAdminUser()) {
    return;
  }


  if (!window.db) {
    return;
  }


  try {

    const snapshot =
      await getDocs(
        collection(
          window.db,
          "registrations"
        )
      );


    const pending = [];


    snapshot.forEach(
      function(item) {

        const data =
          item.data();


        /* Older registrations without
           status are treated as pending */

        const status =
          data.status ||
          "pending";


        if (
          status ===
          "pending"
        ) {

          pending.push({

            id:
              item.id,

            teamName:
              data.teamName || "",

            playerName:
              data.playerName || "",

            createdAt:
              data.createdAt || 0

          });

        }

      }
    );


    pending.sort(
      function(a, b) {

        return (
          b.createdAt -
          a.createdAt
        );

      }
    );


    displayPendingRegistrations(
      pending
    );


  } catch (error) {

    console.error(
      "Unable to load registrations:",
      error
    );

  }

}


/* =========================
   DISPLAY PENDING
   REGISTRATIONS
========================= */

function displayPendingRegistrations(
  pending
) {

  const box =
    document.getElementById(
      "pendingRegistrations"
    );


  if (!box) {
    return;
  }


  box.innerHTML = "";


  const heading =
    document.createElement(
      "h3"
    );


  heading.textContent =
    "📥 Pending Registrations";


  box.appendChild(
    heading
  );


  if (pending.length === 0) {

    const empty =
      document.createElement(
        "p"
      );


    empty.textContent =
      "No pending registrations.";


    box.appendChild(
      empty
    );


    return;

  }


  pending.forEach(
    function(registration) {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "pending-registration";


      const info =
        document.createElement(
          "div"
        );


      info.innerHTML = `

        <strong>
          ⚽ ${escapeHTML(
            registration.teamName
          )}
        </strong>

        <p>
          Player:
          ${escapeHTML(
            registration.playerName
          )}
        </p>

      `;


      card.appendChild(
        info
      );


      /* =========================
         APPROVE
      ========================= */

      const approveButton =
        document.createElement(
          "button"
        );


      approveButton.textContent =
        "✅ Approve";


      approveButton.onclick =
        function() {

          approveRegistration(
            registration.id,
            registration.teamName,
            registration.playerName
          );

        };


      card.appendChild(
        approveButton
      );


      /* =========================
         REJECT
      ========================= */

      const rejectButton =
        document.createElement(
          "button"
        );


      rejectButton.textContent =
        "❌ Reject";


      rejectButton.onclick =
        function() {

          rejectRegistration(
            registration.id
          );

        };


      card.appendChild(
        rejectButton
      );


      box.appendChild(
        card
      );

    }
  );

}


/* =========================
   APPROVE REGISTRATION
========================= */

async function approveRegistration(
  registrationId,
  teamName,
  playerName
) {

  if (!isAdminUser()) {

    alert(
      "🔒 Admin login required."
    );

    return;

  }


  if (season.started) {

    alert(
      "🔒 The season has already started."
    );

    return;

  }


  if (
    !registrationId ||
    !teamName ||
    !playerName
  ) {

    alert(
      "❌ Invalid registration."
    );

    return;

  }


  /* =========================
     CHECK DUPLICATE
  ========================= */

  const cleanName =
    teamName
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();


  const duplicate =
    teams.some(
      function(team) {

        const existingName =
          String(
            team.teamName || ""
          )
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();


        return (
          existingName ===
          cleanName
        );

      }
    );


  if (duplicate) {

    alert(
      "⚠️ This team is already approved."
    );

    return;

  }


  /* =========================
     CREATE TEAM
  ========================= */

  const newTeam = {

    id:
      Date.now().toString(),

    teamName:
      teamName.trim(),

    playerName:
      playerName.trim(),

    played:
      0,

    wins:
      0,

    draws:
      0,

    losses:
      0,

    goalsFor:
      0,

    goalsAgainst:
      0,

    points:
      0

  };


  teams.push(
    newTeam
  );


  /* =========================
     SAVE TEAM
  ========================= */

  const saved =
    await saveCompetition();


  if (!saved) {

    teams.pop();

    return;

  }


  /* =========================
     DELETE PENDING REQUEST
  ========================= */

  try {

    await deleteDoc(
      doc(
        window.db,
        "registrations",
        registrationId
      )
    );


  } catch (error) {

    console.error(
      "Unable to remove registration:",
      error
    );

  }


  displayTeams();

  displayTable();

  displayFixtures();

  displayAdminDashboard();


  alert(
    "✅ Team approved successfully!"
  );

}


/* =========================
   REJECT REGISTRATION
========================= */

async function rejectRegistration(
  registrationId
) {

  if (!isAdminUser()) {

    alert(
      "🔒 Admin login required."
    );

    return;

  }


  if (!registrationId) {
    return;
  }


  const confirmed =
    confirm(
      "❌ Reject this registration?"
    );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        window.db,
        "registrations",
        registrationId
      )
    );


    await loadRegistrations();


    alert(
      "🗑️ Registration rejected."
    );


  } catch (error) {

    console.error(
      "Reject failed:",
      error
    );


    alert(
      "❌ Unable to reject registration."
    );

  }

}


/* =========================
   ADMIN DASHBOARD
========================= */

function displayAdminDashboard() {

  if (!isAdminUser()) {
    return;
  }


  const adminContent =
    document.getElementById(
      "adminContent"
    );


  if (!adminContent) {
    return;
  }


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
        Approved Teams:
        <strong>
          ${teams.length}
        </strong>
      </p>

      <hr>

      <h3>
        ⚙️ Competition Settings
      </h3>

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
          id="generateFixturesButton"
        >
          📅 Generate Fixtures
        </button>

        <button
          id="startSeasonButton"
        >
          🏆 Start Season
        </button>

        <button
          id="manageTeamsButton"
        >
          👥 Manage Teams
        </button>

        <button
          id="reopenRegistrationButton"
        >
          🔓 Reopen Registration
        </button>

        <button
          id="clearCompetitionButton"
        >
          🗑️ Clear Competition
        </button>

        <button
          id="logoutButton"
        >
          🚪 Logout
        </button>

      </div>

      <hr>

      <div id="pendingRegistrations">

        <p>
          Loading registrations...
        </p>

      </div>

    </div>

  `;


  /* =========================
     BUTTONS
  ========================= */

  document
    .getElementById(
      "generateFixturesButton"
    )
    ?.addEventListener(
      "click",
      generateFixtures
    );


  document
    .getElementById(
      "startSeasonButton"
    )
    ?.addEventListener(
      "click",
      startSeason
    );


  document
    .getElementById(
      "manageTeamsButton"
    )
    ?.addEventListener(
      "click",
      manageTeams
    );


  document
    .getElementById(
      "reopenRegistrationButton"
    )
    ?.addEventListener(
      "click",
      reopenRegistration
    );


  document
    .getElementById(
      "clearCompetitionButton"
    )
    ?.addEventListener(
      "click",
      clearCompetition
    );


  document
    .getElementById(
      "logoutButton"
    )
    ?.addEventListener(
      "click",
      adminLogout
    );


  /* =========================
     RESTORE SETTINGS
  ========================= */

  const startInput =
    document.getElementById(
      "seasonStart"
    );


  const endInput =
    document.getElementById(
      "seasonEnd"
    );


  const legInput =
    document.getElementById(
      "legFormat"
    );


  if (
    startInput &&
    season.startDate
  ) {

    startInput.value =
      season.startDate;

  }


  if (
    endInput &&
    season.endDate
  ) {

    endInput.value =
      season.endDate;

  }


  if (legInput) {

    legInput.value =
      season.legs || 1;

  }


  loadRegistrations();

}


/* =========================
   FORMAT DATE
========================= */

function formatDate(date) {

  if (!date) {
    return "Not set";
  }


  const value =
    new Date(
      date +
      "T00:00:00"
    );


  return value.toLocaleDateString(
    "en-GB",
    {

      day:
        "numeric",

      month:
        "long",

      year:
        "numeric"

    }
  );

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    String(
      value ?? ""
    );


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


    if (!register) {
      return;
    }


    register.scrollIntoView({
      behavior:
        "smooth"
    });

  };


/* =========================
   GLOBAL FUNCTIONS
========================= */

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


window.approveRegistration =
  approveRegistration;


window.rejectRegistration =
  rejectRegistration;


/* =========================
   START APPLICATION
========================= */

displayTeams();

displayFixtures();

displayTable();

displaySeason();


/* =========================
   WAIT FOR FIREBASE
========================= */

setTimeout(
  function() {

    setupAuthListener();

  },
  1000
);


setTimeout(
  function() {

    loadCompetition();

  },
  1000
);