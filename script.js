const teams = [];

const form = document.getElementById("registrationForm");
const teamList = document.getElementById("teamList");
const registrationMessage =
  document.getElementById("registrationMessage");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const teamName =
    document.getElementById("teamName").value.trim();

  const playerName =
    document.getElementById("playerName").value.trim();

  if (teamName === "" || playerName === "") {
    registrationMessage.textContent =
      "⚠️ Please fill in all fields.";
    return;
  }

  const cleanName = teamName
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const alreadyExists = teams.some(function (team) {
    return team.teamName
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim() === cleanName;
  });

  if (alreadyExists) {
    registrationMessage.textContent =
      "⚠️ This team name is already registered.";
    return;
  }

  teams.push({
    teamName: teamName,
    playerName: playerName
  });

  displayTeams();

  registrationMessage.textContent =
    "✅ Team registered successfully!";

  form.reset();
});


function displayTeams() {
  if (teams.length === 0) {
    teamList.innerHTML =
      "<p>No teams registered yet.</p>";
    return;
  }

  teamList.innerHTML = "";

  teams.forEach(function (team) {
    const card = document.createElement("div");

    card.className = "team-card";

    card.innerHTML = `
      <h3>⚽ ${team.teamName}</h3>
      <p>${team.playerName}</p>
    `;

    teamList.appendChild(card);
  });
}


function showRegister() {
  document.getElementById("register").scrollIntoView({
    behavior: "smooth"
  });
}


function adminLogin() {
  alert("Admin system coming soon.");
}


displayTeams();

window.showRegister = showRegister;
window.adminLogin = adminLogin;
