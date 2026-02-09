class SnakeAndLadder {
  constructor() {
    this.currentPlayer = 1;
    this.positions = { 1: 0, 2: 0 };
    this.boardSize = 100;
    this.gameStarted = true;
    this.rollAttempts = { 1: 0, 2: 0 };
    this.periodicElements = this.getPeriodicElements();
    this.elementPowers = this.getElementPowers();
    this.synth = null;
    this.powerSynth = new Tone.FMSynth().toDestination();
    this.initializeAudio();
    this.initializeBoard();
    this.setupEventListeners();
    this.startDiceBlinking();
    this.gameEnded = false; // Added gameEnded flag
  }

  async initializeAudio() {
    await Tone.start();
    this.synth = new Tone.Synth().toDestination();
    await this.synth.triggerAttackRelease("C4", "0.01"); // Warm up audio context
  }

  playDiceSound() {
    if (this.synth) {
      this.synth.triggerAttackRelease("C4", "8n");
    }
  }

  playPowerSound(isPositive) {
    if (this.powerSynth) {
      const note = isPositive ? "E5" : "C3";
      const duration = isPositive ? "4n" : "2n";
      this.powerSynth.triggerAttackRelease(note, duration);
    }
  }

  getElementPowers() {
    return {
      3: {
        symbol: "Li",
        power: "Reactive with water - Random boost (5-20 spaces)",
        color: "standard",
      },
      6: {
        symbol: "C",
        power: "Carbon bonds - Form chain reaction (moves to 15)",
        color: "green",
      },
      8: {
        symbol: "O",
        power: "Oxidizing power - Extra turn + forward 3 spaces",
        color: "green",
      },
      9: {
        symbol: "F",
        power: "Most reactive - Forced move to position 4",
        color: "red",
      },
      12: {
        symbol: "Mg",
        power: "Bright flash - Illuminate path (+2 spaces)",
        color: "green",
      },
      16: {
        symbol: "S",
        power: "Toxic fumes - Move back 3 spaces",
        color: "red",
      },
      20: {
        symbol: "Ca",
        power: "Strong bones - Immunity to next negative",
        color: "standard",
      },
      23: {
        symbol: "V",
        power: "Toxic oxide - Move back 5 spaces",
        color: "red",
      },
      28: { symbol: "Ni", power: "Magnetic - Swap positions", color: "green" },
      32: {
        symbol: "Ge",
        power: "Semiconductor - Skip obstacles (+2 spaces)",
        color: "green",
      },
      35: {
        symbol: "Br",
        power: "Corrosive - Opponent moves back 2 spaces",
        color: "red",
      },
      36: {
        symbol: "Kr",
        power: "Noble gas shield - Block next 3 attacks",
        color: "standard",
      },
      40: {
        symbol: "Zr",
        power: "Nuclear resistant - Immune to next 3 negative effects",
        color: "green",
      },
      44: {
        symbol: "Ru",
        power: "Catalytic boost - Double next roll",
        color: "green",
      },
      47: {
        symbol: "Ag",
        power: "Silver shield - Block next negative effect",
        color: "green",
      },
      50: {
        symbol: "Sn",
        power: "Tin curse - Opponent skips next turn",
        color: "red",
      },
      53: {
        symbol: "I",
        power: "Iodine radiation - Move back 5 spaces",
        color: "red",
      },
      54: {
        symbol: "Xe",
        power: "Noble gas shield - Block next attack",
        color: "green",
      },
      56: {
        symbol: "Ba",
        power: "Explosive reaction - Random effect (±8 spaces)",
        color: "standard",
      },
      58: {
        symbol: "Ce",
        power: "Rare earth boost - Move forward 3 spaces",
        color: "green",
      },
      63: {
        symbol: "Eu",
        power: "Toxic emission - All players move back 3 spaces",
        color: "red",
      },
      65: {
        symbol: "Tb",
        power: "Terbium leap - Move forward 5 spaces",
        color: "green",
      },
      68: {
        symbol: "Er",
        power: "Radiation burst - Move back 4 spaces",
        color: "red",
      },
      74: {
        symbol: "W",
        power:
          "Ultimate shield - Permanent immunity to next 5 negative effects",
        color: "green",
      },
      78: {
        symbol: "Pt",
        power: "Catalyst - Enhance next power effect",
        color: "standard",
      },
      79: {
        symbol: "Au",
        power: "Noble metal - Royal advance (+7 spaces)",
        color: "green",
      },
      80: {
        symbol: "Hg",
        power: "Toxic metal - Slow progress (-4 spaces)",
        color: "red",
      },
      82: {
        symbol: "Pb",
        power: "Heavy metal poisoning - Move back 10 spaces",
        color: "red",
      },
      88: {
        symbol: "Ra",
        power: "Radiation burst - Teleport to random power cell",
        color: "standard",
      },
      92: {
        symbol: "U",
        power:
          "Nuclear chain reaction - All players move to nearest danger cell",
        color: "red",
      },
      94: {
        symbol: "Pu",
        power: "Unstable - High risk teleport (-10 or +15 spaces)",
        color: "red",
      },
      95: {
        symbol: "Am",
        power: "Radiation damage - Opp moves back 3 spaces",
        color: "red",
      },
      98: {
        symbol: "Cf",
        power: "Safe shield - Block next 2 moves from other effects",
        color: "standard",
      },
      100: {
        symbol: "Fm",
        power: "Superheavy stability - No negative effects in future",
        color: "green",
      },
    };
  }

  getPeriodicElements() {
    return [
      "H",
      "He",
      "Li",
      "Be",
      "B",
      "C",
      "N",
      "O",
      "F",
      "Ne",
      "Na",
      "Mg",
      "Al",
      "Si",
      "P",
      "S",
      "Cl",
      "Ar",
      "K",
      "Ca",
      "Sc",
      "Ti",
      "V",
      "Cr",
      "Mn",
      "Fe",
      "Co",
      "Ni",
      "Cu",
      "Zn",
      "Ga",
      "Ge",
      "As",
      "Se",
      "Br",
      "Kr",
      "Rb",
      "Sr",
      "Y",
      "Zr",
      "Nb",
      "Mo",
      "Tc",
      "Ru",
      "Rh",
      "Pd",
      "Ag",
      "Cd",
      "In",
      "Sn",
      "Sb",
      "Te",
      "I",
      "Xe",
      "Cs",
      "Ba",
      "La",
      "Ce",
      "Pr",
      "Nd",
      "Pm",
      "Sm",
      "Eu",
      "Gd",
      "Tb",
      "Dy",
      "Ho",
      "Er",
      "Tm",
      "Yb",
      "Lu",
      "Hf",
      "Ta",
      "W",
      "Re",
      "Os",
      "Ir",
      "Pt",
      "Au",
      "Hg",
      "Tl",
      "Pb",
      "Bi",
      "Po",
      "At",
      "Rn",
      "Fr",
      "Ra",
      "Ac",
      "Th",
      "Pa",
      "U",
      "Np",
      "Pu",
      "Am",
      "Cm",
      "Bk",
      "Cf",
      "Es",
      "Fm",
    ];
  }

  initializeBoard() {
    const board = document.getElementById("game-board");
    board.innerHTML = "";

    for (let row = 9; row >= 0; row--) {
      for (let col = 0; col < 10; col++) {
        const cell = document.createElement("div");
        cell.className = "cell";

        let number;
        if (row % 2 === 0) {
          number = row * 10 + col + 1;
        } else {
          number = (row + 1) * 10 - col;
        }

        const elementPower = this.elementPowers[number];
        if (elementPower) {
          cell.classList.add(`power-${elementPower.color}`);
        }

        cell.innerHTML = `
                    <div class="number">${number}</div>
                    <div class="element">${
                      this.periodicElements[number - 1]
                    }</div>
                    ${
                      elementPower
                        ? `<div class="power-hint">${elementPower.power}</div>`
                        : ""
                    }
                `;
        cell.dataset.number = number;
        board.appendChild(cell);
      }
    }
  }

  setupEventListeners() {
    document
      .getElementById("dice1")
      .addEventListener("click", () => this.rollDice(1));
    document
      .getElementById("dice2")
      .addEventListener("click", () => this.rollDice(2));
  }

  checkAndApplyPower(player) {
    const position = this.positions[player];
    const power = this.elementPowers[position];

    if (!power) return null;

    const cell = document.querySelector(`[data-number="${position}"]`);
    const isNegativePower = power.color === "red";

    cell.classList.add(
      isNegativePower
        ? "power-activating-negative"
        : "power-activating-positive"
    );
    this.playPowerSound(power.color !== "red");

    setTimeout(() => {
      cell.classList.remove(
        "power-activating-negative",
        "power-activating-positive"
      );
    }, 1000);

    let effect = `Activated ${power.symbol} power: ${power.power}`;
    const otherPlayer = player === 1 ? 2 : 1;

    switch (position) {
      case 3: // Li - Random movement
        const randomMove = Math.floor(Math.random() * 16) + 5;
        this.positions[player] = Math.min(
          this.positions[player] + randomMove,
          100
        );
        break;
      case 6: // C - Carbon bonds
        this.positions[player] = Math.min(this.positions[player] + 9, 100);
        break;
      case 8: // O - Oxidizing power
        this.positions[player] = Math.min(this.positions[player] + 3, 100);
        return effect; // Returns to keep the current player's turn
      case 9: // F - Move to 4
        this.positions[player] = 4;
        break;
      case 12: // Mg - Move 2 forward
        this.positions[player] += 2;
        break;
      case 16: // S - Move back 3
        this.positions[player] = Math.max(1, this.positions[player] - 3);
        break;
      case 20: // Ca - Immunity to next negative
        this.playerEffects = this.playerEffects || {};
        this.playerEffects[player] = { type: "immunity", count: 1 };
        break;
      case 23: // V - Toxic oxide
        this.positions[player] = Math.max(1, this.positions[player] - 5);
        break;
      case 28: // Ni - Swap positions
        const tempPos = this.positions[player];
        this.positions[player] = this.positions[otherPlayer];
        this.positions[otherPlayer] = tempPos;
        this.updatePlayerPosition(otherPlayer);
        break;
      case 32: // Ge - Skip obstacles (+2 spaces)
        this.positions[player] += 2;
        break;
      case 35: // Br - Corrosive
        this.positions[player] = 33;
        break;
      case 36: // Kr - Noble gas shield
        this.playerEffects = this.playerEffects || {};
        this.playerEffects[player] = { type: "block_attack", count: 3 };
        break;
      case 40: // Zr - Nuclear resistant
        this.playerEffects = this.playerEffects || {};
        this.playerEffects[player] = { type: "immunity", count: 3 };
        break;
      case 44: // Ru - Triple next roll
        this.playerEffects = this.playerEffects || {};
        this.playerEffects[player] = { type: "triple_next_roll" };
        break;
      case 47: // Ag - Clear path
        this.positions[player] = Math.min(this.positions[player] + 5, 100);
        break;
      case 50: // Sn - Tin curse
        this.playerEffects = this.playerEffects || {};
        this.playerEffects[otherPlayer] = { type: "skip_turns", count: 2 };
        break;
      case 53: // I - Sublimation
        const teleportDistance = Math.floor(Math.random() * 5) + 3;
        this.positions[player] = Math.min(
          this.positions[player] + teleportDistance,
          100
        );
        break;
      case 54: // Xe - Xenon flash
        let nextPower = position + 1;
        while (nextPower <= 100 && !this.elementPowers[nextPower]) {
          nextPower++;
        }
        if (nextPower <= 100) {
          this.positions[player] = nextPower;
        }
        return effect; // Returns to keep the current player's turn
      case 56: // Ba - Explosive reaction
        const randomEffect = Math.floor(Math.random() * 17) - 8;
        this.positions[player] = Math.max(
          1,
          Math.min(100, this.positions[player] + randomEffect)
        );
        break;
      case 58: // Ce - Rare earth boost
        this.positions[player] += 4;
        break;
      case 63: // Eu - Light up path
        this.positions[player] = Math.min(this.positions[player] + 8, 100);
        break;
      case 65: // Tb - Magnetic disruption
        this.positions[player] = Math.max(1, this.positions[player] - 4);
        this.positions[otherPlayer] = Math.max(
          1,
          this.positions[otherPlayer] - 4
        );
        this.updatePlayerPosition(otherPlayer);
        break;
      case 68: // Er - Laser power
        this.playerEffects = this.playerEffects || {};
        this.playerEffects[player] = { type: "double_movement", count: 2 };
        break;
      case 74: // W - Ultimate shield
        this.playerEffects = this.playerEffects || {};
        this.playerEffects[player] = { type: "immunity", count: 5 };
        break;
      case 78: // Pt - Catalyst
        this.playerEffects = this.playerEffects || {};
        this.playerEffects[player] = { type: "enhance_power" };
        break;
      case 79: // Au - Royal advance
        this.positions[player] = Math.min(this.positions[player] + 7, 100);
        break;
      case 80: // Hg - Toxic slowdown
        this.positions[player] = Math.max(1, this.positions[player] - 4);
        break;
      case 82: // Pb - Heavy metal poisoning
        this.positions[player] = Math.max(1, this.positions[player] - 10);
        break;
      case 88: // Ra - Radiation burst
        const powerCells = Object.keys(this.elementPowers).map(Number);
        const randomPowerCell =
          powerCells[Math.floor(Math.random() * powerCells.length)];
        this.positions[player] = randomPowerCell;
        break;
      case 92: // U - Nuclear chain reaction
        const dangerCells = Object.entries(this.elementPowers)
          .filter(([_, power]) => power.color === "red")
          .map(([pos]) => Number(pos));
        [player, otherPlayer].forEach((p) => {
          const nearestDanger = this.findClosestCell(
            this.positions[p],
            dangerCells
          );
          if (nearestDanger) {
            this.positions[p] = nearestDanger;
            this.updatePlayerPosition(p);
          }
        });
        break;
      case 94: // Pu - High risk teleport
        const risk = Math.random() > 0.5;
        const distance = risk ? -10 : 15;
        this.positions[player] = Math.max(
          1,
          Math.min(100, this.positions[player] + distance)
        );
        break;
      case 95: // Am - Radiation damage
        this.positions[otherPlayer] = Math.max(
          1,
          this.positions[otherPlayer] - 3
        );
        this.updatePlayerPosition(otherPlayer);
        break;
      case 98: // Cf - Safe shield
        this.playerEffects = this.playerEffects || {};
        this.playerEffects[player] = { type: "immunity", count: 2 };
        break;
      case 100: // Fm - Permanent immunity
        this.playerEffects = this.playerEffects || {};
        this.playerEffects[player] = { type: "permanent_immunity" };
        break;
    }

    this.updatePlayerPosition(player);
    return effect;
  }

  findClosestCell(position, cells) {
    return cells.reduce((closest, cell) => {
      if (!closest) return cell;
      return Math.abs(cell - position) < Math.abs(closest - position)
        ? cell
        : closest;
    }, null);
  }

  findClosestPower(position) {
    let closestPower = null;
    let minDistance = Infinity;
    for (let i = 1; i <= 100; i++) {
      if (this.elementPowers[i]) {
        let distance = Math.abs(i - position);
        if (distance < minDistance) {
          minDistance = distance;
          closestPower = i;
        }
      }
    }
    return closestPower;
  }

  startDiceBlinking() {
    const blinkDice = () => {
      const currentDice = document.querySelector(
        `#dice${this.currentPlayer} .dice`
      );
      currentDice.classList.toggle("dice-active");
    };

    setInterval(blinkDice, 1000);
  }

  async rollDice(player) {
    if (this.gameEnded) return;

    if (!this.audioInitialized) {
      await this.initializeAudio();
      this.audioInitialized = true;
    }

    if (player !== this.currentPlayer) {
      this.showPlayerMessage(player, "Not your turn!", "error");
      return;
    }

    this.rollAttempts[player]++;
    let roll;

    if (this.positions[player] === 0 && this.rollAttempts[player] >= 10) {
      roll = 1;
      this.rollAttempts[player] = 0;
    } else {
      roll = Math.floor(Math.random() * 6) + 1;
      // roll =  prompt("Enter a number berween 1 and 6");
      roll = parseInt(roll);
      console.log(roll);
    }

    this.playDiceSound();

    const diceElement = document.querySelector(`#dice${player} .dice`);
    diceElement.classList.add("rolling");
    setTimeout(() => {
      diceElement.innerHTML = `
                <i class="fas fa-dice-${
                  ["one", "two", "three", "four", "five", "six"][roll - 1]
                }"></i>
            `;
      diceElement.classList.remove("rolling");
    }, 800);

    let message = `Rolled a ${roll}`;
    let messageType = "";

    if (this.positions[player] === 0) {
      if (roll === 1) {
        this.positions[player] = 1;
        message = "Got 1! You're in the game!";
        messageType = "your-turn";
        this.updatePlayerPosition(player);
        this.checkAndApplyPower(player);
      } else {
        message = `Need 1 to start. Got ${roll}`;
        messageType = "need-one";
      }
    } else {
      const newPosition = this.positions[player] + roll;
      if (newPosition <= this.boardSize) {
        this.positions[player] = newPosition;
        this.updatePlayerPosition(player);
        const powerEffect = this.checkAndApplyPower(player);
        if (powerEffect) {
          message += `. ${powerEffect}`;
        }

        if (this.positions[player] === this.boardSize) {
          this.gameEnded = true;
          this.showWinner(player);
          return;
        }
      }
    }

    this.showPlayerMessage(player, message, messageType);

    if (roll === 1 || roll === 6) {
      this.showPlayerMessage(player, message + " Roll again!", "your-turn");
      return;
    }

    this.currentPlayer = player === 1 ? 2 : 1;
    this.showPlayerMessage(this.currentPlayer, "Your turn!", "your-turn");
  }

  updatePlayerPosition(player) {
    document.getElementById(`pos${player}`).textContent =
      this.positions[player];

    // Remove all player tokens
    document
      .querySelectorAll(`.player${player}-token`)
      .forEach((token) => token.remove());

    // Add token to new position
    if (this.positions[player] > 0) {
      const cell = document.querySelector(
        `[data-number="${this.positions[player]}"]`
      );
      const token = document.createElement("div");
      token.className = `player${player}-token`;
      cell.appendChild(token);
    }
  }

  showPlayerMessage(player, msg, type = "") {
    const messageEl = document.getElementById(`message${player}`);
    messageEl.textContent = msg;
    messageEl.className = "player-message";
    if (type) {
      messageEl.classList.add(type);
    }
    if (msg.includes("Activated")) {
      messageEl.classList.add("power-message");
      setTimeout(() => {
        messageEl.classList.remove("power-message");
      }, 500);
    }
  }

  showWinner(player) {
    const modal = document.createElement("div");
    modal.className = "winner-modal";
    modal.innerHTML = `
            <div class="winner-content">
                <h2>🎉 Player ${player} Wins! 🎉</h2>
                <p>Congratulations! You've mastered the Periodic Table!</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">Play Again</button>
            </div>
        `;
    document.body.appendChild(modal);

    // Play victory sound
    if (this.synth) {
      const melody = ["C4", "E4", "G4", "C5"];
      let delay = 0;
      melody.forEach((note) => {
        setTimeout(() => {
          this.synth.triggerAttackRelease(note, "8n");
        }, delay);
        delay += 200;
      });
    }
  }
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SnakeAndLadder();
});
