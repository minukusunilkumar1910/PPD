/**
 * ============================================================================
 * PERIODIC PRO — The Ultimate Chemical Race
 * Complete Game Engine, Full Elemental Powers System & Universal Responsive Controller
 * ============================================================================
 */

class PeriodicProGame {
  constructor() {
    this.boardSize = 100;
    this.currentPlayer = 1;
    this.gameMode = "2p"; // "2p" or "ai"
    this.positions = { 1: 0, 2: 0 };
    this.rollAttempts = { 1: 0, 2: 0 };
    this.isRolling = false;
    this.isMoving = false;
    this.gameEnded = false;
    this.soundEnabled = true;

    // Comprehensive Player Status Effects & Buffs
    this.playerStatus = {
      1: {
        shields: 0,
        rollMultiplier: 1,
        skipTurns: 0,
        extraTurn: false,
        enhancedNext: false,
      },
      2: {
        shields: 0,
        rollMultiplier: 1,
        skipTurns: 0,
        extraTurn: false,
        enhancedNext: false,
      },
    };

    // Battle Stats for Victory Screen
    this.stats = {
      totalRolls: { 1: 0, 2: 0 },
      powersHit: { 1: 0, 2: 0 },
      hazardsDodged: { 1: 0, 2: 0 },
    };

    // Load Periodic Database & Powers
    this.elementsData = this.getElementsDatabase();
    this.elementPowers = this.getElementPowers();

    // Audio Context Setup
    this.audioCtx = null;
    this.synth = null;
    this.initAudio();

    // Initialize Game Board & UI
    this.initBoard();
    this.setupEventListeners();
    this.updateHUD();
    this.logEvent("system", "Periodic Pro initialized. Roll a 1 to deploy your isotope into the arena!");

    // Check saved audio preference
    const savedSound = localStorage.getItem("periodicPro_sound");
    if (savedSound !== null) {
      this.soundEnabled = savedSound === "true";
      this.updateSoundButtonUI();
    }
  }

  /* ==========================================================================
     AUDIO ENGINE (Dual-tier: Tone.js + Native Web Audio Fallback)
     ========================================================================== */
  async initAudio() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
      if (window.Tone) {
        this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.synth.volume.value = -6;
      }
    } catch (e) {
      console.warn("Audio initialization error:", e);
    }
  }

  ensureAudioReady() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    if (window.Tone && Tone.context.state === "suspended") {
      Tone.start();
    }
  }

  playSound(type) {
    if (!this.soundEnabled) return;
    this.ensureAudioReady();

    try {
      if (this.synth && window.Tone && Tone.context.state === "running") {
        if (type === "roll") {
          this.synth.triggerAttackRelease("C3", "32n");
        } else if (type === "step") {
          this.synth.triggerAttackRelease("G4", "64n");
        } else if (type === "positive") {
          this.synth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "16n");
        } else if (type === "negative") {
          this.synth.triggerAttackRelease(["F3", "C3", "Ab2"], "8n");
        } else if (type === "tactical") {
          this.synth.triggerAttackRelease(["D4", "A4", "E5"], "16n");
        } else if (type === "shield") {
          this.synth.triggerAttackRelease(["F4", "Bb4", "D5"], "16n");
        } else if (type === "win") {
          const melody = [
            { note: "C4", time: 0 },
            { note: "E4", time: 150 },
            { note: "G4", time: 300 },
            { note: "C5", time: 450 },
            { note: "G4", time: 650 },
            { note: "C5", time: 800 },
          ];
          melody.forEach((item) => {
            setTimeout(() => this.synth.triggerAttackRelease(item.note, "8n"), item.time);
          });
        }
        return;
      }
    } catch (e) {
      // Fallback to Native Web Audio
    }

    // Native Web Audio Synthesizer fallback
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const playTone = (freq, duration, type = "sine", gainVal = 0.1) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    };

    if (type === "roll" || type === "step") {
      playTone(400, 0.04, "triangle", 0.08);
    } else if (type === "positive") {
      playTone(523.25, 0.1, "sine", 0.15);
      setTimeout(() => playTone(659.25, 0.15, "sine", 0.15), 80);
      setTimeout(() => playTone(783.99, 0.25, "sine", 0.15), 160);
    } else if (type === "negative") {
      playTone(180, 0.25, "sawtooth", 0.15);
      setTimeout(() => playTone(120, 0.35, "sawtooth", 0.15), 120);
    } else if (type === "tactical" || type === "shield") {
      playTone(587.33, 0.15, "square", 0.1);
      setTimeout(() => playTone(880, 0.25, "sine", 0.15), 100);
    } else if (type === "win") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        setTimeout(() => playTone(freq, 0.3, "sine", 0.2), idx * 160);
      });
    }
  }

  /* ==========================================================================
     PERIODIC TABLE DATABASE (1 to 100 Elements)
     ========================================================================== */
  getElementsDatabase() {
    const raw = [
      { num: 1, s: "H", n: "Hydrogen", cat: "nonmetal", m: "1.008", lore: "The first, lightest, and most abundant element in the cosmos." },
      { num: 2, s: "He", n: "Helium", cat: "noble", m: "4.002", lore: "Unreactive noble gas forged in stellar nuclear furnaces." },
      { num: 3, s: "Li", n: "Lithium", cat: "alkali", m: "6.94", lore: "Lightest metal, highly reactive with water, powers modern batteries." },
      { num: 4, s: "Be", n: "Beryllium", cat: "alkaline", m: "9.012", lore: "Lightweight aerospace metal forming precious emeralds." },
      { num: 5, s: "B", n: "Boron", cat: "metalloid", m: "10.81", lore: "Hard metalloid essential for heat-resistant borosilicate glass." },
      { num: 6, s: "C", n: "Carbon", cat: "nonmetal", m: "12.01", lore: "Basis of all organic chemistry, graphene, and diamonds." },
      { num: 7, s: "N", n: "Nitrogen", cat: "nonmetal", m: "14.01", lore: "Makes up 78% of Earth's atmosphere and crucial for amino acids." },
      { num: 8, s: "O", n: "Oxygen", cat: "nonmetal", m: "16.00", lore: "Vital oxidizer sustaining cellular respiration and combustion." },
      { num: 9, s: "F", n: "Fluorine", cat: "halogen", m: "19.00", lore: "Most electronegative element, aggressively reactive gas." },
      { num: 10, s: "Ne", n: "Neon", cat: "noble", m: "20.18", lore: "Inert gas glowing brilliant reddish-orange in discharge tubes." },
      { num: 11, s: "Na", n: "Sodium", cat: "alkali", m: "22.99", lore: "Soft alkali metal that burns violently in contact with moisture." },
      { num: 12, s: "Mg", n: "Magnesium", cat: "alkaline", m: "24.31", lore: "Burns with an intense, blinding white light; core of chlorophyll." },
      { num: 13, s: "Al", n: "Aluminium", cat: "post-transition", m: "26.98", lore: "Light, corrosion-resistant structural metal of aviation." },
      { num: 14, s: "Si", n: "Silicon", cat: "metalloid", m: "28.09", lore: "The semiconductor backbone of modern computer chips and quartz." },
      { num: 15, s: "P", n: "Phosphorus", cat: "nonmetal", m: "30.97", lore: "Crucial for DNA backbones and ATP energy storage in cells." },
      { num: 16, s: "S", n: "Sulfur", cat: "nonmetal", m: "32.06", lore: "Volcanic yellow nonmetal known for pungent sulfuric emissions." },
      { num: 17, s: "Cl", n: "Chlorine", cat: "halogen", m: "35.45", lore: "Yellow-green halogen gas used in disinfection and purification." },
      { num: 18, s: "Ar", n: "Argon", cat: "noble", m: "39.95", lore: "Abundant inert noble gas used as a protective thermal shield." },
      { num: 19, s: "K", n: "Potassium", cat: "alkali", m: "39.10", lore: "Essential electrolyte for nerve impulses and muscular function." },
      { num: 20, s: "Ca", n: "Calcium", cat: "alkaline", m: "40.08", lore: "Key structural mineral in human bones, shells, and limestone." },
      { num: 21, s: "Sc", n: "Scandium", cat: "transition", m: "44.96", lore: "Rare transition metal used in high-strength aerospace alloys." },
      { num: 22, s: "Ti", n: "Titanium", cat: "transition", m: "47.87", lore: "Corrosion-proof, biocompatible metal as strong as steel." },
      { num: 23, s: "V", n: "Vanadium", cat: "transition", m: "50.94", lore: "Hardens steel alloys; forms vividly colored toxic oxide states." },
      { num: 24, s: "Cr", n: "Chromium", cat: "transition", m: "52.00", lore: "Shiny chrome finish; imparts deep green to emeralds and red to rubies." },
      { num: 25, s: "Mn", n: "Manganese", cat: "transition", m: "54.94", lore: "Essential for photosynthesis and high-strength industrial steels." },
      { num: 26, s: "Fe", n: "Iron", cat: "transition", m: "55.85", lore: "Earth's magnetic dynamo core and the carrier of oxygen in blood." },
      { num: 27, s: "Co", n: "Cobalt", cat: "transition", m: "58.93", lore: "Magnetic metal producing brilliant cobalt blue pigments." },
      { num: 28, s: "Ni", n: "Nickel", cat: "transition", m: "58.69", lore: "Ferromagnetic metal known for polarity inversion in magnets." },
      { num: 29, s: "Cu", n: "Copper", cat: "transition", m: "63.55", lore: "Supreme thermal and electrical conductor with antimicrobial punch." },
      { num: 30, s: "Zn", n: "Zinc", cat: "transition", m: "65.38", lore: "Galvanizes steel against rust and vital for enzyme catalysis." },
      { num: 31, s: "Ga", n: "Gallium", cat: "post-transition", m: "69.72", lore: "Melts in the palm of human hands at 29.7°C." },
      { num: 32, s: "Ge", n: "Germanium", cat: "metalloid", m: "72.63", lore: "Pioneering semiconductor that enabled the first transistors." },
      { num: 33, s: "As", n: "Arsenic", cat: "metalloid", m: "74.92", lore: "Infamous historical toxic poison and bronze-age alloy additive." },
      { num: 34, s: "Se", n: "Selenium", cat: "nonmetal", m: "78.96", lore: "Photoconductive element that conducts electricity under light." },
      { num: 35, s: "Br", n: "Bromine", cat: "halogen", m: "79.90", lore: "Corrosive reddish-brown liquid halogen fuming noxious vapors." },
      { num: 36, s: "Kr", n: "Krypton", cat: "noble", m: "83.80", lore: "Noble gas used in high-intensity photographic strobe lamps." },
      { num: 37, s: "Rb", n: "Rubidium", cat: "alkali", m: "85.47", lore: "Spontaneously ignites in air, used in atomic quantum clocks." },
      { num: 38, s: "Sr", n: "Strontium", cat: "alkaline", m: "87.62", lore: "Produces brilliant crimson fire in celebratory pyrotechnics." },
      { num: 39, s: "Y", n: "Yttrium", cat: "transition", m: "88.91", lore: "Component of high-temperature YBCO superconductors." },
      { num: 40, s: "Zr", n: "Zirconium", cat: "transition", m: "91.22", lore: "Corrosion-resistant metal used for nuclear reactor fuel cladding." },
      { num: 41, s: "Nb", n: "Niobium", cat: "transition", m: "92.91", lore: "Superconducting metal utilized in MRI scanners and rocketry." },
      { num: 42, s: "Mo", n: "Molybdenum", cat: "transition", m: "95.95", lore: "Ultra-high melting point metal withstanding extreme furnace heat." },
      { num: 43, s: "Tc", n: "Technetium", cat: "transition", m: "98.00", lore: "First artificially created element; heavily used in medical imaging." },
      { num: 44, s: "Ru", n: "Ruthenium", cat: "transition", m: "101.1", lore: "Rare platinum-group catalyst with tremendous chemical activity." },
      { num: 45, s: "Rh", n: "Rhodium", cat: "transition", m: "102.9", lore: "One of the rarest, most expensive precious metals on Earth." },
      { num: 46, s: "Pd", n: "Palladium", cat: "transition", m: "106.4", lore: "Absorbs up to 900 times its own volume of hydrogen gas." },
      { num: 47, s: "Ag", n: "Silver", cat: "transition", m: "107.9", lore: "Highest electrical and thermal conductivity of all known elements." },
      { num: 48, s: "Cd", n: "Cadmium", cat: "transition", m: "112.4", lore: "Toxic heavy metal used in vintage rechargeable NiCad cells." },
      { num: 49, s: "In", n: "Indium", cat: "post-transition", m: "114.8", lore: "Creates indium tin oxide transparent conductive touchscreens." },
      { num: 50, s: "Sn", n: "Tin", cat: "post-transition", m: "118.7", lore: "Famous for the Tin Pest cryogenic decomposition phenomenon." },
      { num: 51, s: "Sb", n: "Antimony", cat: "metalloid", m: "121.8", lore: "Ancient eye cosmetic component and flame-retardant additive." },
      { num: 52, s: "Te", n: "Tellurium", cat: "metalloid", m: "127.6", lore: "Rare solar panel metalloid, forms chemical bonds with gold." },
      { num: 53, s: "I", n: "Iodine", cat: "halogen", m: "126.9", lore: "Sublimates directly from dark solid into brilliant purple vapor." },
      { num: 54, s: "Xe", n: "Xenon", cat: "noble", m: "131.3", lore: "Heavy noble gas fueling advanced ion propulsion engines in space." },
      { num: 55, s: "Cs", n: "Cesium", cat: "alkali", m: "132.9", lore: "Most reactive metal; its vibration defines the standard SI second." },
      { num: 56, s: "Ba", n: "Barium", cat: "alkaline", m: "137.3", lore: "Produces vibrant green fireworks; pyrotechnic flash propellant." },
      { num: 57, s: "La", n: "Lanthanum", cat: "lanthanide", m: "138.9", lore: "Namesake of the Lanthanide rare-earth series, used in camera optics." },
      { num: 58, s: "Ce", n: "Cerium", cat: "lanthanide", m: "140.1", lore: "Pyrophoric metal that sparks easily in lighter flints." },
      { num: 59, s: "Pr", n: "Praseodymium", cat: "lanthanide", m: "140.9", lore: "Gives glass a clear yellow-green tint and strengthens aircraft alloys." },
      { num: 60, s: "Nd", n: "Neodymium", cat: "lanthanide", m: "144.2", lore: "Powers the strongest permanent neodymium magnets in existence." },
      { num: 61, s: "Pm", n: "Promethium", cat: "lanthanide", m: "145.0", lore: "Only radioactive rare earth element, glows in nuclear batteries." },
      { num: 62, s: "Sm", n: "Samarium", cat: "lanthanide", m: "150.4", lore: "Retains magnetism at high temperatures in Samarium-Cobalt magnets." },
      { num: 63, s: "Eu", n: "Europium", cat: "lanthanide", m: "152.0", lore: "Brilliant red phosphors protecting Euro banknotes from counterfeiting." },
      { num: 64, s: "Gd", n: "Gadolinium", cat: "lanthanide", m: "157.3", lore: "Paramagnetic element used as an MRI enhancement contrast agent." },
      { num: 65, s: "Tb", n: "Terbium", cat: "lanthanide", m: "158.9", lore: "Changes shape under magnetic fields (giant magnetostriction)." },
      { num: 66, s: "Dy", n: "Dysprosium", cat: "lanthanide", m: "162.5", lore: "Absorbs thermal neutrons; vital for electric vehicle drive motors." },
      { num: 67, s: "Ho", n: "Holmium", cat: "lanthanide", m: "164.9", lore: "Boasts the highest magnetic flux of any chemical element." },
      { num: 68, s: "Er", n: "Erbium", cat: "lanthanide", m: "167.3", lore: "Dopes fiber-optic cables to amplify transoceanic internet laser pulses." },
      { num: 69, s: "Tm", n: "Thulium", cat: "lanthanide", m: "168.9", lore: "Extremely rare; used in portable medical X-ray machines." },
      { num: 70, s: "Yb", n: "Ytterbium", cat: "lanthanide", m: "173.0", lore: "Laser amplifier metal and premier candidate for optical atomic clocks." },
      { num: 71, s: "Lu", n: "Lutetium", cat: "lanthanide", m: "175.0", lore: "Densely packed heaviest lanthanide, used in PET cancer imaging." },
      { num: 72, s: "Hf", n: "Hafnium", cat: "transition", m: "178.5", lore: "Absorbs neutrons in nuclear submarine reactor control rods." },
      { num: 73, s: "Ta", n: "Tantalum", cat: "transition", m: "180.9", lore: "Immune to acid attacks; essential for miniature smartphone capacitors." },
      { num: 74, s: "W", n: "Tungsten", cat: "transition", m: "183.8", lore: "Highest melting point of any metal (3,422°C), ultimate heat armor." },
      { num: 75, s: "Re", n: "Rhenium", cat: "transition", m: "186.2", lore: "Reinforces jet engine turbine blades against extreme centrifugal shear." },
      { num: 76, s: "Os", n: "Osmium", cat: "transition", m: "190.2", lore: "The densest natural element on Earth (22.59 g/cm³)." },
      { num: 77, s: "Ir", n: "Iridium", cat: "transition", m: "192.2", lore: "Most corrosion-resistant metal; marked the dinosaur asteroid impact." },
      { num: 78, s: "Pt", n: "Platinum", cat: "transition", m: "195.1", lore: "Supreme catalyst of hydrogen fuel cells and industrial synthesis." },
      { num: 79, s: "Au", n: "Gold", cat: "transition", m: "197.0", lore: "Immortal noble metal, completely immune to atmospheric oxidation." },
      { num: 80, s: "Hg", n: "Mercury", cat: "transition", m: "200.6", lore: "Quicksilver: the only elemental metal that remains liquid at room temp." },
      { num: 81, s: "Tl", n: "Thallium", cat: "post-transition", m: "204.4", lore: "Insidiously toxic post-transition metal once called the poisoner's poison." },
      { num: 82, s: "Pb", n: "Lead", cat: "post-transition", m: "207.2", lore: "Heavy neurotoxic shield that halts radiation but ruins vitality." },
      { num: 83, s: "Bi", n: "Bismuth", cat: "post-transition", m: "209.0", lore: "Forms stunning iridescent geometric rainbow stair-step crystals." },
      { num: 84, s: "Po", n: "Polonium", cat: "post-transition", m: "209.0", lore: "Intensely radioactive alpha emitter discovered by Marie Curie." },
      { num: 85, s: "At", n: "Astatine", cat: "halogen", m: "210.0", lore: "Rarest natural element in Earth's crust (less than 1 gram exists)." },
      { num: 86, s: "Rn", n: "Radon", cat: "noble", m: "222.0", lore: "Heavy radioactive noble gas that seeps silently from bedrock." },
      { num: 87, s: "Fr", n: "Francium", cat: "alkali", m: "223.0", lore: "Hyper-unstable alkali metal; decays within minutes." },
      { num: 88, s: "Ra", n: "Radium", cat: "alkaline", m: "226.0", lore: "Historic glowing alkaline metal that glows faintly in the dark." },
      { num: 89, s: "Ac", n: "Actinium", cat: "actinide", m: "227.0", lore: "Glows with eerie blue light from its intense radioactivity." },
      { num: 90, s: "Th", n: "Thorium", cat: "actinide", m: "232.0", lore: "Abundant green nuclear fuel candidate for molten-salt reactors." },
      { num: 91, s: "Pa", n: "Protactinium", cat: "actinide", m: "231.0", lore: "Rare radioactive decay intermediate with high alpha toxicity." },
      { num: 92, s: "U", n: "Uranium", cat: "actinide", m: "238.0", lore: "Fissile actinide giant whose U-235 isotope unleashes atomic power." },
      { num: 93, s: "Np", n: "Neptunium", cat: "actinide", m: "237.0", lore: "First transuranic actinide produced in nuclear reactors." },
      { num: 94, s: "Pu", n: "Plutonium", cat: "actinide", m: "244.0", lore: "High-yield nuclear fuel and deep-space voyager RTG power source." },
      { num: 95, s: "Am", n: "Americium", cat: "actinide", m: "243.0", lore: "Synthetic actinide used worldwide in commercial ionization smoke alarms." },
      { num: 96, s: "Cm", n: "Curium", cat: "actinide", m: "247.0", lore: "Named in honor of Marie and Pierre Curie, powers Mars rover spectrometers." },
      { num: 97, s: "Bk", n: "Berkelium", cat: "actinide", m: "247.0", lore: "Synthesized at UC Berkeley by alpha bombardment of americium." },
      { num: 98, s: "Cf", n: "Californium", cat: "actinide", m: "251.0", lore: "Prolific neutron emitter used for scanning oil wells and igniting reactors." },
      { num: 99, s: "Es", n: "Einsteinium", cat: "actinide", m: "252.0", lore: "Discovered in the fallout debris of the first thermonuclear explosion." },
      { num: 100, s: "Fm", n: "Fermium", cat: "actinide", m: "257.0", lore: "The apex element synthesized via neutron capture. The crown of the race!" },
    ];

    const db = {};
    raw.forEach((item) => {
      db[item.num] = item;
    });
    return db;
  }

  /* ==========================================================================
     ELEMENT POWERS MATRIX (Complete Working Mechanics)
     ========================================================================== */
  getElementPowers() {
    return {
      3: {
        symbol: "Li",
        name: "Lithium Hydro-Burst",
        type: "positive",
        desc: "Alkali reaction propels you forward +5 to +10 spaces!",
        icon: "fas fa-water",
        badge: "⚡ BOOST",
      },
      6: {
        symbol: "C",
        name: "Carbon Catenation",
        type: "positive",
        desc: "Polymer chain slingshot leaps +9 spaces to tile #15!",
        icon: "fas fa-link",
        badge: "⚡ SLINGSHOT",
      },
      8: {
        symbol: "O",
        name: "Combustion Surge",
        type: "positive",
        desc: "Oxidizing blast grants +3 spaces AND an immediate EXTRA ROLL!",
        icon: "fas fa-fire",
        badge: "🔥 EXTRA ROLL",
      },
      9: {
        symbol: "F",
        name: "Fluorine Electronegativity",
        type: "negative",
        desc: "Hazard: Aggressive gas pulls player down to tile #4!",
        icon: "fas fa-radiation",
        badge: "☣️ TRAP",
      },
      12: {
        symbol: "Mg",
        name: "Magnesium Flare",
        type: "positive",
        desc: "Blinding combustion illuminates path: advance +4 spaces!",
        icon: "fas fa-sun",
        badge: "⚡ BOOST",
      },
      16: {
        symbol: "S",
        name: "Toxic Sulfide",
        type: "negative",
        desc: "Hazard: Choking volcanic fumes force a retreat of -3 spaces!",
        icon: "fas fa-smog",
        badge: "☣️ HAZARD",
      },
      17: {
        symbol: "Cl",
        name: "Chlorine Acid Cloud",
        type: "negative",
        desc: "Hazard: Corrosive vapor forces a retreat of -4 spaces!",
        icon: "fas fa-skull-crossbones",
        badge: "☣️ HAZARD",
      },
      20: {
        symbol: "Ca",
        name: "Bone Shield",
        type: "tactical",
        desc: "Calcified barrier grants +1 SHIELD to block the next hazard!",
        icon: "fas fa-shield-alt",
        badge: "🛡️ SHIELD",
      },
      23: {
        symbol: "V",
        name: "Toxic Vanadate",
        type: "negative",
        desc: "Hazard: Heavy metal oxide slows player back -5 spaces!",
        icon: "fas fa-biohazard",
        badge: "☣️ HAZARD",
      },
      26: {
        symbol: "Fe",
        name: "Magnetic Dynamo",
        type: "positive",
        desc: "Ferromagnetic pull propels you forward +4 spaces!",
        icon: "fas fa-magnet",
        badge: "⚡ BOOST",
      },
      28: {
        symbol: "Ni",
        name: "Magnetic Inversion",
        type: "tactical",
        desc: "Polarity reversal: SWAPS positions with your opponent!",
        icon: "fas fa-sync-alt",
        badge: "🔄 SWAP",
      },
      32: {
        symbol: "Ge",
        name: "Semiconductor Flow",
        type: "positive",
        desc: "Electron flow skips obstacles: leap forward +3 spaces!",
        icon: "fas fa-microchip",
        badge: "⚡ BOOST",
      },
      33: {
        symbol: "As",
        name: "Arsenic Poison",
        type: "negative",
        desc: "Hazard: Lethal toxin knocks player back -6 spaces!",
        icon: "fas fa-skull",
        badge: "☣️ HAZARD",
      },
      35: {
        symbol: "Br",
        name: "Bromine Corrosive",
        type: "tactical",
        desc: "Advance +2 and corrode opponent, knocking them back -3 spaces!",
        icon: "fas fa-flask",
        badge: "⚔️ ATTACK",
      },
      36: {
        symbol: "Kr",
        name: "Krypton Inert Bubble",
        type: "tactical",
        desc: "Noble gas shield grants +2 SHIELDS against upcoming hazards!",
        icon: "fas fa-shield-virus",
        badge: "🛡️ 2x SHIELD",
      },
      40: {
        symbol: "Zr",
        name: "Zirconium Nuclear Armor",
        type: "tactical",
        desc: "Reactor-grade refractory shield grants +2 SHIELDS!",
        icon: "fas fa-shield-alt",
        badge: "🛡️ 2x SHIELD",
      },
      44: {
        symbol: "Ru",
        name: "Ruthenium Catalytic Surge",
        type: "positive",
        desc: "Catalytic boost: your NEXT dice roll will be DOUBLED (2x)!",
        icon: "fas fa-bolt",
        badge: "⚡ 2x ROLL",
      },
      47: {
        symbol: "Ag",
        name: "Silver Superconductor",
        type: "positive",
        desc: "Zero electrical resistance launches player forward +5 spaces!",
        icon: "fas fa-bolt",
        badge: "⚡ BOOST",
      },
      50: {
        symbol: "Sn",
        name: "Tin Pest Cry",
        type: "tactical",
        desc: "Cryogenic freeze: freezes opponent, forcing them to SKIP NEXT TURN!",
        icon: "fas fa-snowflake",
        badge: "⏳ FREEZE",
      },
      53: {
        symbol: "I",
        name: "Iodine Sublimation",
        type: "positive",
        desc: "Sublimates into vapor, warping forward +4 to +8 spaces!",
        icon: "fas fa-wind",
        badge: "⚡ WARP",
      },
      54: {
        symbol: "Xe",
        name: "Xenon Flash Ionization",
        type: "positive",
        desc: "Strobe jump: warps to next positive cell + grants an EXTRA ROLL!",
        icon: "fas fa-meteor",
        badge: "🔥 WARP & ROLL",
      },
      56: {
        symbol: "Ba",
        name: "Barium Pyrotechnic Gamble",
        type: "tactical",
        desc: "Pyrotechnic flash: 50% chance forward +6, 50% chance back -4!",
        icon: "fas fa-bomb",
        badge: "🎲 GAMBLE",
      },
      58: {
        symbol: "Ce",
        name: "Cerium Spark",
        type: "positive",
        desc: "Pyrophoric spark accelerates player forward +4 spaces!",
        icon: "fas fa-sparkles",
        badge: "⚡ BOOST",
      },
      63: {
        symbol: "Eu",
        name: "Europium Phosphor Wave",
        type: "tactical",
        desc: "Blinding phosphor blast pushes opponent back -4 spaces!",
        icon: "fas fa-sun",
        badge: "⚔️ KNOCKBACK",
      },
      65: {
        symbol: "Tb",
        name: "Terbium Magnetostriction",
        type: "positive",
        desc: "Magnetic shape-shift propels player forward +5 spaces!",
        icon: "fas fa-forward",
        badge: "⚡ BOOST",
      },
      68: {
        symbol: "Er",
        name: "Erbium Fiber Laser",
        type: "positive",
        desc: "High-intensity amplified laser burst leaps forward +6 spaces!",
        icon: "fas fa-crosshairs",
        badge: "⚡ BOOST",
      },
      74: {
        symbol: "W",
        name: "Tungsten Super-Armor",
        type: "tactical",
        desc: "Highest melting point: grants +3 SHIELDS against hazards!",
        icon: "fas fa-shield-alt",
        badge: "🛡️ 3x SHIELD",
      },
      78: {
        symbol: "Pt",
        name: "Platinum Master Catalyst",
        type: "tactical",
        desc: "Supreme catalyst: boosts forward +5 spaces AND grants +1 SHIELD!",
        icon: "fas fa-gem",
        badge: "💎 CATALYST",
      },
      79: {
        symbol: "Au",
        name: "Royal Aurum",
        type: "positive",
        desc: "Noble metal perfection: sovereign advance of +7 spaces!",
        icon: "fas fa-crown",
        badge: "👑 ROYAL BOOST",
      },
      80: {
        symbol: "Hg",
        name: "Mercury Quicksilver Quagmire",
        type: "negative",
        desc: "Hazard: Dense liquid metal bogs down player: retreat -5 spaces!",
        icon: "fas fa-tint",
        badge: "☣️ HAZARD",
      },
      82: {
        symbol: "Pb",
        name: "Lead Poisoning Drop",
        type: "negative",
        desc: "Hazard: Massive toxic fall! Plunges player back -10 spaces!",
        icon: "fas fa-weight-hanging",
        badge: "☣️ MASSIVE DROP",
      },
      86: {
        symbol: "Rn",
        name: "Radon Infiltration",
        type: "negative",
        desc: "Hazard: Dense radioactive gas pushes player back -7 spaces!",
        icon: "fas fa-radiation-alt",
        badge: "☣️ HAZARD",
      },
      88: {
        symbol: "Ra",
        name: "Radium Quantum Leap",
        type: "tactical",
        desc: "Luminescent warp: teleports to a random lucky cell between 89 and 97!",
        icon: "fas fa-atom",
        badge: "✨ QUANTUM WARP",
      },
      92: {
        symbol: "U",
        name: "Uranium Nuclear Meltdown",
        type: "negative",
        desc: "Hazard: Critical meltdown! Catastrophic plunge back to tile #75!",
        icon: "fas fa-radiation",
        badge: "☣️ MELTDOWN",
      },
      94: {
        symbol: "Pu",
        name: "Plutonium Critical Mass",
        type: "tactical",
        desc: "Extreme gamble: 50% teleport to #99, 50% decay back to #84!",
        icon: "fas fa-biohazard",
        badge: "🎲 CRITICAL GAMBLE",
      },
      95: {
        symbol: "Am",
        name: "Americium Ionization Blast",
        type: "tactical",
        desc: "Sonic sensor shockwave knocks opponent tumbling back -5 spaces!",
        icon: "fas fa-bell",
        badge: "⚔️ KNOCKBACK",
      },
      98: {
        symbol: "Cf",
        name: "Californium Neutron Fortress",
        type: "tactical",
        desc: "Neutron barrier grants +2 SHIELDS for the final stretch to victory!",
        icon: "fas fa-shield-alt",
        badge: "🛡️ 2x SHIELD",
      },
      100: {
        symbol: "Fm",
        name: "Fermium Synthetic Apex",
        type: "positive",
        desc: "VICTORY! The 100th element synthesized. Champion of the arena!",
        icon: "fas fa-trophy",
        badge: "🏆 FINISH",
      },
    };
  }

  /* ==========================================================================
     BOARD INITIALIZATION & RENDERING
     ========================================================================== */
  initBoard() {
    const board = document.getElementById("game-board");
    if (!board) return;
    board.innerHTML = "";

    // Snake & Ladder serpentine pattern (row 9 to row 0)
    for (let row = 9; row >= 0; row--) {
      for (let col = 0; col < 10; col++) {
        let number;
        if (row % 2 === 0) {
          number = row * 10 + col + 1; // Left to right
        } else {
          number = (row + 1) * 10 - col; // Right to left
        }

        const element = this.elementsData[number];
        const power = this.elementPowers[number];

        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.number = number;
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", `Tile ${number}, ${element.name} (${element.s})`);

        // Category class
        if (element && element.cat) {
          cell.classList.add(`cat-${element.cat}`);
        }

        // Power styling
        if (power) {
          cell.classList.add(`power-${power.type}`);
        }
        if (number === 1) cell.classList.add("start-cell");
        if (number === 100) cell.classList.add("finish-cell");

        // Power badge icon
        let badgeHtml = "";
        if (power) {
          badgeHtml = `<div class="cell-power-badge"><i class="${power.icon}"></i></div>`;
        } else if (number === 1) {
          badgeHtml = `<div class="cell-power-badge" style="color:var(--p1-cyan)"><i class="fas fa-play"></i></div>`;
        }

        cell.innerHTML = `
          <div class="number">${number}</div>
          <div class="symbol">${element ? element.s : ""}</div>
          ${badgeHtml}
        `;

        // Click to view element card
        cell.addEventListener("click", () => this.showElementModal(number));

        board.appendChild(cell);
      }
    }

    this.renderTokens();
    this.populateCodexModal();
  }

  /* ==========================================================================
     TOKEN RENDERING & SMOOTH STEP-BY-STEP HOPPING
     ========================================================================== */
  renderTokens() {
    // Remove existing tokens
    document.querySelectorAll(".player-token").forEach((t) => t.remove());

    [1, 2].forEach((player) => {
      const pos = this.positions[player];
      if (pos > 0 && pos <= 100) {
        const cell = document.querySelector(`[data-number="${pos}"]`);
        if (cell) {
          const token = document.createElement("div");
          token.className = `player-token player${player}-token`;
          token.id = `token-p${player}`;
          token.innerHTML = `<i class="fas ${player === 1 ? "fa-atom" : "fa-biohazard"}"></i>`;

          // Handle offset if both are on the same cell
          if (this.positions[1] === this.positions[2] && this.positions[1] > 0) {
            if (player === 1) {
              token.style.left = "2px";
              token.style.bottom = "2px";
            } else {
              token.style.right = "2px";
              token.style.bottom = "2px";
            }
          }

          cell.appendChild(token);
        }
      }
    });
  }

  async movePlayerStepByStep(player, targetPos) {
    const startPos = this.positions[player];
    if (startPos === targetPos) return;

    this.isMoving = true;
    const isForward = targetPos > startPos;
    const stepDiff = Math.abs(targetPos - startPos);

    for (let i = 1; i <= stepDiff; i++) {
      const nextPos = isForward ? startPos + i : startPos - i;
      this.positions[player] = nextPos;
      this.renderTokens();

      const elem = this.elementsData[nextPos];
      const elemNameEl = document.getElementById(`p${player}-current-element`);
      if (elemNameEl && elem) {
        elemNameEl.textContent = `Hop: #${nextPos} ${elem.name} (${elem.s})`;
      }

      // Add prominent visual stepping glow on current tile
      const cell = document.querySelector(`[data-number="${nextPos}"]`);
      if (cell) {
        cell.classList.add("cell-stepping");
        setTimeout(() => cell.classList.remove("cell-stepping"), 380);
      }

      // Hop animation on current token
      const token = document.getElementById(`token-p${player}`);
      if (token) {
        token.classList.add("hopping");
        setTimeout(() => token.classList.remove("hopping"), 360);
      }

      this.playSound("step");
      this.updateHUD();
      // Slowed down hop delay so players can clearly observe every element visited
      await new Promise((r) => setTimeout(r, 420));
    }

    // Brief pause upon landing so player clearly sees final destination
    await new Promise((r) => setTimeout(r, 320));
    this.isMoving = false;
  }

  /* ==========================================================================
     CORE DICE ROLLING & TURN ORCHESTRATION
     ========================================================================== */
  async rollDice(player) {
    if (this.gameEnded || this.isRolling || this.isMoving) return;

    if (player !== this.currentPlayer) {
      this.showPlayerMessage(player, "Not your turn!", "error");
      return;
    }

    // Check if player is frozen / skipped
    if (this.playerStatus[player].skipTurns > 0) {
      this.playerStatus[player].skipTurns--;
      this.showPowerToast("tactical", `Player ${player} is frozen by Tin Pest! Turn passed.`);
      this.logEvent("power-tactical", `⏳ Player ${player} is frozen by Tin Pest and skipped their turn!`);
      this.showPlayerMessage(player, "Turn skipped due to freeze!", "error");
      this.playSound("negative");
      this.updateHUD();
      this.switchTurn();
      return;
    }

    this.isRolling = true;
    this.disableRollButtons(true);
    this.rollAttempts[player]++;
    this.stats.totalRolls[player]++;

    // Pity mechanic: guaranteed entry on 8th attempt if still at 0
    let roll;
    if (this.positions[player] === 0 && this.rollAttempts[player] >= 8) {
      roll = 1;
      this.rollAttempts[player] = 0;
    } else {
      roll = Math.floor(Math.random() * 6) + 1;
    }

    // Play rolling sound & animate 3D dice
    this.playSound("roll");
    this.animateDiceRoll(player, roll);

    await new Promise((resolve) => setTimeout(resolve, 800));

    // Check Multiplier Buff (e.g. Ruthenium x2)
    let effectiveMove = roll;
    let multiplierUsed = false;
    if (this.playerStatus[player].rollMultiplier > 1 && this.positions[player] > 0) {
      effectiveMove = roll * this.playerStatus[player].rollMultiplier;
      multiplierUsed = true;
      this.playerStatus[player].rollMultiplier = 1;
      this.logEvent("power-positive", `⚡ Player ${player}'s Catalytic Surge doubled the roll: ${roll} ➔ ${effectiveMove}!`);
      this.showPowerToast("positive", `Catalytic Surge! Roll doubled to ${effectiveMove}!`);
    }

    let rolledMsg = `Rolled a ${roll}${multiplierUsed ? ` (x2 = ${effectiveMove})` : ""}`;

    // Handle Entry (Position 0 -> 1)
    if (this.positions[player] === 0) {
      if (roll === 1) {
        this.positions[player] = 1;
        this.renderTokens();
        this.logEvent("roll", `🚀 Player ${player} rolled 1 and entered the arena at Hydrogen [#1]!`);
        this.showPlayerMessage(player, "Deployed to Hydrogen [#1]!", "your-turn");
        this.showPowerToast("positive", `Player ${player} deployed to Hydrogen (#1)!`);
        this.playSound("positive");

        // Player gets to roll again after rolling 1
        this.playerStatus[player].extraTurn = true;
      } else {
        rolledMsg += ". Need a 1 to deploy!";
        this.logEvent("roll", `🎲 Player ${player} rolled ${roll} (needs 1 to enter).`);
        this.showPlayerMessage(player, `Need 1 to enter. Got ${roll}.`, "error");
      }
    } else {
      // Normal Board Movement
      const targetPos = this.positions[player] + effectiveMove;

      if (targetPos <= this.boardSize) {
        this.logEvent("roll", `🎲 Player ${player} rolled ${roll}${multiplierUsed ? ` (doubled to ${effectiveMove})` : ""}. Advancing to tile #${targetPos}.`);
        await this.movePlayerStepByStep(player, targetPos);

        // Check for victory
        if (this.positions[player] === this.boardSize) {
          this.gameEnded = true;
          this.showWinner(player);
          return;
        }

        // Check & apply element power at destination
        await this.checkAndApplyPower(player);

        // Check victory again in case power pushed to 100
        if (this.positions[player] >= this.boardSize) {
          this.positions[player] = 100;
          this.renderTokens();
          this.gameEnded = true;
          this.showWinner(player);
          return;
        }
      } else {
        const overshoot = targetPos - this.boardSize;
        this.logEvent("roll", `🎲 Player ${player} rolled ${roll}, overshooting 100 by ${overshoot}. Stay in place.`);
        this.showPlayerMessage(player, `Overshot 100! Need exact roll.`, "error");
      }
    }

    this.isRolling = false;
    this.disableRollButtons(false);
    this.updateHUD();

    // Check Extra Turn rules (Roll of 6 or power extra turn)
    if (roll === 6 || this.playerStatus[player].extraTurn) {
      this.playerStatus[player].extraTurn = false;
      this.showPlayerMessage(player, `${rolledMsg}. ROLL AGAIN! ⚡`, "your-turn");
      this.logEvent("system", `⚡ Player ${player} earned an EXTRA ROLL!`);
      this.showPowerToast("positive", `Player ${player} rolls again!`);
      this.updateHUD();

      // If AI has extra roll, trigger AI
      if (this.gameMode === "ai" && this.currentPlayer === 2) {
        setTimeout(() => this.rollDice(2), 900);
      }
      return;
    }

    // Switch turn
    this.switchTurn();
  }

  switchTurn() {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    this.updateHUD();

    const otherMsg = this.currentPlayer === 1 ? "Player 1's Turn!" : (this.gameMode === "ai" ? "Chem-Bot is thinking..." : "Player 2's Turn!");
    this.showPlayerMessage(this.currentPlayer, otherMsg, "your-turn");

    // If vs AI and it's AI turn, auto roll
    if (this.gameMode === "ai" && this.currentPlayer === 2 && !this.gameEnded) {
      setTimeout(() => this.rollDice(2), 1000);
    }
  }

  animateDiceRoll(player, finalRoll) {
    const diceBox = document.getElementById(`dice${player}`);
    const diceFace = document.getElementById(`dice${player}-face`);
    const mobileDiceIcon = document.getElementById("m-dice-icon");

    if (diceBox) diceBox.classList.add("rolling");

    const diceIcons = ["one", "two", "three", "four", "five", "six"];

    // Rapid shuffle during rolling
    let shuffles = 0;
    const interval = setInterval(() => {
      const rand = Math.floor(Math.random() * 6);
      if (diceFace) diceFace.innerHTML = `<i class="fas fa-dice-${diceIcons[rand]}"></i>`;
      if (mobileDiceIcon) mobileDiceIcon.innerHTML = `<i class="fas fa-dice-${diceIcons[rand]}"></i>`;
      shuffles++;
      if (shuffles > 6) {
        clearInterval(interval);
        if (diceFace) diceFace.innerHTML = `<i class="fas fa-dice-${diceIcons[finalRoll - 1]}"></i>`;
        if (mobileDiceIcon) mobileDiceIcon.innerHTML = `<i class="fas fa-dice-${diceIcons[finalRoll - 1]}"></i>`;
        if (diceBox) diceBox.classList.remove("rolling");
      }
    }, 90);
  }

  /* ==========================================================================
     COMPLETE POWERS ENGINE & STATUS LOGIC
     ========================================================================== */
  async checkAndApplyPower(player) {
    const pos = this.positions[player];
    const power = this.elementPowers[pos];
    if (!power) return;

    this.stats.powersHit[player]++;
    const otherPlayer = player === 1 ? 2 : 1;
    const cell = document.querySelector(`[data-number="${pos}"]`);

    // Flash cell animation
    if (cell) {
      cell.classList.add(`power-trigger-${power.type}`);
      setTimeout(() => cell.classList.remove(`power-trigger-${power.type}`), 900);
    }

    // Check SHIELD defense for negative hazards
    if (power.type === "negative" && this.playerStatus[player].shields > 0) {
      this.playerStatus[player].shields--;
      this.stats.hazardsDodged[player]++;
      this.playSound("shield");
      this.showPowerToast("tactical", `🛡️ SHIELD DEPLOYED! Absorbed ${power.name}!`);
      this.logEvent("power-tactical", `🛡️ Player ${player}'s shield absorbed ${power.name} (${power.symbol})! No retreat taken.`);
      this.showPlayerMessage(player, `Shield absorbed ${power.symbol} hazard!`, "power-hit");
      this.updateHUD();
      return;
    }

    // Play appropriate sound & toast
    this.playSound(power.type);
    this.showPowerToast(power.type, `${power.symbol} ${power.name}: ${power.desc}`);
    this.logEvent(`power-${power.type}`, `⚡ [Tile ${pos}] Player ${player} triggered ${power.name} (${power.symbol}): ${power.desc}`);

    // POWER MECHANICS SWITCH
    switch (pos) {
      // 3: Li - Water reaction boost (+5 to +10)
      case 3: {
        const boost = Math.floor(Math.random() * 6) + 5;
        const target = Math.min(100, this.positions[player] + boost);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 6: C - Carbon bonds (+9 to 15)
      case 6: {
        await this.movePlayerStepByStep(player, 15);
        break;
      }

      // 8: O - Combustion boost (+3 & extra roll)
      case 8: {
        const target = Math.min(100, this.positions[player] + 3);
        await this.movePlayerStepByStep(player, target);
        this.playerStatus[player].extraTurn = true;
        break;
      }

      // 9: F - Fluorine trap (drops to 4)
      case 9: {
        await this.movePlayerStepByStep(player, 4);
        break;
      }

      // 12: Mg - Flare (+4)
      case 12: {
        const target = Math.min(100, this.positions[player] + 4);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 16: S - Toxic fumes (-3)
      case 16: {
        const target = Math.max(1, this.positions[player] - 3);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 17: Cl - Acid cloud (-4)
      case 17: {
        const target = Math.max(1, this.positions[player] - 4);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 20: Ca - Bone Shield (+1 shield)
      case 20: {
        this.playerStatus[player].shields += 1;
        break;
      }

      // 23: V - Toxic oxide (-5)
      case 23: {
        const target = Math.max(1, this.positions[player] - 5);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 26: Fe - Iron dynamo (+4)
      case 26: {
        const target = Math.min(100, this.positions[player] + 4);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 28: Ni - Magnetic Inversion (Swap positions!)
      case 28: {
        const p1Pos = this.positions[1];
        const p2Pos = this.positions[2];
        this.positions[1] = p2Pos;
        this.positions[2] = p1Pos;
        this.renderTokens();
        this.logEvent("power-tactical", `🔄 Nickel Polarity Swap! Player 1 is now at #${this.positions[1]}, Player 2 is at #${this.positions[2]}.`);
        break;
      }

      // 32: Ge - Semiconductor (+3)
      case 32: {
        const target = Math.min(100, this.positions[player] + 3);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 33: As - Arsenic Poison (-6)
      case 33: {
        const target = Math.max(1, this.positions[player] - 6);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 35: Br - Corrosive Vapor (Self +2, Opponent -3)
      case 35: {
        const targetSelf = Math.min(100, this.positions[player] + 2);
        await this.movePlayerStepByStep(player, targetSelf);
        if (this.positions[otherPlayer] > 1) {
          const targetOther = Math.max(1, this.positions[otherPlayer] - 3);
          await this.movePlayerStepByStep(otherPlayer, targetOther);
        }
        break;
      }

      // 36: Kr - Krypton Barrier (+2 shields)
      case 36: {
        this.playerStatus[player].shields += 2;
        break;
      }

      // 40: Zr - Nuclear Armor (+2 shields)
      case 40: {
        this.playerStatus[player].shields += 2;
        break;
      }

      // 44: Ru - Catalytic Surge (Next roll 2x)
      case 44: {
        this.playerStatus[player].rollMultiplier = 2;
        break;
      }

      // 47: Ag - Superconductor (+5)
      case 47: {
        const target = Math.min(100, this.positions[player] + 5);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 50: Sn - Tin Pest Cry (Opponent skips turn)
      case 50: {
        this.playerStatus[otherPlayer].skipTurns += 1;
        break;
      }

      // 53: I - Sublimation Teleport (+4 to +8)
      case 53: {
        const leap = Math.floor(Math.random() * 5) + 4;
        const target = Math.min(100, this.positions[player] + leap);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 54: Xe - Xenon Strobe (Warp to next positive cell + extra roll)
      case 54: {
        let nextPos = pos + 1;
        while (nextPos < 100 && (!this.elementPowers[nextPos] || this.elementPowers[nextPos].type !== "positive")) {
          nextPos++;
        }
        if (nextPos <= 100) {
          await this.movePlayerStepByStep(player, nextPos);
        }
        this.playerStatus[player].extraTurn = true;
        break;
      }

      // 56: Ba - Pyrotechnic Gamble (50% +6, 50% -4)
      case 56: {
        const isLucky = Math.random() > 0.5;
        const diff = isLucky ? 6 : -4;
        const target = Math.max(1, Math.min(100, this.positions[player] + diff));
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 58: Ce - Cerium Spark (+4)
      case 58: {
        const target = Math.min(100, this.positions[player] + 4);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 63: Eu - Europium Phosphor Wave (Opponent -4)
      case 63: {
        if (this.positions[otherPlayer] > 1) {
          const target = Math.max(1, this.positions[otherPlayer] - 4);
          await this.movePlayerStepByStep(otherPlayer, target);
        }
        break;
      }

      // 65: Tb - Terbium Surge (+5)
      case 65: {
        const target = Math.min(100, this.positions[player] + 5);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 68: Er - Laser Pulse (+6)
      case 68: {
        const target = Math.min(100, this.positions[player] + 6);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 74: W - Tungsten Armor (+3 shields)
      case 74: {
        this.playerStatus[player].shields += 3;
        break;
      }

      // 78: Pt - Platinum Master Catalyst (+5 & +1 shield)
      case 78: {
        this.playerStatus[player].shields += 1;
        const target = Math.min(100, this.positions[player] + 5);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 79: Au - Royal Aurum (+7)
      case 79: {
        const target = Math.min(100, this.positions[player] + 7);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 80: Hg - Quicksilver Quagmire (-5)
      case 80: {
        const target = Math.max(1, this.positions[player] - 5);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 82: Pb - Lead Poisoning (-10)
      case 82: {
        const target = Math.max(1, this.positions[player] - 10);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 86: Rn - Radon Infiltration (-7)
      case 86: {
        const target = Math.max(1, this.positions[player] - 7);
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 88: Ra - Luminescent Warp (teleport to random 89-97)
      case 88: {
        const luckyTarget = Math.floor(Math.random() * 9) + 89;
        await this.movePlayerStepByStep(player, luckyTarget);
        break;
      }

      // 92: U - Nuclear Meltdown (drop back to 75)
      case 92: {
        await this.movePlayerStepByStep(player, 75);
        break;
      }

      // 94: Pu - Critical Mass Gamble (50% to 99, 50% to 84)
      case 94: {
        const lucky = Math.random() > 0.5;
        const target = lucky ? 99 : 84;
        await this.movePlayerStepByStep(player, target);
        break;
      }

      // 95: Am - Ionization Blast (Opponent -5)
      case 95: {
        if (this.positions[otherPlayer] > 1) {
          const target = Math.max(1, this.positions[otherPlayer] - 5);
          await this.movePlayerStepByStep(otherPlayer, target);
        }
        break;
      }

      // 98: Cf - Neutron Fortress (+2 shields)
      case 98: {
        this.playerStatus[player].shields += 2;
        break;
      }
    }

    this.updateHUD();
  }

  /* ==========================================================================
     HEADS-UP DISPLAY (HUD) & REAL-TIME STATE SYNC
     ========================================================================== */
  updateHUD() {
    // Positions & Progress Bars
    [1, 2].forEach((p) => {
      const pos = this.positions[p];
      const elem = this.elementsData[pos];

      // Desktop panels
      const posEl = document.getElementById(`pos${p}`);
      if (posEl) posEl.innerHTML = `${pos}<span class="pos-max">/100</span>`;

      const barEl = document.getElementById(`p${p}-progress-bar`);
      if (barEl) barEl.style.width = `${pos}%`;

      const elemNameEl = document.getElementById(`p${p}-current-element`);
      if (elemNameEl) {
        elemNameEl.textContent = pos === 0 ? "Standing at Start" : `#${pos} ${elem ? elem.name : ""} (${elem ? elem.s : ""})`;
      }

      // Mobile player deck
      const mPosVal = document.getElementById(`m-pos${p}-val`);
      if (mPosVal) mPosVal.textContent = pos;

      const mPos = document.getElementById(`m-pos${p}`);
      if (mPos) mPos.textContent = pos;

      // Status Badges (Desktop & Mobile)
      this.renderStatusBadges(p);
    });

    // Active Player Panels & Highlights
    const panel1 = document.getElementById("panel-player-1");
    const panel2 = document.getElementById("panel-player-2");
    const mCard1 = document.getElementById("m-card-1");
    const mCard2 = document.getElementById("m-card-2");
    const turnPill = document.getElementById("turn-pill");
    const turnPillText = document.getElementById("turn-pill-text");
    const mobileBtn = document.getElementById("btn-mobile-roll");
    const mobileTurnPlayer = document.getElementById("mobile-turn-player");

    // Dice & Button DOM references
    const dice1 = document.getElementById("dice1");
    const dice2 = document.getElementById("dice2");
    const btn1 = document.getElementById("btn-roll-1");
    const btn2 = document.getElementById("btn-roll-2");
    const dice1Hint = document.getElementById("dice1-hint");
    const dice2Hint = document.getElementById("dice2-hint");

    if (this.currentPlayer === 1) {
      if (panel1) panel1.classList.add("active");
      if (panel2) panel2.classList.remove("active");
      if (mCard1) mCard1.classList.add("active");
      if (mCard2) mCard2.classList.remove("active");

      // Player 1 Dice & Button Blinking / Highlight
      if (dice1) {
        dice1.classList.add("dice-active-p1");
        dice1.classList.remove("dice-inactive-turn", "dice-active-p2");
      }
      if (btn1) {
        btn1.classList.add("btn-active-p1");
        btn1.classList.remove("btn-inactive-turn", "btn-active-p2");
        btn1.disabled = false;
      }
      if (dice1Hint) {
        dice1Hint.textContent = "⚡ YOUR TURN — Click or Spacebar!";
        dice1Hint.classList.add("hint-active-p1");
      }

      // Player 2 Deactivated
      if (dice2) {
        dice2.classList.remove("dice-active-p2", "dice-active-p1");
        dice2.classList.add("dice-inactive-turn");
      }
      if (btn2) {
        btn2.classList.remove("btn-active-p2", "btn-active-p1");
        btn2.classList.add("btn-inactive-turn");
        btn2.disabled = true;
      }
      if (dice2Hint) {
        dice2Hint.textContent = "Waiting for Player 1...";
        dice2Hint.classList.remove("hint-active-p2");
      }

      if (turnPill) {
        turnPill.className = "turn-status-pill p1-active";
        turnPillText.textContent = "Player 1's Turn";
      }
      if (mobileBtn) {
        mobileBtn.className = "mobile-roll-btn btn-active-p1";
        document.getElementById("mobile-btn-text").textContent = "P1: ROLL DICE";
      }
      if (mobileTurnPlayer) mobileTurnPlayer.textContent = "Player 1";
    } else {
      if (panel1) panel1.classList.remove("active");
      if (panel2) panel2.classList.add("active");
      if (mCard1) mCard1.classList.remove("active");
      if (mCard2) mCard2.classList.add("active");

      // Player 1 Deactivated
      if (dice1) {
        dice1.classList.remove("dice-active-p1", "dice-active-p2");
        dice1.classList.add("dice-inactive-turn");
      }
      if (btn1) {
        btn1.classList.remove("btn-active-p1", "btn-active-p2");
        btn1.classList.add("btn-inactive-turn");
        btn1.disabled = true;
      }
      if (dice1Hint) {
        dice1Hint.textContent = "Waiting for Player 2...";
        dice1Hint.classList.remove("hint-active-p1");
      }

      // Player 2 Dice & Button Blinking / Highlight
      if (dice2) {
        dice2.classList.add("dice-active-p2");
        dice2.classList.remove("dice-inactive-turn", "dice-active-p1");
      }
      if (btn2) {
        btn2.classList.add("btn-active-p2");
        btn2.classList.remove("btn-inactive-turn", "btn-active-p1");
        btn2.disabled = this.gameMode === "ai";
      }
      if (dice2Hint) {
        dice2Hint.textContent = this.gameMode === "ai" ? "🤖 Chem-Bot rolling..." : "⚡ YOUR TURN — Click or Spacebar!";
        dice2Hint.classList.add("hint-active-p2");
      }

      const p2Label = this.gameMode === "ai" ? "Chem-Bot's Turn" : "Player 2's Turn";
      if (turnPill) {
        turnPill.className = "turn-status-pill p2-active";
        turnPillText.textContent = p2Label;
      }
      if (mobileBtn) {
        mobileBtn.className = "mobile-roll-btn turn-p2 btn-active-p2";
        document.getElementById("mobile-btn-text").textContent = this.gameMode === "ai" ? "AI ROLLING..." : "P2: ROLL DICE";
      }
      if (mobileTurnPlayer) mobileTurnPlayer.textContent = this.gameMode === "ai" ? "Chem-Bot" : "Player 2";
    }
  }

  renderStatusBadges(player) {
    const status = this.playerStatus[player];
    const badgesHtml = [];

    if (status.shields > 0) {
      badgesHtml.push(`<span class="status-badge badge-shield"><i class="fas fa-shield-alt"></i> ${status.shields} Shield${status.shields > 1 ? "s" : ""}</span>`);
    }
    if (status.rollMultiplier > 1) {
      badgesHtml.push(`<span class="status-badge badge-double"><i class="fas fa-bolt"></i> 2x Next Roll</span>`);
    }
    if (status.skipTurns > 0) {
      badgesHtml.push(`<span class="status-badge badge-frozen"><i class="fas fa-snowflake"></i> Frozen</span>`);
    }
    if (status.extraTurn) {
      badgesHtml.push(`<span class="status-badge badge-extra"><i class="fas fa-redo"></i> Extra Roll</span>`);
    }

    const htmlString = badgesHtml.length > 0 ? badgesHtml.join("") : '<span class="badge-empty">No active buffs</span>';

    const desktopEl = document.getElementById(`p${player}-status-badges`);
    if (desktopEl) desktopEl.innerHTML = htmlString;

    const mobileEl = document.getElementById(`m-badges${player}`);
    if (mobileEl) {
      mobileEl.innerHTML = badgesHtml.length > 0 ? badgesHtml.join("") : "";
    }
  }

  disableRollButtons(disabled) {
    const btn1 = document.getElementById("btn-roll-1");
    const btn2 = document.getElementById("btn-roll-2");
    const mBtn = document.getElementById("btn-mobile-roll");

    if (btn1) btn1.disabled = disabled || this.currentPlayer !== 1;
    if (btn2) btn2.disabled = disabled || this.currentPlayer !== 2 || this.gameMode === "ai";
    if (mBtn) mBtn.disabled = disabled || (this.gameMode === "ai" && this.currentPlayer === 2);
  }

  showPlayerMessage(player, msg, type = "") {
    const messageEl = document.getElementById(`message${player}`);
    if (!messageEl) return;
    messageEl.textContent = msg;
    messageEl.className = "player-message-box";
    if (type) messageEl.classList.add(type);
  }

  showPowerToast(type, text) {
    const toast = document.getElementById("power-toast");
    const toastText = document.getElementById("power-toast-text");
    if (!toast || !toastText) return;

    toast.className = `power-toast-banner toast-${type} active`;
    toastText.textContent = text;

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove("active");
    }, 3500);
  }

  logEvent(type, text) {
    const logBody = document.getElementById("battle-log");
    const countEl = document.getElementById("log-count");
    if (!logBody) return;

    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;

    const now = new Date();
    const timeStr = `[${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}]`;

    entry.innerHTML = `<span class="log-time">${timeStr}</span> ${text}`;
    logBody.appendChild(entry);
    logBody.scrollTop = logBody.scrollHeight;

    if (countEl) {
      countEl.textContent = `${logBody.children.length} events`;
    }
  }

  /* ==========================================================================
     MODALS & DIALOGS
     ========================================================================== */
  showElementModal(number) {
    const elem = this.elementsData[number];
    const power = this.elementPowers[number];
    if (!elem) return;

    const modal = document.getElementById("element-modal");
    if (!modal) return;

    document.getElementById("elem-modal-number").textContent = `#${elem.num}`;
    document.getElementById("elem-modal-symbol").textContent = elem.s;
    document.getElementById("elem-modal-name").textContent = elem.n;
    document.getElementById("elem-modal-category").textContent = `${elem.cat} • Atomic Mass: ${elem.m}`;
    document.getElementById("elem-lore-text").textContent = elem.lore;

    const powerBox = document.getElementById("elem-power-box");
    const powerBadge = document.getElementById("elem-power-badge");
    const powerDesc = document.getElementById("elem-power-desc");

    if (power) {
      powerBox.style.display = "block";
      powerBadge.textContent = `${power.badge}: ${power.name}`;
      powerBadge.style.color = power.type === "positive" ? "var(--power-positive)" : (power.type === "negative" ? "var(--power-negative)" : "var(--power-tactical)");
      powerDesc.textContent = power.desc;
    } else {
      powerBox.style.display = "block";
      powerBadge.textContent = "STANDARD ELEMENT NODE";
      powerBadge.style.color = "#94a3b8";
      powerDesc.textContent = "A stable stepping stone in the chemical lattice. No elemental hazard or boost present.";
    }

    modal.style.display = "flex";
  }

  populateCodexModal() {
    const list = document.getElementById("codex-list-container");
    if (!list) return;

    const powers = this.elementPowers;
    const sortedKeys = Object.keys(powers).map(Number).sort((a, b) => a - b);

    list.innerHTML = "";
    sortedKeys.forEach((num) => {
      const p = powers[num];
      const elem = this.elementsData[num];

      const item = document.createElement("div");
      item.className = "codex-item";
      item.dataset.type = p.type;
      item.dataset.search = `${p.symbol} ${p.name} ${elem ? elem.n : ""} ${p.desc}`.toLowerCase();

      const badgeColor = p.type === "positive" ? "var(--power-positive)" : (p.type === "negative" ? "var(--power-negative)" : "var(--power-tactical)");

      item.innerHTML = `
        <div class="codex-badge" style="background: rgba(255,255,255,0.06); border: 1px solid ${badgeColor}; color: ${badgeColor};">
          <div>${p.symbol}</div>
          <div class="codex-badge-num">#${num}</div>
        </div>
        <div class="codex-info">
          <div class="codex-name">
            ${elem ? elem.n : p.symbol} — ${p.name}
            <span class="codex-tag" style="background: rgba(255,255,255,0.08); color: ${badgeColor};">${p.badge}</span>
          </div>
          <div class="codex-desc">${p.desc}</div>
        </div>
      `;

      list.appendChild(item);
    });
  }

  showWinner(player) {
    this.playSound("win");

    // Launch Confetti Celebration
    if (window.confetti) {
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      const fire = (particleRatio, opts) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }

    const winnerName = player === 1 ? "PLAYER 1" : (this.gameMode === "ai" ? "CHEM-BOT" : "PLAYER 2");
    document.getElementById("winner-headline").textContent = `🎉 ${winnerName} WINS! 🎉`;
    document.getElementById("stat-total-rolls").textContent = this.stats.totalRolls[player];
    document.getElementById("stat-powers-used").textContent = this.stats.powersHit[player];
    document.getElementById("stat-hazards-dodged").textContent = this.stats.hazardsDodged[player];

    const modal = document.getElementById("winner-modal");
    if (modal) modal.style.display = "flex";

    this.logEvent("system", `🏆 Match completed! ${winnerName} has conquered the Periodic Table!`);
  }

  /* ==========================================================================
     EVENT LISTENERS & CONTROLS SETUP
     ========================================================================== */
  setupEventListeners() {
    // Dice Click Listeners
    const dice1 = document.getElementById("dice1");
    const dice2 = document.getElementById("dice2");
    const btnRoll1 = document.getElementById("btn-roll-1");
    const btnRoll2 = document.getElementById("btn-roll-2");
    const mobileBtnRoll = document.getElementById("btn-mobile-roll");

    if (dice1) dice1.addEventListener("click", () => this.rollDice(1));
    if (dice2) dice2.addEventListener("click", () => this.rollDice(2));
    if (btnRoll1) btnRoll1.addEventListener("click", () => this.rollDice(1));
    if (btnRoll2) btnRoll2.addEventListener("click", () => this.rollDice(2));
    if (mobileBtnRoll) mobileBtnRoll.addEventListener("click", () => this.rollDice(this.currentPlayer));

    // Keyboard Spacebar & Enter Shortcut
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        const activeModal = document.querySelector(".app-modal-backdrop[style*='flex']");
        if (!activeModal) {
          e.preventDefault();
          this.rollDice(this.currentPlayer);
        }
      }
    });

    // Game Mode Toggle Buttons
    const btnMode2P = document.getElementById("btn-mode-2p");
    const btnModeAI = document.getElementById("btn-mode-ai");

    if (btnMode2P) {
      btnMode2P.addEventListener("click", () => {
        if (this.gameMode === "2p") return;
        this.gameMode = "2p";
        btnMode2P.classList.add("active");
        btnModeAI.classList.remove("active");
        document.getElementById("p2-name").textContent = "Player 2";
        document.getElementById("p2-type-badge").textContent = "Crimson Rad";
        document.getElementById("m-name2").textContent = "Player 2";
        this.logEvent("system", "Switched game mode to 2-Player Local Pass & Play.");
        this.updateHUD();
      });
    }

    if (btnModeAI) {
      btnModeAI.addEventListener("click", () => {
        if (this.gameMode === "ai") return;
        this.gameMode = "ai";
        btnModeAI.classList.add("active");
        btnMode2P.classList.remove("active");
        document.getElementById("p2-name").textContent = "Chem-Bot";
        document.getElementById("p2-type-badge").textContent = "Autonomous AI";
        document.getElementById("m-name2").textContent = "Chem-Bot";
        this.logEvent("system", "Switched game mode to Player 1 vs Chem-Bot AI!");
        this.updateHUD();

        if (this.currentPlayer === 2 && !this.gameEnded) {
          setTimeout(() => this.rollDice(2), 800);
        }
      });
    }

    // Sound Toggle Button
    const btnSound = document.getElementById("btn-sound");
    if (btnSound) {
      btnSound.addEventListener("click", () => {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem("periodicPro_sound", String(this.soundEnabled));
        this.updateSoundButtonUI();
        if (this.soundEnabled) this.playSound("positive");
      });
    }

    // Reset Match Button
    const btnReset = document.getElementById("btn-reset");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        if (confirm("Reset current match and restart at Hydrogen (#1)?")) {
          this.resetGame();
        }
      });
    }

    // Close Modals
    const closeElemBtn = document.getElementById("btn-close-element-modal");
    if (closeElemBtn) {
      closeElemBtn.addEventListener("click", () => {
        document.getElementById("element-modal").style.display = "none";
      });
    }

    const elemModal = document.getElementById("element-modal");
    if (elemModal) {
      elemModal.addEventListener("click", (e) => {
        if (e.target === elemModal) elemModal.style.display = "none";
      });
    }

    // Codex Open & Close
    const btnCodex = document.getElementById("btn-codex");
    const codexModal = document.getElementById("codex-modal");
    const closeCodexBtn = document.getElementById("btn-close-codex-modal");

    if (btnCodex) {
      btnCodex.addEventListener("click", () => {
        if (codexModal) codexModal.style.display = "flex";
      });
    }
    if (closeCodexBtn) {
      closeCodexBtn.addEventListener("click", () => {
        if (codexModal) codexModal.style.display = "none";
      });
    }
    if (codexModal) {
      codexModal.addEventListener("click", (e) => {
        if (e.target === codexModal) codexModal.style.display = "none";
      });
    }

    // Codex Filter Tabs
    document.querySelectorAll(".codex-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".codex-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this.filterCodexList();
      });
    });

    // Codex Search Input
    const searchInput = document.getElementById("codex-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", () => this.filterCodexList());
    }

    // Victory Replay Button
    const btnPlayAgain = document.getElementById("btn-play-again");
    if (btnPlayAgain) {
      btnPlayAgain.addEventListener("click", () => {
        document.getElementById("winner-modal").style.display = "none";
        this.resetGame();
      });
    }

    // Event Log Collapse / Expand
    const logHeader = document.getElementById("log-header-toggle");
    const logBody = document.getElementById("battle-log");
    const logChevron = document.getElementById("log-chevron");
    if (logHeader && logBody) {
      logHeader.addEventListener("click", () => {
        logBody.classList.toggle("collapsed");
        if (logChevron) {
          logChevron.className = logBody.classList.contains("collapsed") ? "fas fa-chevron-down" : "fas fa-chevron-up";
        }
      });
    }
  }

  filterCodexList() {
    const activeTab = document.querySelector(".codex-tab.active");
    const filterType = activeTab ? activeTab.dataset.filter : "all";
    const searchVal = (document.getElementById("codex-search-input")?.value || "").toLowerCase().trim();

    document.querySelectorAll(".codex-item").forEach((item) => {
      const matchesType = filterType === "all" || item.dataset.type === filterType;
      const matchesSearch = !searchVal || item.dataset.search.includes(searchVal);
      item.style.display = matchesType && matchesSearch ? "flex" : "none";
    });
  }

  updateSoundButtonUI() {
    const icon = document.getElementById("sound-icon");
    if (!icon) return;
    if (this.soundEnabled) {
      icon.className = "fas fa-volume-up";
      icon.parentElement.style.color = "var(--p1-cyan)";
    } else {
      icon.className = "fas fa-volume-mute";
      icon.parentElement.style.color = "#64748b";
    }
  }

  resetGame() {
    this.positions = { 1: 0, 2: 0 };
    this.rollAttempts = { 1: 0, 2: 0 };
    this.currentPlayer = 1;
    this.isRolling = false;
    this.isMoving = false;
    this.gameEnded = false;

    this.playerStatus = {
      1: { shields: 0, rollMultiplier: 1, skipTurns: 0, extraTurn: false, enhancedNext: false },
      2: { shields: 0, rollMultiplier: 1, skipTurns: 0, extraTurn: false, enhancedNext: false },
    };

    this.stats = {
      totalRolls: { 1: 0, 2: 0 },
      powersHit: { 1: 0, 2: 0 },
      hazardsDodged: { 1: 0, 2: 0 },
    };

    this.renderTokens();
    this.updateHUD();
    this.showPlayerMessage(1, "Game reset. Roll a 1 to deploy!", "your-turn");
    this.showPlayerMessage(2, "Awaiting turn...");
    this.logEvent("system", "🔄 Match restarted. Elements reset to ground zero!");
  }
}

// Bootstrap Game on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  window.gameInstance = new PeriodicProGame();
});
