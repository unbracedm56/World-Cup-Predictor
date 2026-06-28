const STORAGE_KEY = "fifa-26-world-cup-predictor-v2";

const rounds = [
  { key: "r32", label: "Round of 32", short: "R32", count: 8 },
  { key: "r16", label: "Round of 16", short: "R16", count: 4 },
  { key: "qf", label: "Quarter-final", short: "QF", count: 2 },
  { key: "sf", label: "Semi-final", short: "SF", count: 1 },
];

const teams = {
  GER: { name: "Germany", flagCode: "de" },
  PAR: { name: "Paraguay", flagCode: "py" },
  FRA: { name: "France", flagCode: "fr" },
  SWE: { name: "Sweden", flagCode: "se" },
  RSA: { name: "South Africa", flagCode: "za" },
  CAN: { name: "Canada", flagCode: "ca" },
  NED: { name: "Netherlands", flagCode: "nl" },
  MAR: { name: "Morocco", flagCode: "ma" },
  POR: { name: "Portugal", flagCode: "pt" },
  CRO: { name: "Croatia", flagCode: "hr" },
  ESP: { name: "Spain", flagCode: "es" },
  AUT: { name: "Austria", flagCode: "at" },
  USA: { name: "United States", flagCode: "us" },
  BIH: { name: "Bosnia and Herzegovina", flagCode: "ba" },
  BEL: { name: "Belgium", flagCode: "be" },
  SEN: { name: "Senegal", flagCode: "sn" },
  BRA: { name: "Brazil", flagCode: "br" },
  JPN: { name: "Japan", flagCode: "jp" },
  CIV: { name: "Ivory Coast", flagCode: "ci" },
  NOR: { name: "Norway", flagCode: "no" },
  MEX: { name: "Mexico", flagCode: "mx" },
  ECU: { name: "Ecuador", flagCode: "ec" },
  ENG: { name: "England", flagCode: "gb-eng" },
  COD: { name: "DR Congo", flagCode: "cd" },
  ARG: { name: "Argentina", flagCode: "ar" },
  CPV: { name: "Cape Verde", flagCode: "cv" },
  AUS: { name: "Australia", flagCode: "au" },
  EGY: { name: "Egypt", flagCode: "eg" },
  SUI: { name: "Switzerland", flagCode: "ch" },
  ALG: { name: "Algeria", flagCode: "dz" },
  COL: { name: "Colombia", flagCode: "co" },
  GHA: { name: "Ghana", flagCode: "gh" },
};

const startMatches = {
  left: [
    { teams: ["GER", "PAR"], date: "Jun 30" },
    { teams: ["FRA", "SWE"], date: "Jul 1" },
    { teams: ["RSA", "CAN"], date: "Jun 29" },
    { teams: ["NED", "MAR"], date: "Jun 30" },
    { teams: ["POR", "CRO"], date: "Jul 3" },
    { teams: ["ESP", "AUT"], date: "Jul 2" },
    { teams: ["USA", "BIH"], date: "Jul 2" },
    { teams: ["BEL", "SEN"], date: "Jul 1" },
  ],
  right: [
    { teams: ["BRA", "JPN"], date: "Jun 29" },
    { teams: ["CIV", "NOR"], date: "Jun 30" },
    { teams: ["MEX", "ECU"], date: "Jul 1" },
    { teams: ["ENG", "COD"], date: "Jul 1" },
    { teams: ["ARG", "CPV"], date: "Jul 4" },
    { teams: ["AUS", "EGY"], date: "Jul 3" },
    { teams: ["SUI", "ALG"], date: "Jul 3" },
    { teams: ["COL", "GHA"], date: "Jul 4" },
  ],
};

const roundDates = {
  left: {
    r16: ["Jul 5", "Jul 4", "Jul 6", "Jul 7"],
    qf: ["Jul 9", "Jul 10"],
    sf: ["Jul 11"],
  },
  right: {
    r16: ["Jul 5", "Jul 6", "Jul 7", "Jul 7"],
    qf: ["Jul 12", "Jul 12"],
    sf: ["Jul 15"],
  },
};

const state = {
  left: createSideState("left"),
  right: createSideState("right"),
  finalWinner: null,
  bronzeWinner: null,
};

const dom = {
  leftBracket: document.getElementById("leftBracket"),
  rightBracket: document.getElementById("rightBracket"),
  finalMatch: document.getElementById("finalMatch"),
  bronzeMatch: document.getElementById("bronzeMatch"),
  championName: document.getElementById("championName"),
  matchTemplate: document.getElementById("matchTemplate"),
  resetBtn: document.getElementById("resetBtn"),
  randomBtn: document.getElementById("randomBtn"),
};

function createSideState(side) {
  return {
    r32: startMatches[side].map((match) => ({ ...match, winner: null })),
    r16: Array.from({ length: 4 }, (_, index) => ({ date: roundDates[side].r16[index], winner: null })),
    qf: Array.from({ length: 2 }, (_, index) => ({ date: roundDates[side].qf[index], winner: null })),
    sf: Array.from({ length: 1 }, (_, index) => ({ date: roundDates[side].sf[index], winner: null })),
  };
}

function previousRoundKey(roundKey) {
  const index = rounds.findIndex((round) => round.key === roundKey);
  return index > 0 ? rounds[index - 1].key : null;
}

function participants(side, roundKey, matchIndex) {
  if (roundKey === "r32") {
    return state[side].r32[matchIndex].teams;
  }

  const previous = previousRoundKey(roundKey);
  const first = state[side][previous][matchIndex * 2]?.winner;
  const second = state[side][previous][matchIndex * 2 + 1]?.winner;
  return [first, second].filter(Boolean);
}

function setWinner(side, roundKey, matchIndex, teamCode) {
  const match = state[side][roundKey][matchIndex];
  match.winner = match.winner === teamCode ? null : teamCode;
  cleanInvalidPicks();
  saveState();
  render();
}

function cleanInvalidPicks() {
  ["left", "right"].forEach((side) => {
    rounds.forEach((round) => {
      state[side][round.key].forEach((match, index) => {
        if (match.winner && !participants(side, round.key, index).includes(match.winner)) {
          match.winner = null;
        }
      });
    });
  });

  const finalists = getFinalists();
  if (state.finalWinner && !finalists.includes(state.finalWinner)) {
    state.finalWinner = null;
  }

  const thirdPlaceTeams = getThirdPlaceTeams();
  if (state.bronzeWinner && !thirdPlaceTeams.includes(state.bronzeWinner)) {
    state.bronzeWinner = null;
  }
}

function getFinalists() {
  return [state.left.sf[0].winner, state.right.sf[0].winner].filter(Boolean);
}

function getThirdPlaceTeams() {
  return [getSemiLoser("left"), getSemiLoser("right")].filter(Boolean);
}

function getSemiLoser(side) {
  const semiTeams = participants(side, "sf", 0);
  const winner = state[side].sf[0].winner;
  return winner ? semiTeams.find((teamCode) => teamCode !== winner) : null;
}

function render() {
  renderSide("left", dom.leftBracket);
  renderSide("right", dom.rightBracket);
  renderCentralMatch(dom.finalMatch, getFinalists(), state.finalWinner, "Pick champion", (teamCode) => {
    state.finalWinner = state.finalWinner === teamCode ? null : teamCode;
  });
  renderCentralMatch(dom.bronzeMatch, getThirdPlaceTeams(), state.bronzeWinner, "Pick third place", (teamCode) => {
    state.bronzeWinner = state.bronzeWinner === teamCode ? null : teamCode;
  });
  dom.championName.textContent = state.finalWinner ? teamInfo(state.finalWinner).name : "Awaiting final";
}

function renderSide(side, mount) {
  mount.replaceChildren();
  rounds.forEach((round, roundIndex) => {
    state[side][round.key].forEach((match, matchIndex) => {
      mount.appendChild(renderMatch(side, round, roundIndex, matchIndex, match));
    });
  });
}

function renderMatch(side, round, roundIndex, matchIndex, match) {
  const fragment = dom.matchTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".match-card");
  const meta = fragment.querySelector(".match-meta");
  const teamList = fragment.querySelector(".teams");
  const choices = participants(side, round.key, matchIndex);

  card.dataset.round = round.key;
  card.dataset.side = side;
  card.dataset.match = String(matchIndex);
  card.style.setProperty("--col", side === "left" ? roundIndex + 1 : 4 - roundIndex);
  card.style.setProperty("--row", gridRow(round.key, matchIndex));

  if (round.key !== "sf") {
    card.classList.add(side === "left" ? "connect-right" : "connect-left");
  }
  if (round.key !== "r32") {
    card.classList.add(side === "left" ? "connect-left" : "connect-right");
  }

  meta.textContent = `${round.short} · ${match.date}`;

  if (choices.length === 0) {
    teamList.appendChild(emptySlot("Waiting for winners"));
    teamList.appendChild(emptySlot("Waiting for winners"));
    return fragment;
  }

  choices.forEach((teamCode) => {
    teamList.appendChild(teamButton(teamCode, match.winner === teamCode, () => {
      setWinner(side, round.key, matchIndex, teamCode);
    }));
  });

  while (teamList.children.length < 2) {
    teamList.appendChild(emptySlot("TBD"));
  }

  return fragment;
}

function gridRow(roundKey, index) {
  const starts = {
    r32: [1, 3, 5, 7, 9, 11, 13, 15],
    r16: [2, 6, 10, 14],
    qf: [4, 12],
    sf: [8],
  };
  return starts[roundKey][index];
}

function renderCentralMatch(mount, choices, selectedTeam, emptyText, onPick) {
  mount.replaceChildren();

  if (choices.length === 0) {
    mount.appendChild(emptySlot("Waiting for semi-finals"));
    mount.appendChild(emptySlot("Waiting for semi-finals"));
    return;
  }

  choices.forEach((teamCode) => {
    mount.appendChild(teamButton(teamCode, selectedTeam === teamCode, () => {
      onPick(teamCode);
      cleanInvalidPicks();
      saveState();
      render();
    }, emptyText));
  });

  while (mount.children.length < 2) {
    mount.appendChild(emptySlot("TBD"));
  }
}

function teamButton(teamCode, selected, onClick, prompt = "Advance") {
  const info = teamInfo(teamCode);
  const flagMarkup = info.flagCode
    ? `<img class="flag-img" src="https://flagcdn.com/w40/${info.flagCode}.png" alt="${info.name} flag" loading="lazy">`
    : `<span class="flag-fallback">${teamCode.slice(0, 2)}</span>`;
  const button = document.createElement("button");
  button.type = "button";
  button.className = `team-button${selected ? " selected" : ""}`;
  button.setAttribute("aria-pressed", String(selected));
  button.title = `${info.name} (${teamCode})`;
  button.innerHTML = `
    <span class="flag">${flagMarkup}</span>
    <span class="team-copy">
      <span class="team-line">
        <strong>${teamCode}</strong>
        <small>${info.name}</small>
      </span>
    </span>
    <span class="pick-label">${selected ? "Picked" : prompt}</span>
  `;
  button.addEventListener("click", onClick);
  return button;
}

function emptySlot(label) {
  const slot = document.createElement("div");
  slot.className = "empty-slot";
  slot.textContent = label;
  return slot;
}

function teamInfo(teamCode) {
  return teams[teamCode] ?? { name: "To be decided", flagCode: "" };
}

function resetBracket() {
  ["left", "right"].forEach((side) => {
    rounds.forEach((round) => {
      state[side][round.key].forEach((match) => {
        match.winner = null;
      });
    });
  });
  state.finalWinner = null;
  state.bronzeWinner = null;
  saveState();
  render();
}

function randomizeBracket() {
  resetBracket();
  ["left", "right"].forEach((side) => {
    rounds.forEach((round) => {
      state[side][round.key].forEach((match, index) => {
        const choices = participants(side, round.key, index);
        match.winner = choices[Math.floor(Math.random() * choices.length)];
      });
    });
  });
  const finalists = getFinalists();
  state.finalWinner = finalists[Math.floor(Math.random() * finalists.length)];
  const thirdPlaceTeams = getThirdPlaceTeams();
  state.bronzeWinner = thirdPlaceTeams[Math.floor(Math.random() * thirdPlaceTeams.length)];
  saveState();
  render();
}

function saveState() {
  const payload = {
    left: extractWinners("left"),
    right: extractWinners("right"),
    finalWinner: state.finalWinner,
    bronzeWinner: state.bronzeWinner,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function extractWinners(side) {
  return Object.fromEntries(rounds.map((round) => [
    round.key,
    state[side][round.key].map((match) => match.winner),
  ]));
}

function restoreState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const payload = JSON.parse(raw);
    ["left", "right"].forEach((side) => {
      rounds.forEach((round) => {
        payload[side]?.[round.key]?.forEach((winner, index) => {
          if (typeof winner === "string") {
            state[side][round.key][index].winner = winner;
          }
        });
      });
    });
    state.finalWinner = typeof payload.finalWinner === "string" ? payload.finalWinner : null;
    state.bronzeWinner = typeof payload.bronzeWinner === "string" ? payload.bronzeWinner : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

dom.resetBtn.addEventListener("click", resetBracket);
dom.randomBtn.addEventListener("click", randomizeBracket);

restoreState();
cleanInvalidPicks();
render();
