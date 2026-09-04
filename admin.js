import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const ADMIN_EMAIL = "obakimoprecious07@gmail.com";

let competitionData = {
  seasonStarted: false,
  registrationOpen: true,
  seasonStart: "",
  seasonEnd: "",
  legFormat: 1,
  teams: [],
  fixtures: []
};

let currentUser = null;

function $(id) {
  return document.getElementById(id);
}

function showMessage(message, success = false) {
  const box = $("adminLoginMessage");

  if (!box) return;

  box.textContent = message;
  box.style.color = success ? "green" : "red";
}

function isAdmin(user) {
  return user &&
    user.email &&
    user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

async function loadCompetition() {
  try {
    const ref = doc(window.db, "competition", "main");
    const snap = await getDoc(ref);

    if (snap.exists()) {
      competitionData = {
        ...competitionData,
        ...snap.data()
      };
    }

    renderAll();
  } catch (error) {
    console.error("Competition load error:", error);
  }
}

async function saveCompetition() {
  try {
    const ref = doc(window.db, "competition", "main");

    await setDoc(ref, competitionData);

    renderAll();
  } catch (error) {
    alert("❌ Could not save competition: " + error.message);
  }
}

function showDashboard() {
  $("adminLogin").style.display = "none";
  $("adminDashboard").style.display = "block";
}

function showLogin() {
  $("adminLogin").style.display = "block";
  $("adminDashboard").style.display = "none";
}

function renderAll() {
  renderSeason();
  renderTeams();
  renderTable();
  renderFixtures();
}

function renderSeason() {
  const box = $("adminSeasonDetails");

  if (!box) return;

  if (competitionData.seasonStarted) {
    box.innerHTML = `
      <p>🟢 Season is active.</p>
      <p>Start: ${competitionData.seasonStart || "Not set"}</p>
      <p>End: ${competitionData.seasonEnd || "Not set"}</p>
      <p>Format: ${competitionData.legFormat == 2 ? "2 Legs" : "1 Leg"}</p>
    `;
  } else {
    box.innerHTML = `
      <p>🟡 Season not started.</p>
    `;
  }

  if ($("seasonStart")) {
    $("seasonStart").value = competitionData.seasonStart || "";
  }

  if ($("seasonEnd")) {
    $("seasonEnd").value = competitionData.seasonEnd || "";
  }

  if ($("legFormat")) {
    $("legFormat").value = competitionData.legFormat || 1;
  }
}

function renderTeams() {
  const box = $("adminTeamList");

  if (!box) return;

  if (!competitionData.teams || competitionData.teams.length === 0) {
    box.innerHTML = "<p>No approved teams.</p>";
    return;
  }

  box.innerHTML = competitionData.teams.map((team, index) => `
    <div class="admin-team-card">
      <strong>${index + 1}. ${team.name}</strong>
      <p>Player: ${team.playerName || "Unknown"}</p>
    </div>
  `).join("");
}

function calculateTable() {
  const table = {};

  (competitionData.teams || []).forEach(team => {
    table[team.name] = {
      name: team.name,
      P: 0,
      W: 0,
      D: 0,
      L: 0,
      GF: 0,
      GA: 0,
      GD: 0,
      PTS: 0
    };
  });

  (competitionData.fixtures || []).forEach(match => {
    if (match.homeScore == null || match.awayScore == null) {
      return;
    }

    const home = table[match.home];
    const away = table[match.away];

    if (!home || !away) return;

    const hg = Number(match.homeScore);
    const ag = Number(match.awayScore);

    home.P++;
    away.P++;

    home.GF += hg;
    home.GA += ag;

    away.GF += ag;
    away.GA += hg;

    if (hg > ag) {
      home.W++;
      home.PTS += 3;
      away.L++;
    } else if (hg < ag) {
      away.W++;
      away.PTS += 3;
      home.L++;
    } else {
      home.D++;
      away.D++;
      home.PTS++;
      away.PTS++;
    }
  });

  Object.values(table).forEach(team => {
    team.GD = team.GF - team.GA;
  });

  return Object.values(table).sort((a, b) =>
    b.PTS - a.PTS ||
    b.GD - a.GD ||
    b.GF - a.GF
  );
}

function renderTable() {
  const box = $("adminLeagueTable");

  if (!box) return;

  const table = calculateTable();

  if (table.length === 0) {
    box.innerHTML = `
      <tr>
        <td colspan="10">No teams yet.</td>
      </tr>
    `;
    return;
  }

  box.innerHTML = table.map((team, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${team.name}</td>
      <td>${team.P}</td>
      <td>${team.W}</td>
      <td>${team.D}</td>
      <td>${team.L}</td>
      <td>${team.GF}</td>
      <td>${team.GA}</td>
      <td>${team.GD}</td>
      <td>${team.PTS}</td>
    </tr>
  `).join("");
}

function renderFixtures() {
  const box = $("adminFixtureList");

  if (!box) return;

  if (!competitionData.fixtures || competitionData.fixtures.length === 0) {
    box.innerHTML = "<p>No fixtures generated.</p>";
    return;
  }

  box.innerHTML = competitionData.fixtures.map((match, index) => `
    <div class="fixture-card">
      <strong>Match ${index + 1}</strong>
      <p>${match.home} vs ${match.away}</p>

      ${
        match.homeScore == null
          ? `
            <input
              type="number"
              min="0"
              id="homeScore-${index}"
              placeholder="${match.home} score"
            >

            <input
              type="number"
              min="0"
              id="awayScore-${index}"
              placeholder="${match.away} score"
            >

            <button onclick="submitResult(${index})">
              ⚽ Submit Result
            </button>
          `
          : `
            <p>
              ✅ Result:
              ${match.home} ${match.homeScore}
              - ${match.awayScore} ${match.away}
            </p>
          `
      }
    </div>
  `).join("");
}

window.submitResult = async function(index) {
  const homeInput = $(`homeScore-${index}`);
  const awayInput = $(`awayScore-${index}`);

  if (!homeInput || !awayInput) return;

  const homeScore = Number(homeInput.value);
  const awayScore = Number(awayInput.value);

  if (
    homeInput.value === "" ||
    awayInput.value === "" ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    alert("Enter valid scores.");
    return;
  }

  competitionData.fixtures[index].homeScore = homeScore;
  competitionData.fixtures[index].awayScore = awayScore;

  await saveCompetition();

  alert("✅ Result saved.");
};

function generateRoundRobin(teams, legs, startDate, endDate) {

  const list = [...teams];

  if (list.length < 2) {
    return [];
  }

  if (!startDate || !endDate) {
    alert("❌ Please select a start date and end date.");
    return [];
  }

  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  if (end < start) {
    alert("❌ End date cannot be before start date.");
    return [];
  }

  if (list.length % 2 !== 0) {
    list.push(null);
  }

  const rounds = list.length - 1;
  const half = list.length / 2;

  const availableDays =
    Math.floor(
      (end - start) / (1000 * 60 * 60 * 24)
    ) + 1;

  const requiredRounds =
    Number(legs) === 2
      ? rounds * 2
      : rounds;

  if (availableDays < requiredRounds) {
    alert(
      `❌ The selected date range is too short.\n\n` +
      `${list.length - 1} teams require ${requiredRounds} Match Days.\n` +
      `You selected only ${availableDays} days.`
    );

    return [];
  }

  const fixtures = [];

  for (let round = 0; round < rounds; round++) {

    const matchDate = new Date(start);

    matchDate.setDate(
      start.getDate() + round
    );

    const dateString =
      matchDate.toISOString().split("T")[0];

    for (let i = 0; i < half; i++) {

      const home = list[i];

      const away =
        list[list.length - 1 - i];

      if (home && away) {

        fixtures.push({
          day: round + 1,
          date: dateString,
          home: home.name,
          away: away.name,
          homeScore: null,
          awayScore: null
        });

      }
    }

    list.splice(1, 0, list.pop());
  }

  if (Number(legs) === 2) {

    const firstLegFixtures = [...fixtures];

    for (let round = 0; round < rounds; round++) {

      const matchDate = new Date(start);

      matchDate.setDate(
        start.getDate() + rounds + round
      );

      const dateString =
        matchDate.toISOString().split("T")[0];

      const roundFixtures =
        firstLegFixtures.filter(
          match => match.day === round + 1
        );

      roundFixtures.forEach(match => {

        fixtures.push({
          day: rounds + round + 1,
          date: dateString,
          home: match.away,
          away: match.home,
          homeScore: null,
          awayScore: null
        });

      });
    }
  }

  return fixtures;
}

$("generateFixturesButton").addEventListener("click", async () => {
  if (!competitionData.teams || competitionData.teams.length < 2) {
    alert("❌ You need at least 2 approved teams.");
    return;
  }

  if (competitionData.fixtures.length > 0) {
    const confirmGenerate = confirm(
      "Fixtures already exist. Generate new fixtures and replace the current ones?"
    );

    if (!confirmGenerate) return;
  }

  const legs = Number($("legFormat").value);

  competitionData.legFormat = legs;

  competitionData.fixtures = generateRoundRobin(
    competitionData.teams,
    legs
  );

  await saveCompetition();

  alert(
    `✅ ${competitionData.fixtures.length} fixtures generated successfully.`
  );
});

$("startSeasonButton").addEventListener("click", async () => {
  if (!competitionData.teams || competitionData.teams.length < 2) {
    alert("❌ You need at least 2 approved teams.");
    return;
  }

  if (!competitionData.fixtures || competitionData.fixtures.length === 0) {
    alert("❌ Generate fixtures first.");
    return;
  }

  competitionData.seasonStart = $("seasonStart").value;
  competitionData.seasonEnd = $("seasonEnd").value;
  competitionData.legFormat = Number($("legFormat").value);

  competitionData.seasonStarted = true;
  competitionData.registrationOpen = false;

  await saveCompetition();

  alert("🏆 Season started successfully.");
});

$("reopenRegistrationButton").addEventListener("click", async () => {
  competitionData.registrationOpen = true;

  await saveCompetition();

  alert("🔓 Registration reopened.");
});

$("adminLoginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("adminEmail").value.trim();
  const password = $("adminPassword").value;

  if (!email || !password) {
    showMessage("Please enter your email and password.");
    return;
  }

  showMessage("🔄 Logging in...", true);

  try {
    const result = await signInWithEmailAndPassword(
      window.auth,
      email,
      password
    );

    if (!isAdmin(result.user)) {
      await signOut(window.auth);
      showMessage("❌ You are not authorized to access this dashboard.");
      return;
    }

    currentUser = result.user;

    showDashboard();
    await loadCompetition();
    startPendingListener();

  } catch (error) {
    console.error(error);

    showMessage(
      "❌ Login failed: " +
      (error.code || "") +
      " " +
      (error.message || "")
    );
  }
});

function startPendingListener() {
  const registrationsRef = collection(
    window.db,
    "registrations"
  );

  onSnapshot(
    registrationsRef,
    (snapshot) => {
      const pending = [];

      snapshot.forEach((item) => {
        const data = item.data();

        if (data.status === "pending") {
          pending.push({
            id: item.id,
            ...data
          });
        }
      });

      renderPendingRegistrations(pending);
    },
    (error) => {
      console.error("Pending registration listener error:", error);

      const box = $("pendingRegistrations");

      if (box) {
        box.innerHTML =
          "<p>❌ Unable to load pending registrations.</p>";
      }
    }
  );
}

function renderPendingRegistrations(registrations) {
  const box = $("pendingRegistrations");

  if (!box) return;

  if (registrations.length === 0) {
    box.innerHTML = "<p>No pending registrations.</p>";
    return;
  }

  box.innerHTML = registrations.map((registration) => `
    <div class="admin-team-card">

      <h3>${registration.teamName}</h3>

      <p>
        Player:
        ${registration.playerName}
      </p>

      <div class="admin-buttons">

        <button
          onclick="approveRegistration(
            '${registration.id}'
          )"
        >
          ✅ Approve
        </button>

        <button
          onclick="rejectRegistration(
            '${registration.id}'
          )"
        >
          ❌ Reject
        </button>

      </div>

    </div>
  `).join("");
}

window.approveRegistration = async function(id) {
  try {
    const registrationRef = doc(
      window.db,
      "registrations",
      id
    );

    const registrationSnap = await getDoc(
      registrationRef
    );

    if (!registrationSnap.exists()) {
      alert("❌ Registration no longer exists.");
      return;
    }

    const registration = registrationSnap.data();

    const alreadyExists = competitionData.teams.some(
      team =>
        team.name.toLowerCase() ===
        registration.teamName.toLowerCase()
    );

    if (alreadyExists) {
      alert("❌ This team is already approved.");
      return;
    }

    competitionData.teams.push({
      name: registration.teamName,
      playerName: registration.playerName
    });

    await saveCompetition();

    await deleteDoc(registrationRef);

    alert("✅ Team approved successfully.");

  } catch (error) {
    console.error(error);

    alert(
      "❌ Approval failed: " +
      error.message
    );
  }
};

window.rejectRegistration = async function(id) {
  const confirmReject = confirm(
    "Reject this registration?"
  );

  if (!confirmReject) return;

  try {
    await deleteDoc(
      doc(
        window.db,
        "registrations",
        id
      )
    );

    alert("❌ Registration rejected.");

  } catch (error) {
    console.error(error);

    alert(
      "❌ Rejection failed: " +
      error.message
    );
  }
};

$("logoutButton").addEventListener("click", async () => {
  try {
    await signOut(window.auth);
    currentUser = null;
    showLogin();
    $("adminPassword").value = "";
  } catch (error) {
    alert("❌ Logout failed: " + error.message);
  }
});

onAuthStateChanged(window.auth, async (user) => {
  if (!user) {
    currentUser = null;
    showLogin();
    return;
  }

  if (!isAdmin(user)) {
    await signOut(window.auth);
    showLogin();
    return;
  }

  currentUser = user;

  showDashboard();

  await loadCompetition();

  startPendingListener();
});

window.addEventListener("load", () => {
  if (!window.firebaseReady) {
    showMessage(
      "❌ Firebase is still loading. Please wait a moment and try again."
    );
  }
});

$("manageTeamsButton").addEventListener("click", () => {
  if (!competitionData.teams.length) {
    alert("No approved teams to manage.");
    return;
  }

  const teamNames = competitionData.teams
    .map((team, index) => `${index + 1}. ${team.name}`)
    .join("\n");

  alert(
    "Approved Teams:\n\n" +
    teamNames +
    "\n\nTeam management will be expanded here."
  );
});

$("clearCompetitionButton").addEventListener("click", async () => {
  const confirmed = confirm(
    "⚠️ This will clear the competition data. Continue?"
  );

  if (!confirmed) return;

  const secondConfirm = confirm(
    "Are you absolutely sure? This cannot be undone."
  );

  if (!secondConfirm) return;

  try {
    competitionData = {
      seasonStarted: false,
      registrationOpen: true,
      seasonStart: "",
      seasonEnd: "",
      legFormat: 1,
      teams: [],
      fixtures: []
    };

    await saveCompetition();

    alert("🗑️ Competition cleared successfully.");

  } catch (error) {
    console.error(error);

    alert(
      "❌ Could not clear competition: " +
      error.message
    );
  }
});

showLogin();