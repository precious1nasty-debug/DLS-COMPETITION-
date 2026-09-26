// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 2 — FIREBASE, AUTHENTICATION & CORE DATA
// =========================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const ADMIN_EMAIL = "obakimoprecious07@gmail.com";

let teams = [];
let fixtures = [];
let registrations = [];

let season = {
  format: "league",
  started: false,
  formatLocked: false,
  phase: "registration",
  startDate: "",
  endDate: "",
  legs: 1,
  matchesPerTeam: 4,
  knockoutLegs: 1,
  qualificationCount: 0
};

let knockout = {
  enabled: false,
  qualificationCount: 0,
  drawLocked: false,
  roundOf16: [],
  quarterFinals: [],
  semiFinals: [],
  thirdPlace: null,
  final: null
};

let champions = {
  champion: "",
  runnerUp: "",
  thirdPlace: ""
};

let competitionUnsubscribe = null;
let registrationUnsubscribe = null;

const adminLogin = document.getElementById("adminLogin");
const adminDashboard = document.getElementById("adminDashboard");

const adminLoginForm =
  document.getElementById("adminLoginForm");

const adminEmail =
  document.getElementById("adminEmail");

const adminPassword =
  document.getElementById("adminPassword");

const adminLoginMessage =
  document.getElementById("adminLoginMessage");

const pendingRegistrations =
  document.getElementById("pendingRegistrations");

const adminSeasonDetails =
  document.getElementById("adminSeasonDetails");

const competitionFormat =
  document.getElementById("competitionFormat");

const seasonStart =
  document.getElementById("seasonStart");

const seasonEnd =
  document.getElementById("seasonEnd");

const legFormat =
  document.getElementById("legFormat");

const leagueSettings =
  document.getElementById("leagueSettings");

const championsSettings =
  document.getElementById("championsSettings");

const matchesPerTeam =
  document.getElementById("matchesPerTeam");

const matchesPerTeamSuggestion =
  document.getElementById("matchesPerTeamSuggestion");

const knockoutLegFormat =
  document.getElementById("knockoutLegFormat");

const championsQualificationInfo =
  document.getElementById("championsQualificationInfo");

const generateFixturesButton =
  document.getElementById("generateFixturesButton");

const startSeasonButton =
  document.getElementById("startSeasonButton");

const reopenRegistrationButton =
  document.getElementById("reopenRegistrationButton");

const manageTeamsButton =
  document.getElementById("manageTeamsButton");

const adminTeamList =
  document.getElementById("adminTeamList");

const adminTableTitle =
  document.getElementById("adminTableTitle");

const qualificationLegend =
  document.getElementById("qualificationLegend");

const adminLeagueTable =
  document.getElementById("adminLeagueTable");

const adminFixtureTitle =
  document.getElementById("adminFixtureTitle");

const adminFixtureList =
  document.getElementById("adminFixtureList");

const adminKnockoutSection =
  document.getElementById("adminKnockoutSection");

const knockoutQualificationStatus =
  document.getElementById("knockoutQualificationStatus");

const drawKnockoutButton =
  document.getElementById("drawKnockoutButton");

const knockoutDrawStatus =
  document.getElementById("knockoutDrawStatus");

const adminKnockoutList =
  document.getElementById("adminKnockoutList");

const adminChampionsSection =
  document.getElementById("adminChampionsSection");

const adminChampionsResults =
  document.getElementById("adminChampionsResults");

const clearCompetitionButton =
  document.getElementById("clearCompetitionButton");

const logoutButton =
  document.getElementById("logoutButton");

const seasonControlMessage =
  document.getElementById("seasonControlMessage");

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function normalizeTeamName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getTeamName(team) {
  return team?.teamName || team?.name || "";
}

function getPlayerName(team) {
  return team?.playerName || team?.player || "";
}

function teamKey(name) {
  return normalizeTeamName(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

function createDefaultSeason() {
  return {
    format: "league",
    started: false,
    formatLocked: false,
    phase: "registration",
    startDate: "",
    endDate: "",
    legs: 1,
    matchesPerTeam: 4,
    knockoutLegs: 1,
    qualificationCount: 0
  };
}

function createDefaultKnockout() {
  return {
    enabled: false,
    qualificationCount: 0,
    drawLocked: false,
    roundOf16: [],
    quarterFinals: [],
    semiFinals: [],
    thirdPlace: null,
    final: null
  };
}

function createDefaultChampions() {
  return {
    champion: "",
    runnerUp: "",
    thirdPlace: ""
  };
}

function normalizeCompetitionData(data) {
  const oldSeason = data?.season || {};

  season = {
    ...createDefaultSeason(),
    ...oldSeason,

    format:
      oldSeason.format === "champions"
        ? "champions"
        : "league",

    started:
      oldSeason.started === true,

    formatLocked:
      oldSeason.formatLocked === true ||
      oldSeason.started === true,

    phase:
      oldSeason.phase ||
      (oldSeason.started
        ? "league"
        : "registration"),

    startDate:
      oldSeason.startDate ||
      oldSeason.seasonStart ||
      "",

    endDate:
      oldSeason.endDate ||
      oldSeason.seasonEnd ||
      "",

    legs:
      Number(
        oldSeason.legs ??
        oldSeason.legFormat ??
        1
      ),

    matchesPerTeam:
      Number(
        oldSeason.matchesPerTeam ??
        4
      ),

    knockoutLegs:
      Number(
        oldSeason.knockoutLegs ??
        oldSeason.legs ??
        1
      ),

    qualificationCount:
      Number(
        oldSeason.qualificationCount ||
        0
      )
  };

  teams =
    Array.isArray(data?.teams)
      ? data.teams
      : [];

  fixtures =
    Array.isArray(data?.fixtures)
      ? data.fixtures
      : [];

  knockout = {
    ...createDefaultKnockout(),
    ...(data?.knockout || {}),

    roundOf16:
      Array.isArray(data?.knockout?.roundOf16)
        ? data.knockout.roundOf16
        : [],

    quarterFinals:
      Array.isArray(data?.knockout?.quarterFinals)
        ? data.knockout.quarterFinals
        : [],

    semiFinals:
      Array.isArray(data?.knockout?.semiFinals)
        ? data.knockout.semiFinals
        : []
  };

  champions = {
    ...createDefaultChampions(),
    ...(data?.champions || {})
  };
}

async function loadCompetition() {
  if (!window.db) {
    console.error("Firestore is not available.");
    return;
  }

  try {
    const competitionRef =
      doc(window.db, "competition", "main");

    const snapshot =
      await getDoc(competitionRef);

    if (snapshot.exists()) {
      normalizeCompetitionData(
        snapshot.data()
      );
    } else {
      teams = [];
      fixtures = [];
      season = createDefaultSeason();
      knockout = createDefaultKnockout();
      champions = createDefaultChampions();
    }

    if (typeof renderAll === "function") {
      renderAll();
    }

  } catch (error) {
    console.error(
      "Competition loading failed:",
      error
    );

    if (seasonControlMessage) {
      seasonControlMessage.textContent =
        "❌ Failed to load competition data.";
    }
  }
}

async function saveCompetition() {
  if (!window.db) {
    console.error("Firestore is not available.");
    return false;
  }

  try {
    const competitionRef =
      doc(window.db, "competition", "main");

    await setDoc(
      competitionRef,
      {
        season,
        teams,
        fixtures,
        knockout,
        champions
      },
      {
        merge: true
      }
    );

    return true;

  } catch (error) {
    console.error(
      "Competition save failed:",
      error
    );

    if (seasonControlMessage) {
      seasonControlMessage.textContent =
        "❌ Could not save competition: " +
        (error.message || "Unknown error.");
    }

    return false;
  }
}

if (adminLoginForm) {
  adminLoginForm.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      if (!window.auth) {
        adminLoginMessage.textContent =
          "❌ Authentication is unavailable.";
        return;
      }

      const email =
        adminEmail?.value
          ?.trim()
          .toLowerCase() || "";

      const password =
        adminPassword?.value || "";

      if (!email || !password) {
        adminLoginMessage.textContent =
          "⚠️ Enter your email and password.";
        return;
      }

      if (email !== ADMIN_EMAIL) {
        adminLoginMessage.textContent =
          "❌ This account is not authorized.";
        return;
      }

      adminLoginMessage.textContent =
        "⏳ Signing in...";

      try {

        await signInWithEmailAndPassword(
          window.auth,
          email,
          password
        );

        adminLoginMessage.textContent =
          "✅ Login successful.";

      } catch (error) {

        console.error(
          "Admin login failed:",
          error
        );

        adminLoginMessage.textContent =
          "❌ Login failed: " +
          (
            error.message ||
            "Please check your details."
          );
      }
    }
  );
}

function setupAuthentication() {
  if (!window.auth) {
    console.error(
      "Firebase Auth is unavailable."
    );
    return;
  }

  onAuthStateChanged(
    window.auth,
    async function(user) {

      if (!user) {
        showLogin();
        return;
      }

      const email =
        String(user.email || "")
          .trim()
          .toLowerCase();

      if (email !== ADMIN_EMAIL) {

        await signOut(window.auth);

        showLogin();

        if (adminLoginMessage) {
          adminLoginMessage.textContent =
            "❌ Unauthorized account.";
        }

        return;
      }

      showDashboard();

      await loadCompetition();

      setupRegistrationListener();
    }
  );
}

function showLogin() {
  if (adminLogin) {
    adminLogin.style.display = "block";
  }

  if (adminDashboard) {
    adminDashboard.style.display = "none";
  }
}

function showDashboard() {
  if (adminLogin) {
    adminLogin.style.display = "none";
  }

  if (adminDashboard) {
    adminDashboard.style.display = "block";
  }
}

if (logoutButton) {
  logoutButton.addEventListener(
    "click",
    async function() {

      try {
        await signOut(window.auth);
      } catch (error) {
        console.error(
          "Logout failed:",
          error
        );
      }

    }
  );
}

function waitForFirebase() {

  if (window.firebaseReady) {
    setupAuthentication();
    return;
  }

  let attempts = 0;

  const timer =
    setInterval(function() {

      attempts++;

      if (window.firebaseReady) {

        clearInterval(timer);

        setupAuthentication();

        return;
      }

      if (attempts >= 100) {

        clearInterval(timer);

        if (adminLoginMessage) {
          adminLoginMessage.textContent =
            "❌ Firebase failed to initialize.";
        }
      }

    }, 100);
}

waitForFirebase();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 3 — FORMAT CONTROL & CHAMPIONS SETTINGS
// =========================================================


// =========================================================
// GET CHAMPIONS QUALIFICATION COUNT
// =========================================================

function getChampionsQualificationCount(teamCount) {

  if (teamCount >= 9 && teamCount <= 16) {
    return 8;
  }

  if (teamCount >= 17 && teamCount <= 40) {
    return 16;
  }

  return 0;
}


// =========================================================
// GET CHAMPIONS FIRST KNOCKOUT ROUND
// =========================================================

function getChampionsFirstKnockoutRound() {

  if (season.qualificationCount === 8) {
    return "Quarter-finals";
  }

  if (season.qualificationCount === 16) {
    return "Round of 16";
  }

  return "";
}


// =========================================================
// CHECK WHETHER MATCHES PER TEAM WORKS
// =========================================================

function isMatchesPerTeamPossible(
  teamCount,
  matchesPerTeam
) {

  if (!Number.isInteger(teamCount)) {
    return false;
  }

  if (!Number.isInteger(matchesPerTeam)) {
    return false;
  }

  if (teamCount < 9 || teamCount > 40) {
    return false;
  }

  if (matchesPerTeam < 1 || matchesPerTeam > 8) {
    return false;
  }

  /*
   * Every match uses two team appearances.
   *
   * Therefore:
   *
   * teamCount × matchesPerTeam
   *
   * must be even.
   */

  return (
    (teamCount * matchesPerTeam) % 2 === 0
  );
}


// =========================================================
// FIND A WORKABLE MATCHES-PER-TEAM SUGGESTION
// =========================================================

function getSuggestedMatchesPerTeam(
  teamCount,
  requested
) {

  const requestedNumber =
    Number(requested);

  if (
    isMatchesPerTeamPossible(
      teamCount,
      requestedNumber
    )
  ) {
    return requestedNumber;
  }


  /*
   * Prefer the closest lower number.
   */

  for (
    let number = requestedNumber - 1;
    number >= 1;
    number--
  ) {

    if (
      isMatchesPerTeamPossible(
        teamCount,
        number
      )
    ) {
      return number;
    }
  }


  /*
   * If necessary, search upward.
   */

  for (
    let number = requestedNumber + 1;
    number <= 8;
    number++
  ) {

    if (
      isMatchesPerTeamPossible(
        teamCount,
        number
      )
    ) {
      return number;
    }
  }


  return null;
}


// =========================================================
// UPDATE MATCHES-PER-TEAM SUGGESTION
// =========================================================

function updateMatchesPerTeamSuggestion() {

  if (!matchesPerTeamSuggestion) {
    return;
  }


  const teamCount =
    teams.length;

  const requested =
    Number(
      matchesPerTeam?.value || 1
    );


  if (season.format !== "champions") {

    matchesPerTeamSuggestion.innerHTML = "";

    return;
  }


  if (teamCount < 9) {

    matchesPerTeamSuggestion.innerHTML =
      `
        <p>
          ⚠️ Champions League requires at least
          <strong>9 approved teams</strong>.
        </p>
      `;

    return;
  }


  if (teamCount > 40) {

    matchesPerTeamSuggestion.innerHTML =
      `
        <p>
          ⚠️ Champions League currently supports
          a maximum of <strong>40 teams</strong>.
        </p>
      `;

    return;
  }


  const suggested =
    getSuggestedMatchesPerTeam(
      teamCount,
      requested
    );


  if (suggested === requested) {

    matchesPerTeamSuggestion.innerHTML =
      `
        <p>
          ✅ ${requested} match${
            requested === 1 ? "" : "es"
          } per team works for
          ${teamCount} teams.
        </p>
      `;

    return;
  }


  if (suggested === null) {

    matchesPerTeamSuggestion.innerHTML =
      `
        <p>
          ⚠️ No workable number was found.
        </p>
      `;

    return;
  }


  matchesPerTeamSuggestion.innerHTML =
    `
      <p>
        ⚠️ ${requested} match${
          requested === 1 ? "" : "es"
        } per team cannot give every team
        exactly that number of matches with
        ${teamCount} teams.
      </p>

      <p>
        💡 Suggested:
        <strong>${suggested} match${
          suggested === 1 ? "" : "es"
        } per team</strong>
      </p>
    `;
}


// =========================================================
// UPDATE QUALIFICATION INFORMATION
// =========================================================

function updateChampionsQualificationInfo() {

  if (!championsQualificationInfo) {
    return;
  }


  const teamCount =
    teams.length;


  if (teamCount < 9) {

    championsQualificationInfo.innerHTML =
      `
        <p>
          🔒 Champions League cannot start yet.
        </p>

        <p>
          Minimum:
          <strong>9 approved teams</strong>
        </p>

        <p>
          Current:
          <strong>${teamCount} teams</strong>
        </p>
      `;

    return;
  }


  if (teamCount > 40) {

    championsQualificationInfo.innerHTML =
      `
        <p>
          ⚠️ Maximum:
          <strong>40 teams</strong>
        </p>

        <p>
          Current:
          <strong>${teamCount} teams</strong>
        </p>
      `;

    return;
  }


  const qualificationCount =
    getChampionsQualificationCount(
      teamCount
    );


  const firstRound =
    qualificationCount === 8
      ? "Quarter-finals"
      : "Round of 16";


  championsQualificationInfo.innerHTML =
    `
      <p>
        👥 Approved teams:
        <strong>${teamCount}</strong>
      </p>

      <p>
        🟢 Teams qualifying for knockout:
        <strong>${qualificationCount}</strong>
      </p>

      <p>
        🏆 Knockout begins:
        <strong>${firstRound}</strong>
      </p>
    `;
}


// =========================================================
// SHOW CORRECT FORMAT SETTINGS
// =========================================================

function updateFormatSettings() {

  const format =
    competitionFormat?.value ||
    season.format ||
    "league";


  if (format === "champions") {

    if (leagueSettings) {
      leagueSettings.style.display =
        "none";
    }

    if (championsSettings) {
      championsSettings.style.display =
        "block";
    }

    updateMatchesPerTeamSuggestion();

    updateChampionsQualificationInfo();

  } else {

    if (leagueSettings) {
      leagueSettings.style.display =
        "block";
    }

    if (championsSettings) {
      championsSettings.style.display =
        "none";
    }

    if (matchesPerTeamSuggestion) {
      matchesPerTeamSuggestion.innerHTML =
        "";
    }
  }
}


// =========================================================
// FORMAT SELECTOR
// =========================================================

if (competitionFormat) {

  competitionFormat.addEventListener(
    "change",
    function() {

      if (season.started || season.formatLocked) {

        competitionFormat.value =
          season.format;

        updateFormatSettings();

        if (seasonControlMessage) {

          seasonControlMessage.textContent =
            "🔒 Competition format is locked because the season has started.";
        }

        return;
      }


      updateFormatSettings();

      season.format =
        competitionFormat.value;


      if (
        season.format === "champions"
      ) {

        season.phase =
          "registration";

      } else {

        season.phase =
          "registration";
      }


      updateMatchesPerTeamSuggestion();

      updateChampionsQualificationInfo();
    }
  );
}


// =========================================================
// MATCHES PER TEAM SELECTOR
// =========================================================

if (matchesPerTeam) {

  matchesPerTeam.addEventListener(
    "change",
    function() {

      if (
        season.started ||
        season.formatLocked
      ) {

        matchesPerTeam.value =
          String(
            season.matchesPerTeam || 4
          );

        return;
      }


      updateMatchesPerTeamSuggestion();
    }
  );
}


// =========================================================
// KNOCKOUT LEG SELECTOR
// =========================================================

if (knockoutLegFormat) {

  knockoutLegFormat.addEventListener(
    "change",
    function() {

      if (
        season.started ||
        season.formatLocked
      ) {

        knockoutLegFormat.value =
          String(
            season.knockoutLegs || 1
          );
      }
    }
  );
}


// =========================================================
// UPDATE FORMAT WHEN TEAM COUNT CHANGES
// =========================================================

function updateChampionsSettingsFromTeams() {

  updateMatchesPerTeamSuggestion();

  updateChampionsQualificationInfo();
}


// =========================================================
// SEASON INFORMATION DISPLAY
// =========================================================

function renderSeasonDetails() {

  if (!adminSeasonDetails) {
    return;
  }


  const formatName =
    season.format === "champions"
      ? "🏆 Champions League"
      : "⚽ League";


  if (!season.started) {

    adminSeasonDetails.innerHTML =
      `
        <div class="season-card">

          <p>
            <strong>Format:</strong>
            ${formatName}
          </p>

          <p>
            <strong>Status:</strong>
            🟡 Season has not started.
          </p>

          ${
            season.startDate
              ? `
                <p>
                  <strong>Start:</strong>
                  ${escapeHTML(
                    season.startDate
                  )}
                </p>
              `
              : ""
          }

          ${
            season.endDate
              ? `
                <p>
                  <strong>End:</strong>
                  ${escapeHTML(
                    season.endDate
                  )}
                </p>
              `
              : ""
          }

        </div>
      `;

    return;
  }


  if (
    season.format === "champions"
  ) {

    adminSeasonDetails.innerHTML =
      `
        <div class="season-card">

          <p>
            <strong>Format:</strong>
            🏆 Champions League
          </p>

          <p>
            <strong>Status:</strong>
            🟢 Season is active.
          </p>

          <p>
            <strong>Format:</strong>
            🔒 Locked
          </p>

          <p>
            <strong>League Phase:</strong>
            ${season.matchesPerTeam}
            matches per team
          </p>

          <p>
            <strong>Knockout:</strong>
            ${season.knockoutLegs === 2
              ? "2 Legs"
              : "1 Leg"}
          </p>

          <p>
            <strong>Qualification:</strong>
            Top ${season.qualificationCount}
          </p>

        </div>
      `;

    return;
  }


  adminSeasonDetails.innerHTML =
    `
      <div class="season-card">

        <p>
          <strong>Format:</strong>
          ⚽ League
        </p>

        <p>
          <strong>Status:</strong>
          🟢 Season is active.
        </p>

        <p>
          <strong>Format:</strong>
          🔒 Locked
        </p>

        <p>
          <strong>League Format:</strong>
          ${
            Number(season.legs) === 2
              ? "2 Legs"
              : "1 Leg"
          }
        </p>

      </div>
    `;
}


// =========================================================
// APPLY CURRENT SEASON SETTINGS TO FORM
// =========================================================

function loadSeasonSettingsIntoForm() {

  if (competitionFormat) {

    competitionFormat.value =
      season.format || "league";
  }


  if (seasonStart) {

    seasonStart.value =
      season.startDate || "";
  }


  if (seasonEnd) {

    seasonEnd.value =
      season.endDate || "";
  }


  if (legFormat) {

    legFormat.value =
      String(
        season.legs || 1
      );
  }


  if (matchesPerTeam) {

    matchesPerTeam.value =
      String(
        season.matchesPerTeam || 4
      );
  }


  if (knockoutLegFormat) {

    knockoutLegFormat.value =
      String(
        season.knockoutLegs || 1
      );
  }


  updateFormatSettings();
}


// =========================================================
// LOCK / UNLOCK FORMAT CONTROLS
// =========================================================

function updateSeasonControlState() {

  const locked =
    season.started ||
    season.formatLocked;


  if (competitionFormat) {

    competitionFormat.disabled =
      locked;
  }


  if (seasonStart) {

    seasonStart.disabled =
      locked;
  }


  if (seasonEnd) {

    seasonEnd.disabled =
      locked;
  }


  if (legFormat) {

    legFormat.disabled =
      locked ||
      season.format === "champions";
  }


  if (matchesPerTeam) {

    matchesPerTeam.disabled =
      locked ||
      season.format !== "champions";
  }


  if (knockoutLegFormat) {

    knockoutLegFormat.disabled =
      locked ||
      season.format !== "champions";
  }


  if (startSeasonButton) {

    startSeasonButton.disabled =
      season.started;
  }


  if (generateFixturesButton) {

    /*
     * Fixtures can only be generated
     * before the season has started.
     */

    generateFixturesButton.disabled =
      season.started;
  }
}


// =========================================================
// VALIDATE CHAMPIONS FORMAT
// =========================================================

function validateChampionsSettings() {

  const teamCount =
    teams.length;


  if (
    teamCount < 9 ||
    teamCount > 40
  ) {

    return {
      valid: false,

      message:
        "Champions League requires between 9 and 40 approved teams."
    };
  }


  const selectedMatches =
    Number(
      matchesPerTeam?.value || 0
    );


  if (
    selectedMatches < 1 ||
    selectedMatches > 8
  ) {

    return {
      valid: false,

      message:
        "Matches per team must be between 1 and 8."
    };
  }


  if (
    !isMatchesPerTeamPossible(
      teamCount,
      selectedMatches
    )
  ) {

    const suggested =
      getSuggestedMatchesPerTeam(
        teamCount,
        selectedMatches
      );


    return {
      valid: false,

      message:
        suggested
          ? `With ${teamCount} teams, ${selectedMatches} matches per team cannot be scheduled evenly. Suggested: ${suggested} matches per team.`
          : "The selected matches-per-team value cannot be scheduled."
    };
  }


  return {
    valid: true,
    message: ""
  };
}


// =========================================================
// PREPARE SEASON SETTINGS
// =========================================================

function readSeasonSettingsFromForm() {

  if (
    season.started ||
    season.formatLocked
  ) {

    return;
  }


  season.format =
    competitionFormat?.value ||
    "league";


  season.startDate =
    seasonStart?.value ||
    "";


  season.endDate =
    seasonEnd?.value ||
    "";


  if (
    season.format === "league"
  ) {

    season.legs =
      Number(
        legFormat?.value || 1
      );

    season.matchesPerTeam =
      0;

    season.knockoutLegs =
      0;

    season.qualificationCount =
      0;

  } else {

    season.matchesPerTeam =
      Number(
        matchesPerTeam?.value || 1
      );

    season.knockoutLegs =
      Number(
        knockoutLegFormat?.value || 1
      );

    season.qualificationCount =
      getChampionsQualificationCount(
        teams.length
      );

    season.legs = 1;
  }
}


// =========================================================
// FORMAT CHANGE MESSAGE
// =========================================================

function showFormatMessage(message) {

  if (!seasonControlMessage) {
    return;
  }

  seasonControlMessage.textContent =
    message;
}


// =========================================================
// INITIAL FORMAT SETUP
// =========================================================

loadSeasonSettingsIntoForm();

updateSeasonControlState();

renderSeasonDetails();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 4 — REGISTRATIONS & TEAM MANAGEMENT
// =========================================================


// =========================================================
// LOAD PENDING REGISTRATIONS
// =========================================================

async function loadPendingRegistrations() {

  if (!window.db) {
    return;
  }

  try {

    const registrationsRef =
      collection(
        window.db,
        "registrations"
      );

    const snapshot =
      await getDocs(
        registrationsRef
      );

    registrations = [];

    snapshot.forEach(function(docSnapshot) {

      const data =
        docSnapshot.data();

      if (
        data.status === "pending"
      ) {

        registrations.push({
          id: docSnapshot.id,
          ...data
        });
      }
    });

    registrations.sort(
      function(a, b) {

        return (
          Number(a.createdAt || 0) -
          Number(b.createdAt || 0)
        );
      }
    );

    renderPendingRegistrations();

  } catch (error) {

    console.error(
      "Failed to load registrations:",
      error
    );

    if (pendingRegistrations) {

      pendingRegistrations.innerHTML =
        "<p>❌ Failed to load registrations.</p>";
    }
  }
}


// =========================================================
// REGISTRATION LISTENER
// =========================================================

function setupRegistrationListener() {

  if (!window.db) {
    return;
  }

  if (registrationUnsubscribe) {

    registrationUnsubscribe();

    registrationUnsubscribe = null;
  }

  try {

    const registrationsRef =
      collection(
        window.db,
        "registrations"
      );

    registrationUnsubscribe =
      onSnapshot(
        registrationsRef,
        function(snapshot) {

          registrations = [];

          snapshot.forEach(
            function(docSnapshot) {

              const data =
                docSnapshot.data();

              if (
                data.status === "pending"
              ) {

                registrations.push({
                  id: docSnapshot.id,
                  ...data
                });
              }
            }
          );

          registrations.sort(
            function(a, b) {

              return (
                Number(a.createdAt || 0) -
                Number(b.createdAt || 0)
              );
            }
          );

          renderPendingRegistrations();
        },
        function(error) {

          console.error(
            "Registration listener failed:",
            error
          );

          loadPendingRegistrations();
        }
      );

  } catch (error) {

    console.error(
      "Registration listener setup failed:",
      error
    );

    loadPendingRegistrations();
  }
}


// =========================================================
// RENDER PENDING REGISTRATIONS
// =========================================================

function renderPendingRegistrations() {

  if (!pendingRegistrations) {
    return;
  }

  pendingRegistrations.innerHTML = "";


  if (registrations.length === 0) {

    pendingRegistrations.innerHTML =
      "<p>No pending registrations.</p>";

    return;
  }


  registrations.forEach(
    function(registration) {

      const card =
        document.createElement("div");

      card.className =
        "team-card";


      const teamName =
        escapeHTML(
          registration.teamName ||
          ""
        );


      const playerName =
        escapeHTML(
          registration.playerName ||
          ""
        );


      card.innerHTML =
        `
          <h3>
            ⚽ ${teamName}
          </h3>

          <p>
            👤 ${playerName}
          </p>

          <div class="admin-buttons">

            <button
              data-action="approve"
              data-registration-id="${escapeHTML(
                registration.id
              )}"
            >
              ✅ Approve
            </button>

            <button
              data-action="reject"
              data-registration-id="${escapeHTML(
                registration.id
              )}"
            >
              ❌ Reject
            </button>

          </div>
        `;


      pendingRegistrations.appendChild(
        card
      );
    }
  );
}


// =========================================================
// PENDING REGISTRATION BUTTONS
// =========================================================

if (pendingRegistrations) {

  pendingRegistrations.addEventListener(
    "click",
    async function(event) {

      const button =
        event.target.closest("button");

      if (!button) {
        return;
      }


      const action =
        button.dataset.action;

      const registrationId =
        button.dataset.registrationId;


      if (!registrationId) {
        return;
      }


      if (action === "approve") {

        await approveRegistration(
          registrationId
        );

        return;
      }


      if (action === "reject") {

        await rejectRegistration(
          registrationId
        );
      }
    }
  );
}


// =========================================================
// FIND REGISTRATION
// =========================================================

function findRegistration(
  registrationId
) {

  return registrations.find(
    function(registration) {

      return (
        registration.id ===
        registrationId
      );
    }
  );
}


// =========================================================
// CHECK WHETHER TEAM ALREADY EXISTS
// =========================================================

function approvedTeamExists(
  teamName
) {

  const normalized =
    normalizeTeamName(
      teamName
    );


  return teams.some(
    function(team) {

      return (
        normalizeTeamName(
          getTeamName(team)
        ) === normalized
      );
    }
  );
}


// =========================================================
// APPROVE REGISTRATION
// =========================================================

async function approveRegistration(
  registrationId
) {

  const registration =
    findRegistration(
      registrationId
    );


  if (!registration) {

    alert(
      "❌ Registration could not be found."
    );

    return;
  }


  if (
    season.started ||
    season.formatLocked
  ) {

    alert(
      "🔒 Registration cannot be approved after the season has started."
    );

    return;
  }


  const teamName =
    String(
      registration.teamName || ""
    ).trim();


  const playerName =
    String(
      registration.playerName || ""
    ).trim();


  if (!teamName || !playerName) {

    alert(
      "❌ Registration contains invalid information."
    );

    return;
  }


  if (
    approvedTeamExists(
      teamName
    )
  ) {

    alert(
      "⚠️ This team is already approved."
    );

    return;
  }


  const team = {

    teamName,

    playerName,

    createdAt:
      Number(
        registration.createdAt ||
        Date.now()
      )
  };


  try {

    teams.push(team);


    const registrationRef =
      doc(
        window.db,
        "registrations",
        registrationId
      );


    await setDoc(
      registrationRef,
      {
        teamName,
        playerName,
        createdAt:
          Number(
            registration.createdAt ||
            Date.now()
          ),
        status: "approved"
      },
      {
        merge: true
      }
    );


    const saved =
      await saveCompetition();


    if (!saved) {

      teams =
        teams.filter(
          function(existingTeam) {

            return (
              normalizeTeamName(
                getTeamName(existingTeam)
              ) !==
              normalizeTeamName(
                teamName
              )
            );
          }
        );

      return;
    }


    renderAll();


    alert(
      `✅ ${teamName} has been approved.`
    );


  } catch (error) {

    console.error(
      "Approval failed:",
      error
    );


    teams =
      teams.filter(
        function(existingTeam) {

          return (
            normalizeTeamName(
              getTeamName(existingTeam)
            ) !==
            normalizeTeamName(
              teamName
            )
          );
        }
      );


    alert(
      "❌ Approval failed: " +
      (
        error.message ||
        "Please try again."
      )
    );
  }
}


// =========================================================
// REJECT REGISTRATION
// =========================================================

async function rejectRegistration(
  registrationId
) {

  const registration =
    findRegistration(
      registrationId
    );


  if (!registration) {

    alert(
      "❌ Registration could not be found."
    );

    return;
  }


  const confirmed =
    confirm(
      `Reject ${registration.teamName || "this registration"}?`
    );


  if (!confirmed) {
    return;
  }


  try {

    const registrationRef =
      doc(
        window.db,
        "registrations",
        registrationId
      );


    await setDoc(
      registrationRef,
      {
        status: "rejected"
      },
      {
        merge: true
      }
    );


    alert(
      "✅ Registration rejected."
    );


  } catch (error) {

    console.error(
      "Registration rejection failed:",
      error
    );


    alert(
      "❌ Could not reject registration: " +
      (
        error.message ||
        "Please try again."
      )
    );
  }
}


// =========================================================
// RENDER APPROVED TEAMS
// =========================================================

function renderTeams() {

  if (!adminTeamList) {
    return;
  }


  adminTeamList.innerHTML = "";


  if (teams.length === 0) {

    adminTeamList.innerHTML =
      "<p>No approved teams.</p>";

    updateChampionsSettingsFromTeams();

    return;
  }


  teams.forEach(
    function(team, index) {

      const card =
        document.createElement("div");

      card.className =
        "team-card";


      const name =
        escapeHTML(
          getTeamName(team)
        );


      const player =
        escapeHTML(
          getPlayerName(team)
        );


      card.innerHTML =
        `
          <h3>
            ${index + 1}. ⚽ ${name}
          </h3>

          <p>
            👤 ${player}
          </p>

          <button
            data-action="remove-team"
            data-team-index="${index}"
          >
            🗑️ Remove Team
          </button>
        `;


      adminTeamList.appendChild(
        card
      );
    }
  );


  updateChampionsSettingsFromTeams();
}


// =========================================================
// TEAM MANAGEMENT BUTTON
// =========================================================

if (manageTeamsButton) {

  manageTeamsButton.addEventListener(
    "click",
    function() {

      if (teams.length === 0) {

        alert(
          "There are no approved teams to manage."
        );

        return;
      }


      const teamNames =
        teams.map(
          function(team, index) {

            return (
              `${index + 1}. ` +
              getTeamName(team)
            );
          }
        )
        .join("\n");


      alert(
        "Approved Teams:\n\n" +
        teamNames +
        "\n\nUse the Remove Team buttons below the team list to remove a team."
      );
    }
  );
}


// =========================================================
// REMOVE TEAM
// =========================================================

if (adminTeamList) {

  adminTeamList.addEventListener(
    "click",
    async function(event) {

      const button =
        event.target.closest("button");

      if (!button) {
        return;
      }


      if (
        button.dataset.action !==
        "remove-team"
      ) {

        return;
      }


      const index =
        Number(
          button.dataset.teamIndex
        );


      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= teams.length
      ) {

        return;
      }


      if (season.started) {

        alert(
          "🔒 Teams cannot be removed after the season has started."
        );

        return;
      }


      const team =
        teams[index];


      const teamName =
        getTeamName(team);


      const confirmed =
        confirm(
          `Remove ${teamName} from the approved teams?`
        );


      if (!confirmed) {
        return;
      }


      const previousTeams =
        [...teams];


      teams.splice(
        index,
        1
      );


      const saved =
        await saveCompetition();


      if (!saved) {

        teams =
          previousTeams;

        renderAll();

        return;
      }


      renderAll();


      alert(
        `✅ ${teamName} was removed.`
      );
    }
  );
}


// =========================================================
// REFRESH TEAM-DEPENDENT SETTINGS
// =========================================================

function refreshTeamDependentSettings() {

  updateChampionsSettingsFromTeams();

  renderTeams();
}


// =========================================================
// RENDER ALL BASIC ADMIN DATA
// =========================================================

function renderAll() {

  loadSeasonSettingsIntoForm();

  renderSeasonDetails();

  updateSeasonControlState();

  renderTeams();

  renderPendingRegistrations();

  refreshTeamDependentSettings();


  if (
    typeof renderTable === "function"
  ) {

    renderTable();
  }


  if (
    typeof renderFixtures === "function"
  ) {

    renderFixtures();
  }


  if (
    typeof renderKnockout === "function"
  ) {

    renderKnockout();
  }


  if (
    typeof renderChampionsResults ===
    "function"
  ) {

    renderChampionsResults();
  }
}


// =========================================================
// INITIAL REGISTRATION LOAD
// =========================================================

loadPendingRegistrations();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 5 — FIXTURE GENERATION
// =========================================================


// =========================================================
// RANDOMIZE ARRAY
// =========================================================

function shuffleArray(array) {

  const result = [...array];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];
  }

  return result;
}


// =========================================================
// CREATE TEAM OBJECT FOR FIXTURES
// =========================================================

function createFixtureTeam(team) {

  return {
    teamName: getTeamName(team),
    playerName: getPlayerName(team)
  };
}


// =========================================================
// CREATE SINGLE MATCH
// =========================================================

function createFixture(
  homeTeam,
  awayTeam,
  matchNumber
) {

  return {

    id:
      `match-${Date.now()}-${matchNumber}-${Math.random()
        .toString(36)
        .substring(2, 8)}`,

    home:
      getTeamName(homeTeam),

    away:
      getTeamName(awayTeam),

    homeScore:
      null,

    awayScore:
      null,

    resultEntered:
      false,

    matchNumber,

    createdAt:
      Date.now()
  };
}


// =========================================================
// CREATE LEAGUE ROUND-ROBIN PAIRS
// =========================================================

function createRoundRobinPairs(
  teamList,
  legs
) {

  let workingTeams =
    teamList.map(
      function(team) {
        return createFixtureTeam(team);
      }
    );


  /*
   * Round-robin scheduling requires
   * an even number of positions.
   *
   * For an odd number of teams,
   * one BYE position is added.
   */

  const hasBye =
    workingTeams.length % 2 !== 0;


  if (hasBye) {

    workingTeams.push({
      teamName: "__BYE__",
      playerName: ""
    });
  }


  const rounds =
    workingTeams.length - 1;

  const matchesPerRound =
    workingTeams.length / 2;


  let rotation =
    [...workingTeams];


  const firstLegMatches = [];


  for (
    let round = 0;
    round < rounds;
    round++
  ) {

    for (
      let match = 0;
      match < matchesPerRound;
      match++
    ) {

      const first =
        rotation[match];

      const second =
        rotation[
          rotation.length - 1 - match
        ];


      if (
        first.teamName === "__BYE__" ||
        second.teamName === "__BYE__"
      ) {

        continue;
      }


      /*
       * Alternate the home team to
       * avoid always giving the same
       * side home advantage.
       */

      let homeTeam;
      let awayTeam;


      if (
        (round + match) % 2 === 0
      ) {

        homeTeam = first;
        awayTeam = second;

      } else {

        homeTeam = second;
        awayTeam = first;
      }


      firstLegMatches.push({

        home:
          homeTeam.teamName,

        away:
          awayTeam.teamName,

        homeScore:
          null,

        awayScore:
          null,

        resultEntered:
          false,

        round:
          round + 1
      });
    }


    /*
     * Circle method rotation.
     *
     * Keep the first team fixed and
     * rotate the remaining teams.
     */

    const fixed =
      rotation[0];

    const rotating =
      rotation.slice(1);


    rotating.unshift(
      rotating.pop()
    );


    rotation = [
      fixed,
      ...rotating
    ];
  }


  if (Number(legs) !== 2) {

    return firstLegMatches;
  }


  /*
   * Second leg:
   *
   * Every home/away pairing is reversed.
   */

  const secondLegMatches =
    firstLegMatches.map(
      function(match) {

        return {

          home:
            match.away,

          away:
            match.home,

          homeScore:
            null,

          awayScore:
            null,

          resultEntered:
            false,

          round:
            match.round
        };
      }
    );


  return [
    ...firstLegMatches,
    ...secondLegMatches
  ];
}


// =========================================================
// CREATE CHAMPIONS LEAGUE MATCHES
// =========================================================

function createChampionsLeagueFixtures() {

  const teamCount =
    teams.length;


  const matchesPerTeam =
    Number(
      season.matchesPerTeam
    );


  if (
    teamCount < 9 ||
    teamCount > 40
  ) {

    return {
      success: false,

      message:
        "Champions League requires between 9 and 40 approved teams."
    };
  }


  if (
    !isMatchesPerTeamPossible(
      teamCount,
      matchesPerTeam
    )
  ) {

    const suggested =
      getSuggestedMatchesPerTeam(
        teamCount,
        matchesPerTeam
      );


    return {
      success: false,

      message:
        suggested
          ? `The selected ${matchesPerTeam} matches per team cannot be scheduled evenly with ${teamCount} teams. Suggested: ${suggested}.`
          : "The selected matches-per-team value cannot be scheduled."
    };
  }


  /*
   * We repeatedly shuffle the teams and
   * choose valid unused opponents.
   *
   * The algorithm records every pairing,
   * so the same two teams are not selected
   * twice during the league phase.
   */

  const teamNames =
    teams.map(
      function(team) {
        return getTeamName(team);
      }
    );


  const opponents =
    {};


  teamNames.forEach(
    function(teamName) {

      opponents[teamName] =
        new Set();
    }
  );


  const appearances =
    {};


  teamNames.forEach(
    function(teamName) {

      appearances[teamName] = 0;
    }
  );


  const generatedMatches = [];

  const totalMatches =
    (
      teamCount *
      matchesPerTeam
    ) / 2;


  let safety =
    0;


  while (
    generatedMatches.length <
      totalMatches &&
    safety < 100000
  ) {

    safety++;


    const candidates =
      shuffleArray(
        teamNames
      );


    let matchCreated =
      false;


    for (
      let i = 0;
      i < candidates.length;
      i++
    ) {

      const teamA =
        candidates[i];


      if (
        appearances[teamA] >=
        matchesPerTeam
      ) {

        continue;
      }


      const possibleOpponents =
        candidates.filter(
          function(teamB) {

            return (
              teamB !== teamA &&

              appearances[teamB] <
                matchesPerTeam &&

              !opponents[teamA].has(
                teamB
              )
            );
          }
        );


      if (
        possibleOpponents.length === 0
      ) {

        continue;
      }


      /*
       * Prefer an opponent with the
       * lowest number of appearances.
       */

      possibleOpponents.sort(
        function(a, b) {

          return (
            appearances[a] -
            appearances[b]
          );
        }
      );


      const opponent =
        possibleOpponents[
          Math.floor(
            Math.random() *
            Math.min(
              possibleOpponents.length,
              4
            )
          )
        ];


      let home =
        teamA;

      let away =
        opponent;


      /*
       * Randomly decide home advantage.
       */

      if (
        Math.random() < 0.5
      ) {

        home =
          opponent;

        away =
          teamA;
      }


      generatedMatches.push({

        home,

        away,

        homeScore:
          null,

        awayScore:
          null,

        resultEntered:
          false,

        round:
          Math.floor(
            generatedMatches.length /
              Math.max(
                1,
                Math.floor(
                  teamCount / 2
                )
              )
          ) + 1
      });


      appearances[teamA]++;
      appearances[opponent]++;


      opponents[teamA].add(
        opponent
      );

      opponents[opponent].add(
        teamA
      );


      matchCreated =
        true;

      break;
    }


    if (!matchCreated) {

      /*
       * Restart the generation if the
       * random arrangement reached a dead end.
       */

      if (
        safety < 90000
      ) {

        generatedMatches.length = 0;


        teamNames.forEach(
          function(teamName) {

            appearances[teamName] =
              0;

            opponents[teamName] =
              new Set();
          }
        );
      }
    }
  }


  if (
    generatedMatches.length !==
    totalMatches
  ) {

    return {
      success: false,

      message:
        "The fixture generator could not create a complete schedule. Please try generating again."
    };
  }


  /*
   * Verify every team has exactly the
   * selected number of matches.
   */

  for (
    const teamName of teamNames
  ) {

    if (
      appearances[teamName] !==
      matchesPerTeam
    ) {

      return {
        success: false,

        message:
          `Fixture validation failed for ${teamName}. Please generate again.`
      };
    }
  }


  return {
    success: true,

    fixtures:
      generatedMatches
  };
}


// =========================================================
// GENERATE NORMAL LEAGUE FIXTURES
// =========================================================

function generateLeagueFixtures() {

  if (teams.length < 2) {

    return {
      success: false,

      message:
        "At least 2 approved teams are required for a league."
    };
  }


  const legs =
    Number(
      season.legs || 1
    );


  const generated =
    createRoundRobinPairs(
      teams,
      legs
    );


  const finalFixtures =
    generated.map(
      function(match, index) {

        return {

          id:
            `league-${Date.now()}-${index}-${Math.random()
              .toString(36)
              .substring(2, 8)}`,

          home:
            match.home,

          away:
            match.away,

          homeScore:
            null,

          awayScore:
            null,

          resultEntered:
            false,

          round:
            match.round,

          createdAt:
            Date.now()
        };
      }
    );


  return {

    success: true,

    fixtures:
      finalFixtures
  };
}


// =========================================================
// GENERATE FIXTURES BUTTON
// =========================================================

if (generateFixturesButton) {

  generateFixturesButton.addEventListener(
    "click",
    async function() {

      if (season.started) {

        alert(
          "🔒 Fixtures cannot be regenerated after the season has started."
        );

        return;
      }


      if (teams.length < 2) {

        alert(
          "⚠️ Not enough approved teams."
        );

        return;
      }


      readSeasonSettingsFromForm();


      if (
        season.format ===
        "champions"
      ) {

        const validation =
          validateChampionsSettings();


        if (!validation.valid) {

          alert(
            "⚠️ " +
            validation.message
          );

          return;
        }
      }


      if (
        !season.startDate ||
        !season.endDate
      ) {

        alert(
          "⚠️ Please set the season start and end dates first."
        );

        return;
      }


      if (
        season.format ===
        "champions"
      ) {

        if (
          fixtures.length > 0
        ) {

          const confirmed =
            confirm(
              "Existing fixtures will be replaced with a new Champions League league phase. Continue?"
            );

          if (!confirmed) {
            return;
          }
        }


        const result =
          createChampionsLeagueFixtures();


        if (!result.success) {

          alert(
            "❌ " +
            result.message
          );

          return;
        }


        fixtures =
          result.fixtures;


        season.phase =
          "league";


        season.qualificationCount =
          getChampionsQualificationCount(
            teams.length
          );


        knockout =
          createDefaultKnockout();


        knockout.enabled =
          true;

        knockout.qualificationCount =
          season.qualificationCount;


        champions =
          createDefaultChampions();


      } else {

        if (
          fixtures.length > 0
        ) {

          const confirmed =
            confirm(
              "Existing fixtures will be replaced with a new league schedule. Continue?"
            );

          if (!confirmed) {
            return;
          }
        }


        const result =
          generateLeagueFixtures();


        if (!result.success) {

          alert(
            "❌ " +
            result.message
          );

          return;
        }


        fixtures =
          result.fixtures;


        season.phase =
          "league";


        knockout =
          createDefaultKnockout();


        champions =
          createDefaultChampions();
      }


      const saved =
        await saveCompetition();


      if (!saved) {
        return;
      }


      renderAll();


      alert(
        season.format === "champions"
          ? "✅ Champions League league-phase fixtures generated."
          : "✅ League fixtures generated."
      );
    }
  );
}

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 6 — START SEASON & FORMAT LOCK
// =========================================================


// =========================================================
// VALIDATE SEASON DATES
// =========================================================

function validateSeasonDates() {

  if (!season.startDate) {

    return {
      valid: false,
      message:
        "Please select a season start date."
    };
  }


  if (!season.endDate) {

    return {
      valid: false,
      message:
        "Please select a season end date."
    };
  }


  if (
    season.endDate <
    season.startDate
  ) {

    return {
      valid: false,
      message:
        "Season end date cannot be before the start date."
    };
  }


  return {
    valid: true,
    message: ""
  };
}


// =========================================================
// VALIDATE LEAGUE BEFORE START
// =========================================================

function validateLeagueBeforeStart() {

  if (teams.length < 2) {

    return {
      valid: false,
      message:
        "At least 2 approved teams are required."
    };
  }


  if (fixtures.length === 0) {

    return {
      valid: false,
      message:
        "Generate the league fixtures before starting the season."
    };
  }


  return {
    valid: true,
    message: ""
  };
}


// =========================================================
// VALIDATE CHAMPIONS LEAGUE BEFORE START
// =========================================================

function validateChampionsBeforeStart() {

  if (teams.length < 9) {

    return {
      valid: false,
      message:
        "Champions League requires at least 9 approved teams."
    };
  }


  if (teams.length > 40) {

    return {
      valid: false,
      message:
        "Champions League supports a maximum of 40 approved teams."
    };
  }


  if (fixtures.length === 0) {

    return {
      valid: false,
      message:
        "Generate the Champions League league-phase fixtures before starting the season."
    };
  }


  const qualificationCount =
    getChampionsQualificationCount(
      teams.length
    );


  if (
    qualificationCount !== 8 &&
    qualificationCount !== 16
  ) {

    return {
      valid: false,
      message:
        "The number of approved teams does not produce a valid knockout qualification stage."
    };
  }


  if (
    !isMatchesPerTeamPossible(
      teams.length,
      Number(
        season.matchesPerTeam
      )
    )
  ) {

    const suggested =
      getSuggestedMatchesPerTeam(
        teams.length,
        Number(
          season.matchesPerTeam
        )
      );


    return {
      valid: false,

      message:
        suggested
          ? `The selected matches-per-team value is not workable. Suggested value: ${suggested}.`
          : "The selected matches-per-team value is not workable."
    };
  }


  return {
    valid: true,
    message: ""
  };
}


// =========================================================
// CHECK WHETHER ALL LEAGUE FIXTURES ARE COMPLETE
// =========================================================

function areLeagueFixturesComplete() {

  if (
    !Array.isArray(fixtures) ||
    fixtures.length === 0
  ) {

    return false;
  }


  return fixtures.every(
    function(fixture) {

      return (
        fixture.homeScore !== null &&
        fixture.homeScore !== undefined &&
        fixture.awayScore !== null &&
        fixture.awayScore !== undefined
      );
    }
  );
}


// =========================================================
// GET SEASON START CONFIRMATION TEXT
// =========================================================

function getSeasonStartConfirmation() {

  if (
    season.format ===
    "champions"
  ) {

    const firstRound =
      season.qualificationCount === 8
        ? "Quarter-finals"
        : "Round of 16";


    return `
Start Champions League season?

Format:
🏆 Champions League

Approved teams:
${teams.length}

Matches per team:
${season.matchesPerTeam}

Knockout qualifiers:
Top ${season.qualificationCount}

Knockout starts:
${firstRound}

Knockout legs:
${season.knockoutLegs === 2
  ? "2 Legs"
  : "1 Leg"}

Once started, the format and season settings will be locked.
    `.trim();
  }


  return `
Start League season?

Format:
⚽ League

Approved teams:
${teams.length}

League format:
${Number(season.legs) === 2
  ? "2 Legs"
  : "1 Leg"}

Once started, the format and season settings will be locked.
  `.trim();
}


// =========================================================
// START SEASON
// =========================================================

if (startSeasonButton) {

  startSeasonButton.addEventListener(
    "click",
    async function() {

      if (season.started) {

        alert(
          "🔒 The season has already started."
        );

        return;
      }


      /*
       * Read the settings one final time
       * before locking them.
       */

      readSeasonSettingsFromForm();


      /*
       * Validate dates.
       */

      const dateValidation =
        validateSeasonDates();


      if (!dateValidation.valid) {

        alert(
          "⚠️ " +
          dateValidation.message
        );

        return;
      }


      /*
       * Validate the selected format.
       */

      let validation;


      if (
        season.format ===
        "champions"
      ) {

        validation =
          validateChampionsBeforeStart();

      } else {

        validation =
          validateLeagueBeforeStart();
      }


      if (!validation.valid) {

        alert(
          "⚠️ " +
          validation.message
        );

        return;
      }


      /*
       * Make sure the correct qualification
       * number is stored.
       */

      if (
        season.format ===
        "champions"
      ) {

        season.qualificationCount =
          getChampionsQualificationCount(
            teams.length
          );


        knockout.enabled =
          true;

        knockout.qualificationCount =
          season.qualificationCount;
      }


      const confirmed =
        confirm(
          getSeasonStartConfirmation()
        );


      if (!confirmed) {
        return;
      }


      /*
       * LOCK THE FORMAT.
       *
       * This is what prevents a League
       * and Champions League season from
       * running at the same time.
       */

      season.started =
        true;

      season.formatLocked =
        true;

      season.phase =
        "league";


      /*
       * Reset completed competition
       * results when a genuinely new
       * season is started.
       */

      champions =
        createDefaultChampions();


      const saved =
        await saveCompetition();


      if (!saved) {

        /*
         * Roll back the lock if Firebase
         * failed to save.
         */

        season.started =
          false;

        season.formatLocked =
          false;

        return;
      }


      renderAll();


      if (seasonControlMessage) {

        seasonControlMessage.textContent =
          season.format === "champions"
            ? "🔒 Champions League season started. Format and settings are now locked."
            : "🔒 League season started. Format and settings are now locked.";
      }


      alert(
        season.format === "champions"
          ? "🏆 Champions League season started successfully."
          : "⚽ League season started successfully."
      );
    }
  );
}


// =========================================================
// DISABLE FORMAT CHANGES AFTER START
// =========================================================

function enforceFormatLock() {

  if (
    !season.started &&
    !season.formatLocked
  ) {

    return;
  }


  if (competitionFormat) {

    competitionFormat.value =
      season.format;

    competitionFormat.disabled =
      true;
  }


  if (seasonStart) {

    seasonStart.value =
      season.startDate || "";

    seasonStart.disabled =
      true;
  }


  if (seasonEnd) {

    seasonEnd.value =
      season.endDate || "";

    seasonEnd.disabled =
      true;
  }


  if (legFormat) {

    legFormat.value =
      String(
        season.legs || 1
      );

    legFormat.disabled =
      true;
  }


  if (matchesPerTeam) {

    matchesPerTeam.value =
      String(
        season.matchesPerTeam || 4
      );

    matchesPerTeam.disabled =
      true;
  }


  if (knockoutLegFormat) {

    knockoutLegFormat.value =
      String(
        season.knockoutLegs || 1
      );

    knockoutLegFormat.disabled =
      true;
  }
}


// =========================================================
// REOPEN REGISTRATION
// =========================================================

if (reopenRegistrationButton) {

  reopenRegistrationButton.addEventListener(
    "click",
    async function() {

      /*
       * A season that has actually started
       * must remain locked.
       */

      if (season.started) {

        alert(
          "🔒 Registration cannot be reopened during an active season."
        );

        return;
      }


      /*
       * A completed season must be cleared
       * before a new registration period.
       */

      if (isSeasonCompleted()) {

        alert(
          "🔒 This season is completed. Clear the competition before starting a new registration period."
        );

        return;
      }


      /*
       * Reopening registration before the
       * season starts is allowed.
       */

      season.phase =
        "registration";


      /*
       * Unlock the pre-season controls.
       */

      season.formatLocked =
        false;


      const saved =
        await saveCompetition();


      if (!saved) {
        return;
      }


      /*
       * Refresh the dashboard so the
       * registration state and controls
       * immediately update.
       */

      renderAll();

      refreshAdminDashboard();


      if (seasonControlMessage) {

        seasonControlMessage.textContent =
          "🔓 Registration is open. You can add or approve teams before starting the season.";

        seasonControlMessage.style.display =
          "block";
      }


      alert(
        "🔓 Registration is open."
      );
    }
  );
}


// =========================================================
// KEEP FORMAT LOCKED WHEN DASHBOARD RENDERS
// =========================================================

const originalRenderSeasonDetails =
  renderSeasonDetails;

renderSeasonDetails =
  function() {

    originalRenderSeasonDetails();

    enforceFormatLock();
  };


// =========================================================
// INITIAL LOCK CHECK
// =========================================================

enforceFormatLock();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 7 — TABLE + FIXTURES + RESULTS
// =========================================================


// =========================================================
// CREATE EMPTY TEAM STATISTICS
// =========================================================

function createEmptyTeamStats(team) {

  return {
    team: getTeamName(team),

    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,

    goalsFor: 0,
    goalsAgainst: 0,

    goalDifference: 0,
    points: 0
  };
}


// =========================================================
// CALCULATE COMPETITION TABLE
// =========================================================

function getFixtureHomeName(fixture) {
  if (fixture?.homeTeam) {
    return getTeamName(fixture.homeTeam);
  }

  return String(fixture?.home || "").trim();
}


function getFixtureAwayName(fixture) {
  if (fixture?.awayTeam) {
    return getTeamName(fixture.awayTeam);
  }

  return String(fixture?.away || "").trim();
}


function calculateLeagueTable() {

  const table = {};

  teams.forEach(function(team) {

    const name = getTeamName(team);

    if (!name) {
      return;
    }

    table[name] =
      createEmptyTeamStats(team);
  });


  fixtures.forEach(function(fixture) {

    const home =
      getFixtureHomeName(fixture);

    const away =
      getFixtureAwayName(fixture);


    if (!home || !away) {
      return;
    }


    if (
      !Object.prototype.hasOwnProperty.call(
        table,
        home
      )
    ) {
      table[home] =
        createEmptyTeamStats({
          teamName: home
        });
    }


    if (
      !Object.prototype.hasOwnProperty.call(
        table,
        away
      )
    ) {
      table[away] =
        createEmptyTeamStats({
          teamName: away
        });
    }


    const hasHomeScore =
  fixture.homeScore !== null &&
  fixture.homeScore !== undefined &&
  fixture.homeScore !== "";

const hasAwayScore =
  fixture.awayScore !== null &&
  fixture.awayScore !== undefined &&
  fixture.awayScore !== "";


if (
  !hasHomeScore ||
  !hasAwayScore
) {
  return;
}


const homeScore =
  Number(fixture.homeScore);

const awayScore =
  Number(fixture.awayScore);


if (
  !Number.isFinite(homeScore) ||
  !Number.isFinite(awayScore)
) {
  return;
}


    table[home].played++;
    table[away].played++;


    table[home].goalsFor +=
      homeScore;

    table[home].goalsAgainst +=
      awayScore;


    table[away].goalsFor +=
      awayScore;

    table[away].goalsAgainst +=
      homeScore;


    if (homeScore > awayScore) {

      table[home].wins++;
      table[home].points += 3;

      table[away].losses++;

    } else if (homeScore < awayScore) {

      table[away].wins++;
      table[away].points += 3;

      table[home].losses++;

    } else {

      table[home].draws++;
      table[away].draws++;

      table[home].points++;
      table[away].points++;
    }
  });


  Object.values(table).forEach(function(row) {

    row.goalDifference =
      row.goalsFor -
      row.goalsAgainst;
  });


  return Object.values(table).sort(function(a, b) {

    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.goalDifference !== a.goalDifference) {
      return (
        b.goalDifference -
        a.goalDifference
      );
    }

    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }

    return a.team.localeCompare(b.team);
  });
}


// =========================================================
// RENDER ADMIN TABLE
// =========================================================

function renderTable() {

  if (!adminLeagueTable) {
    return;
  }


  adminLeagueTable.innerHTML =
    "";


  const table =
    calculateLeagueTable();


  if (table.length === 0) {

    adminLeagueTable.innerHTML = `
      <tr>
        <td colspan="10">
          No approved teams.
        </td>
      </tr>
    `;

    return;
  }


  const isChampions =
    season.format ===
    "champions";


  const qualificationCount =
    isChampions
      ? Number(
          season.qualificationCount || 0
        )
      : 0;


  table.forEach(
    function(row, index) {

      /*
       * Add the qualification
       * cutoff before the first
       * team that does not qualify.
       */

      if (
        isChampions &&
        qualificationCount > 0 &&
        index === qualificationCount
      ) {

        const cutoff =
          document.createElement(
            "tr"
          );

        cutoff.innerHTML = `
          <td
            colspan="10"
            style="
              text-align:center;
              font-weight:bold;
              padding:10px;
            "
          >
            🟢 KNOCKOUT QUALIFICATION LINE
          </td>
        `;

        adminLeagueTable.appendChild(
          cutoff
        );
      }


      const tr =
        document.createElement(
          "tr"
        );


      const qualifies =
        isChampions &&
        index <
        qualificationCount;


      tr.innerHTML = `
        <td>
          ${index + 1}
        </td>

        <td>
          ${
            qualifies
              ? "🟢 "
              : ""
          }${escapeHTML(row.team)}
        </td>

        <td>
          ${row.played}
        </td>

        <td>
          ${row.wins}
        </td>

        <td>
          ${row.draws}
        </td>

        <td>
          ${row.losses}
        </td>

        <td>
          ${row.goalsFor}
        </td>

        <td>
          ${row.goalsAgainst}
        </td>

        <td>
          ${row.goalDifference}
        </td>

        <td>
          <strong>
            ${row.points}
          </strong>
        </td>
      `;


      adminLeagueTable.appendChild(
        tr
      );
    }
  );
}


// =========================================================
// GET FIXTURE SCORE
// =========================================================

function getAdminFixtureScore(
  fixture
) {

  const home =
    fixture.homeScore;

  const away =
    fixture.awayScore;


  if (
    home === undefined ||
    home === null ||
    away === undefined ||
    away === null
  ) {

    return null;
  }


  return {
    home: Number(home),
    away: Number(away)
  };
}


// =========================================================
// CHECK VALID SCORE
// =========================================================

function isValidScore(value) {

  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {

    return false;
  }


  const number =
    Number(value);


  return (
    Number.isInteger(number) &&
    number >= 0
  );
}


// =========================================================
// SAVE FIXTURE RESULT
// =========================================================

async function saveFixtureResult(
  fixtureId,
  homeScore,
  awayScore
) {

  if (!season.started) {

    alert(
      "Start the season before entering results."
    );

    return;
  }


  if (
    !isValidScore(homeScore) ||
    !isValidScore(awayScore)
  ) {

    alert(
      "Please enter valid whole-number scores."
    );

    return;
  }


  /*
   * First try the normal fixture ID.
   */

  let fixture =
    fixtures.find(
      function(item) {

        return (
          String(item.id || "") ===
          String(fixtureId || "")
        );
      }
    );


  /*
   * Older fixtures may not have had an ID.
   *
   * The renderer now gives those fixtures
   * a temporary/stable ID before displaying
   * the Save Result button.
   */


  if (!fixture) {

    alert(
      "Fixture not found. Please refresh the admin page and try again."
    );

    return;
  }


  fixture.homeScore =
    Number(homeScore);

  fixture.awayScore =
    Number(awayScore);

  fixture.resultEntered =
    true;

  fixture.updatedAt =
    Date.now();


  const saved =
    await saveCompetition();


  if (!saved) {
    return;
  }


  renderTable();

  renderFixtures();


  alert(
    "✅ Result saved successfully."
  );
}


// =========================================================
// RENDER FIXTURES
// =========================================================

function renderFixtures() {

  if (!adminFixtureList) {
    return;
  }


  adminFixtureList.innerHTML =
    "";


  if (
    fixtures.length === 0
  ) {

    adminFixtureList.innerHTML = `
      <p>
        No fixtures generated.
      </p>
    `;

    return;
  }


  const sortedFixtures =
    [...fixtures].sort(
      function(a, b) {

        return (
          Number(a.round || 0) -
          Number(b.round || 0)
        );
      }
    );


  let currentRound =
    null;


  sortedFixtures.forEach(
  function(fixture, fixtureIndex) {

    /*
     * Some older fixtures were created without
     * an ID. Give them one now so their results
     * can be saved normally.
     */

    if (!fixture.id) {

      fixture.id =
        `legacy-${fixture.round || 1}-${fixtureIndex}-${teamKey(
          getFixtureHomeName(fixture)
        )}-${teamKey(
          getFixtureAwayName(fixture)
        )}`;
    }

      const round =
        Number(
          fixture.round || 1
        );


      if (
        round !==
        currentRound
      ) {

        currentRound =
          round;


        const heading =
          document.createElement(
            "h3"
          );

        heading.textContent =
          season.format === "champions"
            ? `Match Day ${round}`
            : `Match Day ${round}`;

        adminFixtureList.appendChild(
          heading
        );
      }


      const homeName =
  getFixtureHomeName(fixture);

const awayName =
  getFixtureAwayName(fixture);


      const score =
        getAdminFixtureScore(
          fixture
        );


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "admin-fixture";


      card.innerHTML = `
        <div
          style="
            padding:15px;
            margin-bottom:12px;
            border:1px solid #ccc;
            border-radius:10px;
          "
        >

          <strong>
            ${escapeHTML(homeName)}
          </strong>

          <span>
            vs
          </span>

          <strong>
            ${escapeHTML(awayName)}
          </strong>

          <div
            style="
              display:flex;
              gap:8px;
              align-items:center;
              margin-top:10px;
              flex-wrap:wrap;
            "
          >

            <input
              type="number"
              min="0"
              step="1"
              class="fixture-home-score"
              value="${
                score
                  ? score.home
                  : ""
              }"
              placeholder="Home"
              style="width:80px;"
            >

            <span>
              -
            </span>

            <input
              type="number"
              min="0"
              step="1"
              class="fixture-away-score"
              value="${
                score
                  ? score.away
                  : ""
              }"
              placeholder="Away"
              style="width:80px;"
            >

            <button
              class="save-fixture-result"
              data-fixture-id="${escapeHTML(
                fixture.id
              )}"
            >
              💾 Save Result
            </button>

          </div>

          ${
            score
              ? `
                <p>
                  ✅ Result recorded:
                  <strong>
                    ${score.home}
                    -
                    ${score.away}
                  </strong>
                </p>
              `
              : `
                <p>
                  🟡 Result not entered.
                </p>
              `
          }

        </div>
      `;


      adminFixtureList.appendChild(
        card
      );
    }
  );
}


// =========================================================
// RESULT BUTTON HANDLER
// =========================================================

if (adminFixtureList) {

  adminFixtureList.addEventListener(
    "click",
    async function(event) {

      const button =
        event.target.closest(
          ".save-fixture-result"
        );


      if (!button) {
        return;
      }


      const fixtureId =
        button.dataset.fixtureId;


      const container =
        button.closest(
          ".admin-fixture"
        );


      if (!container) {
        return;
      }


      const homeInput =
        container.querySelector(
          ".fixture-home-score"
        );


      const awayInput =
        container.querySelector(
          ".fixture-away-score"
        );


      await saveFixtureResult(
        fixtureId,
        homeInput.value,
        awayInput.value
      );
    }
  );
}


// =========================================================
// UPDATE FIXTURE TITLE
// =========================================================

function updateFixtureTitle() {

  if (!adminFixtureTitle) {
    return;
  }


  if (
    season.format ===
    "champions"
  ) {

    adminFixtureTitle.textContent =
      "⚽ Champions League League Phase";

  } else {

    adminFixtureTitle.textContent =
      "⚽ Fixtures & Results";
  }
}


// =========================================================
// UPDATE TABLE TITLE
// =========================================================

function updateTableTitle() {

  if (!adminTableTitle) {
    return;
  }


  if (
    season.format ===
    "champions"
  ) {

    adminTableTitle.textContent =
      "🏆 Champions League Table";

  } else {

    adminTableTitle.textContent =
      "📊 League Table";
  }
}


// =========================================================
// UPDATE QUALIFICATION LEGEND
// =========================================================

function updateQualificationLegend() {

  if (!qualificationLegend) {
    return;
  }


  if (
    season.format ===
      "champions" &&
    Number(
      season.qualificationCount || 0
    ) > 0
  ) {

    qualificationLegend.style.display =
      "block";

  } else {

    qualificationLegend.style.display =
      "none";
  }
}

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 8 — CHAMPIONS LEAGUE KNOCKOUT DRAW
// =========================================================


// =========================================================
// GET QUALIFIED TEAMS
// =========================================================

function getQualifiedTeams() {

  if (
    season.format !== "champions"
  ) {
    return [];
  }


  const table =
    calculateLeagueTable();


  const qualificationCount =
    Number(
      season.qualificationCount || 0
    );


  if (
    qualificationCount <= 0
  ) {
    return [];
  }


  return table
    .slice(
      0,
      qualificationCount
    )
    .map(
      function(row) {
        return row.team;
      }
    );
}


// =========================================================
// CREATE KNOCKOUT MATCH
// =========================================================

function createKnockoutMatch(
  tieId,
  matchNumber,
  homeTeam,
  awayTeam
) {

  return {

    id:
      `${tieId}-M${matchNumber}`,

    tieId:

      tieId,

    matchNumber:

      matchNumber,

    homeTeam: {

      teamName:
        homeTeam

    },

    awayTeam: {

      teamName:
        awayTeam

    },

    homeScore:
      null,

    awayScore:
      null,

    resultEntered:
      false,

    winner:
      "",

    updatedAt:
      null
  };
}


// =========================================================
// CREATE KNOCKOUT TIE
// =========================================================

function createKnockoutTie(
  round,
  tieNumber,
  teamA,
  teamB
) {

  const tieId =
    `${round}-T${tieNumber}`;


  const matches = [];


  const legs =
    Number(
      season.knockoutLegs || 1
    );


  if (legs === 2) {

    /*
     * First leg
     */

    matches.push(
      createKnockoutMatch(
        tieId,
        1,
        teamA,
        teamB
      )
    );


    /*
     * Second leg reverses
     * the home team.
     */

    matches.push(
      createKnockoutMatch(
        tieId,
        2,
        teamB,
        teamA
      )
    );

  } else {

    matches.push(
      createKnockoutMatch(
        tieId,
        1,
        teamA,
        teamB
      )
    );
  }


  return {

    id:
      tieId,

    round:
      round,

    tieNumber:
      tieNumber,

    teamA:
      teamA,

    teamB:
      teamB,

    matches:
      matches,

    winner:
      "",

    loser:
      "",

    completed:
      false
  };
}


// =========================================================
// CREATE RANDOM KNOCKOUT DRAW
// =========================================================

function createRandomKnockoutDraw(
  qualifiedTeams
) {

  const shuffled =
    shuffleArray(
      [...qualifiedTeams]
    );


  const firstRound =
    qualifiedTeams.length === 16
      ? "R16"
      : "QF";


  const ties = [];


  for (
    let i = 0;
    i < shuffled.length;
    i += 2
  ) {

    const tieNumber =
      Math.floor(i / 2) + 1;


    ties.push(
      createKnockoutTie(
        firstRound,
        tieNumber,
        shuffled[i],
        shuffled[i + 1]
      )
    );
  }


  return ties;
}


// =========================================================
// DRAW KNOCKOUT STAGE
// =========================================================

async function drawKnockoutStage() {

  if (
    season.format !==
    "champions"
  ) {

    alert(
      "Knockout stage is only available for Champions League."
    );

    return;
  }


  if (
    !season.started
  ) {

    alert(
      "Start the Champions League season first."
    );

    return;
  }


  if (
    knockout.drawLocked
  ) {

    alert(
      "🔒 The knockout draw has already been completed and locked."
    );

    return;
  }


  if (
    !areLeagueFixturesComplete()
  ) {

    alert(
      "⚠️ Complete all Champions League league-phase fixtures before drawing the knockout stage."
    );

    return;
  }


  const qualifiedTeams =
    getQualifiedTeams();


  const required =
    Number(
      season.qualificationCount || 0
    );


  if (
    qualifiedTeams.length !==
    required
  ) {

    alert(
      `Unable to create the knockout draw. ${required} qualified teams are required.`
    );

    return;
  }


  const firstRound =
    getChampionsFirstKnockoutRound();


  const confirmed =
    confirm(
      `Create the Champions League ${firstRound} draw now?\n\nThe draw will be random and permanently locked after it is saved.`
    );


  if (!confirmed) {
    return;
  }


  /*
   * Safety check immediately before
   * creating the draw.
   */

  if (
    knockout.drawLocked
  ) {

    alert(
      "The knockout draw has already been locked."
    );

    return;
  }


  const ties =
    createRandomKnockoutDraw(
      qualifiedTeams
    );


  knockout.enabled =
    true;

  knockout.qualificationCount =
    required;

  knockout.drawLocked =
    true;


  if (
    firstRound === "R16"
  ) {

    knockout.roundOf16 =
      ties;

    knockout.quarterFinals =
      [];

  } else {

    knockout.roundOf16 =
      [];

    knockout.quarterFinals =
      ties;
  }


  knockout.semiFinals =
    [];

  knockout.thirdPlace =
    null;

  knockout.final =
    null;


  season.phase =
    "knockout";


  const saved =
    await saveCompetition();


  if (!saved) {
    return;
  }


  renderKnockout();


  if (knockoutDrawStatus) {

    knockoutDrawStatus.textContent =
      `🔒 ${firstRound} draw completed and permanently locked.`;
  }


  alert(
    `🏆 ${firstRound} draw completed successfully.`
  );
}


// =========================================================
// DRAW BUTTON
// =========================================================

if (drawKnockoutButton) {

  drawKnockoutButton.addEventListener(
    "click",
    drawKnockoutStage
  );
}


// =========================================================
// GET CURRENT KNOCKOUT ROUND
// =========================================================

function getCurrentKnockoutRound() {

  if (
    knockout.final &&
    knockout.final.length > 0
  ) {

    return "FINAL";
  }


  if (
    knockout.semiFinals &&
    knockout.semiFinals.length > 0
  ) {

    return "SF";
  }


  if (
    knockout.quarterFinals &&
    knockout.quarterFinals.length > 0
  ) {

    return "QF";
  }


  if (
    knockout.roundOf16 &&
    knockout.roundOf16.length > 0
  ) {

    return "R16";
  }


  return "";
}


// =========================================================
// DISPLAY KNOCKOUT MATCHES
// =========================================================

function renderKnockoutTie(
  tie,
  container
) {

  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.style.border =
    "1px solid #ccc";

  wrapper.style.borderRadius =
    "10px";

  wrapper.style.padding =
    "12px";

  wrapper.style.marginBottom =
    "12px";


  const title =
    document.createElement(
      "h4"
    );


  title.textContent =
    `${tie.round} — Tie ${tie.tieNumber}`;


  wrapper.appendChild(
    title
  );


  const teamsLine =
    document.createElement(
      "p"
    );


  teamsLine.innerHTML = `
    <strong>
      ${escapeHTML(tie.teamA)}
    </strong>

    vs

    <strong>
      ${escapeHTML(tie.teamB)}
    </strong>
  `;


  wrapper.appendChild(
    teamsLine
  );


  tie.matches.forEach(
    function(match) {

      const matchBox =
        document.createElement(
          "div"
        );


      matchBox.style.marginTop =
        "10px";


      const score =
        getAdminFixtureScore(
          match
        );


      matchBox.innerHTML = `
        <div>
          <strong>
            Leg ${match.matchNumber}
          </strong>
        </div>

        <div
          style="
            display:flex;
            gap:8px;
            align-items:center;
            flex-wrap:wrap;
            margin-top:6px;
          "
        >

          <span>
            ${escapeHTML(
              getTeamName(
                match.homeTeam
              )
            )}
          </span>

          <input
            type="number"
            min="0"
            step="1"
            class="knockout-home-score"
            value="${
              score
                ? score.home
                : ""
            }"
            placeholder="0"
            style="width:65px;"
          >

          <span>
            -
          </span>

          <input
            type="number"
            min="0"
            step="1"
            class="knockout-away-score"
            value="${
              score
                ? score.away
                : ""
            }"
            placeholder="0"
            style="width:65px;"
          >

          <span>
            ${escapeHTML(
              getTeamName(
                match.awayTeam
              )
            )}
          </span>

          <button
            class="save-knockout-match"
            data-tie-id="${escapeHTML(
              tie.id
            )}"
            data-match-id="${escapeHTML(
              match.id
            )}"
          >
            💾 Save
          </button>

        </div>
      `;


      wrapper.appendChild(
        matchBox
      );
    }
  );


  if (tie.winner) {

    const winner =
      document.createElement(
        "p"
      );


    winner.innerHTML = `
      🏆 Winner:
      <strong>
        ${escapeHTML(tie.winner)}
      </strong>
    `;


    wrapper.appendChild(
      winner
    );
  }


  container.appendChild(
    wrapper
  );
}


// =========================================================
// RENDER KNOCKOUT
// =========================================================

function renderKnockout() {

  if (
    !adminKnockoutSection ||
    !adminKnockoutList
  ) {
    return;
  }


  if (
    season.format !==
    "champions"
  ) {

    adminKnockoutSection.style.display =
      "none";

    return;
  }


  adminKnockoutSection.style.display =
    "block";


  adminKnockoutList.innerHTML =
    "";


  if (
    !knockout.drawLocked
  ) {

    adminKnockoutList.innerHTML = `
      <p>
        🟡 Knockout draw has not been completed.
      </p>
    `;

    if (knockoutQualificationStatus) {

      const count =
        getQualifiedTeams().length;

      const required =
        Number(
          season.qualificationCount || 0
        );

      knockoutQualificationStatus.textContent =
        `Qualified: ${count}/${required}`;
    }

    return;
  }


  if (
    knockoutQualificationStatus
  ) {

    knockoutQualificationStatus.textContent =
      `🔒 Draw locked — ${knockout.qualificationCount} teams qualified.`;
  }


  if (
    knockoutDrawStatus
  ) {

    knockoutDrawStatus.textContent =
      "🔒 Knockout draw is permanently locked.";
  }


  if (
    knockout.roundOf16 &&
    knockout.roundOf16.length > 0
  ) {

    const heading =
      document.createElement(
        "h3"
      );

    heading.textContent =
      "🏆 Round of 16";

    adminKnockoutList.appendChild(
      heading
    );


    knockout.roundOf16.forEach(
      function(tie) {

        renderKnockoutTie(
          tie,
          adminKnockoutList
        );
      }
    );
  }


  if (
    knockout.quarterFinals &&
    knockout.quarterFinals.length > 0
  ) {

    const heading =
      document.createElement(
        "h3"
      );

    heading.textContent =
      "🏆 Quarter-finals";

    adminKnockoutList.appendChild(
      heading
    );


    knockout.quarterFinals.forEach(
      function(tie) {

        renderKnockoutTie(
          tie,
          adminKnockoutList
        );
      }
    );
  }


  if (
    knockout.semiFinals &&
    knockout.semiFinals.length > 0
  ) {

    const heading =
      document.createElement(
        "h3"
      );

    heading.textContent =
      "🏆 Semi-finals";

    adminKnockoutList.appendChild(
      heading
    );


    knockout.semiFinals.forEach(
      function(tie) {

        renderKnockoutTie(
          tie,
          adminKnockoutList
        );
      }
    );
  }


  if (
    knockout.thirdPlace
  ) {

    const heading =
      document.createElement(
        "h3"
      );

    heading.textContent =
      "🥉 Third-place Match";

    adminKnockoutList.appendChild(
      heading
    );


    renderKnockoutTie(
      knockout.thirdPlace,
      adminKnockoutList
    );
  }


  if (
    knockout.final &&
    knockout.final.length > 0
  ) {

    const heading =
      document.createElement(
        "h3"
      );

    heading.textContent =
      "🏆 Final";

    adminKnockoutList.appendChild(
      heading
    );


    knockout.final.forEach(
      function(tie) {

        renderKnockoutTie(
          tie,
          adminKnockoutList
        );
      }
    );
  }
}


// =========================================================
// INITIAL KNOCKOUT RENDER
// =========================================================

renderKnockout();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 9 — KNOCKOUT RESULTS + WINNERS
// =========================================================


// =========================================================
// FIND KNOCKOUT TIE
// =========================================================

function findKnockoutTie(tieId) {

  const allGroups = [
    knockout.roundOf16 || [],
    knockout.quarterFinals || [],
    knockout.semiFinals || [],
    knockout.thirdPlace
      ? [knockout.thirdPlace]
      : [],
    knockout.final || []
  ];


  for (
    const group of allGroups
  ) {

    const found =
      group.find(
        function(tie) {

          return (
            tie.id === tieId
          );
        }
      );


    if (found) {
      return found;
    }
  }


  return null;
}


// =========================================================
// FIND KNOCKOUT MATCH
// =========================================================

function findKnockoutMatch(
  tie,
  matchId
) {

  if (!tie) {
    return null;
  }


  return (
    tie.matches || []
  ).find(
    function(match) {

      return (
        match.id === matchId
      );
    }
  ) || null;
}


// =========================================================
// GET KNOCKOUT AGGREGATE
// =========================================================

function getKnockoutAggregate(
  tie
) {

  if (!tie) {
    return null;
  }


  let teamAScore = 0;
  let teamBScore = 0;


  for (
    const match of tie.matches || []
  ) {

    if (
      !match.resultEntered
    ) {

      return null;
    }


    const homeScore =
      Number(
        match.homeScore
      );

    const awayScore =
      Number(
        match.awayScore
      );


    if (
      !Number.isFinite(homeScore) ||
      !Number.isFinite(awayScore)
    ) {

      return null;
    }


    const homeTeam =
      getTeamName(
        match.homeTeam
      );

    const awayTeam =
      getTeamName(
        match.awayTeam
      );


    if (
      homeTeam === tie.teamA
    ) {

      teamAScore +=
        homeScore;

      teamBScore +=
        awayScore;

    } else if (
      homeTeam === tie.teamB
    ) {

      teamBScore +=
        homeScore;

      teamAScore +=
        awayScore;

    } else {

      return null;
    }
  }


  return {
    teamA:
      teamAScore,

    teamB:
      teamBScore
  };
}


// =========================================================
// DETERMINE KNOCKOUT WINNER
// =========================================================

function determineKnockoutWinner(
  tie
) {

  if (!tie) {
    return {
      status: "invalid"
    };
  }


  const aggregate =
    getKnockoutAggregate(
      tie
    );


  if (!aggregate) {

    return {
      status: "incomplete"
    };
  }


  if (
    aggregate.teamA >
    aggregate.teamB
  ) {

    return {
      status: "winner",
      winner: tie.teamA,
      loser: tie.teamB
    };
  }


  if (
    aggregate.teamB >
    aggregate.teamA
  ) {

    return {
      status: "winner",
      winner: tie.teamB,
      loser: tie.teamA
    };
  }


  /*
   * A tied knockout tie cannot
   * automatically advance a team.
   *
   * The admin must select the winner.
   */

  return {
    status: "draw"
  };
}


// =========================================================
// SET KNOCKOUT WINNER
// =========================================================

async function setKnockoutWinner(
  tieId,
  winner
) {

  const tie =
    findKnockoutTie(
      tieId
    );


  if (!tie) {

    alert(
      "Knockout tie not found."
    );

    return;
  }


  if (
    winner !== tie.teamA &&
    winner !== tie.teamB
  ) {

    alert(
      "Invalid knockout winner."
    );

    return;
  }


  const result =
    determineKnockoutWinner(
      tie
    );


  if (
    result.status !==
    "draw"
  ) {

    alert(
      "A manual winner is only required when the tie is level."
    );

    return;
  }


  tie.winner =
    winner;

  tie.loser =
    winner === tie.teamA
      ? tie.teamB
      : tie.teamA;

  tie.completed =
    true;


  const saved =
    await saveCompetition();


  if (!saved) {
    return;
  }


  renderKnockout();


  alert(
    `🏆 ${winner} advances.`
  );
}


// =========================================================
// SAVE KNOCKOUT MATCH RESULT
// =========================================================

async function saveKnockoutMatchResult(
  tieId,
  matchId,
  homeScore,
  awayScore
) {

  if (
    !season.started
  ) {

    alert(
      "Start the season first."
    );

    return;
  }


  const tie =
    findKnockoutTie(
      tieId
    );


  if (!tie) {

    alert(
      "Knockout tie not found."
    );

    return;
  }


  if (
    tie.completed
  ) {

    alert(
      "This knockout tie has already been completed."
    );

    return;
  }


  const match =
    findKnockoutMatch(
      tie,
      matchId
    );


  if (!match) {

    alert(
      "Knockout match not found."
    );

    return;
  }


  if (
    !isValidScore(homeScore) ||
    !isValidScore(awayScore)
  ) {

    alert(
      "Please enter valid whole-number scores."
    );

    return;
  }


  match.homeScore =
    Number(homeScore);

  match.awayScore =
    Number(awayScore);

  match.resultEntered =
    true;

  match.updatedAt =
    Date.now();


  /*
   * Check whether the entire tie
   * has now been completed.
   */

  const result =
    determineKnockoutWinner(
      tie
    );


  if (
    result.status ===
    "winner"
  ) {

    tie.winner =
      result.winner;

    tie.loser =
      result.loser;

    tie.completed =
      true;
  }


  const saved =
    await saveCompetition();


  if (!saved) {
    return;
  }


  renderKnockout();


  if (
    result.status ===
    "winner"
  ) {

    alert(
      `🏆 ${result.winner} advances.`
    );

  } else if (
    result.status ===
    "draw"
  ) {

    alert(
      "The knockout tie is level. Select the team that advances."
    );

  } else {

    alert(
      "✅ Knockout result saved."
    );
  }
}


// =========================================================
// KNOCKOUT RESULT BUTTON HANDLER
// =========================================================

if (adminKnockoutList) {

  adminKnockoutList.addEventListener(
    "click",
    async function(event) {

      /*
       * SAVE SCORE
       */

      const saveButton =
        event.target.closest(
          ".save-knockout-match"
        );


      if (saveButton) {

        const tieId =
          saveButton.dataset.tieId;

        const matchId =
          saveButton.dataset.matchId;


        const box =
          saveButton.parentElement;


        const homeInput =
          box.querySelector(
            ".knockout-home-score"
          );


        const awayInput =
          box.querySelector(
            ".knockout-away-score"
          );


        if (
          !homeInput ||
          !awayInput
        ) {
          return;
        }


        await saveKnockoutMatchResult(
          tieId,
          matchId,
          homeInput.value,
          awayInput.value
        );


        return;
      }


      /*
       * MANUAL WINNER
       */

      const winnerButton =
        event.target.closest(
          ".select-knockout-winner"
        );


      if (winnerButton) {

        const tieId =
          winnerButton.dataset.tieId;

        const winner =
          winnerButton.dataset.winner;


        await setKnockoutWinner(
          tieId,
          winner
        );
      }
    }
  );
}


// =========================================================
// ADD MANUAL WINNER BUTTONS
// =========================================================

function addManualWinnerControls(
  tie,
  container
) {

  if (!tie) {
    return;
  }


  if (
    tie.completed
  ) {
    return;
  }


  const result =
    determineKnockoutWinner(
      tie
    );


  if (
    result.status !==
    "draw"
  ) {
    return;
  }


  const box =
    document.createElement(
      "div"
    );


  box.style.marginTop =
    "10px";

  box.style.padding =
    "10px";

  box.style.border =
    "1px solid #ccc";

  box.style.borderRadius =
    "8px";


  box.innerHTML = `
    <p>
      ⚠️ The tie is level.
      Select the team that advances:
    </p>

    <button
      class="select-knockout-winner"
      data-tie-id="${escapeHTML(
        tie.id
      )}"
      data-winner="${escapeHTML(
        tie.teamA
      )}"
    >
      🏆 ${escapeHTML(
        tie.teamA
      )}
    </button>

    <button
      class="select-knockout-winner"
      data-tie-id="${escapeHTML(
        tie.id
      )}"
      data-winner="${escapeHTML(
        tie.teamB
      )}"
    >
      🏆 ${escapeHTML(
        tie.teamB
      )}
    </button>
  `;


  container.appendChild(
    box
  );
}


// =========================================================
// EXTEND KNOCKOUT TIE RENDERING
// =========================================================

const originalRenderKnockoutTie =
  renderKnockoutTie;

renderKnockoutTie =
  function(
    tie,
    container
  ) {

    const before =
      container.children.length;


    originalRenderKnockoutTie(
      tie,
      container
    );


    /*
     * The tie wrapper is the last
     * element added by the original
     * renderer.
     */

    const wrapper =
      container.children[
        container.children.length - 1
      ];


    if (
      wrapper &&
      container.children.length >
      before
    ) {

      addManualWinnerControls(
        tie,
        wrapper
      );
    }
  };


// =========================================================
// KNOCKOUT COMPLETION CHECK
// =========================================================

function areTiesComplete(
  ties
) {

  if (
    !Array.isArray(ties) ||
    ties.length === 0
  ) {

    return false;
  }


  return ties.every(
    function(tie) {

      return (
        tie.completed === true &&
        !!tie.winner
      );
    }
  );
}


// =========================================================
// GET WINNERS FROM ROUND
// =========================================================

function getRoundWinners(
  ties
) {

  if (
    !areTiesComplete(ties)
  ) {

    return [];
  }


  return ties.map(
    function(tie) {

      return tie.winner;
    }
  );
}


// =========================================================
// GET LOSERS FROM ROUND
// =========================================================

function getRoundLosers(
  ties
) {

  if (
    !areTiesComplete(ties)
  ) {

    return [];
  }


  return ties.map(
    function(tie) {

      return tie.loser;
    }
  );
}

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 10 — NEXT KNOCKOUT ROUNDS
// =========================================================


// =========================================================
// CREATE NEXT ROUND TIES
// =========================================================

function createNextKnockoutRound(
  round,
  teamsForRound
) {

  const ties = [];


  for (
    let i = 0;
    i < teamsForRound.length;
    i += 2
  ) {

    const tieNumber =
      Math.floor(i / 2) + 1;


    ties.push(
      createKnockoutTie(
        round,
        tieNumber,
        teamsForRound[i],
        teamsForRound[i + 1]
      )
    );
  }


  return ties;
}


// =========================================================
// ADVANCE FROM ROUND OF 16
// =========================================================

async function createQuarterFinals() {

  if (
    !knockout.roundOf16 ||
    knockout.roundOf16.length === 0
  ) {
    return false;
  }


  if (
    !areTiesComplete(
      knockout.roundOf16
    )
  ) {
    return false;
  }


  if (
    knockout.quarterFinals &&
    knockout.quarterFinals.length > 0
  ) {
    return true;
  }


  const winners =
    getRoundWinners(
      knockout.roundOf16
    );


  if (
    winners.length !== 8
  ) {
    return false;
  }


  knockout.quarterFinals =
    createNextKnockoutRound(
      "QF",
      winners
    );


  return true;
}


// =========================================================
// ADVANCE FROM QUARTER-FINALS
// =========================================================

async function createSemiFinals() {

  if (
    !knockout.quarterFinals ||
    knockout.quarterFinals.length === 0
  ) {
    return false;
  }


  if (
    !areTiesComplete(
      knockout.quarterFinals
    )
  ) {
    return false;
  }


  if (
    knockout.semiFinals &&
    knockout.semiFinals.length > 0
  ) {
    return true;
  }


  const winners =
    getRoundWinners(
      knockout.quarterFinals
    );


  if (
    winners.length !== 4
  ) {
    return false;
  }


  knockout.semiFinals =
    createNextKnockoutRound(
      "SF",
      winners
    );


  return true;
}


// =========================================================
// CREATE FINAL + THIRD PLACE
// =========================================================

async function createFinalAndThirdPlace() {

  if (
    !knockout.semiFinals ||
    knockout.semiFinals.length !== 2
  ) {
    return false;
  }


  if (
    !areTiesComplete(
      knockout.semiFinals
    )
  ) {
    return false;
  }


  if (
    knockout.final &&
    knockout.final.length > 0
  ) {

    return true;
  }


  const winners =
    getRoundWinners(
      knockout.semiFinals
    );


  const losers =
    getRoundLosers(
      knockout.semiFinals
    );


  if (
    winners.length !== 2 ||
    losers.length !== 2
  ) {
    return false;
  }


  /*
   * Final
   */

  knockout.final =
    createNextKnockoutRound(
      "FINAL",
      winners
    );


  /*
   * Third-place match
   */

  const thirdPlaceTie =
    createKnockoutTie(
      "THIRD",
      1,
      losers[0],
      losers[1]
    );


  knockout.thirdPlace =
    thirdPlaceTie;


  return true;
}


// =========================================================
// ADVANCE KNOCKOUT STAGE
// =========================================================

async function advanceKnockoutStage() {

  if (
    season.format !==
    "champions"
  ) {
    return;
  }


  if (
    !knockout.drawLocked
  ) {
    return;
  }


  let changed =
    false;


  /*
   * R16 → QF
   */

  if (
    knockout.roundOf16 &&
    knockout.roundOf16.length > 0 &&
    !knockout.quarterFinals.length
  ) {

    if (
      await createQuarterFinals()
    ) {

      changed =
        true;
    }
  }


  /*
   * QF → SF
   */

  if (
    knockout.quarterFinals &&
    knockout.quarterFinals.length > 0 &&
    !knockout.semiFinals.length
  ) {

    if (
      await createSemiFinals()
    ) {

      changed =
        true;
    }
  }


  /*
   * SF → Final + Third place
   */

  if (
    knockout.semiFinals &&
    knockout.semiFinals.length === 2 &&
    !knockout.final.length
  ) {

    if (
      await createFinalAndThirdPlace()
    ) {

      changed =
        true;
    }
  }


  if (!changed) {
    return;
  }


  season.phase =
    "knockout";


  await saveCompetition();

  renderKnockout();
}


// =========================================================
// CHECK AND ADVANCE AFTER RESULT
// =========================================================

async function checkKnockoutProgression() {

  if (
    season.format !==
    "champions"
  ) {
    return;
  }


  await advanceKnockoutStage();
}


// =========================================================
// WRAP KNOCKOUT RESULT SAVE
// =========================================================

const originalSaveKnockoutMatchResult =
  saveKnockoutMatchResult;

saveKnockoutMatchResult =
  async function(
    tieId,
    matchId,
    homeScore,
    awayScore
  ) {

    await originalSaveKnockoutMatchResult(
      tieId,
      matchId,
      homeScore,
      awayScore
    );


    /*
     * Check whether the completed
     * result allows the competition
     * to move to the next round.
     */

    await checkKnockoutProgression();
  };


// =========================================================
// WRAP MANUAL WINNER SELECTION
// =========================================================

const originalSetKnockoutWinner =
  setKnockoutWinner;

setKnockoutWinner =
  async function(
    tieId,
    winner
  ) {

    await originalSetKnockoutWinner(
      tieId,
      winner
    );


    await checkKnockoutProgression();
  };


// =========================================================
// SHOW NEXT-ROUND STATUS
// =========================================================

function renderKnockoutProgressStatus() {

  if (
    !knockoutQualificationStatus
  ) {
    return;
  }


  if (
    !knockout.drawLocked
  ) {

    return;
  }


  if (
    knockout.roundOf16.length > 0 &&
    !knockout.quarterFinals.length
  ) {

    if (
      areTiesComplete(
        knockout.roundOf16
      )
    ) {

      knockoutQualificationStatus.textContent =
        "✅ Round of 16 complete. Quarter-finals will be created.";
    }

    return;
  }


  if (
    knockout.quarterFinals.length > 0 &&
    !knockout.semiFinals.length
  ) {

    if (
      areTiesComplete(
        knockout.quarterFinals
      )
    ) {

      knockoutQualificationStatus.textContent =
        "✅ Quarter-finals complete. Semi-finals will be created.";
    }

    return;
  }


  if (
    knockout.semiFinals.length === 2 &&
    !knockout.final.length
  ) {

    if (
      areTiesComplete(
        knockout.semiFinals
      )
    ) {

      knockoutQualificationStatus.textContent =
        "✅ Semi-finals complete. Final and third-place match will be created.";
    }

    return;
  }


  if (
    knockout.final &&
    knockout.final.length > 0
  ) {

    knockoutQualificationStatus.textContent =
      "🏆 Final stage is active.";
  }
}


// =========================================================
// EXTEND KNOCKOUT RENDER
// =========================================================

const previousRenderKnockout =
  renderKnockout;

renderKnockout =
  function() {

    previousRenderKnockout();

    renderKnockoutProgressStatus();
  };


// =========================================================
// INITIAL PROGRESSION CHECK
// =========================================================

if (
  season.format === "champions" &&
  knockout.drawLocked
) {

  advanceKnockoutStage();
}

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 11 — FINAL RESULTS + PODIUM
// =========================================================


// =========================================================
// CHECK WHETHER A TIE IS COMPLETED
// =========================================================

function isKnockoutTieCompleted(tie) {

  return !!(
    tie &&
    tie.completed === true &&
    tie.winner
  );
}


// =========================================================
// GET COMPLETED FINAL
// =========================================================

function getCompletedFinal() {

  if (
    !knockout.final ||
    knockout.final.length === 0
  ) {
    return null;
  }


  const finalTie =
    knockout.final[0];


  if (
    !isKnockoutTieCompleted(
      finalTie
    )
  ) {
    return null;
  }


  return finalTie;
}


// =========================================================
// GET COMPLETED THIRD-PLACE MATCH
// =========================================================

function getCompletedThirdPlace() {

  const tie =
    knockout.thirdPlace;


  if (
    !isKnockoutTieCompleted(
      tie
    )
  ) {
    return null;
  }


  return tie;
}


// =========================================================
// UPDATE COMPETITION PODIUM
// =========================================================

async function updateCompetitionPodium() {

  if (
    season.format !==
    "champions"
  ) {
    return false;
  }


  const finalTie =
    getCompletedFinal();


  const thirdPlaceTie =
    getCompletedThirdPlace();


  if (!finalTie) {

    return false;
  }


  champions.champion =
    finalTie.winner;


  champions.runnerUp =
    finalTie.loser || "";


  if (thirdPlaceTie) {

    champions.thirdPlace =
      thirdPlaceTie.winner;
  }


  season.phase =
    "completed";


  const saved =
    await saveCompetition();


  if (!saved) {
    return false;
  }


  renderChampionsResults();


  return true;
}


// =========================================================
// CHECK WHETHER COMPETITION IS FINISHED
// =========================================================

function isChampionsCompetitionComplete() {

  if (
    season.format !==
    "champions"
  ) {
    return false;
  }


  const finalTie =
    getCompletedFinal();


  const thirdPlaceTie =
    getCompletedThirdPlace();


  return !!(
    finalTie &&
    thirdPlaceTie
  );
}


// =========================================================
// RENDER CHAMPIONS RESULTS
// =========================================================

function renderChampionsResults() {

  if (
    !adminChampionsSection ||
    !adminChampionsResults
  ) {
    return;
  }


  if (
    season.format !==
    "champions"
  ) {

    adminChampionsSection.style.display =
      "none";

    return;
  }


  adminChampionsSection.style.display =
    "block";


  adminChampionsResults.innerHTML =
    "";


  const finalTie =
    getCompletedFinal();


  const thirdPlaceTie =
    getCompletedThirdPlace();


  if (!finalTie) {

    adminChampionsResults.innerHTML = `
      <p>
        🟡 The Champions League final has not been completed yet.
      </p>
    `;

    return;
  }


  const champion =
    finalTie.winner;


  const runnerUp =
    finalTie.loser || "";


  const third =
    thirdPlaceTie
      ? thirdPlaceTie.winner
      : "";


  adminChampionsResults.innerHTML = `
    <div
      style="
        text-align:center;
        padding:20px;
      "
    >

      <h3>
        🏆 Champions League Results
      </h3>

      <p>
        🥇
        <strong>
          Champion
        </strong>
        <br>
        ${escapeHTML(
          champion
        )}
      </p>

      <p>
        🥈
        <strong>
          Runner-up
        </strong>
        <br>
        ${escapeHTML(
          runnerUp
        )}
      </p>

      <p>
        🥉
        <strong>
          Third Place
        </strong>
        <br>
        ${
          third
            ? escapeHTML(third)
            : "Third-place match pending."
        }
      </p>

    </div>
  `;


  if (
    isChampionsCompetitionComplete()
  ) {

    const complete =
      document.createElement(
        "p"
      );


    complete.style.textAlign =
      "center";


    complete.innerHTML = `
      <strong>
        🎉 Champions League season completed.
      </strong>
    `;


    adminChampionsResults.appendChild(
      complete
    );
  }
}


// =========================================================
// WRAP KNOCKOUT PROGRESSION
// =========================================================

const previousAdvanceKnockoutStage =
  advanceKnockoutStage;

advanceKnockoutStage =
  async function() {

    await previousAdvanceKnockoutStage();


    /*
     * After the final and third-place
     * match have both been completed,
     * store the official podium.
     */

    if (
      isChampionsCompetitionComplete()
    ) {

      await updateCompetitionPodium();
    }
  };


// =========================================================
// WRAP KNOCKOUT RESULT SAVE AGAIN
// =========================================================

const previousKnockoutResultSave =
  saveKnockoutMatchResult;

saveKnockoutMatchResult =
  async function(
    tieId,
    matchId,
    homeScore,
    awayScore
  ) {

    await previousKnockoutResultSave(
      tieId,
      matchId,
      homeScore,
      awayScore
    );


    /*
     * The previous wrapper advances
     * the competition. This final check
     * records the podium when applicable.
     */

    if (
      isChampionsCompetitionComplete()
    ) {

      await updateCompetitionPodium();
    }
  };


// =========================================================
// INITIAL RESULTS RENDER
// =========================================================

renderChampionsResults();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 12 — CLEAR COMPETITION + NEW SEASON RESET
// =========================================================


// =========================================================
// CLEAR COMPETITION
// =========================================================

async function clearCompetition() {

  const confirmed =
    confirm(
      "⚠️ CLEAR COMPETITION?\n\n" +
      "This will remove:\n\n" +
      "• Fixtures\n" +
      "• Results\n" +
      "• Champions League knockout stages\n" +
      "• Competition winners\n" +
      "• Season settings\n\n" +
      "✅ Approved teams will NOT be deleted.\n\n" +
      "This action cannot be undone."
    );


  if (!confirmed) {
    return;
  }


  /*
   * Second confirmation prevents
   * accidental deletion on phone.
   */

  const finalConfirmed =
    confirm(
      "FINAL CONFIRMATION\n\n" +
      "Approved teams will remain.\n" +
      "Only the current competition data will be cleared.\n\n" +
      "Continue?"
    );


  if (!finalConfirmed) {
    return;
  }


  /*
   * Keep approved teams.
   *
   * Only competition-specific data
   * is reset.
   */

  fixtures = [];


  season =
    createDefaultSeason();


  knockout =
    createDefaultKnockout();


  champions =
    createDefaultChampions();


  /*
   * Save the reset competition while
   * preserving the existing approved teams.
   */

  const saved =
    await saveCompetition();


  if (!saved) {
    return;
  }


  /*
   * Refresh the dashboard.
   */

  renderAll();


  loadSeasonSettingsIntoForm();


  updateFormatSettings();

  updateChampionsSettingsFromTeams();

  updateSeasonControlState();

  enforceFormatLock();


  if (seasonControlMessage) {

    seasonControlMessage.textContent =
      "🟢 Competition cleared. Approved teams were kept. A new season can now be configured.";
  }


  alert(
    "✅ Competition cleared successfully.\n\n" +
    "Approved teams were kept.\n\n" +
    "You can now choose League or Champions League for the new season."
  );
}


// =========================================================
// CLEAR COMPETITION BUTTON
// =========================================================

if (clearCompetitionButton) {

  clearCompetitionButton.addEventListener(
    "click",
    clearCompetition
  );
}


// =========================================================
// LOGOUT
// =========================================================

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async function() {

      const confirmed =
        confirm(
          "Logout from the admin dashboard?"
        );


      if (!confirmed) {
        return;
      }


      try {

        await signOut(auth);

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

        alert(
          "Unable to logout. Please try again."
        );
      }
    }
  );
}


// =========================================================
// FINAL DASHBOARD REFRESH
// =========================================================

function refreshAdminDashboard() {

  renderSeasonDetails();

  renderTeams();

  renderTable();

  renderFixtures();

  renderKnockout();

  renderChampionsResults();

  updateFixtureTitle();

  updateTableTitle();

  updateQualificationLegend();

  updateChampionsSettingsFromTeams();

  updateSeasonControlState();

  enforceFormatLock();
}


// =========================================================
// RUN FINAL REFRESH
// =========================================================

refreshAdminDashboard();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 13 — KNOCKOUT SAFETY FIXES
// =========================================================


// =========================================================
// SAFE CHECK FOR KNOCKOUT FINAL
// =========================================================

function hasKnockoutFinal() {

  return (
    Array.isArray(knockout.final) &&
    knockout.final.length > 0
  );
}


// =========================================================
// SAFE CHECK FOR THIRD-PLACE MATCH
// =========================================================

function hasThirdPlaceMatch() {

  return !!(
    knockout.thirdPlace &&
    typeof knockout.thirdPlace === "object"
  );
}


// =========================================================
// SAFE CHECK FOR SEMI-FINALS
// =========================================================

function hasSemiFinals() {

  return (
    Array.isArray(
      knockout.semiFinals
    ) &&
    knockout.semiFinals.length === 2
  );
}


// =========================================================
// REPLACE KNOCKOUT PROGRESSION
// =========================================================

async function runSafeKnockoutProgression() {

  if (
    season.format !==
    "champions"
  ) {
    return;
  }


  if (
    !knockout.drawLocked
  ) {
    return;
  }


  /*
   * R16 → QF
   */

  if (
    Array.isArray(
      knockout.roundOf16
    ) &&
    knockout.roundOf16.length > 0 &&
    (
      !Array.isArray(
        knockout.quarterFinals
      ) ||
      knockout.quarterFinals.length === 0
    )
  ) {

    if (
      areTiesComplete(
        knockout.roundOf16
      )
    ) {

      await createQuarterFinals();
    }
  }


  /*
   * QF → SF
   */

  if (
    Array.isArray(
      knockout.quarterFinals
    ) &&
    knockout.quarterFinals.length > 0 &&
    (
      !Array.isArray(
        knockout.semiFinals
      ) ||
      knockout.semiFinals.length === 0
    )
  ) {

    if (
      areTiesComplete(
        knockout.quarterFinals
      )
    ) {

      await createSemiFinals();
    }
  }


  /*
   * SF → Final + Third Place
   */

  if (
    hasSemiFinals() &&
    !hasKnockoutFinal()
  ) {

    if (
      areTiesComplete(
        knockout.semiFinals
      )
    ) {

      await createFinalAndThirdPlace();
    }
  }


  season.phase =
    "knockout";


  await saveCompetition();


  renderKnockout();

  renderChampionsResults();
}


// =========================================================
// SAFE INITIAL STATE NORMALIZATION
// =========================================================

function normalizeKnockoutArrays() {

  if (
    !Array.isArray(
      knockout.roundOf16
    )
  ) {

    knockout.roundOf16 = [];
  }


  if (
    !Array.isArray(
      knockout.quarterFinals
    )
  ) {

    knockout.quarterFinals = [];
  }


  if (
    !Array.isArray(
      knockout.semiFinals
    )
  ) {

    knockout.semiFinals = [];
  }


  if (
    knockout.final !== null &&
    !Array.isArray(
      knockout.final
    )
  ) {

    knockout.final = [];
  }
}


// =========================================================
// RUN NORMALIZATION
// =========================================================

normalizeKnockoutArrays();


// =========================================================
// REFRESH AFTER NORMALIZATION
// =========================================================

renderKnockout();

renderChampionsResults();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 14 — FINAL SEASON SAFETY + EDIT LOCK
// =========================================================


// =========================================================
// CHECK WHETHER THE SEASON IS COMPLETED
// =========================================================

function isSeasonCompleted() {

  return (
    season.phase === "completed" ||
    (
      season.format === "champions" &&
      isChampionsCompetitionComplete()
    )
  );
}


// =========================================================
// BLOCK CHANGES AFTER SEASON COMPLETION
// =========================================================

function canModifyCompetition() {

  if (isSeasonCompleted()) {

    alert(
      "This season is completed. " +
      "Start a new season before making further changes."
    );

    return false;
  }

  return true;
}


// =========================================================
// PROTECT FIXTURE RESULTS
// =========================================================

const originalSaveFixtureResultPart14 =
  saveFixtureResult;

saveFixtureResult = async function () {

  if (!canModifyCompetition()) {
    return;
  }

  return originalSaveFixtureResultPart14.apply(
    this,
    arguments
  );
};


// =========================================================
// PROTECT KNOCKOUT RESULTS
// =========================================================

const originalSaveKnockoutMatchResultPart14 =
  saveKnockoutMatchResult;

saveKnockoutMatchResult = async function () {

  if (!canModifyCompetition()) {
    return;
  }

  return originalSaveKnockoutMatchResultPart14.apply(
    this,
    arguments
  );
};


// =========================================================
// PROTECT MANUAL KNOCKOUT WINNER
// =========================================================

const originalSetKnockoutWinnerPart14 =
  setKnockoutWinner;

setKnockoutWinner = async function () {

  if (!canModifyCompetition()) {
    return;
  }

  return originalSetKnockoutWinnerPart14.apply(
    this,
    arguments
  );
};


// =========================================================
// UPDATE SEASON CONTROL MESSAGE
// =========================================================

function updateCompletedSeasonMessage() {

  if (!seasonControlMessage) {
    return;
  }

  if (isSeasonCompleted()) {

    seasonControlMessage.textContent =
      "Season completed. Clear the competition to start a new season.";

    seasonControlMessage.style.display = "block";

    return;
  }

  if (
    season.started &&
    season.formatLocked
  ) {

    seasonControlMessage.textContent =
      "Season is active. Format and team changes are locked.";

    seasonControlMessage.style.display = "block";

    return;
  }

  seasonControlMessage.textContent = "";

  seasonControlMessage.style.display = "none";
}


// =========================================================
// WRAP DASHBOARD REFRESH
// =========================================================

const originalRefreshAdminDashboardPart14 =
  refreshAdminDashboard;

refreshAdminDashboard = function () {

  originalRefreshAdminDashboardPart14();

  updateCompletedSeasonMessage();
};


// =========================================================
// INITIAL UPDATE
// =========================================================

updateCompletedSeasonMessage();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 15 — CHAMPIONS SEASON COMPLETION LOCK
// =========================================================


// =========================================================
// LOCK CHAMPIONS CONTROLS AFTER COMPLETION
// =========================================================

function enforceChampionsCompletionLock() {

  if (
    season.format !== "champions" ||
    !isSeasonCompleted()
  ) {
    return;
  }


  if (drawKnockoutButton) {
    drawKnockoutButton.disabled = true;
  }


  if (generateFixturesButton) {
    generateFixturesButton.disabled = true;
  }


  if (startSeasonButton) {
    startSeasonButton.disabled = true;
  }


  if (reopenRegistrationButton) {
    reopenRegistrationButton.disabled = true;
  }


  if (matchesPerTeam) {
    matchesPerTeam.disabled = true;
  }


  if (knockoutLegFormat) {
    knockoutLegFormat.disabled = true;
  }


  if (competitionFormat) {
    competitionFormat.disabled = true;
  }


  if (seasonStart) {
    seasonStart.disabled = true;
  }


  if (seasonEnd) {
    seasonEnd.disabled = true;
  }


  if (legFormat) {
    legFormat.disabled = true;
  }
}


// =========================================================
// UPDATE COMPLETION LOCK AFTER DASHBOARD REFRESH
// =========================================================

const originalUpdateSeasonControlStatePart15 =
  updateSeasonControlState;

updateSeasonControlState = function () {

  originalUpdateSeasonControlStatePart15();

  enforceChampionsCompletionLock();
};


// =========================================================
// FINAL INITIALIZATION
// =========================================================

enforceChampionsCompletionLock();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 16 — FINAL ADMIN STATUS DISPLAY
// =========================================================

function renderFinalCompetitionStatus() {

  const statusElement =
    document.getElementById("knockoutDrawStatus");

  if (!statusElement) {
    return;
  }

  if (
    season.format !== "champions"
  ) {
    return;
  }

  if (
    !season.started
  ) {
    statusElement.textContent =
      "Champions League has not started.";

    return;
  }

  if (
    season.phase === "completed"
  ) {

    statusElement.textContent =
      "Champions League completed.";

    return;
  }

  if (
    knockout.drawLocked
  ) {

    statusElement.textContent =
      "Knockout draw locked. Results can now be entered.";

    return;
  }

  statusElement.textContent =
    "Knockout draw is ready when the league phase is complete.";
}


// =========================================================
// ADD STATUS TO DASHBOARD REFRESH
// =========================================================

const originalRefreshAdminDashboardPart16 =
  refreshAdminDashboard;

refreshAdminDashboard = function () {

  originalRefreshAdminDashboardPart16();

  renderFinalCompetitionStatus();
};


// =========================================================
// INITIAL STATUS
// =========================================================

renderFinalCompetitionStatus();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 17 — FINAL ADMIN VALIDATION
// =========================================================


// =========================================================
// CHECK REQUIRED CHAMPIONS DATA
// =========================================================

function validateChampionsDataIntegrity() {

  if (
    season.format !== "champions"
  ) {
    return true;
  }


  if (
    !Array.isArray(teams) ||
    teams.length < 9 ||
    teams.length > 40
  ) {
    return false;
  }


  const expectedQualification =
    getChampionsQualificationCount(
      teams.length
    );


  if (
    season.qualificationCount !==
    expectedQualification
  ) {
    return false;
  }


  if (
    knockout.qualificationCount !==
    expectedQualification
  ) {
    return false;
  }


  if (
    knockout.enabled !== true
  ) {
    return false;
  }


  return true;
}


// =========================================================
// SHOW DATA WARNING IF NEEDED
// =========================================================

function renderChampionsDataWarning() {

  const warning =
    document.getElementById(
      "championsQualificationInfo"
    );

  if (!warning) {
    return;
  }


  if (
    season.format !== "champions"
  ) {
    return;
  }


  if (
    validateChampionsDataIntegrity()
  ) {
    return;
  }


  warning.textContent =
    "Champions League settings need to be refreshed before starting the season.";

  warning.style.display =
    "block";
}


// =========================================================
// ADD VALIDATION TO DASHBOARD REFRESH
// =========================================================

const originalRefreshAdminDashboardPart17 =
  refreshAdminDashboard;

refreshAdminDashboard = function () {

  originalRefreshAdminDashboardPart17();

  renderChampionsDataWarning();
};


// =========================================================
// INITIAL CHECK
// =========================================================

renderChampionsDataWarning();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 18 — ADMIN.JS FINAL INITIALIZATION
// =========================================================


// =========================================================
// LOAD COMPETITION DATA
// =========================================================

async function initializeAdminApplication() {

  try {

    await waitForFirebase();

    await loadCompetition();

    normalizeKnockoutArrays();

    renderAll();

    refreshAdminDashboard();

    updateCompletedSeasonMessage();

    enforceChampionsCompletionLock();

    renderFinalCompetitionStatus();

    renderChampionsDataWarning();

  } catch (error) {

    console.error(
      "Admin initialization failed:",
      error
    );

    if (seasonControlMessage) {

      seasonControlMessage.textContent =
        "Unable to load competition data. Please refresh the page.";

      seasonControlMessage.style.display =
        "block";
    }
  }
}


// =========================================================
// START ADMIN APPLICATION
// =========================================================

initializeAdminApplication();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 19 — ADMIN ERROR HANDLER
// =========================================================


// =========================================================
// GLOBAL FIREBASE ERROR HANDLER
// =========================================================

window.addEventListener(
  "unhandledrejection",
  function (event) {

    console.error(
      "Unhandled admin error:",
      event.reason
    );

  }
);


// =========================================================
// GLOBAL JAVASCRIPT ERROR HANDLER
// =========================================================

window.addEventListener(
  "error",
  function (event) {

    console.error(
      "Admin JavaScript error:",
      event.error || event.message
    );

  }
);


// =========================================================
// FIREBASE READY CHECK
// =========================================================

function verifyAdminFirebaseConnection() {

  if (
    !window.firebaseReady ||
    !window.db ||
    !window.auth
  ) {

    console.error(
      "Firebase is not ready."
    );

    return false;
  }

  return true;
}


// =========================================================
// DISPLAY CONNECTION STATUS
// =========================================================

function renderFirebaseStatus() {

  const status =
    document.getElementById(
      "seasonControlMessage"
    );

  if (!status) {
    return;
  }


  if (
    verifyAdminFirebaseConnection()
  ) {
    return;
  }


  status.textContent =
    "Firebase connection is not ready. Please refresh the page.";

  status.style.display =
    "block";
}


// =========================================================
// INITIAL CONNECTION CHECK
// =========================================================

renderFirebaseStatus();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 20 — ADMIN DATA VALIDATION
// =========================================================

function validateAdminDataBeforeSave() {

  if (!Array.isArray(teams)) {
    teams = [];
  }

  if (!Array.isArray(fixtures)) {
    fixtures = [];
  }

  if (!Array.isArray(registrations)) {
    registrations = [];
  }

  if (!season || typeof season !== "object") {
    season = createDefaultSeason();
  }

  if (!knockout || typeof knockout !== "object") {
    knockout = createDefaultKnockout();
  }

  if (!champions || typeof champions !== "object") {
    champions = createDefaultChampions();
  }

  normalizeKnockoutArrays();

  return true;
}


// =========================================================
// VALIDATE BEFORE SAVING
// =========================================================

const originalSaveCompetitionPart20 =
  saveCompetition;

saveCompetition = async function () {

  validateAdminDataBeforeSave();

  return originalSaveCompetitionPart20.apply(
    this,
    arguments
  );
};


// =========================================================
// INITIAL VALIDATION
// =========================================================

validateAdminDataBeforeSave();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 21 — FINAL ADMIN.JS CHECK
// =========================================================

function runAdminFinalCheck() {

  const checks = {
    firebase:
      !!window.db &&
      !!window.auth,

    teams:
      Array.isArray(teams),

    fixtures:
      Array.isArray(fixtures),

    registrations:
      Array.isArray(registrations),

    season:
      !!season &&
      typeof season === "object",

    knockout:
      !!knockout &&
      typeof knockout === "object",

    champions:
      !!champions &&
      typeof champions === "object"
  };


  const failed =
    Object.keys(checks).filter(
      key => !checks[key]
    );


  if (failed.length > 0) {

    console.error(
      "DLS Admin validation failed:",
      failed
    );

    return false;
  }


  console.log(
    "DLS Admin validation passed."
  );

  return true;
}


// =========================================================
// RUN FINAL CHECK
// =========================================================

runAdminFinalCheck();

// =========================================================
// DLS COMPETITION
// ADMIN.JS
// PART 22 — FINAL ADMIN STARTUP
// =========================================================

async function finalizeAdminStartup() {

  try {

    validateAdminDataBeforeSave();

    normalizeKnockoutArrays();

    renderAll();

    updateCompletedSeasonMessage();

    enforceChampionsCompletionLock();

    renderFinalCompetitionStatus();

    renderChampionsDataWarning();

    runAdminFinalCheck();

  } catch (error) {

    console.error(
      "Final admin startup error:",
      error
    );

  }
}


// =========================================================
// RUN FINAL STARTUP
// =========================================================

finalizeAdminStartup();