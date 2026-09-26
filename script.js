// =========================================================
// DLS COMPETITION
// PUBLIC SCRIPT
// PART 24 — LEAGUE + CHAMPIONS DISPLAY
// =========================================================

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// GLOBAL DATA
// =========================================================

let teams = [];
let fixtures = [];

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


// =========================================================
// DOM
// =========================================================

const seasonInfo =
  document.getElementById("seasonInfo");

const teamsList =
  document.getElementById("teamsList");

const fixturesList =
  document.getElementById("fixturesList");

const leagueTable =
  document.getElementById("leagueTable");

const fixturesTitle =
  document.getElementById("fixturesTitle");

const tableTitle =
  document.getElementById("tableTitle");

const qualificationLegend =
  document.getElementById(
    "qualificationLegend"
  );

const championsStatus =
  document.getElementById(
    "championsStatus"
  );

const championsQualificationList =
  document.getElementById(
    "championsQualificationList"
  );

const championsBracketContent =
  document.getElementById(
    "championsBracketContent"
  );

const championsPodiumContent =
  document.getElementById(
    "championsPodiumContent"
  );

const registrationForm =
  document.getElementById(
    "registrationForm"
  );

const registrationMessage =
  document.getElementById(
    "registrationMessage"
  );


// =========================================================
// HELPERS
// =========================================================

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function getTeamName(team) {

  if (typeof team === "string") {
    return team;
  }

  return (
    team?.teamName ||
    team?.name ||
    ""
  );
}


function getFixtureResult(fixture) {

  if (
    fixture &&
    fixture.homeScore !== undefined &&
    fixture.awayScore !== undefined
  ) {

    return {
      home:
        Number(fixture.homeScore),

      away:
        Number(fixture.awayScore)
    };
  }


  if (
    fixture?.result &&
    fixture.result.homeGoals !== undefined &&
    fixture.result.awayGoals !== undefined
  ) {

    return {
      home:
        Number(
          fixture.result.homeGoals
        ),

      away:
        Number(
          fixture.result.awayGoals
        )
    };
  }


  return null;
}


function hasResult(fixture) {

  const result =
    getFixtureResult(fixture);

  return !!(
    result &&
    Number.isFinite(result.home) &&
    Number.isFinite(result.away)
  );
}


// =========================================================
// LOAD COMPETITION
// =========================================================

async function loadCompetition() {

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

      renderEverything();

      return;
    }


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


    if (
      data.season &&
      typeof data.season === "object"
    ) {

      season = {
        ...season,
        ...data.season
      };
    }


    if (
      data.knockout &&
      typeof data.knockout === "object"
    ) {

      knockout = {
        ...knockout,
        ...data.knockout
      };
    }


    if (
      data.champions &&
      typeof data.champions === "object"
    ) {

      champions = {
        ...champions,
        ...data.champions
      };
    }


    renderEverything();

  } catch (error) {

    console.error(
      "Unable to load competition:",
      error
    );

    if (seasonInfo) {

      seasonInfo.innerHTML =
        "<p>Unable to load competition data.</p>";
    }
  }
}


// =========================================================
// SEASON DISPLAY
// =========================================================

function renderSeason() {

  if (!seasonInfo) {
    return;
  }


  if (!season.started) {

    seasonInfo.innerHTML = `
      <p>Registration is open.</p>
      <p>
        Competition format:
        <strong>
          ${escapeHTML(
            season.format === "champions"
              ? "Champions League"
              : "League"
          )}
        </strong>
      </p>
    `;

    return;
  }


  const formatName =
    season.format === "champions"
      ? "Champions League"
      : "League";


  let status =
    "Active";


  if (
    season.phase === "completed"
  ) {

    status =
      "Completed";

  } else if (
    season.phase === "knockout"
  ) {

    status =
      "Knockout Stage";
  }


  seasonInfo.innerHTML = `

    <p>
      <strong>Format:</strong>
      ${escapeHTML(formatName)}
    </p>

    <p>
      <strong>Status:</strong>
      ${escapeHTML(status)}
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

  `;
}


// =========================================================
// TEAMS
// =========================================================

function renderTeams() {

  if (!teamsList) {
    return;
  }


  if (!teams.length) {

    teamsList.innerHTML =
      "<p>No approved teams yet.</p>";

    return;
  }


  teamsList.innerHTML =
    teams
      .map(
        (team, index) => `
          <div class="team-card">

            <strong>
              ${index + 1}.
              ${escapeHTML(
                getTeamName(team)
              )}
            </strong>

          </div>
        `
      )
      .join("");
}


// =========================================================
// TABLE CALCULATION
// =========================================================

function createTeamStats(name) {

  return {
    team:
      name,

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


function calculateTable() {

  const stats = {};


  teams.forEach(team => {

    const name =
      getTeamName(team);

    stats[name] =
      createTeamStats(name);
  });


  fixtures.forEach(fixture => {

    if (!hasResult(fixture)) {
      return;
    }


    const home =
      fixture.homeTeam ||
      fixture.home ||
      "";


    const away =
      fixture.awayTeam ||
      fixture.away ||
      "";


    if (
      !stats[home] ||
      !stats[away]
    ) {
      return;
    }


    const result =
      getFixtureResult(
        fixture
      );


    stats[home].played++;
    stats[away].played++;


    stats[home].goalsFor +=
      result.home;

    stats[home].goalsAgainst +=
      result.away;


    stats[away].goalsFor +=
      result.away;

    stats[away].goalsAgainst +=
      result.home;


    if (
      result.home >
      result.away
    ) {

      stats[home].wins++;
      stats[away].losses++;

      stats[home].points += 3;

    } else if (
      result.home <
      result.away
    ) {

      stats[away].wins++;
      stats[home].losses++;

      stats[away].points += 3;

    } else {

      stats[home].draws++;
      stats[away].draws++;

      stats[home].points++;
      stats[away].points++;
    }
  });


  return Object.values(stats)
    .map(team => {

      team.goalDifference =
        team.goalsFor -
        team.goalsAgainst;

      return team;
    })
    .sort((a, b) => {

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
        b.goalDifference !==
        a.goalDifference
      ) {

        return (
          b.goalDifference -
          a.goalDifference
        );
      }


      if (
        b.goalsFor !==
        a.goalsFor
      ) {

        return (
          b.goalsFor -
          a.goalsFor
        );
      }


      return a.team.localeCompare(
        b.team
      );
    });
}


// =========================================================
// TABLE DISPLAY
// =========================================================

function renderTable() {

  if (!leagueTable) {
    return;
  }


  const table =
    calculateTable();


  if (!table.length) {

    leagueTable.innerHTML = `
      <tr>
        <td colspan="10">
          No teams yet.
        </td>
      </tr>
    `;

    return;
  }


  const qualificationCount =
    season.format === "champions"
      ? Number(
          season.qualificationCount ||
          knockout.qualificationCount ||
          0
        )
      : 0;


  leagueTable.innerHTML =
    table
      .map((team, index) => {

        const position =
          index + 1;


        let cutoff = "";


        if (
          season.format === "champions" &&
          qualificationCount > 0 &&
          position === qualificationCount
        ) {

          cutoff = `
            <tr class="qualification-cutoff">
              <td colspan="10">
                Champions League qualification cutoff
              </td>
            </tr>
          `;
        }


        return `

          ${cutoff}

          <tr>

            <td>
              ${position}
            </td>

            <td>
              <strong>
                ${escapeHTML(
                  team.team
                )}
              </strong>
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
              ${team.goalsFor}
            </td>

            <td>
              ${team.goalsAgainst}
            </td>

            <td>
              ${team.goalDifference}
            </td>

            <td>
              <strong>
                ${team.points}
              </strong>
            </td>

          </tr>

        `;
      })
      .join("");
}


// =========================================================
// TABLE TITLES
// =========================================================

function renderTableTitles() {

  if (!tableTitle) {
    return;
  }


  if (
    season.format === "champions"
  ) {

    tableTitle.textContent =
      "Champions League Table";


    if (qualificationLegend) {

      const count =
        Number(
          season.qualificationCount ||
          knockout.qualificationCount ||
          0
        );


      qualificationLegend.textContent =
        count
          ? `Top ${count} teams qualify for the knockout stage.`
          : "";
    }

  } else {

    tableTitle.textContent =
      "League Table";


    if (qualificationLegend) {

      qualificationLegend.textContent =
        "";
    }
  }
}


// =========================================================
// FIXTURE DISPLAY
// =========================================================

function renderFixtures() {

  if (!fixturesList) {
    return;
  }


  if (!fixtures.length) {

    fixturesList.innerHTML =
      "<p>No fixtures generated yet.</p>";

    return;
  }


  const grouped = {};


  fixtures.forEach(fixture => {

    const round =
      fixture.round ||
      fixture.matchDay ||
      "Fixtures";


    if (!grouped[round]) {
      grouped[round] = [];
    }


    grouped[round].push(
      fixture
    );
  });


  fixturesList.innerHTML =
    Object.entries(grouped)
      .map(
        ([round, roundFixtures]) => `

          <div class="fixture-round">

            <h3>
              ${escapeHTML(
                round
              )}
            </h3>

            <div class="fixture-list">

              ${roundFixtures
                .map(
                  fixture => {

                    const result =
                      getFixtureResult(
                        fixture
                      );


                    const home =
                      fixture.homeTeam ||
                      fixture.home ||
                      "TBD";


                    const away =
                      fixture.awayTeam ||
                      fixture.away ||
                      "TBD";


                    const score =
                      result
                        ? `${result.home} - ${result.away}`
                        : "vs";


                    return `

                      <div class="fixture-card">

                        <span>
                          ${escapeHTML(
                            home
                          )}
                        </span>

                        <strong>
                          ${score}
                        </strong>

                        <span>
                          ${escapeHTML(
                            away
                          )}
                        </span>

                      </div>

                    `;
                  }
                )
                .join("")}

            </div>

          </div>

        `
      )
      .join("");
}


// =========================================================
// CHAMPIONS STATUS
// =========================================================

function renderChampionsStatus() {

  if (!championsStatus) {
    return;
  }


  if (
    season.format !==
    "champions"
  ) {

    championsStatus.innerHTML =
      "<p>Champions League is not active for this season.</p>";

    return;
  }


  if (!season.started) {

    championsStatus.innerHTML =
      "<p>Champions League registration is open.</p>";

    return;
  }


  if (
    season.phase ===
    "completed"
  ) {

    championsStatus.innerHTML =
      "<p><strong>Champions League completed.</strong></p>";

    return;
  }


  if (
    season.phase ===
    "knockout"
  ) {

    championsStatus.innerHTML =
      "<p><strong>Knockout stage is in progress.</strong></p>";

    return;
  }


  const count =
    Number(
      season.qualificationCount ||
      knockout.qualificationCount ||
      0
    );


  championsStatus.innerHTML = `

    <p>
      League phase in progress.
    </p>

    <p>
      Top
      <strong>${count}</strong>
      teams qualify for the knockout stage.
    </p>

  `;
}


// =========================================================
// QUALIFIED TEAMS
// =========================================================

function getQualifiedTeams() {

  const table =
    calculateTable();


  const count =
    Number(
      season.qualificationCount ||
      knockout.qualificationCount ||
      0
    );


  if (!count) {
    return [];
  }


  return table
    .slice(0, count)
    .map(team => team.team);
}


// =========================================================
// QUALIFICATION DISPLAY
// =========================================================

function renderChampionsQualification() {

  if (
    !championsQualificationList
  ) {
    return;
  }


  if (
    season.format !==
    "champions"
  ) {

    championsQualificationList.innerHTML =
      "<p>Not active.</p>";

    return;
  }


  const qualified =
    getQualifiedTeams();


  if (!qualified.length) {

    championsQualificationList.innerHTML =
      "<p>Qualification positions will appear as results are recorded.</p>";

    return;
  }


  championsQualificationList.innerHTML = `

    <div class="qualified-grid">

      ${qualified
        .map(
          (team, index) => `

            <div class="qualified-team">

              <span>
                ${index + 1}
              </span>

              <strong>
                ${escapeHTML(team)}
              </strong>

            </div>

          `
        )
        .join("")}

    </div>

  `;
}


// =========================================================
// KNOCKOUT ROUND NAME
// =========================================================

function getRoundTitle(
  roundArray,
  fallback
) {

  if (
    Array.isArray(roundArray) &&
    roundArray.length
  ) {

    const first =
      roundArray[0];


    if (
      first &&
      first.round
    ) {

      return first.round;
    }
  }


  return fallback;
}


// =========================================================
// GET KNOCKOUT TIES
// =========================================================

function getKnockoutRounds() {

  const rounds = [];


  if (
    Array.isArray(
      knockout.roundOf16
    ) &&
    knockout.roundOf16.length
  ) {

    rounds.push({
      title:
        "Round of 16",

      ties:
        knockout.roundOf16
    });
  }


  if (
    Array.isArray(
      knockout.quarterFinals
    ) &&
    knockout.quarterFinals.length
  ) {

    rounds.push({
      title:
        "Quarter-Finals",

      ties:
        knockout.quarterFinals
    });
  }


  if (
    Array.isArray(
      knockout.semiFinals
    ) &&
    knockout.semiFinals.length
  ) {

    rounds.push({
      title:
        "Semi-Finals",

      ties:
        knockout.semiFinals
    });
  }


  if (
    Array.isArray(
      knockout.final
    ) &&
    knockout.final.length
  ) {

    rounds.push({
      title:
        "Final",

      ties:
        knockout.final
    });
  }


  return rounds;
}


// =========================================================
// RENDER A KNOCKOUT TIE
// =========================================================

function renderTie(
  tie
) {

  if (!tie) {
    return "";
  }


  const matches =
    Array.isArray(
      tie.matches
    )
      ? tie.matches
      : [];


  const home =
    tie.homeTeam ||
    tie.home ||
    "TBD";


  const away =
    tie.awayTeam ||
    tie.away ||
    "TBD";


  let aggregateHome = 0;
  let aggregateAway = 0;


  matches.forEach(match => {

    const result =
      getFixtureResult(
        match
      );


    if (!result) {
      return;
    }


    aggregateHome +=
      result.home;

    aggregateAway +=
      result.away;
  });


  const winner =
    tie.winner ||
    "";


  return `

    <div class="knockout-tie">

      <div class="knockout-team">

        <span>
          ${escapeHTML(home)}
        </span>

        <strong>
          ${aggregateHome}
        </strong>

      </div>


      <div class="knockout-team">

        <span>
          ${escapeHTML(away)}
        </span>

        <strong>
          ${aggregateAway}
        </strong>

      </div>


      ${
        winner
          ? `
            <div class="knockout-winner">
              ✓ ${escapeHTML(winner)}
            </div>
          `
          : ""
      }

    </div>

  `;
}


// =========================================================
// THIRD PLACE
// =========================================================

function renderThirdPlace() {

  if (
    !knockout.thirdPlace
  ) {

    return "";
  }


  const tie =
    knockout.thirdPlace;


  return `

    <div class="third-place-card">

      <h3>
        🥉 Third-Place Match
      </h3>

      ${renderTie(tie)}

    </div>

  `;
}


// =========================================================
// BRACKET DISPLAY
// =========================================================

function renderChampionsBracket() {

  if (
    !championsBracketContent
  ) {
    return;
  }


  if (
    season.format !==
    "champions"
  ) {

    championsBracketContent.innerHTML =
      "<p>Champions League bracket is not active.</p>";

    return;
  }


  const rounds =
    getKnockoutRounds();


  if (!rounds.length) {

    championsBracketContent.innerHTML =
      "<p>The knockout bracket will appear after the draw.</p>";

    return;
  }


  championsBracketContent.innerHTML = `

    <div class="bracket">

      ${rounds
        .map(
          round => `

            <div class="bracket-round">

              <h3>
                ${escapeHTML(
                  round.title
                )}
              </h3>

              <div class="bracket-ties">

                ${round.ties
                  .map(
                    tie =>
                      renderTie(tie)
                  )
                  .join("")}

              </div>

            </div>

          `
        )
        .join("")}

    </div>

    ${renderThirdPlace()}

  `;
}


// =========================================================
// PODIUM
// =========================================================

function renderChampionsPodium() {

  if (
    !championsPodiumContent
  ) {
    return;
  }


  if (
    season.format !==
    "champions"
  ) {

    championsPodiumContent.innerHTML =
      "<p>Champions results are not active.</p>";

    return;
  }


  const champion =
    champions.champion ||
    "";


  const runnerUp =
    champions.runnerUp ||
    "";


  const third =
    champions.thirdPlace ||
    "";


  if (
    !champion &&
    !runnerUp &&
    !third
  ) {

    championsPodiumContent.innerHTML =
      "<p>Final results will appear here.</p>";

    return;
  }


  championsPodiumContent.innerHTML = `

    <div class="podium-place gold">

      <div class="podium-medal">
        🥇
      </div>

      <h3>
        Champion
      </h3>

      <strong>
        ${escapeHTML(
          champion || "TBD"
        )}
      </strong>

    </div>


    <div class="podium-place silver">

      <div class="podium-medal">
        🥈
      </div>

      <h3>
        Runner-Up
      </h3>

      <strong>
        ${escapeHTML(
          runnerUp || "TBD"
        )}
      </strong>

    </div>


    <div class="podium-place bronze">

      <div class="podium-medal">
        🥉
      </div>

      <h3>
        Third Place
      </h3>

      <strong>
        ${escapeHTML(
          third || "TBD"
        )}
      </strong>

    </div>

  `;
}


// =========================================================
// REGISTRATION
// =========================================================

function createTeamKey(
  teamName
) {

  return teamName
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}


if (registrationForm) {

  registrationForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const teamName =
        document
          .getElementById(
            "teamName"
          )
          ?.value
          .trim();


      const playerName =
        document
          .getElementById(
            "playerName"
          )
          ?.value
          .trim();


      if (
        !teamName ||
        !playerName
      ) {

        registrationMessage.textContent =
          "Please complete all fields.";

        return;
      }


      if (
        season.started
      ) {

        registrationMessage.textContent =
          "Registration is closed for this season.";

        return;
      }


      if (
        teamName.length < 2 ||
        teamName.length > 40
      ) {

        registrationMessage.textContent =
          "Team name must be 2–40 characters.";

        return;
      }


      if (
        playerName.length < 2 ||
        playerName.length > 60
      ) {

        registrationMessage.textContent =
          "Player name must be 2–60 characters.";

        return;
      }


      try {

        const id =
          createTeamKey(
            teamName
          );


        if (!id) {

          registrationMessage.textContent =
            "Please enter a valid team name.";

          return;
        }


        const registrationRef =
          doc(
            window.db,
            "registrations",
            id
          );


        const existing =
          await getDoc(
            registrationRef
          );


        if (existing.exists()) {

          registrationMessage.textContent =
            "This team has already registered.";

          return;
        }


        await setDoc(
          registrationRef,
          {
            teamName,
            playerName,
            createdAt:
              Date.now(),
            status:
              "pending"
          }
        );


        registrationForm.reset();


        registrationMessage.textContent =
          "Registration submitted successfully.";

      } catch (error) {

        console.error(
          "Registration error:",
          error
        );

        registrationMessage.textContent =
          "Registration failed. Please try again.";
      }
    }
  );
}


// =========================================================
// RENDER EVERYTHING
// =========================================================

function renderEverything() {

  renderSeason();

  renderTeams();

  renderFixtures();

  renderTable();

  renderTableTitles();

  renderChampionsStatus();

  renderChampionsQualification();

  renderChampionsBracket();

  renderChampionsPodium();
}


// =========================================================
// FIREBASE READY
// =========================================================

function startPublicApp() {

  if (
    !window.firebaseReady ||
    !window.db
  ) {

    setTimeout(
      startPublicApp,
      200
    );

    return;
  }


  loadCompetition();
}


startPublicApp(); 