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


let registrationUnsubscribe = null;


const loginSection =
  document.getElementById("adminLogin");


const dashboard =
  document.getElementById("adminDashboard");


const loginForm =
  document.getElementById("adminLoginForm");


const loginMessage =
  document.getElementById("adminLoginMessage");


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


function normalizeTeamName(name) {

  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}


function escapeHTML(value) {

  const div =
    document.createElement("div");

  div.textContent =
    String(value ?? "");

  return div.innerHTML;
}


function formatDate(date) {

  if (!date) {
    return "Not set";
  }

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

  if (!window.db) {
    return;
  }

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
      "Competition save failed:",
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
            "❌ This account is not authorized as admin."
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
          "Admin login failed:",
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

  if (!window.auth) {
    return;
  }


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

function displayEverything() {

  renderSeason();

  renderTeams();

  renderTable();

  renderFixtures();
}


function renderSeason() {

  const startInput =
    document.getElementById(
      "seasonStart"
    );

  const endInput =
    document.getElementById(
      "seasonEnd"
    );

  const legsInput =
    document.getElementById(
      "legFormat"
    );


  if (startInput) {

    startInput.value =
      season.startDate || "";
  }


  if (endInput) {

    endInput.value =
      season.endDate || "";
  }


  if (legsInput) {

    legsInput.value =
      String(
        season.legs || 1
      );
  }


  if (!adminSeasonDetails) {
    return;
  }


  if (!season.started) {

    adminSeasonDetails.innerHTML =
      `
      <p>
        🟡 <strong>Season not started.</strong>
      </p>

      <p>
        Start Date:
        ${escapeHTML(
          formatDate(
            season.startDate
          )
        )}
      </p>

      <p>
        End Date:
        ${escapeHTML(
          formatDate(
            season.endDate
          )
        )}
      </p>

      <p>
        Format:
        ${season.legs == 2
          ? "2 Legs"
          : "1 Leg"}
      </p>
      `;

    return;
  }


  adminSeasonDetails.innerHTML =
    `
    <p>
      🟢 <strong>Season is LIVE</strong>
    </p>

    <p>
      Start Date:
      ${escapeHTML(
        formatDate(
          season.startDate
        )
      )}
    </p>

    <p>
      End Date:
      ${escapeHTML(
        formatDate(
          season.endDate
        )
      )}
    </p>

    <p>
      Format:
      ${season.legs == 2
        ? "2 Legs"
        : "1 Leg"}
    </p>
    `;
}


function renderTeams() {

  if (!adminTeamList) {
    return;
  }


  if (!teams.length) {

    adminTeamList.innerHTML =
      "<p>No approved teams.</p>";

    return;
  }


  adminTeamList.innerHTML =
    teams
      .map(
        (team, index) => {

          return `
            <div class="card">

              <h3>
                ⚽ ${escapeHTML(
                  team.name
                )}
              </h3>

              <p>
                👤 ${escapeHTML(
                  team.player || ""
                )}
              </p>

              <button
                class="remove-team-button"
                data-index="${index}"
              >
                🗑️ Remove Team
              </button>

            </div>
          `;
        }
      )
      .join("");


  document
    .querySelectorAll(
      ".remove-team-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async function() {

            const index =
              Number(
                this.dataset.index
              );


            const team =
              teams[index];


            if (!team) {
              return;
            }


            const confirmed =
              confirm(
                `Remove ${team.name} from the competition?`
              );


            if (!confirmed) {
              return;
            }


            teams.splice(
              index,
              1
            );


            fixtures =
              fixtures.filter(
                fixture =>
                  fixture.home !==
                    team.name &&
                  fixture.away !==
                    team.name
              );


            const saved =
              await saveCompetition();


            if (saved) {

              displayEverything();

              alert(
                "✅ Team removed."
              );
            }

          }
        );

      }
    );
}


function createEmptyStats() {

  const stats = {};


  teams.forEach(
    team => {

      stats[
        normalizeTeamName(
          team.name
        )
      ] = {

        name: team.name,

        played: 0,

        wins: 0,

        draws: 0,

        losses: 0,

        gf: 0,

        ga: 0,

        gd: 0,

        points: 0
      };

    }
  );


  return stats;
}


function calculateTable() {

  const stats =
    createEmptyStats();


  fixtures.forEach(
    fixture => {

      if (
        fixture.homeScore === null ||
        fixture.awayScore === null ||
        fixture.homeScore === undefined ||
        fixture.awayScore === undefined
      ) {

        return;
      }


      const homeKey =
        normalizeTeamName(
          fixture.home
        );


      const awayKey =
        normalizeTeamName(
          fixture.away
        );


      if (
        !stats[homeKey] ||
        !stats[awayKey]
      ) {

        return;
      }


      const homeScore =
        Number(
          fixture.homeScore
        );


      const awayScore =
        Number(
          fixture.awayScore
        );


      if (
        Number.isNaN(homeScore) ||
        Number.isNaN(awayScore)
      ) {

        return;
      }


      stats[homeKey].played++;

      stats[awayKey].played++;


      stats[homeKey].gf +=
        homeScore;

      stats[homeKey].ga +=
        awayScore;


      stats[awayKey].gf +=
        awayScore;

      stats[awayKey].ga +=
        homeScore;


      if (
        homeScore >
        awayScore
      ) {

        stats[homeKey].wins++;

        stats[awayKey].losses++;

        stats[homeKey].points += 3;

      } else if (
        homeScore <
        awayScore
      ) {

        stats[awayKey].wins++;

        stats[homeKey].losses++;

        stats[awayKey].points += 3;

      } else {

        stats[homeKey].draws++;

        stats[awayKey].draws++;

        stats[homeKey].points++;

        stats[awayKey].points++;
      }

    }
  );


  Object.values(
    stats
  ).forEach(
    team => {

      team.gd =
        team.gf -
        team.ga;

    }
  );


  return Object.values(
    stats
  ).sort(
    (a, b) => {

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


      return (
        b.gf -
        a.gf
      );

    }
  );
}


function renderTable() {

  if (!adminTable) {
    return;
  }


  const table =
    calculateTable();


  if (!table.length) {

    adminTable.innerHTML =
      `
      <tr>
        <td colspan="10">
          No teams yet.
        </td>
      </tr>
      `;

    return;
  }


  adminTable.innerHTML =
    table
      .map(
        (team, index) => {

          return `
            <tr>

              <td>
                ${index + 1}
              </td>

              <td>
                ${escapeHTML(
                  team.name
                )}
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

            </tr>
          `;
        }
      )
      .join("");
}


function formatFixtureDate(
  date
) {

  if (!date) {
    return "";
  }


  return new Date(
    date + "T00:00:00"
  ).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
}


function renderFixtures() {

  if (!adminFixtureList) {
    return;
  }


  if (!fixtures.length) {

    adminFixtureList.innerHTML =
      "<p>No fixtures generated.</p>";

    return;
  }


  const grouped = {};


  fixtures.forEach(
    (fixture, index) => {

      const day =
        fixture.day || 1;


      if (!grouped[day]) {

        grouped[day] = [];
      }


      grouped[day].push({
        ...fixture,
        index
      });

    }
  );


  adminFixtureList.innerHTML =
    Object.keys(grouped)
      .sort(
        (a, b) =>
          Number(a) -
          Number(b)
      )
      .map(
        day => {

          const matches =
            grouped[day];


          const date =
            matches[0].date;


          return `
            <div class="admin-match-day">

              <h3>
                📅 Match Day ${day}
              </h3>

              <p>
                ${escapeHTML(
                  formatFixtureDate(
                    date
                  )
                )}
              </p>

              ${matches
                .map(
                  match =>
                    renderAdminFixture(
                      match
                    )
                )
                .join("")}

            </div>
          `;
        }
      )
      .join("");


  attachResultHandlers();
}


function renderAdminFixture(
  fixture
) {

  const homeScore =
    fixture.homeScore !== null &&
    fixture.homeScore !== undefined
      ? fixture.homeScore
      : "";


  const awayScore =
    fixture.awayScore !== null &&
    fixture.awayScore !== undefined
      ? fixture.awayScore
      : "";


  const completed =
    homeScore !== "" &&
    awayScore !== "";


  return `
    <div class="fixture-card">

      <div class="fixture-teams">

        <strong>
          ${escapeHTML(
            fixture.home
          )}
        </strong>

        <span>vs</span>

        <strong>
          ${escapeHTML(
            fixture.away
          )}
        </strong>

      </div>

      <div class="result-controls">

        <input
          type="number"
          min="0"
          class="home-score"
          data-index="${fixture.index}"
          value="${homeScore}"
          placeholder="0"
        >

        <span>:</span>

        <input
          type="number"
          min="0"
          class="away-score"
          data-index="${fixture.index}"
          value="${awayScore}"
          placeholder="0"
        >

        <button
          class="save-result-button"
          data-index="${fixture.index}"
        >
          ${completed
            ? "✏️ Update"
            : "💾 Save Result"}
        </button>

      </div>

    </div>
  `;
}


function attachResultHandlers() {

  document
    .querySelectorAll(
      ".save-result-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async function() {

            const index =
              Number(
                this.dataset.index
              );


            const homeInput =
              document.querySelector(
                `.home-score[data-index="${index}"]`
              );


            const awayInput =
              document.querySelector(
                `.away-score[data-index="${index}"]`
              );


            if (
              !homeInput ||
              !awayInput
            ) {

              return;
            }


            const homeScore =
              homeInput.value.trim();


            const awayScore =
              awayInput.value.trim();


            if (
              homeScore === "" ||
              awayScore === ""
            ) {

              alert(
                "⚠️ Enter both scores."
              );

              return;
            }


            if (
              Number(homeScore) < 0 ||
              Number(awayScore) < 0
            ) {

              alert(
                "⚠️ Scores cannot be negative."
              );

              return;
            }


            fixtures[index].homeScore =
              Number(homeScore);


            fixtures[index].awayScore =
              Number(awayScore);


            const saved =
              await saveCompetition();


            if (saved) {

              renderTable();

              renderFixtures();

              alert(
                "✅ Result saved successfully."
              );
            }

          }
        );

      }
    );
}

function generateRoundRobin(
  teamList,
  legs,
  startDate,
  endDate
) {

  const list =
    teamList.map(
      team => ({
        name: team.name
      })
    );


  if (list.length < 2) {

    alert(
      "❌ You need at least 2 approved teams."
    );

    return [];
  }


  if (
    !startDate ||
    !endDate
  ) {

    alert(
      "❌ Please select both a start date and an end date."
    );

    return [];
  }


  const start =
    new Date(
      startDate + "T00:00:00"
    );


  const end =
    new Date(
      endDate + "T00:00:00"
    );


  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {

    alert(
      "❌ Invalid season dates."
    );

    return [];
  }


  if (end < start) {

    alert(
      "❌ End date cannot be before start date."
    );

    return [];
  }


  /*
    If there is an odd number of teams,
    add a BYE.
  */

  if (
    list.length % 2 !== 0
  ) {

    list.push(null);
  }


  const rounds =
    list.length - 1;


  const half =
    list.length / 2;


  const availableDays =
    Math.floor(
      (
        end.getTime() -
        start.getTime()
      ) /
      (
        1000 *
        60 *
        60 *
        24
      )
    ) + 1;


  const requiredRounds =
    Number(legs) === 2
      ? rounds * 2
      : rounds;


  if (
    availableDays <
    requiredRounds
  ) {

    alert(
      `❌ The selected date range is too short.

${teamList.length} teams require ${requiredRounds} Match Days.

You selected only ${availableDays} days.`
    );

    return [];
  }


  const generated =
    [];


  /*
    We use a standard circle
    round-robin system.

    Every team plays once
    per Match Day.
  */

  for (
    let round = 0;
    round < rounds;
    round++
  ) {

    const matchDate =
      new Date(start);


    matchDate.setDate(
      start.getDate() +
      round
    );


    const dateString =
      getLocalDateString(
        matchDate
      );


    for (
      let i = 0;
      i < half;
      i++
    ) {

      const home =
        list[i];


      const away =
        list[
          list.length -
          1 -
          i
        ];


      /*
        Ignore BYE matches.
      */

      if (
        home &&
        away
      ) {

        generated.push({

          day:
            round + 1,

          date:
            dateString,

          home:
            home.name,

          away:
            away.name,

          homeScore:
            null,

          awayScore:
            null

        });
      }
    }


    /*
      Rotate all teams except
      the first team.
    */

    const last =
      list.pop();


    list.splice(
      1,
      0,
      last
    );
  }


  /*
    SECOND LEG

    Reverse home/away.

    Example:

    First leg:
    Team A vs Team B

    Second leg:
    Team B vs Team A
  */

  if (
    Number(legs) === 2
  ) {

    const firstLeg =
      [...generated];


    for (
      let round = 0;
      round < rounds;
      round++
    ) {

      const matchDate =
        new Date(start);


      matchDate.setDate(
        start.getDate() +
        rounds +
        round
      );


      const dateString =
        getLocalDateString(
          matchDate
        );


      const roundFixtures =
        firstLeg.filter(
          fixture =>
            fixture.day ===
            round + 1
        );


      roundFixtures.forEach(
        fixture => {

          generated.push({

            day:
              rounds +
              round +
              1,

            date:
              dateString,

            home:
              fixture.away,

            away:
              fixture.home,

            homeScore:
              null,

            awayScore:
              null

          });

        }
      );
    }
  }


  return generated;
}


/*
  This avoids the timezone problem
  that can happen with toISOString()
  in Nigeria and other timezones.
*/

function getLocalDateString(
  date
) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;
}


/*
  GENERATE FIXTURES BUTTON
*/

const generateFixturesButton =
  document.getElementById(
    "generateFixturesButton"
  );


if (
  generateFixturesButton
) {

  generateFixturesButton.addEventListener(
    "click",
    async function() {

      if (!isAdmin()) {

        alert(
          "🔒 Admin login required."
        );

        return;
      }


      if (
        teams.length < 2
      ) {

        alert(
          "❌ Approve at least 2 teams before generating fixtures."
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
          )?.value || 1
        );


      if (
        !startDate ||
        !endDate
      ) {

        alert(
          "❌ Please select the season start and end dates."
        );

        return;
      }


      if (
        fixtures.length > 0
      ) {

        const confirmed =
          confirm(
            "⚠️ Fixtures already exist.\n\nGenerating again will replace the current fixtures and remove existing results.\n\nContinue?"
          );


        if (!confirmed) {
          return;
        }
      }


      const newFixtures =
        generateRoundRobin(
          teams,
          legs,
          startDate,
          endDate
        );


      if (
        !newFixtures.length
      ) {

        return;
      }


      fixtures =
        newFixtures;


      season = {

        started:
          false,

        startDate:
          startDate,

        endDate:
          endDate,

        legs:
          legs

      };


      const saved =
        await saveCompetition();


      if (saved) {

        displayEverything();


        alert(
          `✅ Fixtures generated successfully.

${newFixtures.length} matches created.`
        );
      }

    }
  );

}


/*
  START SEASON BUTTON
*/

const startSeasonButton =
  document.getElementById(
    "startSeasonButton"
  );


if (
  startSeasonButton
) {

  startSeasonButton.addEventListener(
    "click",
    async function() {

      if (!isAdmin()) {

        alert(
          "🔒 Admin login required."
        );

        return;
      }


      if (
        teams.length < 2
      ) {

        alert(
          "❌ You need at least 2 approved teams."
        );

        return;
      }


      if (
        !season.startDate ||
        !season.endDate
      ) {

        alert(
          "❌ Set the season start and end dates first."
        );

        return;
      }


      if (
        fixtures.length === 0
      ) {

        const generate =
          confirm(
            "No fixtures have been generated yet.\n\nGenerate fixtures now?"
          );


        if (!generate) {
          return;
        }


        const legs =
          Number(
            document.getElementById(
              "legFormat"
            )?.value || 1
          );


        const newFixtures =
          generateRoundRobin(
            teams,
            legs,
            season.startDate,
            season.endDate
          );


        if (
          !newFixtures.length
        ) {

          return;
        }


        fixtures =
          newFixtures;


        season.legs =
          legs;
      }


      const confirmed =
        confirm(
          "🏆 Start the season now?\n\nOnce started, registration should remain closed."
        );


      if (!confirmed) {
        return;
      }


      season.started =
        true;


      const saved =
        await saveCompetition();


      if (saved) {

        displayEverything();


        alert(
          "🏆 Season started successfully!"
        );
      }

    }
  );

}


/*
  REOPEN REGISTRATION
*/

const reopenRegistrationButton =
  document.getElementById(
    "reopenRegistrationButton"
  );


if (
  reopenRegistrationButton
) {

  reopenRegistrationButton.addEventListener(
    "click",
    async function() {

      if (!isAdmin()) {

        alert(
          "🔒 Admin login required."
        );

        return;
      }


      if (
        season.started
      ) {

        const confirmed =
          confirm(
            "⚠️ The season is currently active.\n\nReopening registration will allow new teams to be approved.\n\nContinue?"
          );


        if (!confirmed) {
          return;
        }
      }


      season.started =
        false;


      const saved =
        await saveCompetition();


      if (saved) {

        displayEverything();


        alert(
          "🔓 Registration has been reopened."
        );
      }

    }
  );

}


/*
  PENDING REGISTRATION LISTENER
*/

function startRegistrationListener() {

  if (
    registrationUnsubscribe
  ) {

    return;
  }


  if (!isAdmin()) {
    return;
  }


  const registrationsRef =
    collection(
      window.db,
      "registrations"
    );


  registrationUnsubscribe =
    onSnapshot(
      registrationsRef,
      snapshot => {

        const pending =
          [];


        snapshot.forEach(
          item => {

            const data =
              item.data();


            if (
              data.status ===
              "pending"
            ) {

              pending.push({

                id:
                  item.id,

                ...data

              });

            }

          }
        );


        renderPendingRegistrations(
          pending
        );

      },
      error => {

        console.error(
          "Registration listener error:",
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


function renderPendingRegistrations(
  registrations
) {

  if (!pendingBox) {
    return;
  }


  if (
    registrations.length === 0
  ) {

    pendingBox.innerHTML =
      "<p>No pending registrations.</p>";

    return;
  }


  pendingBox.innerHTML =
    registrations
      .map(
        registration => {

          return `
            <div class="card">

              <h3>
                ⚽ ${escapeHTML(
                  registration.teamName
                )}
              </h3>

              <p>
                👤 Player:
                ${escapeHTML(
                  registration.playerName
                )}
              </p>

              <div class="admin-buttons">

                <button
                  class="approve-registration"
                  data-id="${escapeHTML(
                    registration.id
                  )}"
                  data-team="${escapeHTML(
                    registration.teamName
                  )}"
                  data-player="${escapeHTML(
                    registration.playerName
                  )}"
                >
                  ✅ Approve
                </button>

                <button
                  class="reject-registration"
                  data-id="${escapeHTML(
                    registration.id
                  )}"
                >
                  ❌ Reject
                </button>

              </div>

            </div>
          `;
        }
      )
      .join("");


  attachRegistrationHandlers();
}

function attachRegistrationHandlers() {

  document
    .querySelectorAll(
      ".approve-registration"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async function() {

            const id =
              this.dataset.id;

            const teamName =
              this.dataset.team;

            const playerName =
              this.dataset.player;


            await approveRegistration(
              id,
              teamName,
              playerName
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".reject-registration"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async function() {

            const id =
              this.dataset.id;


            await rejectRegistration(
              id
            );

          }
        );

      }
    );
}


async function approveRegistration(
  registrationId,
  teamName,
  playerName
) {

  if (!isAdmin()) {

    alert(
      "🔒 Admin login required."
    );

    return;
  }


  const duplicate =
    teams.some(
      team =>
        normalizeTeamName(
          team.name
        ) ===
        normalizeTeamName(
          teamName
        )
    );


  if (duplicate) {

    alert(
      "❌ A team with this name is already approved."
    );

    return;
  }


  const confirmed =
    confirm(
      `Approve ${teamName}?\n\nPlayer: ${playerName}`
    );


  if (!confirmed) {
    return;
  }


  try {

    /*
      Add the team to the approved
      team list.
    */

    teams.push({

      name:
        teamName.trim(),

      player:
        playerName.trim()

    });


    /*
      Save the updated competition.
    */

    const saved =
      await saveCompetition();


    if (!saved) {

      return;
    }


    /*
      Change registration status
      from pending to approved.
    */

    await setDoc(
      doc(
        window.db,
        "registrations",
        registrationId
      ),
      {
        status: "approved"
      },
      {
        merge: true
      }
    );


    displayEverything();


    alert(
      "✅ Team approved successfully!"
    );

  } catch (error) {

    console.error(
      "Approval error:",
      error
    );


    alert(
      "❌ Could not approve this registration."
    );
  }
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


  const confirmed =
    confirm(
      "❌ Reject this registration?"
    );


  if (!confirmed) {
    return;
  }


  try {

    await setDoc(
      doc(
        window.db,
        "registrations",
        registrationId
      ),
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
      "Rejection error:",
      error
    );


    alert(
      "❌ Could not reject this registration."
    );
  }
}


/*
  MANAGE TEAMS BUTTON
*/

const manageTeamsButton =
  document.getElementById(
    "manageTeamsButton"
  );


if (
  manageTeamsButton
) {

  manageTeamsButton.addEventListener(
    "click",
    function() {

      const section =
        document.getElementById(
          "adminTeamList"
        );


      if (!section) {
        return;
      }


      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }
  );
}


/*
  CLEAR COMPETITION
*/

const clearCompetitionButton =
  document.getElementById(
    "clearCompetitionButton"
  );


if (
  clearCompetitionButton
) {

  clearCompetitionButton.addEventListener(
    "click",
    async function() {

      if (!isAdmin()) {

        alert(
          "🔒 Admin login required."
        );

        return;
      }


      const firstConfirm =
        confirm(
          "⚠️ WARNING!\n\nThis will remove ALL approved teams, fixtures, results and season settings.\n\nPending registrations will NOT be deleted.\n\nContinue?"
        );


      if (!firstConfirm) {
        return;
      }


      const secondConfirm =
        confirm(
          "🚨 FINAL WARNING!\n\nThis action cannot be undone.\n\nAre you absolutely sure?"
        );


      if (!secondConfirm) {
        return;
      }


      try {

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


        await setDoc(
          doc(
            window.db,
            "competition",
            "main"
          ),
          {

            teams:
              [],

            fixtures:
              [],

            season:
              season

          }
        );


        displayEverything();


        alert(
          "🗑️ Competition cleared successfully."
        );

      } catch (error) {

        console.error(
          "Clear competition error:",
          error
        );


        alert(
          "❌ Could not clear the competition."
        );
      }

    }
  );
}


/*
  LOGOUT BUTTON
*/

const logoutButton =
  document.getElementById(
    "logoutButton"
  );


if (
  logoutButton
) {

  logoutButton.addEventListener(
    "click",
    async function() {

      const confirmed =
        confirm(
          "🚪 Logout from the admin dashboard?"
        );


      if (!confirmed) {
        return;
      }


      await adminLogout();

    }
  );
}


/*
  AUTHENTICATION STATE

  This allows the admin dashboard
  to remember an authenticated
  Firebase session.
*/

if (window.auth) {

  onAuthStateChanged(
    window.auth,
    async function(user) {

      if (!user) {

        currentAdmin =
          null;


        stopRegistrationListener();


        showLogin();


        return;
      }


      /*
        Check that the logged-in
        account is the real admin.
      */

      if (
        !user.email ||
        user.email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
      ) {

        try {

          await signOut(
            window.auth
          );

        } catch (error) {

          console.error(
            error
          );
        }


        currentAdmin =
          null;


        showLogin();


        showLoginMessage(
          "❌ This account is not authorized."
        );


        return;
      }


      currentAdmin =
        user;


      showDashboard();


      await loadCompetition();


      startRegistrationListener();

    }
  );

}


/*
  SAFETY CHECK

  Make sure the dashboard does not
  accidentally remain visible when
  there is no admin session.
*/

if (!currentAdmin) {

  showLogin();
}