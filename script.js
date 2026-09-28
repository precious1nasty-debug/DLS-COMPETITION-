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
  thirdPlace: "",
  prizeAmount: "",
  prizeCurrency: ""
};


// =========================================================
// DOM
// =========================================================

const seasonInfo =
  document.getElementById("seasonInfo");

const winnerCelebration =
  document.getElementById("winnerCelebration");

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

const leagueTableDropdown =
  document.getElementById("leagueTableDropdown");

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

const championsQualificationDropdown =
  document.getElementById(
    "championsQualificationDropdown"
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


    /*
     * Normalize the Firestore knockout data after
     * the competition document has been loaded.
     * This is important because the public page
     * initially starts with empty local defaults.
     */
    normalizePublicKnockoutData();
    normalizePublicChampionsData();


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


        const isQualified =
          season.format === "champions" &&
          qualificationCount > 0 &&
          position <= qualificationCount;


        return `

          <tr class="${isQualified ? "qualification-team" : ""}">

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

          ${cutoff}

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
              MATCH DAY ${escapeHTML(round)}
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

  if (
    season.format !== "champions" ||
    !season.started ||
    !count
  ) {
    return [];
  }

  if (season.phase === "knockout") {
    return table
      .slice(0, count)
      .map(team => team.team);
  }

  const remainingMatches = {};

  teams.forEach(team => {
    remainingMatches[getTeamName(team)] = 0;
  });

  fixtures.forEach(fixture => {

    if (hasResult(fixture)) {
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

    if (remainingMatches[home] !== undefined) {
      remainingMatches[home]++;
    }

    if (remainingMatches[away] !== undefined) {
      remainingMatches[away]++;
    }
  });

  return table
    .filter(team => {

      const teamsThatCanFinishAbove =
        table.filter(other => {

          if (other.team === team.team) {
            return false;
          }

          const otherMaxPoints =
            other.points +
            (remainingMatches[other.team] || 0) * 3;

          return otherMaxPoints > team.points;
        }).length;

      return teamsThatCanFinishAbove < count;
    })
    .slice(0, count)
    .map(team => team.team);
}

// =========================================================
// QUALIFICATION DISPLAY
// =========================================================

function renderChampionsQualification() {

  if (championsQualificationDropdown) {
    championsQualificationDropdown.open =
      season.phase !== "knockout";
  }

  if (!championsQualificationList) {
    return;
  }

  if (season.format !== "champions") {
    championsQualificationList.innerHTML =
      "<p>Not active.</p>";
    return;
  }

  const qualified =
    getQualifiedTeams();

  if (!qualified.length) {
    championsQualificationList.innerHTML =
      "<p>Qualification is not guaranteed for any team yet.</p>";
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


  const teamA =
    getTeamName(tie.teamA) ||
    "TBD";

  const teamB =
    getTeamName(tie.teamB) ||
    "TBD";


  let aggregateA = 0;
  let aggregateB = 0;


  matches.forEach(match => {

    const result =
      getFixtureResult(
        match
      );


    if (!result) {
      return;
    }


    const homeTeam =
      getTeamName(match.homeTeam);

    if (homeTeam === teamA) {
      aggregateA += result.home;
      aggregateB += result.away;
    } else if (homeTeam === teamB) {
      aggregateB += result.home;
      aggregateA += result.away;
    }
  });


  const winner =
    tie.winner ||
    "";


  return `

    <div class="knockout-tie">

      <div class="knockout-team">

        <span>
          ${escapeHTML(teamA)}
        </span>

        <strong>
          ${aggregateA}
        </strong>

      </div>


      <div class="knockout-team">

        <span>
          ${escapeHTML(teamB)}
        </span>

        <strong>
          ${aggregateB}
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

function getVisualTeamName(value) {

  if (!value) {
    return "";
  }

  return getTeamName(value);
}


// =========================================================
// RENDER A BRACKET TEAM
// =========================================================

function renderVisualTeam(
  name,
  score,
  winner,
  loser
) {

  const safeName = name || "TBD";

  const nameClass =
    safeName.length > 26
      ? "team-name-xsmall"
      : safeName.length > 18
        ? "team-name-small"
        : safeName.length > 10
          ? "team-name-medium"
          : "";

  return `
    <div class="visual-bracket-team ${winner ? "is-winner" : loser ? "is-loser" : ""}">
      <span class="${nameClass}">${escapeHTML(safeName)}</span>
      <strong>${score !== "" ? escapeHTML(score) : ""}</strong>
    </div>
  `;
}


// =========================================================
// RENDER A BRACKET TIE
// =========================================================

function renderVisualTie(
  tie,
  label,
  placeholderA,
  placeholderB
) {

  if (!tie) {

    return `
      <div class="visual-bracket-tie placeholder">
        <div class="visual-bracket-label">${escapeHTML(label)}</div>
        ${renderVisualTeam(placeholderA, "", false)}
        ${renderVisualTeam(placeholderB, "", false)}
      </div>
    `;
  }

  const matches =
    Array.isArray(tie.matches)
      ? tie.matches
      : [];

  let aggregateA = 0;
  let aggregateB = 0;
  let hasScore = false;

  matches.forEach(match => {

    const result =
      getFixtureResult(match);

    if (!result) {
      return;
    }

    hasScore = true;

    const home =
      getVisualTeamName(
        match.homeTeam ||
        match.home
      );

    const away =
      getVisualTeamName(
        match.awayTeam ||
        match.away
      );

    if (home === tie.teamA) {
      aggregateA += result.home;
      aggregateB += result.away;
    } else if (away === tie.teamA) {
      aggregateA += result.away;
      aggregateB += result.home;
    }
  });

  const winner =
    tie.winner || "";

  return `
    <div class="visual-bracket-tie">
      <div class="visual-bracket-label">
        ${escapeHTML(label)}
      </div>

      ${renderVisualTeam(
        tie.teamA || "TBD",
        hasScore ? String(aggregateA) : "",
        winner === tie.teamA,
        Boolean(winner) && winner !== tie.teamA
      )}

      ${renderVisualTeam(
        tie.teamB || "TBD",
        hasScore ? String(aggregateB) : "",
        winner === tie.teamB,
        Boolean(winner) && winner !== tie.teamB
      )}
    </div>
  `;
}


// =========================================================
// BRACKET PLACEHOLDERS
// =========================================================

function getBracketPlaceholder(
  sourceRound,
  index
) {

  return `Winner ${sourceRound} ${index + 1}`;
}


// =========================================================
// CHAMPIONS LEAGUE TREE
// =========================================================

function renderBracketColumn(
  title,
  ties,
  placeholdersA,
  placeholdersB,
  side,
  roundClass,
  expectedCount
) {

  const list =
    Array.isArray(ties)
      ? ties
      : [];

  const count =
    Math.max(
      expectedCount || 0,
      list.length
    );

  return `
    <div class="skeleton-round ${side} ${roundClass}">
      <div class="skeleton-round-title">
        ${escapeHTML(title)}
      </div>

      <div class="skeleton-round-body">
        ${Array.from(
          { length: count },
          (_, index) =>
            renderVisualTie(
              list[index] || null,
              list[index]?.round ||
                `${title} ${index + 1}`,
              placeholdersA?.[index] || "TBD",
              placeholdersB?.[index] || "TBD"
            )
        ).join("")}
      </div>
    </div>
  `;
}


// =========================================================
// CHAMPIONS LEAGUE 2D SKELETON BRACKET
// =========================================================

function renderChampionsBracketConnectors(isR16) {

  if (isR16) {
    return `
      <svg class="champions-bracket-lines"
           viewBox="0 0 1556 620"
           preserveAspectRatio="none"
           aria-hidden="true">

        <path d="M200 105 H220 V175 H246" />
        <path d="M200 245 H220 V175" />
        <path d="M200 385 H220 V455 H246" />
        <path d="M200 525 H220 V455" />

        <path d="M416 175 H436 V315 H462" />
        <path d="M416 455 H436 V315" />

        <path d="M622 315 H668" />

        <path d="M1346 105 H1336 V175 H1300" />
        <path d="M1346 245 H1336 V175" />
        <path d="M1346 385 H1336 V455 H1300" />
        <path d="M1346 525 H1336 V455" />

        <path d="M1300 175 H1100 V315 H1084" />
        <path d="M1300 455 H1100 V315" />

        <path d="M924 315 H878" />

      </svg>
    `;
  }

  return `
    <svg class="champions-bracket-lines"
         viewBox="0 0 1094 620"
         preserveAspectRatio="none"
         aria-hidden="true">

      <path d="M245 167 H265 V310 H281" />
      <path d="M245 453 H265 V310" />

      <path d="M441 310 H462" />

      <path d="M849 167 H829 V310 H813" />
      <path d="M849 453 H829 V310" />

      <path d="M633 310 H612" />

    </svg>
  `;
}

function renderChampionsBracket() {

  if (!championsBracketContent) {
    return;
  }

  if (season.format !== "champions") {

    championsBracketContent.innerHTML =
      "<p>Champions League bracket is not active.</p>";

    return;
  }

  const hasKnockoutData =
    (
      Array.isArray(knockout.roundOf16) &&
      knockout.roundOf16.length > 0
    ) ||
    (
      Array.isArray(knockout.quarterFinals) &&
      knockout.quarterFinals.length > 0
    ) ||
    (
      Array.isArray(knockout.semiFinals) &&
      knockout.semiFinals.length > 0
    ) ||
    (
      Array.isArray(knockout.final) &&
      knockout.final.length > 0
    );

  /*
   * The draw lock is the normal trigger.
   * The data check also makes the public page
   * resilient if an older competition document
   * contains the knockout arrays but is missing
   * the drawLocked flag.
   */
  if (
    knockout.drawLocked !== true &&
    !hasKnockoutData
  ) {

    championsBracketContent.innerHTML =
      "<p>CHAMPIONS LEAGUE PHASE NOT COMPLETED YET.</p>";

    return;
  }

  const r16 =
    Array.isArray(knockout.roundOf16)
      ? knockout.roundOf16
      : [];

  const qf =
    Array.isArray(knockout.quarterFinals)
      ? knockout.quarterFinals
      : [];

  const sf =
    Array.isArray(knockout.semiFinals)
      ? knockout.semiFinals
      : [];

  const final =
    Array.isArray(knockout.final)
      ? knockout.final
      : [];

  const isR16 =
    r16.length > 0;

  const leftR16 =
    isR16 ? r16.slice(0, 4) : [];

  const rightR16 =
    isR16 ? r16.slice(4, 8) : [];

  const leftQF =
    qf.slice(0, 2);

  const rightQF =
    qf.slice(2, 4);

  const leftSF =
    sf[0] || null;

  const rightSF =
    sf[1] || null;

  const finalTie =
    final[0] || null;

  const leftQFPlaceholdersA = [
    isR16 ? getBracketPlaceholder("R16", 1) : "Qualified team",
    isR16 ? getBracketPlaceholder("R16", 3) : "Qualified team"
  ];

  const leftQFPlaceholdersB = [
    isR16 ? getBracketPlaceholder("R16", 2) : "Qualified team",
    isR16 ? getBracketPlaceholder("R16", 4) : "Qualified team"
  ];

  const rightQFPlaceholdersA = [
    isR16 ? getBracketPlaceholder("R16", 5) : "Qualified team",
    isR16 ? getBracketPlaceholder("R16", 7) : "Qualified team"
  ];

  const rightQFPlaceholdersB = [
    isR16 ? getBracketPlaceholder("R16", 6) : "Qualified team",
    isR16 ? getBracketPlaceholder("R16", 8) : "Qualified team"
  ];

  const bracketColumns = [];

  if (isR16) {

    bracketColumns.push(
      renderBracketColumn(
        "ROUND OF 16",
        leftR16,
        ["Qualified team", "Qualified team", "Qualified team", "Qualified team"],
        ["Qualified team", "Qualified team", "Qualified team", "Qualified team"],
        "left",
        "round-r16"
      )
    );
  }

  bracketColumns.push(
    renderBracketColumn(
      "QUARTER-FINALS",
      leftQF,
      leftQFPlaceholdersA,
      leftQFPlaceholdersB,
      "left",
      "round-qf",
      2
    )
  );

  bracketColumns.push(`
    <div class="skeleton-round left sf-column">
      <div class="skeleton-round-title">SEMI-FINALS</div>
      <div class="skeleton-round-body single-tie">
        ${renderVisualTie(
          leftSF,
          "SF-1",
          getBracketPlaceholder("QF", 0),
          getBracketPlaceholder("QF", 1)
        )}
      </div>
    </div>
  `);

  bracketColumns.push(`
    <div class="skeleton-final-column">

      <div class="skeleton-round-title">FINAL</div>

      <div class="skeleton-final-tie">
        ${renderVisualTie(
          finalTie,
          "FINAL",
          "Winner SF-1",
          "Winner SF-2"
        )}
      </div>

      <div class="skeleton-third-place">
        <div class="third-place-title">3RD PLACE</div>
        <div class="third-place-team">
          ${escapeHTML(
            champions.thirdPlace ||
            "Winner SF-1 / SF-2"
          )}
        </div>
      </div>

    </div>
  `);

  bracketColumns.push(`
    <div class="skeleton-round right sf-column">
      <div class="skeleton-round-title">SEMI-FINALS</div>
      <div class="skeleton-round-body single-tie">
        ${renderVisualTie(
          rightSF,
          "SF-2",
          getBracketPlaceholder("QF", 2),
          getBracketPlaceholder("QF", 3)
        )}
      </div>
    </div>
  `);

  bracketColumns.push(
    renderBracketColumn(
      "QUARTER-FINALS",
      rightQF,
      rightQFPlaceholdersA,
      rightQFPlaceholdersB,
      "right",
      "round-qf",
      2
    )
  );

  if (isR16) {

    bracketColumns.push(
      renderBracketColumn(
        "ROUND OF 16",
        rightR16,
        ["Qualified team", "Qualified team", "Qualified team", "Qualified team"],
        ["Qualified team", "Qualified team", "Qualified team", "Qualified team"],
        "right",
        "round-r16"
      )
    );
  }

  championsBracketContent.innerHTML = `
    <div class="champions-skeleton-shell">

      <div class="champions-skeleton-scroll">
        <div class="champions-skeleton-grid ${isR16 ? "has-r16" : "qf-only"}">
          ${renderChampionsBracketConnectors(isR16)}
          ${bracketColumns.join("")}
        </div>
      </div>

    </div>
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
// WINNER CELEBRATION
// =========================================================

function renderWinnerCelebration() {

  if (!winnerCelebration) {
    return;
  }

  const champion =
    champions.champion || "";

  if (
    season.format !== "champions" ||
    !champion
  ) {
    winnerCelebration.style.display = "none";
    winnerCelebration.innerHTML = "";
    return;
  }

  const prizeCurrency =
    champions.prizeCurrency === "$"
      ? "$"
      : "₦";

  const prizeAmount =
    champions.prizeAmount || "";

  const prizeEnabled =
    champions.prizeEnabled === true;

  winnerCelebration.style.display = "block";

  winnerCelebration.innerHTML = `
    <div class="ucl-stage">

      <div class="stage-stars" aria-hidden="true">
        <span>✦</span><span>·</span><span>✦</span>
        <span>·</span><span>✦</span><span>·</span>
        <span>✦</span>
      </div>

      <div class="stage-crawler-wrap">
        <div class="stage-crawler">
          🏆 CONGRATULATIONS — ${escapeHTML(champion)} — CHAMPIONS 🏆
        </div>
      </div>

      <div class="stage-spotlight spotlight-left"></div>
      <div class="stage-spotlight spotlight-right"></div>

      <div class="stage-title">
        <span>CHAMPIONS</span>
        <strong>LEAGUE WINNER</strong>
      </div>

      <div class="stage-trophy-area">

        <div class="stage-firework firework-one">✦</div>
        <div class="stage-firework firework-two">✧</div>
        <div class="stage-firework firework-three">✦</div>

        <div class="stage-trophy" aria-label="Champions trophy">
          🏆
        </div>

        <div class="stage-medal">
          🥇
        </div>

      </div>

      <div class="stage-winner-name">
        ${escapeHTML(champion)}
      </div>

      <div class="stage-podium">

        <div class="podium-block podium-left">
          <span>2ND PLACE</span>
          <strong class="podium-team-name">
            ${escapeHTML(champions.runnerUp || "RUNNER-UP")}
          </strong>
        </div>

        <div class="podium-block podium-center">
          <div class="podium-crown" aria-hidden="true">👑</div>
          <span>🏆 CHAMPION 🏆</span>
          <strong class="podium-team-name podium-champion-name">
            ${escapeHTML(champion)}
          </strong>
          <b>1</b>
        </div>

        <div class="podium-block podium-right">
          <span>3RD PLACE</span>
          <strong class="podium-team-name">
            ${escapeHTML(champions.thirdPlace || "3RD PLACE")}
          </strong>
        </div>

      </div>

      ${prizeEnabled ? `
        <div class="stage-prize">
          <span>WINNER'S PRIZE</span>
          <strong>
            ${escapeHTML(
              prizeCurrency + " " + (prizeAmount || "0")
            )}
          </strong>
        </div>
      ` : ""}

      <div class="stage-congratulations">
        Congratulations to the Champions!
      </div>

      <div class="stage-confetti" aria-hidden="true">
        ✦ ･ ✧ ･ ✦ ･ ✧ ･ ✦ ･ ✧ ･ ✦
      </div>

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

  renderWinnerCelebration();

  renderTeams();

  renderFixtures();

  renderTable();

  renderTableTitles();

  /*
   * Champions League should only be visible
   * when Champions format is selected.
   */

  const championsSection =
    document.getElementById("champions");

  const championsBracketTop =
    document.getElementById("championsBracketTop");

  const championsNav =
    document.querySelector(
      'a[href="#champions"]'
    );


  const championsActive =
    season.format === "champions";


  if (championsSection) {

    championsSection.style.display =
      championsActive
        ? ""
        : "none";
  }

  if (championsBracketTop) {

    championsBracketTop.style.display =
      championsActive
        ? ""
        : "none";
  }


  if (championsNav) {

    championsNav.style.display =
      championsActive
        ? ""
        : "none";
  }


  if (leagueTableDropdown) {

    leagueTableDropdown.open =
      !(
        season.format === "champions" &&
        season.phase === "knockout"
      );
  }

  if (championsActive) {

    renderChampionsStatus();

    renderChampionsQualification();

    renderChampionsBracket();

    renderChampionsPodium();
  }
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

// =========================================================
// DLS COMPETITION
// PUBLIC SCRIPT
// PART 27 — KNOCKOUT DATA COMPATIBILITY
// =========================================================

function normalizePublicKnockoutData() {

  if (
    !knockout ||
    typeof knockout !== "object"
  ) {

    knockout = {
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
// NORMALIZE CHAMPIONS DATA
// =========================================================

function normalizePublicChampionsData() {

  if (
    !champions ||
    typeof champions !== "object"
  ) {

    champions = {
      champion: "",
      runnerUp: "",
      thirdPlace: "",
      prizeAmount: "",
      prizeCurrency: ""
    };

    return;
  }


  champions = {

    champion:
      champions.champion ||
      "",

    runnerUp:
      champions.runnerUp ||
      "",

    thirdPlace:
      champions.thirdPlace ||
      "",

    prizeAmount:
      champions.prizeAmount ||
      "",

    prizeCurrency:
      champions.prizeCurrency === "$"
        ? "$"
        : "₦",

    prizeEnabled:
      champions.prizeEnabled === true
  };
}


// =========================================================
// RUN NORMALIZATION
// =========================================================

normalizePublicKnockoutData();

normalizePublicChampionsData();


// =========================================================
// RE-RENDER AFTER NORMALIZATION
// =========================================================

renderChampionsStatus();

renderChampionsQualification();

renderChampionsBracket();

renderChampionsPodium();