import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


const ADMIN_EMAIL =
  "obakimoprecious07@gmail.com";


let currentAdmin = null;

let teams = [];

let fixtures = [];

let season = {
  started: false,
  startDate: null,
  endDate: null,
  legs: 1
};

let registrationUnsubscribe =
  null;


const loginSection =
  document.getElementById(
    "adminLogin"
  );

const dashboard =
  document.getElementById(
    "adminDashboard"
  );

const loginForm =
  document.getElementById(
    "adminLoginForm"
  );

const loginMessage =
  document.getElementById(
    "adminLoginMessage"
  );

const pendingBox =
  document.getElementById(
    "pendingRegistrations"
  );

const adminTeamList =
  document.getElementById(
    "adminTeamList"
  );

const adminFixtureList =
  document.getElementById(
    "adminFixtureList"
  );

const adminTable =
  document.getElementById(
    "adminLeagueTable"
  );

const adminSeasonDetails =
  document.getElementById(
    "adminSeasonDetails"
  );


function isAdmin() {

  return (
    currentAdmin &&
    currentAdmin.email &&
    currentAdmin.email.toLowerCase() ===
    ADMIN_EMAIL.toLowerCase()
  );
}


function normalizeTeamName(name) {

  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
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

    const snapshot =
      await getDoc(
        doc(
          window.db,
          "competition",
          "main"
        )
      );


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


    displayEverything();

  } catch (error) {

    console.error(
      "Competition load failed:",
      error
    );
  }
}


async function saveCompetition() {

  if (!isAdmin()) {

    alert(
      "🔒 Admin login required."
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


    return true;

  } catch (error) {

    console.error(
      "Save failed:",
      error
    );

    alert(
      "❌ Unable to save competition."
    );

    return false;
  }
}


if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      const email =
        document.getElementById(
          "adminEmail"
        )?.value.trim();


      const password =
        document.getElementById(
          "adminPassword"
        )?.value;


      if (!email || !password) {

        showLoginMessage(
          "⚠️ Enter your email and password."
        );

        return;
      }


      showLoginMessage(
        "⏳ Signing in..."
      );


      try {

        const result =
          await signInWithEmailAndPassword(
            window.auth,
            email,
            password
          );


        if (
          !result.user.email ||
          result.user.email.toLowerCase() !==
          ADMIN_EMAIL.toLowerCase()
        ) {

          await signOut(
            window.auth
          );

          showLoginMessage(
            "❌ This account is not authorized."
          );

          return;
        }


        currentAdmin =
          result.user;


        await loadCompetition();

        showDashboard();

        startRegistrationListener();


      } catch (error) {

        console.error(
          "Login failed:",
          error
        );

        showLoginMessage(
          "❌ Login failed. Check your email and password."
        );
      }
    }
  );
}


function showLoginMessage(message) {

  if (loginMessage) {
    loginMessage.textContent =
      message;
  }
}


function showLogin() {

  if (loginSection) {
    loginSection.style.display =
      "block";
  }

  if (dashboard) {
    dashboard.style.display =
      "none";
  }
}


function showDashboard() {

  if (loginSection) {
    loginSection.style.display =
      "none";
  }

  if (dashboard) {
    dashboard.style.display =
      "block";
  }

  displayEverything();
}

async function adminLogout() {

  if (!window.auth) return;


  try {

    stopRegistrationListener();

    await signOut(
      window.auth
    );

    currentAdmin = null;

    showLogin();

  } catch (error) {

    console.error(
      "Logout failed:",
      error
    );
  }
}


function setupAuth() {

  if (
    !window.auth
  ) {

    setTimeout(
      setupAuth,
      500
    );

    return;
  }


  onAuthStateChanged(
    window.auth,
    async function(user) {

      if (!user) {

        currentAdmin = null;

        stopRegistrationListener();

        showLogin();

        return;
      }


      if (
        !user.email ||
        user.email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
      ) {

        await signOut(
          window.auth
        );

        return;
      }


      currentAdmin =
        user;


      await loadCompetition();

      showDashboard();

      startRegistrationListener();

    }
  );
}


function startRegistrationListener() {

  if (!isAdmin()) return;

  if (!window.db) return;


  stopRegistrationListener();


  registrationUnsubscribe =
    onSnapshot(
      collection(
        window.db,
        "registrations"
      ),
      function(snapshot) {

        const pending = [];


        snapshot.forEach(
          function(item) {

            const data =
              item.data();


            if (
              (data.status ||
                "pending") ===
              "pending"
            ) {

              pending.push({

                id:
                  item.id,

                teamName:
                  data.teamName ||
                  "",

                playerName:
                  data.playerName ||
                  "",

                createdAt:
                  data.createdAt ||
                  0

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

      },
      function(error) {

        console.error(
          "Live registration error:",
          error
        );

      }
    );
}


function stopRegistrationListener() {

  if (
    registrationUnsubscribe
  ) {

    registrationUnsubscribe();

    registrationUnsubscribe =
      null;
  }
}


function displayPendingRegistrations(
  pending
) {

  if (!pendingBox) return;


  pendingBox.innerHTML = "";


  if (pending.length === 0) {

    pendingBox.innerHTML =
      "<p>No pending registrations.</p>";

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


      const title =
        document.createElement(
          "h3"
        );


      title.textContent =
        "⚽ " +
        registration.teamName;


      const player =
        document.createElement(
          "p"
        );


      player.textContent =
        "Player: " +
        registration.playerName;


      const approve =
        document.createElement(
          "button"
        );


      approve.textContent =
        "✅ Approve";


      approve.onclick =
        function() {

          approveRegistration(
            registration
          );

        };


      const reject =
        document.createElement(
          "button"
        );


      reject.textContent =
        "❌ Reject";


      reject.onclick =
        function() {

          rejectRegistration(
            registration.id
          );

        };


      card.appendChild(title);

      card.appendChild(player);

      card.appendChild(approve);

      card.appendChild(reject);


      pendingBox.appendChild(
        card
      );

    }
  );
}


async function approveRegistration(
  registration
) {

  if (!isAdmin()) {

    alert(
      "🔒 Admin login required."
    );

    return;
  }


  if (season.started) {

    alert(
      "🔒 Season has already started."
    );

    return;
  }


  const teamName =
    registration.teamName.trim();


  const playerName =
    registration.playerName.trim();


  const duplicate =
    teams.some(
      function(team) {

        return (
          normalizeTeamName(
            team.teamName
          ) ===
          normalizeTeamName(
            teamName
          )
        );

      }
    );


  if (duplicate) {

    alert(
      "⚠️ This team is already approved."
    );

    return;
  }


  const newTeam = {

    id:
      Date.now().toString(),

    teamName:
      teamName,

    playerName:
      playerName,

    played: 0,

    wins: 0,

    draws: 0,

    losses: 0,

    goalsFor: 0,

    goalsAgainst: 0,

    points: 0

  };


  teams.push(
    newTeam
  );


  const saved =
    await saveCompetition();


  if (!saved) {

    teams.pop();

    return;
  }


  try {

    await deleteDoc(
      doc(
        window.db,
        "registrations",
        registration.id
      )
    );

  } catch (error) {

    console.error(
      "Registration deletion failed:",
      error
    );
  }


  displayEverything();

}


async function rejectRegistration(
  registrationId
) {

  if (!isAdmin()) {

    alert(
      "🔒 Admin login required."
    );

    return;
  }


  if (
    !confirm(
      "Reject this registration?"
    )
  ) {

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


async function generateFixtures() {

  if (!isAdmin()) {

    alert(
      "🔒 Admin login required."
    );

    return;
  }


  if (season.started) {

    alert(
      "🔒 Season has already started."
    );

    return;
  }


  if (teams.length < 2) {

    alert(
      "❌ You need at least 2 approved teams."
    );

    return;
  }


  fixtures = [];


  let list =
    teams.map(
      function(team) {
        return team.teamName;
      }
    );


  if (
    list.length % 2 !== 0
  ) {

    list.push("BYE");
  }


  const total =
    list.length;

  const rounds =
    total - 1;

  const matches =
    total / 2;


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

      const home =
        list[i];

      const away =
        list[
          total - 1 - i
        ];


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

          day:
            round + 1,

          home:
            home,

          away:
            away,

          completed:
            false,

          homeScore:
            null,

          awayScore:
            null

        });

      }
    }


    list.splice(
      1,
      0,
      list.pop()
    );

  }


  if (
    season.legs === 2
  ) {

    const firstLeg =
      [...fixtures];


    firstLeg.forEach(
      function(fixture) {

        fixtures.push({

          id:
            "fixture-" +
            Date.now() +
            "-" +
            fixtures.length,

          day:
            fixture.day +
            rounds,

          home:
            fixture.away,

          away:
            fixture.home,

          completed:
            false,

          homeScore:
            null,

          awayScore:
            null

        });

      }
    );

  }


  const saved =
    await saveCompetition();


  if (!saved) return;


  displayEverything();


  alert(
    "✅ " +
    fixtures.length +
    " fixtures generated."
  );
}

async function startSeason() {

  if (!isAdmin()) {

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
      "❌ Approve at least 2 teams first."
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


  if (
    fixtures.length === 0
  ) {

    await generateFixtures();

  }


  if (
    fixtures.length === 0
  ) {

    alert(
      "❌ Fixtures could not be generated."
    );

    return;
  }


  season.started =
    true;

  season.startDate =
    startDate;

  season.endDate =
    endDate;


  const saved =
    await saveCompetition();


  if (!saved) return;


  displayEverything();


  alert(
    "🏆 SEASON STARTED!\n\n" +
    "🔒 Registration is now closed."
  );
}


async function reopenRegistration() {

  if (!isAdmin()) {

    alert(
      "🔒 Admin login required."
    );

    return;
  }


  season.started =
    false;


  const saved =
    await saveCompetition();


  if (!saved) return;


  displayEverything();


  alert(
    "🔓 Registration reopened."
  );
}


async function enterResult(index) {

  if (!isAdmin()) {

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
      "⚠️ This match already has a result."
    );

    return;
  }


  const homeInput =
    prompt(
      fixture.home +
      " score:"
    );


  if (
    homeInput === null
  ) return;


  const awayInput =
    prompt(
      fixture.away +
      " score:"
    );


  if (
    awayInput === null
  ) return;


  const homeScore =
    Number(homeInput);


  const awayScore =
    Number(awayInput);


  if (
    !Number.isInteger(
      homeScore
    ) ||
    !Number.isInteger(
      awayScore
    ) ||
    homeScore < 0 ||
    awayScore < 0
  ) {

    alert(
      "⚠️ Enter valid scores."
    );

    return;
  }


  const homeTeam =
    teams.find(
      function(team) {

        return (
          team.teamName ===
          fixture.home
        );

      }
    );


  const awayTeam =
    teams.find(
      function(team) {

        return (
          team.teamName ===
          fixture.away
        );

      }
    );


  if (
    !homeTeam ||
    !awayTeam
  ) {

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


  if (
    homeScore > awayScore
  ) {

    homeTeam.wins =
      (homeTeam.wins || 0) + 1;

    homeTeam.points =
      (homeTeam.points || 0) + 3;

    awayTeam.losses =
      (awayTeam.losses || 0) + 1;

  } else if (
    homeScore < awayScore
  ) {

    awayTeam.wins =
      (awayTeam.wins || 0) + 1;

    awayTeam.points =
      (awayTeam.points || 0) + 3;

    homeTeam.losses =
      (homeTeam.losses || 0) + 1;

  } else {

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


  if (!saved) return;


  displayEverything();


  alert(
    "✅ Match result saved!"
  );
}


async function manageTeams() {

  if (!isAdmin()) {

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
      "⚠️ No approved teams."
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


  if (
    choice === null
  ) return;


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


  if (
    action === "1"
  ) {

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
    ) return;


    const duplicate =
      teams.some(
        function(team, teamIndex) {

          if (
            teamIndex === index
          ) return false;


          return (
            normalizeTeamName(
              team.teamName
            ) ===
            normalizeTeamName(
              newName
            )
          );

        }
      );


    if (duplicate) {

      alert(
        "⚠️ That team name is already being used."
      );

      return;
    }


    teams[index].teamName =
      newName.trim();


    teams[index].playerName =
      newPlayer.trim();


    fixtures = [];


    const saved =
      await saveCompetition();


    if (!saved) return;


    displayEverything();


    alert(
      "✅ Team updated."
    );

  }


  if (
    action === "2"
  ) {

    const confirmed =
      confirm(
        "Remove " +
        teams[index].teamName +
        "?"
      );


    if (!confirmed) return;


    teams.splice(
      index,
      1
    );


    fixtures = [];


    const saved =
      await saveCompetition();


    if (!saved) return;


    displayEverything();


    alert(
      "🗑️ Team removed."
    );
  }
}


async function clearCompetition() {

  if (!isAdmin()) {

    alert(
      "🔒 Admin login required."
    );

    return;
  }


  const confirmed =
    confirm(
      "⚠️ CLEAR COMPETITION?\n\n" +
      "This removes approved teams, fixtures and season data."
    );


  if (!confirmed) return;


  teams = [];

  fixtures = [];


  season = {

    started: false,

    startDate: null,

    endDate: null,

    legs: 1

  };


  const saved =
    await saveCompetition();


  if (!saved) return;


  displayEverything();


  alert(
    "🗑️ Competition cleared."
  );
}

function displayEverything() {

  displayAdminTeams();

  displayAdminTable();

  displayAdminFixtures();

  displayAdminSeason();

}


function displayAdminTeams() {

  if (!adminTeamList) return;


  adminTeamList.innerHTML = "";


  if (teams.length === 0) {

    adminTeamList.innerHTML =
      "<p>No approved teams.</p>";

    return;
  }


  teams.forEach(
    function(team) {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "admin-team";


      item.textContent =
        team.teamName +
        " — " +
        team.playerName;


      adminTeamList.appendChild(
        item
      );

    }
  );
}


function displayAdminTable() {

  if (!adminTable) return;


  adminTable.innerHTML = "";


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


      adminTable.innerHTML += `
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


function displayAdminFixtures() {

  if (!adminFixtureList) return;


  adminFixtureList.innerHTML = "";


  if (fixtures.length === 0) {

    adminFixtureList.innerHTML =
      "<p>No fixtures generated.</p>";

    return;
  }


  let currentDay = 0;


  fixtures.forEach(
    function(fixture, index) {

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


        heading.textContent =
          "📅 Match Day " +
          fixture.day;


        adminFixtureList.appendChild(
          heading
        );
      }


      const match =
        document.createElement(
          "div"
        );


      match.className =
        "admin-fixture";


      const text =
        document.createElement(
          "span"
        );


      text.textContent =
        fixture.home +
        " 🆚 " +
        fixture.away;


      match.appendChild(
        text
      );


      if (
        fixture.completed
      ) {

        const score =
          document.createElement(
            "strong"
          );


        score.textContent =
          " " +
          fixture.homeScore +
          " - " +
          fixture.awayScore;


        match.appendChild(
          score
        );

      } else {

        const button =
          document.createElement(
            "button"
          );


        button.textContent =
          "🏆 Enter Result";


        button.onclick =
          function() {

            enterResult(
              index
            );

          };


        match.appendChild(
          button
        );
      }


      adminFixtureList.appendChild(
        match
      );

    }
  );
}


function displayAdminSeason() {

  if (!adminSeasonDetails) return;


  if (!season.started) {

    adminSeasonDetails.innerHTML =
      "<p>🟡 Season not started.</p>";

    return;
  }


  adminSeasonDetails.innerHTML = `
    <p>
      🟢 <strong>Season Active</strong>
    </p>

    <p>
      Start:
      ${formatDate(
        season.startDate
      )}
    </p>

    <p>
      End:
      ${formatDate(
        season.endDate
      )}
    </p>

    <p>
      Format:
      ${season.legs}
      Leg${season.legs === 1 ? "" : "s"}
    </p>
  `;
}


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


function startAdminWebsite() {

  if (
    !window.db ||
    !window.auth
  ) {

    setTimeout(
      startAdminWebsite,
      500
    );

    return;
  }


  setupAuth();

}


startAdminWebsite();