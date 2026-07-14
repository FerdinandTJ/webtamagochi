(function () {
  "use strict";

  const STORAGE_KEY = "retro-web-tamago-state-v1";
  const SAVE_INTERVAL_MS = 5000;
  const TICK_MS = 1000;
  const OFFLINE_STEP_MS = 5 * 60 * 1000;
  const IDB_NAME = "retro-web-tamago-db";
  const IDB_STORE = "saves";
  const IDB_SAVE_KEY = "current";
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const APP_VERSION = "1.2.0";

  const RULES = {
    hungerDecayMs: 5 * MINUTE,
    happinessDecayMs: 6 * MINUTE,
    awakeEnergyDecayMs: 4 * MINUTE,
    sleepEnergyGainMs: 10 * 1000,
    sleepHungerDecayMs: 4 * HOUR,
    sleepHappinessDecayMs: 5 * HOUR,
    poopAfterMealMs: 4 * MINUTE,
    ageStepMs: DAY,
    sicknessCheckMs: 8 * MINUTE,
    deathAfterCriticalMs: 24 * HOUR,
    disciplineCallMs: 12 * MINUTE,
  };

  const DAILY_REFILL = {
    meal: 4,
    snack: 4,
    treat: 1,
    medicine: 2,
  };

  const SHOP_ITEMS = {
    meal: {
      label: "MEAL",
      cost: 2,
      stockKey: "meal",
    },
    snack: {
      label: "SNACK",
      cost: 3,
      stockKey: "snack",
    },
    medicine: {
      label: "MED",
      cost: 5,
      stockKey: "medicine",
    },
  };

  const PET_TYPES = {
    sprout: {
      label: "SPROUT",
      energy: 85,
      happiness: 4,
      weight: 10,
      personality: "balanced",
    },
    dino: {
      label: "DINO",
      energy: 90,
      happiness: 3,
      weight: 12,
      personality: "playful",
    },
    panda: {
      label: "PANDA",
      energy: 78,
      happiness: 4,
      weight: 11,
      personality: "sleepy",
    },
    bunny: {
      label: "BUNNY",
      energy: 82,
      happiness: 4,
      weight: 9,
      personality: "social",
    },
    shiba: {
      label: "SHIBA",
      energy: 84,
      happiness: 3,
      weight: 12,
      personality: "stubborn",
    },
    jelly: {
      label: "JELLY",
      energy: 88,
      happiness: 4,
      weight: 8,
      personality: "gentle",
    },
  };

  const dom = {
    clock: document.getElementById("clockDisplay"),
    message: document.getElementById("messageDisplay"),
    attention: document.getElementById("attentionLight"),
    screen: document.getElementById("screen"),
    pet: document.getElementById("pixelPet"),
    poopLayer: document.getElementById("poopLayer"),
    selectPanel: document.getElementById("selectPanel"),
    onboardingPanel: document.getElementById("onboardingPanel"),
    foodPanel: document.getElementById("foodPanel"),
    foodCoinDisplay: document.getElementById("foodCoinDisplay"),
    mealButton: document.getElementById("mealButton"),
    snackButton: document.getElementById("snackButton"),
    treatButton: document.getElementById("treatButton"),
    shopPanel: document.getElementById("shopPanel"),
    gamePanel: document.getElementById("gamePanel"),
    gamePrompt: document.getElementById("gamePrompt"),
    logPanel: document.getElementById("logPanel"),
    settingsPanel: document.getElementById("settingsPanel"),
    rhythmDisplay: document.getElementById("rhythmDisplay"),
    statusPanel: document.getElementById("statusPanel"),
    manualPanel: document.getElementById("manualPanel"),
    aboutPanel: document.getElementById("aboutPanel"),
    hungerMeter: document.getElementById("hungerMeter"),
    happinessMeter: document.getElementById("happinessMeter"),
    energyBar: document.getElementById("energyBar"),
  };

  const SPRITES = {
    idleA: [
      "0000011111000000",
      "0001111111110000",
      "0011111111111000",
      "0111101111011100",
      "0111111111111100",
      "1110111111101110",
      "1111111111111110",
      "1111011110111110",
      "0111110001111100",
      "0011111111111000",
      "0001111111110000",
      "0000111111100000",
      "0000110001100000",
      "0001100000110000",
      "0011000000011000",
      "0000000000000000",
    ],
    idleB: [
      "0000011111000000",
      "0001111111110000",
      "0011111111111000",
      "0111011110111100",
      "0111111111111100",
      "1110111111101110",
      "1111111111111110",
      "1111101111011110",
      "0111110001111100",
      "0011111111111000",
      "0001111111110000",
      "0000111111100000",
      "0001100000110000",
      "0000110001100000",
      "0000011001000000",
      "0000000000000000",
    ],
    sad: [
      "0000011111000000",
      "0001111111110000",
      "0011111111111000",
      "0111011110111100",
      "0111111111111100",
      "1110111111101110",
      "1111111111111110",
      "1111110001111110",
      "0111101110111100",
      "0011011111011000",
      "0001111111110000",
      "0000111111100000",
      "0000100000100000",
      "0001000000010000",
      "0010000000001000",
      "0000000000000000",
    ],
    sick: [
      "0000011111000000",
      "0001111111110000",
      "0011111111111000",
      "0110111111011000",
      "0111111111111100",
      "1101111111110110",
      "1111111111111110",
      "1111001111001110",
      "0111111111111100",
      "0011100000111000",
      "0001111111110000",
      "0000111111100000",
      "0010110001101000",
      "0001100000110000",
      "0011000000011000",
      "0000000000000000",
    ],
    sleep: [
      "0000000000001110",
      "0000000000011000",
      "0000000000111110",
      "0000000000000000",
      "0000011111000000",
      "0001111111110000",
      "0011111111111000",
      "0111111111111100",
      "0111101111011100",
      "1111111111111110",
      "1111111111111110",
      "0111110001111100",
      "0011111111111000",
      "0000111111100000",
      "0001100000110000",
      "0000000000000000",
    ],
    dead: [
      "0000000000000000",
      "0011000000001100",
      "0001100000011000",
      "0000110000110000",
      "0000011001100000",
      "0000001111000000",
      "0000001111000000",
      "0000011001100000",
      "0000110000110000",
      "0001100000011000",
      "0011000000001100",
      "0000000000000000",
      "0001111111110000",
      "0010000000001000",
      "0001111111110000",
      "0000000000000000",
    ],
    happy: [
      "0000011111000000",
      "0001111111110000",
      "0011111111111000",
      "0111011110111100",
      "0111111111111100",
      "1110111111101110",
      "1111111111111110",
      "1111000000111110",
      "0110111111011100",
      "0011011110111000",
      "0001110001110000",
      "0000111111100000",
      "0001100000110000",
      "0011000000011000",
      "0000000000000000",
      "0000000000000000",
    ],
    babyA: [
      "0000000000000000",
      "0000001110000000",
      "0000011111000000",
      "0000111111100000",
      "0001110111110000",
      "0001111110110000",
      "0001111111110000",
      "0000111001100000",
      "0000011111000000",
      "0000001110000000",
      "0000011011000000",
      "0000110001100000",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000",
    ],
    babyB: [
      "0000000000000000",
      "0000001110000000",
      "0000011111000000",
      "0000111111100000",
      "0001111101110000",
      "0001110111110000",
      "0001111111110000",
      "0000111001100000",
      "0000011111000000",
      "0000001110000000",
      "0000110110000000",
      "0001100011000000",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000",
    ],
    teenA: [
      "0000001111000000",
      "0000111111110000",
      "0001111111111000",
      "0011110111101100",
      "0011111111111100",
      "0110111111101110",
      "0111111111111110",
      "0011111001111100",
      "0001111111111000",
      "0000111111110000",
      "0000011111100000",
      "0000110110110000",
      "0001100000011000",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000",
    ],
    teenB: [
      "0000001111000000",
      "0000111111110000",
      "0001111111111000",
      "0011101111011100",
      "0011111111111100",
      "0110111111101110",
      "0111111111111110",
      "0011111001111100",
      "0001111111111000",
      "0000111111110000",
      "0000011111100000",
      "0001101101100000",
      "0011000000001100",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000",
    ],
    championA: [
      "0000010000100000",
      "0000011111100000",
      "0001111111111000",
      "0011111111111100",
      "0111011110111110",
      "0111111111111110",
      "1110111111101111",
      "1111111111111111",
      "0111100001111110",
      "0011111111111100",
      "0001111111111000",
      "0000111111110000",
      "0001100110011000",
      "0011000000001100",
      "0110000000000110",
      "0000000000000000",
    ],
    championB: [
      "0000001001000000",
      "0000011111100000",
      "0001111111111000",
      "0011111111111100",
      "0111101111011110",
      "0111111111111110",
      "1110111111101111",
      "1111111111111111",
      "0111100001111110",
      "0011111111111100",
      "0001111111111000",
      "0000111111110000",
      "0011001100110000",
      "0110000000000110",
      "0001100000011000",
      "0000000000000000",
    ],
    heavyA: [
      "0000111111100000",
      "0011111111111000",
      "0111111111111100",
      "1111011110111110",
      "1111111111111110",
      "1110111111101111",
      "1111111111111111",
      "1111110001111111",
      "0111111111111110",
      "0011111111111100",
      "0001111111111000",
      "0000111111110000",
      "0000110000110000",
      "0001100000011000",
      "0000000000000000",
      "0000000000000000",
    ],
    heavyB: [
      "0000111111100000",
      "0011111111111000",
      "0111111111111100",
      "1111101111011110",
      "1111111111111110",
      "1110111111101111",
      "1111111111111111",
      "1111110001111111",
      "0111111111111110",
      "0011111111111100",
      "0001111111111000",
      "0000111111110000",
      "0001100000011000",
      "0000110000110000",
      "0000000000000000",
      "0000000000000000",
    ],
  };

  const COLOR_PALETTE = {
    K: "#06150f",
    W: "#fff8ef",
    H: "#fff1a6",
    R: "#ff6f9f",
    N: "#161616",
    G: "#bde95d",
    g: "#7db33b",
    L: "#e5ff8d",
    D: "#2f6b2e",
    B: "#56c9ef",
    b: "#a9ecff",
    C: "#2e8fc0",
    O: "#f2a51f",
    o: "#ffd56a",
    M: "#6e86ad",
    m: "#a7c6ef",
    P: "#f9a3ca",
    p: "#ffd3e6",
    Y: "#f7d86b",
    V: "#c9b8ff",
  };

  const COLOR_SPRITES = {
    sprout: [
      "..........KKKK..........",
      "........KKGGGGKK........",
      ".......KGGLLGGGK........",
      "......KGGLLLGGGGK.......",
      ".......KGGGGGGGK........",
      ".........KKGGKK.........",
      "...........GG...........",
      "........KKKGGKKK........",
      "......KKGGGGGGGGKK......",
      ".....KGGGGGGGGGGGGK.....",
      "....KGGGGGGGGGGGGGGK....",
      "...KGGGGGGGGGGGGGGGGK...",
      "...KGGGGKGGGGGGKGGGGK...",
      "..KGGGGKKGGGGGGKKGGGGK..",
      "..KGGGGRRGGGGGGRRGGGGK..",
      "..KGGGGGGGKKGGGGGGGGGK..",
      "..KGGGGGGKRRKGGGGGGGGK..",
      "...KGGGGGGKKGGGGGGGGK...",
      "...KGGGGHHHHHHGGGGGGK...",
      "....KGGGHHHHHHGGGGGK....",
      ".....KKGGGGGGGGGGKK.....",
      "......KGGK....KGGK......",
      "......KKK......KKK......",
      "........................",
    ],
    dino: [
      "........................",
      "...........KKK..........",
      ".........KKBBBKK........",
      "........KBBBBBBBK.......",
      ".......KBBBBKBBBK.......",
      "......KBBBBBBBBBBK......",
      ".....KBBbBBBBBBBBK......",
      "....KBBBBBBBBBBBBK......",
      "....KBBBBBBBBBBBBKKK....",
      "...KBBBBBBBBBBBBBBBK....",
      "...KBBBBBBBBBBBBBBBK....",
      "...KBBBBBBBBBBBBBBK.....",
      "....KBBBBBBBBBBBBK......",
      ".....KBBBBBBBBBBBK......",
      "......KBBBBBBBBBBKK.....",
      ".......KBBBBBBBBBBK.....",
      ".......KBBBBBBBBBCKK....",
      "......KBBBBBBKKKCCCK....",
      ".....KBBBBBK....KKK.....",
      ".....KBBKK..............",
      ".....KKK...............",
      "........................",
      "........................",
      "........................",
    ],
    panda: [
      "........................",
      ".....KKK..........KKK...",
      "....KNNNK........KNNNK..",
      "...KNNNNK........KNNNNK.",
      "...KNNKKKKKKKKKKKKKNNK.",
      "....KKWWWWWWWWWWWWKKK..",
      "....KWWWWWWWWWWWWWWK...",
      "...KWWWNNWWWWWWNNWWWK..",
      "...KWWWNNWWWWWWNNWWWK..",
      "...KWWWWWWWWWWWWWWWWK..",
      "...KWWWWWWKWWWKWWWWWK..",
      "...KWWWWWWKKKKWWWWWWK..",
      "...KWWRWWWWKKWWWWRWWK..",
      "....KWWRWWWWWWWWRWWK...",
      ".....KWWWWWWWWWWWWK....",
      "......KWWWWWWWWWWK.....",
      ".....KWWWWWWWWWWWWK....",
      "....KWWWK......KWWWK...",
      "....KKKK........KKKK...",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
    ],
    bunny: [
      ".....KKK......KKK.......",
      "....KWWWK....KWWWK......",
      "...KWWPWWK..KWWPWWK.....",
      "...KWWPWWK..KWWPWWK.....",
      "...KWWWWWK..KWWWWWK.....",
      "....KWWWK....KWWWK......",
      ".....KWWKKKKKKWWK.......",
      "....KWWWWWWWWWWWWK......",
      "...KWWWWWWWWWWWWWWK.....",
      "...KWWWKWWWWWWKWWWK.....",
      "...KWWWKWWWWWWKWWWK.....",
      "...KWWWWWWWWWWWWWWK.....",
      "...KWWRWWWWWWWWRWWK.....",
      "....KWWWWKKKKWWWWK......",
      ".....KWWWK..KWWWK.......",
      "....KWWWWWWWWWWWWK......",
      "...KWWWWWWWWWWWWWWK.....",
      "...KWWK........KWWK.....",
      "...KKK..........KKK.....",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
    ],
    shiba: [
      "........................",
      "....KKK..........KKK....",
      "...KOOOK........KOOOK...",
      "..KOOOOOKKKKKKKKOOOOOK..",
      "..KOOOOOOOOOOOOOOOOOOK..",
      ".KOOOOOOOOOOOOOOOOOOOOK.",
      ".KOOOOKOOOOOOOOOOKOOOOK.",
      ".KOOOOKOOOOOOOOOOKOOOOK.",
      ".KOOOOOOOOOOOOOOOOOOOOK.",
      ".KOOOOROOOOOOOOROOOOOK.",
      "..KOOOOOOOKKKOOOOOOOK...",
      "...KOOOOWWWWWWOOOOK....",
      "....KOOOWWWWWWWOOK.....",
      ".....KOOWWWWWWWOK......",
      "......KOWWWWWWWK.......",
      ".....KOOOOOOOOOOK......",
      "....KOOOK....KOOOK.....",
      "....KKK......KKK.......",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
    ],
    jelly: [
      "........................",
      "........................",
      ".......KKKKKKKKK........",
      ".....KKBBBBBBBBBKK......",
      "....KBBBBBBBBBBBBBK.....",
      "...KBBBBBBBBBBBBBBBK....",
      "..KBBBBBBBBBBBBBBBBBK...",
      "..KBBBBBBBBBBBBBBBBBK...",
      ".KBBBBBBKBBBBBKBBBBBBK..",
      ".KBBBBBBKBBBBBKBBBBBBK..",
      ".KBBBBBBBBBBBBBBBBBBBK..",
      "..KBBBBBBBBKBBBBBBBBK...",
      "...KBBBBBBBBBBBBBBBK....",
      "....KKBBBBBBBBBBBKK.....",
      "......KBBKBBKBBK.......",
      "......KBBKBBKBBK.......",
      "......KK.KK.KK.........",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
    ],
  };

  const timers = {
    tick: null,
    save: null,
    animationFrame: 0,
    flashUntil: 0,
  };

  let state = loadState();
  let activePanel = state.petType ? null : "select";
  let gameRound = null;
  let audioContext = null;
  let idbPromise = null;
  let backupRestorePending = !state.petType;

  function createLogbook() {
    return {
      bestAge: 0,
      gamesWon: 0,
      sicknessCount: 0,
      deaths: 0,
      bestEvolution: "baby",
    };
  }

  function createNewState(now = Date.now()) {
    return {
      version: 1,
      hunger: 4,
      happiness: 4,
      energy: 85,
      health: "healthy",
      discipline: 0,
      weight: 10,
      coins: 0,
      petType: null,
      petName: "",
      personality: "balanced",
      age: 0,
      poopCount: 0,
      isSleeping: false,
      isDead: false,
      attention: false,
      needsDiscipline: false,
      soundEnabled: true,
      onboardingSeen: false,
      notificationsEnabled: false,
      lastNotificationAt: 0,
      rhythm: {
        wakeHour: 8,
        sleepHour: 22,
      },
      inventory: {
        ...DAILY_REFILL,
        lastRefillDay: getDayStamp(now),
      },
      events: [],
      logbook: createLogbook(),
      mealsSincePoop: 0,
      lastMealTimestamp: 0,
      criticalSince: null,
      bornTimestamp: now,
      lastSavedTimestamp: now,
      accumulators: {
        hunger: 0,
        happiness: 0,
        energyAwake: 0,
        energySleep: 0,
        sickness: 0,
        age: 0,
        disciplineCall: 0,
        rhythmPenalty: 0,
      },
      message: "READY",
    };
  }

  function loadState() {
    const now = Date.now();
    const raw = readLocalSave();
    if (!raw) {
      return createNewState(now);
    }

    try {
      const loaded = normalizeState(JSON.parse(raw), now);
      applyOfflineTime(loaded, Math.max(0, now - loaded.lastSavedTimestamp));
      loaded.lastSavedTimestamp = now;
      loaded.message = loaded.isDead ? "DEAD" : "WELCOME";
      return loaded;
    } catch (error) {
      console.warn("Failed to load Tamagotchi state. Starting new game.", error);
      return createNewState(now);
    }
  }

  function readLocalSave() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Local save unavailable.", error);
      return null;
    }
  }

  function normalizeState(input, now) {
    const fresh = createNewState(now);
    const merged = {
      ...fresh,
      ...input,
      accumulators: {
        ...fresh.accumulators,
        ...(input.accumulators || {}),
      },
    };

    merged.hunger = clamp(Math.floor(merged.hunger), 0, 4);
    merged.happiness = clamp(Math.floor(merged.happiness), 0, 4);
    merged.energy = clamp(Math.round(merged.energy), 0, 100);
    merged.discipline = clamp(Math.round(merged.discipline), 0, 100);
    merged.weight = Math.max(1, Math.round(merged.weight));
    merged.coins = clamp(Math.floor(merged.coins || 0), 0, 999);
    merged.petType = normalizePetType(merged.petType);
    merged.petName = merged.petType ? PET_TYPES[merged.petType].label : "";
    merged.personality = merged.petType ? PET_TYPES[merged.petType].personality : "balanced";
    merged.age = Math.max(0, Math.floor(merged.age));
    merged.poopCount = clamp(Math.floor(merged.poopCount), 0, 4);
    merged.health = merged.health === "sick" ? "sick" : "healthy";
    merged.needsDiscipline = Boolean(merged.needsDiscipline);
    merged.soundEnabled = input.soundEnabled !== false;
    merged.onboardingSeen = Boolean(input.onboardingSeen);
    merged.notificationsEnabled = Boolean(input.notificationsEnabled);
    merged.lastNotificationAt = Number(input.lastNotificationAt) || 0;
    merged.rhythm = normalizeRhythm(input.rhythm);
    merged.inventory = normalizeInventory(input.inventory, now);
    merged.events = normalizeEvents(input.events);
    merged.logbook = normalizeLogbook(input.logbook);
    merged.lastSavedTimestamp = Number(merged.lastSavedTimestamp) || now;
    merged.bornTimestamp = Number(merged.bornTimestamp) || now;
    merged.lastMealTimestamp = Number(merged.lastMealTimestamp) || 0;
    merged.criticalSince = Number(merged.criticalSince) || null;
    merged.mealsSincePoop = Math.max(0, Math.floor(merged.mealsSincePoop || 0));
    return merged;
  }

  function normalizeRhythm(input = {}) {
    return {
      wakeHour: clamp(Number(input.wakeHour) || 8, 0, 23),
      sleepHour: clamp(Number(input.sleepHour) || 22, 0, 23),
    };
  }

  function normalizeInventory(input = {}, now = Date.now()) {
    return {
      meal: clamp(Math.floor(input.meal ?? DAILY_REFILL.meal), 0, 9),
      snack: clamp(Math.floor(input.snack ?? DAILY_REFILL.snack), 0, 9),
      treat: clamp(Math.floor(input.treat ?? DAILY_REFILL.treat), 0, 9),
      medicine: clamp(Math.floor(input.medicine ?? DAILY_REFILL.medicine), 0, 9),
      lastRefillDay: input.lastRefillDay || getDayStamp(now),
    };
  }

  function normalizeEvents(input = []) {
    return Array.isArray(input) ? input.slice(0, 12).filter((event) => event && event.text && event.time) : [];
  }

  function normalizeLogbook(input = {}) {
    const fresh = createLogbook();
    return {
      ...fresh,
      ...input,
      bestAge: Math.max(0, Math.floor(input.bestAge || 0)),
      gamesWon: Math.max(0, Math.floor(input.gamesWon || 0)),
      sicknessCount: Math.max(0, Math.floor(input.sicknessCount || 0)),
      deaths: Math.max(0, Math.floor(input.deaths || 0)),
      bestEvolution: typeof input.bestEvolution === "string" ? input.bestEvolution : fresh.bestEvolution,
    };
  }

  function normalizePetType(type) {
    const legacyMap = {
      mame: "sprout",
      kuchi: "dino",
      mimi: "bunny",
      robo: "jelly",
    };
    const normalized = legacyMap[type] || type;
    return PET_TYPES[normalized] ? normalized : null;
  }

  function saveState() {
    state.lastSavedTimestamp = Date.now();
    const serialized = JSON.stringify(state);
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.warn("Local save failed.", error);
    }
    saveIndexedBackup(JSON.parse(serialized));
  }

  function openSaveDb() {
    if (typeof indexedDB === "undefined") {
      return Promise.reject(new Error("IndexedDB unavailable"));
    }

    if (idbPromise) {
      return idbPromise;
    }

    idbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(IDB_NAME, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
      request.onblocked = () => reject(new Error("IndexedDB blocked"));
    });

    idbPromise.catch(() => {
      idbPromise = null;
    });

    return idbPromise;
  }

  function saveIndexedBackup(snapshot) {
    if (!snapshot || typeof indexedDB === "undefined") {
      return;
    }

    if (backupRestorePending && !snapshot.petType) {
      return;
    }

    openSaveDb()
      .then((db) => new Promise((resolve, reject) => {
        const transaction = db.transaction(IDB_STORE, "readwrite");
        transaction.objectStore(IDB_STORE).put(snapshot, IDB_SAVE_KEY);
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error || new Error("IndexedDB save failed"));
      }))
      .catch((error) => {
        console.warn("Backup save failed.", error);
      });
  }

  function readIndexedBackup() {
    if (typeof indexedDB === "undefined") {
      return Promise.resolve(null);
    }

    return openSaveDb()
      .then((db) => new Promise((resolve, reject) => {
        const transaction = db.transaction(IDB_STORE, "readonly");
        const request = transaction.objectStore(IDB_STORE).get(IDB_SAVE_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error("IndexedDB read failed"));
      }))
      .catch((error) => {
        console.warn("Backup restore failed.", error);
        return null;
      });
  }

  function restoreIndexedBackupIfNeeded() {
    if (state.petType) {
      backupRestorePending = false;
      return;
    }

    readIndexedBackup().then((backup) => {
      backupRestorePending = false;
      if (!backup || !backup.petType || state.petType) {
        return;
      }

      const now = Date.now();
      const restored = normalizeState(backup, now);
      applyOfflineTime(restored, Math.max(0, now - restored.lastSavedTimestamp));
      restored.lastSavedTimestamp = now;
      restored.message = restored.isDead ? "DEAD" : "SAVE BACK";
      state = restored;
      activePanel = state.petType ? null : "select";
      saveState();
      render();
    });
  }

  function getDayStamp(now = Date.now()) {
    return new Date(now).toISOString().slice(0, 10);
  }

  function addEvent(text, now = Date.now(), target = state) {
    const time = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    target.events = [{ time, text }, ...(target.events || [])].slice(0, 12);
  }

  function refillInventoryIfNeeded(target, now = Date.now()) {
    const today = getDayStamp(now);
    if (target.inventory.lastRefillDay === today) {
      return;
    }

    target.inventory = {
      ...target.inventory,
      meal: Math.max(target.inventory.meal || 0, DAILY_REFILL.meal),
      snack: Math.max(target.inventory.snack || 0, DAILY_REFILL.snack),
      treat: Math.max(target.inventory.treat || 0, DAILY_REFILL.treat),
      medicine: Math.max(target.inventory.medicine || 0, DAILY_REFILL.medicine),
      lastRefillDay: today,
    };
    addEvent("Daily items refilled", now, target);
  }

  function isNaturalSleepTime(target, now = Date.now()) {
    const hour = new Date(now).getHours();
    const { wakeHour, sleepHour } = target.rhythm;
    if (sleepHour === wakeHour) return false;
    if (sleepHour > wakeHour) {
      return hour >= sleepHour || hour < wakeHour;
    }
    return hour >= sleepHour && hour < wakeHour;
  }

  function maybeNotify(reason) {
    if (!state.notificationsEnabled || typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }

    const now = Date.now();
    if (now - state.lastNotificationAt < 30 * MINUTE) {
      return;
    }

    state.lastNotificationAt = now;
    try {
      new Notification("Retro Web Tamagotchi", { body: reason });
    } catch (error) {
      state.notificationsEnabled = false;
    }
  }

  function applyOfflineTime(target, elapsedMs) {
    if (!target.petType || !elapsedMs || target.isDead) {
      return target;
    }

    target.message = formatOfflineMessage(elapsedMs);
    let remainingMs = elapsedMs;
    let cursor = target.lastSavedTimestamp;
    while (remainingMs > 0 && !target.isDead) {
      const stepMs = Math.min(remainingMs, OFFLINE_STEP_MS);
      cursor += stepMs;
      advanceState(target, stepMs, cursor);
      remainingMs -= stepMs;
    }
    return target;
  }

  function advanceState(target, elapsedMs, now = Date.now()) {
    if (!target.petType || target.isDead || elapsedMs <= 0) {
      return;
    }

    refillInventoryIfNeeded(target, now);
    applyAge(target, elapsedMs);
    applyHunger(target, elapsedMs);
    applyHappiness(target, elapsedMs);
    applyEnergy(target, elapsedMs);
    applyPoop(target, now);
    applyHealth(target, elapsedMs);
    applyDisciplineCall(target, elapsedMs);
    applyDailyRhythm(target, elapsedMs, now);
    applyDeath(target, elapsedMs, now);
    updateAttention(target);
  }

  function applyAge(target, elapsedMs) {
    target.accumulators.age += elapsedMs;
    const gained = consumeSteps(target.accumulators, "age", RULES.ageStepMs);
    if (gained > 0) {
      target.age += gained;
      updateLogbook(target);
    }
  }

  function applyHunger(target, elapsedMs) {
    target.accumulators.hunger += elapsedMs;
    const hungryMultiplier = target.personality === "gentle" ? 1.25 : target.personality === "playful" ? 0.9 : 1;
    const interval = (target.isSleeping ? RULES.sleepHungerDecayMs : RULES.hungerDecayMs) * hungryMultiplier;
    const loss = consumeSteps(target.accumulators, "hunger", interval);
    if (loss > 0) {
      const before = target.hunger;
      target.hunger = clamp(target.hunger - loss, 0, 4);
      if (before > 0 && target.hunger === 0) addEvent("Pet got hungry", Date.now(), target);
    }
  }

  function applyHappiness(target, elapsedMs) {
    target.accumulators.happiness += elapsedMs;
    const happyMultiplier = target.personality === "social" ? 1.25 : target.personality === "stubborn" ? 0.85 : 1;
    const interval = (target.isSleeping ? RULES.sleepHappinessDecayMs : RULES.happinessDecayMs) * happyMultiplier;
    const loss = consumeSteps(target.accumulators, "happiness", interval);
    if (loss > 0) {
      const before = target.happiness;
      target.happiness = clamp(target.happiness - loss, 0, 4);
      if (before > 0 && target.happiness === 0) addEvent("Pet got sad", Date.now(), target);
    }
  }

  function applyEnergy(target, elapsedMs) {
    const key = target.isSleeping ? "energySleep" : "energyAwake";
    const rate = target.isSleeping ? RULES.sleepEnergyGainMs : RULES.awakeEnergyDecayMs;
    target.accumulators[key] += elapsedMs;
    const steps = consumeSteps(target.accumulators, key, rate);
    if (steps > 0) {
      const awakeLoss = target.personality === "sleepy" ? -2 : -3;
      const delta = target.isSleeping ? steps : steps * awakeLoss;
      target.energy = clamp(target.energy + delta, 0, 100);
    }
  }

  function applyPoop(target, now) {
    if (target.lastMealTimestamp === 0 || target.mealsSincePoop === 0) {
      return;
    }

    if (now - target.lastMealTimestamp >= RULES.poopAfterMealMs) {
      target.poopCount = clamp(target.poopCount + target.mealsSincePoop, 0, 4);
      addEvent("Poop appeared", now, target);
      target.mealsSincePoop = 0;
      target.lastMealTimestamp = 0;
    }
  }

  function applyHealth(target, elapsedMs) {
    const atRisk = target.hunger === 0 || target.happiness === 0 || target.energy <= 10 || target.poopCount >= 4;
    if (!atRisk || target.health === "sick") {
      if (!atRisk) {
        target.accumulators.sickness = 0;
      }
      return;
    }

    target.accumulators.sickness += elapsedMs;
    if (target.accumulators.sickness >= RULES.sicknessCheckMs) {
      target.health = "sick";
      target.logbook.sicknessCount += 1;
      target.message = "SICK";
      addEvent("Pet became sick", Date.now(), target);
      target.accumulators.sickness = 0;
      updateLogbook(target);
    }
  }

  function applyDisciplineCall(target, elapsedMs) {
    if (target.isSleeping || target.isDead || target.needsDiscipline) {
      return;
    }

    const fullyCared = target.hunger === 4 && target.happiness === 4 && target.health === "healthy" && target.poopCount === 0;
    if (!fullyCared) {
      target.accumulators.disciplineCall = 0;
      return;
    }

    target.accumulators.disciplineCall += elapsedMs;
    if (target.accumulators.disciplineCall >= RULES.disciplineCallMs) {
      target.needsDiscipline = true;
      target.accumulators.disciplineCall = 0;
      target.message = "CALL";
      addEvent("Pet called for attention", Date.now(), target);
    }
  }

  function applyDailyRhythm(target, elapsedMs, now) {
    if (target.isSleeping || !isNaturalSleepTime(target, now)) {
      return;
    }

    target.accumulators.rhythmPenalty = (target.accumulators.rhythmPenalty || 0) + elapsedMs;
    const penalty = consumeSteps(target.accumulators, "rhythmPenalty", HOUR);
    if (penalty > 0) {
      target.happiness = clamp(target.happiness - penalty, 0, 4);
      target.energy = clamp(target.energy - penalty * 4, 0, 100);
      addEvent("Stayed up past bedtime", now, target);
    }
  }

  function applyDeath(target, elapsedMs, now) {
    const critical = target.health === "sick" && (target.hunger === 0 || target.energy === 0 || target.poopCount >= 4);
    if (!critical) {
      target.criticalSince = null;
      return;
    }

    if (!target.criticalSince) {
      target.criticalSince = now;
    }

    if (now - target.criticalSince >= RULES.deathAfterCriticalMs) {
      target.isDead = true;
      target.isSleeping = false;
      target.logbook.deaths += 1;
      target.message = "DEAD";
      addEvent("Pet died", now, target);
      updateLogbook(target);
    }
  }

  function updateAttention(target) {
    target.attention = !target.isDead && (target.needsDiscipline || target.hunger === 0 || target.happiness === 0 || target.health === "sick" || target.poopCount >= 4);
    if (target === state && target.attention) {
      maybeNotify(deriveMessage());
    }
  }

  function consumeSteps(accumulators, key, intervalMs) {
    const steps = Math.floor(accumulators[key] / intervalMs);
    if (steps > 0) {
      accumulators[key] -= steps * intervalMs;
    }
    return steps;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function mutate(callback) {
    callback();
    updateAttention(state);
    updateLogbook(state);
    saveState();
    render();
  }

  function blocked(reason) {
    state.message = reason;
    timers.flashUntil = Date.now() + 1000;
    playSound("error");
    render();
    return false;
  }

  function canActWhileAwake() {
    if (!state.petType) {
      activePanel = "select";
      return blocked("CHOOSE");
    }
    if (state.isDead) {
      return blocked("DEAD");
    }
    if (state.isSleeping) {
      return blocked("SLEEP");
    }
    return true;
  }

  function selectPet(type) {
    const pet = PET_TYPES[type];
    if (!pet) {
      return blocked("BAD PET");
    }

    mutate(() => {
      state.petType = type;
      state.petName = pet.label;
      state.personality = pet.personality;
      state.energy = pet.energy;
      state.happiness = pet.happiness;
      state.weight = pet.weight;
      state.hunger = 4;
      state.health = "healthy";
      state.isDead = false;
      state.isSleeping = false;
      state.message = `${pet.label} OK`;
      addEvent(`${pet.label} joined you`);
      activePanel = state.onboardingSeen ? null : "onboarding";
      timers.flashUntil = Date.now() + 1200;
    });
    playSound("win");
    return getState();
  }

  function feedMeal() {
    if (!canActWhileAwake()) {
      return false;
    }

    mutate(() => {
      refillInventoryIfNeeded(state);
      if (state.inventory.meal <= 0) {
        state.message = "NO MEAL";
        timers.flashUntil = Date.now() + 900;
        return;
      }
      state.inventory.meal -= 1;
      state.hunger = clamp(state.hunger + 1, 0, 4);
      state.weight += 1;
      state.mealsSincePoop += 1;
      state.lastMealTimestamp = Date.now();
      state.message = "MEAL +1";
      addEvent("Ate meal");
      activePanel = null;
      timers.flashUntil = Date.now() + 900;
    });
    playSound("eat");
    return true;
  }

  function feedSnack() {
    if (!canActWhileAwake()) {
      return false;
    }

    mutate(() => {
      refillInventoryIfNeeded(state);
      if (state.inventory.snack <= 0) {
        state.message = "NO SNACK";
        timers.flashUntil = Date.now() + 900;
        return;
      }
      state.inventory.snack -= 1;
      state.happiness = clamp(state.happiness + 1, 0, 4);
      state.weight += 2;
      state.mealsSincePoop += 1;
      state.lastMealTimestamp = Date.now();
      state.message = "SNACK";
      addEvent("Ate snack");
      activePanel = null;
      timers.flashUntil = Date.now() + 900;
    });
    playSound("eat");
    return true;
  }

  function feedTreat() {
    if (!canActWhileAwake()) {
      return false;
    }

    mutate(() => {
      refillInventoryIfNeeded(state);
      if (state.inventory.treat <= 0) {
        state.message = "NO TREAT";
        timers.flashUntil = Date.now() + 900;
        return;
      }
      state.inventory.treat -= 1;
      state.hunger = clamp(state.hunger + 1, 0, 4);
      state.happiness = clamp(state.happiness + 1, 0, 4);
      state.weight += 2;
      state.mealsSincePoop += 1;
      state.lastMealTimestamp = Date.now();
      state.message = "TREAT";
      addEvent("Ate treat");
      activePanel = null;
      timers.flashUntil = Date.now() + 900;
    });
    playSound("eat");
    return true;
  }

  function playGame() {
    if (!canActWhileAwake()) {
      return false;
    }
    if (state.energy < 12) {
      return blocked("TIRED");
    }

    gameRound = {
      target: 50,
      startedAt: Date.now(),
      speed: 1300 + Math.floor(Math.random() * 600),
    };
    activePanel = "game";
    state.message = "STOP 50";
    playSound("click");
    render();
    return { started: true };
  }

  function chooseGame() {
    if (!gameRound) {
      return blocked("NO GAME");
    }

    if (!canActWhileAwake()) {
      gameRound = null;
      activePanel = null;
      return false;
    }

    const elapsed = Date.now() - gameRound.startedAt;
    const phase = (elapsed % gameRound.speed) / gameRound.speed;
    const position = Math.round(phase <= 0.5 ? phase * 200 : (1 - phase) * 200);
    const distance = Math.abs(position - gameRound.target);
    const won = distance <= 14;
    mutate(() => {
      const energyCost = state.personality === "playful" ? 10 : 14;
      state.energy = clamp(state.energy - energyCost, 0, 100);
      state.weight = Math.max(1, state.weight - 1);
      if (won) {
        const closeWin = distance <= 6;
        const coinReward = closeWin ? 3 : 2;
        state.happiness = clamp(state.happiness + (distance <= 6 ? 2 : 1), 0, 4);
        state.coins = clamp(state.coins + coinReward, 0, 999);
        if (closeWin) {
          state.inventory.treat = clamp(state.inventory.treat + 1, 0, 9);
        } else {
          state.inventory.snack = clamp(state.inventory.snack + 1, 0, 9);
        }
        state.logbook.gamesWon += 1;
        state.message = `WIN +${coinReward}C`;
        addEvent(`Won game +${coinReward}C ${closeWin ? "+treat" : "+snack"} (${position})`);
      } else {
        state.happiness = clamp(state.happiness - 1, 0, 4);
        state.message = `${position}`;
        addEvent(`Missed timing game (${position})`);
      }
      updateLogbook(state);
      gameRound = null;
      activePanel = null;
      timers.flashUntil = Date.now() + 900;
    });
    playSound(won ? "win" : "miss");
    return won;
  }

  function toggleSleep() {
    if (state.isDead) {
      return blocked("DEAD");
    }

    mutate(() => {
      state.isSleeping = !state.isSleeping;
      state.accumulators.hunger = 0;
      state.accumulators.happiness = 0;
      state.accumulators.energyAwake = 0;
      state.accumulators.energySleep = 0;
      state.message = state.isSleeping ? "LIGHT OFF" : "WAKE";
      activePanel = null;
      gameRound = null;
      timers.flashUntil = Date.now() + 900;
    });
    playSound(state.isSleeping ? "sleep" : "click");
    return state.isSleeping;
  }

  function cleanPoop() {
    if (state.isDead) {
      return blocked("DEAD");
    }

    mutate(() => {
      state.poopCount = 0;
      state.message = "CLEAN";
      timers.flashUntil = Date.now() + 900;
    });
    playSound("clean");
    return true;
  }

  function healPet() {
    if (state.isDead) {
      return blocked("DEAD");
    }

    if (state.health === "healthy") {
      return blocked("NO SICK");
    }

    mutate(() => {
      refillInventoryIfNeeded(state);
      if (state.inventory.medicine <= 0) {
        state.message = "NO MED";
        timers.flashUntil = Date.now() + 900;
        return;
      }
      state.inventory.medicine -= 1;
      state.health = "healthy";
      state.criticalSince = null;
      state.accumulators.sickness = 0;
      state.message = "HEALED";
      addEvent("Used medicine");
      timers.flashUntil = Date.now() + 900;
    });
    playSound("heal");
    return true;
  }

  function disciplinePet() {
    if (!canActWhileAwake()) {
      return false;
    }

    const validDiscipline = state.needsDiscipline && state.hunger > 0 && state.happiness > 0 && state.health === "healthy";
    mutate(() => {
      if (validDiscipline) {
        state.discipline = clamp(state.discipline + 12, 0, 100);
        state.needsDiscipline = false;
        state.message = "SCOLD";
        addEvent("Discipline worked");
      } else {
        state.happiness = clamp(state.happiness - 1, 0, 4);
        state.message = "WRONG";
        addEvent("Wrong discipline");
      }
      timers.flashUntil = Date.now() + 900;
    });
    playSound(validDiscipline ? "click" : "error");
    return validDiscipline;
  }

  function showFoodMenu() {
    if (!canActWhileAwake()) {
      return false;
    }

    activePanel = activePanel === "food" ? null : "food";
    gameRound = null;
    state.message = activePanel === "food" ? "FOOD" : "READY";
    playSound("click");
    render();
    return true;
  }

  function showShop() {
    if (!canActWhileAwake()) {
      return false;
    }

    activePanel = activePanel === "shop" ? null : "shop";
    gameRound = null;
    state.message = activePanel === "shop" ? "SHOP" : "READY";
    playSound("click");
    render();
    return true;
  }

  function buySupply(itemKey) {
    if (!canActWhileAwake()) {
      return false;
    }

    const item = SHOP_ITEMS[itemKey];
    if (!item) {
      return blocked("BAD ITEM");
    }

    mutate(() => {
      refillInventoryIfNeeded(state);
      if (state.coins < item.cost) {
        state.message = "NO COIN";
        timers.flashUntil = Date.now() + 900;
        return;
      }

      if (state.inventory[item.stockKey] >= 9) {
        state.message = "FULL";
        timers.flashUntil = Date.now() + 900;
        return;
      }

      state.coins -= item.cost;
      state.inventory[item.stockKey] = clamp(state.inventory[item.stockKey] + 1, 0, 9);
      state.message = `${item.label} +1`;
      addEvent(`Bought ${item.label}`);
      timers.flashUntil = Date.now() + 900;
    });
    playSound("click");
    return getInventory();
  }

  function showStatus() {
    if (!state.petType) {
      activePanel = "select";
      state.message = "CHOOSE";
      render();
      return getState();
    }

    activePanel = activePanel === "status" ? null : "status";
    gameRound = null;
    state.message = activePanel === "status" ? "STATUS" : "READY";
    playSound("click");
    render();
    return getState();
  }

  function showLog() {
    if (!state.petType) {
      activePanel = "select";
      state.message = "CHOOSE";
      render();
      return false;
    }

    activePanel = activePanel === "log" ? null : "log";
    gameRound = null;
    state.message = activePanel === "log" ? "LOG" : "READY";
    playSound("click");
    render();
    return true;
  }

  function showSettings() {
    activePanel = activePanel === "settings" ? null : "settings";
    gameRound = null;
    state.message = activePanel === "settings" ? "SET" : "READY";
    playSound("click");
    render();
    return true;
  }

  function showManual() {
    activePanel = activePanel === "manual" ? (state.petType ? null : "select") : "manual";
    gameRound = null;
    state.message = activePanel === "manual" ? "MANUAL" : (state.petType ? deriveMessage() : "CHOOSE");
    playSound("click");
    render();
    return true;
  }

  function showAbout() {
    activePanel = activePanel === "about" ? (state.petType ? null : "select") : "about";
    gameRound = null;
    state.message = activePanel === "about" ? "ABOUT" : (state.petType ? deriveMessage() : "CHOOSE");
    playSound("click");
    render();
    return true;
  }

  function finishOnboarding() {
    state.onboardingSeen = true;
    activePanel = null;
    state.message = "READY";
    addEvent("Tutorial finished");
    saveState();
    playSound("click");
    render();
    return true;
  }

  function adjustRhythm(command) {
    const rhythm = { ...state.rhythm };
    if (command === "wakeDown") rhythm.wakeHour = (rhythm.wakeHour + 23) % 24;
    if (command === "wakeUp") rhythm.wakeHour = (rhythm.wakeHour + 1) % 24;
    if (command === "sleepDown") rhythm.sleepHour = (rhythm.sleepHour + 23) % 24;
    if (command === "sleepUp") rhythm.sleepHour = (rhythm.sleepHour + 1) % 24;
    state.rhythm = rhythm;
    state.message = "RHYTHM";
    addEvent(`Rhythm ${formatHour(rhythm.wakeHour)}-${formatHour(rhythm.sleepHour)}`);
    saveState();
    playSound("click");
    render();
    return rhythm;
  }

  function requestNotifications() {
    if (typeof Notification === "undefined") {
      state.message = "NO API";
      render();
      return false;
    }

    Notification.requestPermission().then((permission) => {
      state.notificationsEnabled = permission === "granted";
      state.message = state.notificationsEnabled ? "NOTIFY ON" : "NO NOTIFY";
      addEvent(state.notificationsEnabled ? "Notifications enabled" : "Notifications blocked");
      saveState();
      render();
    });
    return true;
  }

  function closePanel() {
    activePanel = state.petType ? null : "select";
    gameRound = null;
    state.message = state.petType ? deriveMessage() : "CHOOSE";
    playSound("click");
    render();
    return true;
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    state.message = state.soundEnabled ? "SND ON" : "SND OFF";
    saveState();
    if (state.soundEnabled) {
      playSound("click");
    }
    render();
    return state.soundEnabled;
  }

  function resetGame() {
    const soundEnabled = state.soundEnabled;
    const logbook = normalizeLogbook(state.logbook);
    state = createNewState(Date.now());
    state.soundEnabled = soundEnabled;
    state.logbook = logbook;
    activePanel = "select";
    gameRound = null;
    saveState();
    playSound("click");
    render();
    return getState();
  }

  function getState() {
    return JSON.parse(JSON.stringify(state));
  }

  function getLogbook() {
    updateLogbook(state);
    return JSON.parse(JSON.stringify(state.logbook));
  }

  function getEvents() {
    return JSON.parse(JSON.stringify(state.events || []));
  }

  function getInventory() {
    refillInventoryIfNeeded(state);
    return JSON.parse(JSON.stringify(state.inventory));
  }

  function getEvolution() {
    return {
      stage: determineEvolution(state),
      careQuality: calculateCareQuality(state),
    };
  }

  function getWeightTier(target = state) {
    if (target.weight >= 26) return "heavy";
    if (target.weight >= 24) return "overweight";
    if (target.weight >= 18) return "wide";
    return "normal";
  }

  function updateLogbook(target) {
    target.logbook.bestAge = Math.max(target.logbook.bestAge, target.age);
    const evolution = determineEvolution(target);
    if (getEvolutionRank(evolution) > getEvolutionRank(target.logbook.bestEvolution)) {
      target.logbook.bestEvolution = evolution;
    }
  }

  function determineEvolution(target) {
    const quality = calculateCareQuality(target);
    if (target.weight >= 26) return "heavy";
    if (target.age <= 0) return "baby";
    if (target.age < 3) return "teen";
    if (quality < 55) return "heavy";
    if (target.age >= 5 && target.discipline >= 70 && quality >= 125) return "champion";
    return "adult";
  }

  function getEvolutionRank(stage) {
    const ranks = {
      baby: 1,
      teen: 2,
      adult: 3,
      heavy: 3,
      champion: 4,
    };
    return ranks[stage] || 0;
  }

  function calculateCareQuality(target) {
    const statScore = target.hunger * 10 + target.happiness * 10 + Math.round(target.energy / 2);
    const disciplineScore = Math.round(target.discipline * 0.6);
    const cleanPenalty = target.poopCount * 9;
    const healthPenalty = target.health === "sick" ? 25 : 0;
    const weightPenalty = target.weight > 20 ? (target.weight - 20) * 3 : 0;
    return clamp(statScore + disciplineScore - cleanPenalty - healthPenalty - weightPenalty, 0, 160);
  }

  function tick() {
    advanceState(state, TICK_MS);
    updateLogbook(state);
    if (!state.isDead && Date.now() > timers.flashUntil) {
      state.message = deriveMessage();
    }
    timers.animationFrame += 1;
    render();
  }

  function deriveMessage() {
    if (state.isDead) return "DEAD";
    if (state.isSleeping) return "SLEEP";
    if (state.health === "sick") return "SICK";
    if (state.hunger === 0) return "HUNGRY";
    if (state.happiness === 0) return "SAD";
    if (state.poopCount >= 4) return "DIRTY";
    if (state.needsDiscipline) return "CALL";
    if (state.energy <= 12) return "TIRED";
    return "READY";
  }

  function render() {
    dom.clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    dom.message.textContent = state.message || deriveMessage();
    dom.attention.classList.toggle("is-on", state.attention);

    renderMeters();
    renderPoop();
    renderPet();
    renderPanels();
    renderStatusPanel();
    renderButtons();
  }

  function renderMeters() {
    renderDots(dom.hungerMeter, state.hunger);
    renderDots(dom.happinessMeter, state.happiness);
    dom.energyBar.style.width = `${state.energy}%`;
  }

  function renderDots(container, filledCount) {
    container.replaceChildren();
    for (let index = 0; index < 4; index += 1) {
      const dot = document.createElement("span");
      dot.className = `dot${index < filledCount ? " is-filled" : ""}`;
      container.appendChild(dot);
    }
  }

  function renderPoop() {
    dom.poopLayer.replaceChildren();
    for (let index = 0; index < state.poopCount; index += 1) {
      const poop = document.createElement("span");
      poop.className = "poop";
      poop.textContent = "▟";
      dom.poopLayer.appendChild(poop);
    }
  }

  function renderPet() {
    if (!state.petType) {
      clearPetCanvas();
      dom.pet.className = "pixel-pet";
      return;
    }

    dom.pet.className = `pixel-pet${shouldBounce() ? " is-bounce" : ""}${state.isSleeping ? " is-sleep" : ""}`;
    drawCuteSprite(state.petType);
  }

  function drawCuteSprite(type) {
    if (!dom.pet.getContext) {
      return;
    }

    const context = dom.pet.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, 32, 32);
    context.imageSmoothingEnabled = false;

    const renderers = {
      sprout: drawSproutPet,
      dino: drawDinoPet,
      panda: drawPandaPet,
      bunny: drawBunnyPet,
      shiba: drawShibaPet,
      jelly: drawJellyPet,
    };
    if (determineEvolution(state) === "baby") {
      drawBabyPet(context, type);
    } else {
      (renderers[type] || renderers.sprout)(context);
      if (determineEvolution(state) === "teen") {
        drawBox(context, "#ffffff", 25, 11, 2, 2);
      }
    }
    drawCuteStateOverlay(context);
  }

  function drawBabyPet(context, type) {
    const fills = {
      sprout: "#b8ef55",
      dino: "#59c7ee",
      panda: "#fff8ef",
      bunny: "#fff8ef",
      shiba: "#f4a51f",
      jelly: "#59c7ee",
    };
    const fill = fills[type] || fills.sprout;
    drawSpanRows(context, "#06150f", [
      [10, 12, 8], [11, 10, 12], [12, 9, 14], [13, 8, 16], [14, 8, 16],
      [15, 8, 16], [16, 8, 16], [17, 9, 14], [18, 10, 12], [19, 12, 8],
    ]);
    drawSpanRows(context, fill, [
      [11, 12, 8], [12, 11, 10], [13, 10, 12], [14, 10, 12],
      [15, 10, 12], [16, 10, 12], [17, 11, 10], [18, 12, 8],
    ]);
    if (type === "sprout") {
      drawBox(context, "#063b21", 15, 6, 2, 5);
      drawBox(context, "#9ad545", 11, 5, 5, 2);
      drawBox(context, "#9ad545", 17, 5, 5, 2);
    }
    if (type === "bunny") {
      drawBox(context, "#06150f", 10, 4, 3, 8);
      drawBox(context, "#06150f", 20, 4, 3, 8);
      drawBox(context, "#fff8ef", 11, 5, 1, 6);
      drawBox(context, "#fff8ef", 21, 5, 1, 6);
    }
    drawGlossyEye(context, 12, 13);
    drawGlossyEye(context, 19, 13);
    drawBox(context, "#ff6f9f", 10, 18, 2, 1);
    drawBox(context, "#ff6f9f", 22, 18, 2, 1);
    drawBox(context, "#06150f", 16, 18, 2, 1);
  }

  function drawSproutPet(context) {
    drawBox(context, "#063b21", 10, 1, 5, 2);
    drawBox(context, "#063b21", 6, 3, 9, 4);
    drawBox(context, "#063b21", 17, 3, 9, 4);
    drawBox(context, "#9ad545", 7, 4, 7, 3);
    drawBox(context, "#bdf269", 8, 4, 4, 1);
    drawBox(context, "#9ad545", 18, 4, 7, 3);
    drawBox(context, "#bdf269", 19, 4, 4, 1);
    drawBox(context, "#063b21", 15, 6, 2, 5);
    drawRoundedPetBody(context, "#063b21", "#b8ef55");
    drawBox(context, "#f6ef9b", 11, 22, 10, 6);
    drawBox(context, "#9ad545", 6, 12, 2, 4);
    drawBox(context, "#8bc83e", 24, 14, 2, 5);
    drawCuteFace(context, 10, 15, { mouth: "open" });
    drawBox(context, "#6aa732", 9, 23, 3, 4);
    drawBox(context, "#6aa732", 20, 23, 3, 4);
  }

  function drawDinoPet(context) {
    drawBox(context, "#06222e", 12, 3, 3, 2);
    drawBox(context, "#06222e", 17, 4, 3, 2);
    drawBox(context, "#2f96c8", 12, 4, 3, 2);
    drawBox(context, "#2f96c8", 17, 5, 3, 2);
    drawSpanRows(context, "#06222e", [
      [7, 7, 13], [8, 6, 17], [9, 5, 19], [10, 5, 20], [11, 5, 21],
      [12, 5, 22], [13, 6, 23], [14, 6, 24], [15, 6, 24], [16, 7, 23],
      [17, 8, 21], [18, 9, 18], [19, 10, 15], [20, 11, 11],
    ]);
    drawSpanRows(context, "#59c7ee", [
      [8, 8, 10], [9, 7, 15], [10, 7, 17], [11, 7, 18],
      [12, 7, 19], [13, 8, 19], [14, 8, 20], [15, 8, 19],
      [16, 9, 17], [17, 10, 15], [18, 11, 12], [19, 12, 9],
    ]);
    drawBox(context, "#a9ecff", 7, 12, 5, 2);
    drawBox(context, "#a9ecff", 13, 17, 2, 4);
    drawBox(context, "#2f96c8", 22, 11, 2, 3);
    drawBox(context, "#2f96c8", 24, 13, 4, 3);
    drawBox(context, "#06222e", 28, 15, 2, 2);
    drawBox(context, "#06222e", 13, 21, 3, 2);
    drawBox(context, "#06222e", 19, 20, 3, 2);
    drawBox(context, "#06150f", 12, 10, 2, 4);
    drawBox(context, "#06150f", 16, 12, 1, 1);
    drawWeightBulge(context, "#2f96c8", "#06222e");
  }

  function drawPandaPet(context) {
    drawBox(context, "#06150f", 4, 5, 5, 5);
    drawBox(context, "#06150f", 23, 5, 5, 5);
    drawRoundedPetBody(context, "#06150f", "#fff8ef");
    drawBox(context, "#06150f", 8, 14, 4, 5);
    drawBox(context, "#06150f", 20, 14, 4, 5);
    drawBox(context, "#fff8ef", 10, 15, 1, 2);
    drawBox(context, "#fff8ef", 22, 15, 1, 2);
    drawBox(context, "#ff9ac0", 7, 19, 3, 2);
    drawBox(context, "#ff9ac0", 22, 19, 3, 2);
    drawBox(context, "#06150f", 15, 18, 2, 2);
    drawBox(context, "#06150f", 14, 21, 4, 1);
    drawBox(context, "#06150f", 9, 27, 4, 2);
    drawBox(context, "#06150f", 19, 27, 4, 2);
  }

  function drawBunnyPet(context) {
    drawBox(context, "#06150f", 7, 1, 5, 12);
    drawBox(context, "#06150f", 20, 1, 5, 12);
    drawBox(context, "#fff8ef", 8, 2, 3, 10);
    drawBox(context, "#fff8ef", 21, 2, 3, 10);
    drawBox(context, "#ff9ac0", 9, 5, 1, 5);
    drawBox(context, "#ff9ac0", 22, 5, 1, 5);
    drawRoundedPetBody(context, "#06150f", "#fff8ef");
    drawCuteFace(context, 10, 15, { mouth: "small" });
    drawBox(context, "#ff9ac0", 7, 20, 3, 2);
    drawBox(context, "#ff9ac0", 22, 20, 3, 2);
    drawBox(context, "#e6e6dc", 10, 27, 3, 2);
    drawBox(context, "#e6e6dc", 19, 27, 3, 2);
  }

  function drawShibaPet(context) {
    drawBox(context, "#06150f", 6, 5, 5, 5);
    drawBox(context, "#06150f", 21, 5, 5, 5);
    drawBox(context, "#f2a51f", 7, 6, 3, 4);
    drawBox(context, "#f2a51f", 22, 6, 3, 4);
    drawRoundedPetBody(context, "#06150f", "#f4a51f");
    drawBox(context, "#fff8ef", 11, 20, 10, 7);
    drawBox(context, "#fff8ef", 13, 17, 6, 4);
    drawCuteFace(context, 10, 15, { mouth: "small" });
    drawBox(context, "#ff9ac0", 7, 20, 3, 2);
    drawBox(context, "#ff9ac0", 22, 20, 3, 2);
    drawBox(context, "#d98612", 7, 11, 3, 2);
    drawBox(context, "#ffd56a", 21, 12, 3, 2);
  }

  function drawJellyPet(context) {
    drawSpanRows(context, "#06150f", [
      [7, 9, 14], [8, 7, 18], [9, 6, 20], [10, 5, 22], [11, 4, 24],
      [12, 4, 24], [13, 4, 24], [14, 5, 22], [15, 6, 20], [16, 7, 18],
      [17, 9, 14],
    ]);
    drawSpanRows(context, "#59c7ee", [
      [8, 10, 11], [9, 8, 16], [10, 7, 18], [11, 6, 20],
      [12, 6, 20], [13, 6, 20], [14, 7, 18], [15, 8, 16], [16, 10, 12],
    ]);
    drawBox(context, "#a9ecff", 8, 10, 5, 2);
    drawBox(context, "#06150f", 11, 13, 2, 4);
    drawBox(context, "#06150f", 20, 13, 2, 4);
    drawBox(context, "#06150f", 15, 18, 3, 1);
    drawBox(context, "#06150f", 9, 18, 3, 7);
    drawBox(context, "#06150f", 15, 18, 3, 8);
    drawBox(context, "#06150f", 21, 18, 3, 7);
    drawBox(context, "#59c7ee", 10, 18, 1, 6);
    drawBox(context, "#59c7ee", 16, 18, 1, 7);
    drawBox(context, "#59c7ee", 22, 18, 1, 6);
    drawWeightBulge(context, "#59c7ee", "#06150f");
  }

  function drawRoundedPetBody(context, outline, fill) {
    const extra = getWeightExtra();
    drawSpanRows(context, outline, widenRows([
      [8, 11, 10], [9, 8, 16], [10, 7, 18], [11, 6, 20], [12, 5, 22],
      [13, 5, 22], [14, 4, 24], [15, 4, 24], [16, 4, 24], [17, 4, 24],
      [18, 4, 24], [19, 4, 24], [20, 5, 22], [21, 5, 22], [22, 6, 20],
      [23, 7, 18], [24, 8, 16], [25, 9, 14], [26, 11, 10], [27, 12, 8],
    ], extra));
    drawSpanRows(context, fill, widenRows([
      [9, 11, 10], [10, 9, 14], [11, 8, 16], [12, 7, 18], [13, 7, 18],
      [14, 6, 20], [15, 6, 20], [16, 6, 20], [17, 6, 20], [18, 6, 20],
      [19, 6, 20], [20, 7, 18], [21, 7, 18], [22, 8, 16], [23, 9, 14],
      [24, 10, 12], [25, 11, 10],
    ], extra));
    drawBox(context, "rgba(255,255,255,0.28)", 8, 12, 2, 5);
    drawBox(context, "rgba(255,255,255,0.28)", 10, 10, 5, 1);
    drawBox(context, "rgba(0,0,0,0.1)", 24, 15, 2, 5);
    if (extra >= 2) {
      drawBox(context, "rgba(255,255,255,0.24)", 12, 23, 8, 3);
    }
  }

  function getWeightExtra() {
    const tier = getWeightTier();
    if (tier === "heavy") return 3;
    if (tier === "overweight") return 2;
    if (tier === "wide") return 1;
    return 0;
  }

  function widenRows(rows, extra) {
    if (!extra) return rows;
    return rows.map(([y, x, width]) => {
      const lowerBody = y >= 12 && y <= 25;
      if (!lowerBody) return [y, x, width];
      const applied = y >= 15 && y <= 22 ? extra : Math.max(0, extra - 1);
      return [y, Math.max(0, x - applied), Math.min(32, width + applied * 2)];
    });
  }

  function drawWeightBulge(context, fill, outline) {
    const extra = getWeightExtra();
    if (!extra) return;
    const rows = extra >= 3
      ? [[16, 3, 4], [17, 2, 5], [18, 2, 5], [19, 3, 4], [16, 25, 4], [17, 25, 5], [18, 25, 5], [19, 25, 4]]
      : extra >= 2
        ? [[17, 3, 3], [18, 3, 3], [17, 26, 3], [18, 26, 3]]
        : [[18, 4, 2], [18, 26, 2]];
    drawSpanRows(context, outline, rows);
    drawSpanRows(context, fill, rows.map(([y, x, width]) => [y, x + 1, Math.max(1, width - 2)]));
  }

  function drawCuteFace(context, leftEyeX, eyeY, options = {}) {
    const rightEyeX = 20;
    drawGlossyEye(context, leftEyeX, eyeY);
    drawGlossyEye(context, rightEyeX, eyeY);
    drawBox(context, "#ff6f9f", leftEyeX - 4, eyeY + 5, 3, 2);
    drawBox(context, "#ff6f9f", rightEyeX + 4, eyeY + 5, 3, 2);
    if (options.mouth === "open") {
      drawBox(context, "#06150f", 15, eyeY + 4, 3, 4);
      drawBox(context, "#ff7ca8", 16, eyeY + 6, 2, 2);
    } else {
      drawBox(context, "#06150f", 15, eyeY + 5, 1, 1);
      drawBox(context, "#06150f", 17, eyeY + 5, 1, 1);
      drawBox(context, "#06150f", 16, eyeY + 6, 1, 1);
    }
  }

  function drawGlossyEye(context, x, y) {
    drawBox(context, "#06150f", x, y, 3, 5);
    drawBox(context, "#ffffff", x + 1, y, 1, 2);
    drawBox(context, "#ffffff", x + 2, y + 3, 1, 1);
  }

  function drawBox(context, color, x, y, width = 1, height = 1) {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  }

  function drawSpanRows(context, color, rows) {
    context.fillStyle = color;
    rows.forEach(([y, x, width]) => context.fillRect(x, y, width, 1));
  }

  function drawPixelWord(context, word, startX, startY, color) {
    const glyphs = {
      R: ["110", "101", "110", "101", "101"],
      I: ["111", "010", "010", "010", "111"],
      P: ["110", "101", "110", "100", "100"],
    };
    context.fillStyle = color;
    word.split("").forEach((letter, index) => {
      const glyph = glyphs[letter];
      if (!glyph) return;
      const offsetX = startX + index * 4;
      glyph.forEach((row, y) => {
        row.split("").forEach((cell, x) => {
          if (cell === "1") {
            context.fillRect(offsetX + x, startY + y, 1, 1);
          }
        });
      });
    });
  }

  function drawCuteStateOverlay(context) {
    const evolution = determineEvolution(state);
    if (evolution === "champion") {
      context.fillStyle = COLOR_PALETTE.Y;
      [[10, 0], [12, 0], [14, 0], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1]].forEach(([x, y]) => context.fillRect(x, y, 1, 1));
      context.fillStyle = COLOR_PALETTE.K;
      [[9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2]].forEach(([x, y]) => context.fillRect(x, y, 1, 1));
    }

    if (evolution === "heavy") {
      context.fillStyle = COLOR_PALETTE.g;
      [[3, 15], [2, 16], [21, 15], [22, 16]].forEach(([x, y]) => context.fillRect(x, y, 1, 1));
    }

    if (state.isSleeping) {
      context.fillStyle = COLOR_PALETTE.K;
      [[24, 2], [25, 2], [26, 2], [26, 3], [25, 4], [24, 5], [25, 5], [26, 5]].forEach(([x, y]) => context.fillRect(x, y, 1, 1));
    }

    if (state.health === "sick" && !state.isDead) {
      context.fillStyle = COLOR_PALETTE.R;
      [[3, 3], [5, 3], [4, 4], [3, 5], [5, 5]].forEach(([x, y]) => context.fillRect(x, y, 1, 1));
    }

    if (state.isDead) {
      drawBox(context, "#06150f", 8, 1, 16, 9);
      drawBox(context, "#d8d2b5", 9, 2, 14, 7);
      drawPixelWord(context, "RIP", 10, 3, "#06150f");
      context.fillStyle = COLOR_PALETTE.K;
      [[10, 15], [12, 15], [11, 16], [10, 17], [12, 17], [20, 15], [22, 15], [21, 16], [20, 17], [22, 17]].forEach(([x, y]) => context.fillRect(x, y, 1, 1));
      context.fillRect(14, 23, 5, 1);
    }
  }

  function clearPetCanvas() {
    if (!dom.pet.getContext) {
      return;
    }

    const context = dom.pet.getContext("2d");
    if (context) {
      context.clearRect(0, 0, 32, 32);
    }
  }

  function shouldBounce() {
    return !state.isDead && !state.isSleeping && state.health !== "sick" && state.energy > 12;
  }

  function renderPanels() {
    dom.selectPanel.hidden = activePanel !== "select";
    dom.onboardingPanel.hidden = activePanel !== "onboarding";
    dom.foodPanel.hidden = activePanel !== "food";
    dom.shopPanel.hidden = activePanel !== "shop";
    dom.gamePanel.hidden = activePanel !== "game";
    dom.logPanel.hidden = activePanel !== "log";
    dom.settingsPanel.hidden = activePanel !== "settings";
    dom.manualPanel.hidden = activePanel !== "manual";
    dom.aboutPanel.hidden = activePanel !== "about";
    renderFoodPanel();
    renderShopPanel();
    renderLogPanel();
    renderSettingsPanel();
    renderManualPanel();
    renderAboutPanel();
    if (dom.gamePrompt) {
      dom.gamePrompt.textContent = gameRound ? "Stop near 50" : "Press game";
    }
  }

  function renderFoodPanel() {
    if (!dom.mealButton) return;
    refillInventoryIfNeeded(state);
    if (dom.foodCoinDisplay) {
      dom.foodCoinDisplay.textContent = `COIN ${state.coins}`;
    }
    dom.mealButton.textContent = `MEAL ${state.inventory.meal}`;
    dom.snackButton.textContent = `SNACK ${state.inventory.snack}`;
    dom.treatButton.textContent = `TREAT ${state.inventory.treat}`;
  }

  function renderShopPanel() {
    if (!dom.shopPanel) return;
    refillInventoryIfNeeded(state);
    const rows = Object.entries(SHOP_ITEMS).map(([key, item]) => {
      const stock = state.inventory[item.stockKey];
      const disabled = state.coins < item.cost || stock >= 9 ? "disabled" : "";
      return `
        <div class="shop-row">
          <span>${item.label}</span>
          <span>${stock}/9</span>
          <button class="lcd-button" type="button" data-shop-item="${key}" ${disabled}>${item.cost}C</button>
        </div>
      `;
    });

    dom.shopPanel.innerHTML = `
      <h2>Shop</h2>
      <p>COIN ${state.coins}</p>
      <div class="shop-list">${rows.join("")}</div>
      <button class="lcd-button" type="button" data-action="showFoodMenu">BACK</button>
    `;
  }

  function renderLogPanel() {
    if (!dom.logPanel) return;
    const entries = state.events && state.events.length ? state.events : [{ time: "--:--", text: "No events yet" }];
    dom.logPanel.innerHTML = `
      <h2>Log</h2>
      ${entries.map((event) => `<div class="log-entry">${event.time} ${event.text}</div>`).join("")}
      <button class="lcd-button" type="button" data-action="closePanel">BACK</button>
    `;
  }

  function renderSettingsPanel() {
    if (!dom.rhythmDisplay) return;
    dom.rhythmDisplay.textContent = `DAY ${formatHour(state.rhythm.wakeHour)}-${formatHour(state.rhythm.sleepHour)}`;
  }

  function renderManualPanel() {
    if (!dom.manualPanel || activePanel !== "manual") return;
    dom.manualPanel.innerHTML = `
      <h2>Manual</h2>
      <p><strong>Goal:</strong> keep pet alive, clean, happy, fed, and rested.</p>
      <ul>
        <li><strong>M/FOOD:</strong> meal, snack, treat, shop.</li>
        <li><strong>L:</strong> sleep. Energy +1 every 10 seconds.</li>
        <li><strong>G:</strong> timing game. Stop near 50 for coin/reward.</li>
        <li><strong>W:</strong> clean all poop.</li>
        <li><strong>+:</strong> use medicine when sick.</li>
        <li><strong>S:</strong> status, care, evolution, coin, weight.</li>
        <li><strong>D:</strong> use only when message says CALL.</li>
      </ul>
      <p>Daily refill top-up: MEAL 4, SNACK 4, TREAT 1, MED 2.</p>
      <button class="lcd-button" type="button" data-action="closePanel">BACK</button>
    `;
  }

  function renderAboutPanel() {
    if (!dom.aboutPanel || activePanel !== "about") return;
    dom.aboutPanel.innerHTML = `
      <h2>About</h2>
      <div class="status-grid">
        <span>App</span><strong>Retro Web Tamago</strong>
        <span>Version</span><strong>${APP_VERSION}</strong>
        <span>Build</span><strong>Static Web</strong>
        <span>Engine</span><strong>Vanilla JS</strong>
        <span>Save</span><strong>Local + IDB</strong>
        <span>Deploy</span><strong>Vercel OK</strong>
      </div>
      <p>Save data stays in this browser/device.</p>
      <button class="lcd-button" type="button" data-action="closePanel">BACK</button>
    `;
  }

  function saveBeforeBackground() {
    saveState();
  }

  function formatHour(hour) {
    return String(hour).padStart(2, "0");
  }

  function renderStatusPanel() {
    dom.statusPanel.hidden = activePanel !== "status";
    if (activePanel !== "status") {
      return;
    }

    const rows = [
      ["Pet", state.petName || "none"],
      ["Persona", state.personality],
      ["Age", `${state.age} day`],
      ["Weight", `${state.weight} oz`],
      ["Coin", state.coins],
      ["Build", getWeightTier(state)],
      ["Evolve", determineEvolution(state)],
      ["Care", `${calculateCareQuality(state)}/160`],
      ["Discipline", `${state.discipline}%`],
      ["Hunger", `${state.hunger}/4`],
      ["Happy", `${state.happiness}/4`],
      ["Energy", `${state.energy}%`],
      ["Health", state.health],
      ["Poop", `${state.poopCount}/4`],
      ["Best Age", `${state.logbook.bestAge} day`],
      ["Wins", state.logbook.gamesWon],
      ["Sick", state.logbook.sicknessCount],
      ["Deaths", state.logbook.deaths],
      ["Best Evo", state.logbook.bestEvolution],
      ["Call", state.needsDiscipline ? "yes" : "no"],
      ["Sound", state.soundEnabled ? "on" : "off"],
      ["Notify", state.notificationsEnabled ? "on" : "off"],
      ["Rhythm", `${formatHour(state.rhythm.wakeHour)}-${formatHour(state.rhythm.sleepHour)}`],
    ];

    dom.statusPanel.innerHTML = `
      <h2>Status</h2>
      <div class="status-grid">
        ${rows.map(([label, value]) => `<span>${label}</span><strong>${value}</strong>`).join("")}
      </div>
    `;
  }

  function renderButtons() {
    const buttons = document.querySelectorAll("[data-action]");
    buttons.forEach((button) => {
      const action = button.dataset.action;
      const alwaysAllowed = ["resetGame", "toggleSound", "showManual", "showAbout", "closePanel"];
      const blockedByDeath = state.isDead && !alwaysAllowed.includes(action);
      const blockedByNoPet = !state.petType && !alwaysAllowed.includes(action);
      const blockedBySleep = state.isSleeping && ["showFoodMenu", "showShop", "feedMeal", "feedSnack", "feedTreat", "playGame", "disciplinePet"].includes(action);
      const isActive = (action === "toggleSleep" && state.isSleeping) || (action === "toggleSound" && state.soundEnabled);
      button.disabled = blockedByNoPet || blockedByDeath || blockedBySleep;
      button.classList.toggle("is-active", isActive);
    });
  }

  function formatOfflineMessage(elapsedMs) {
    if (elapsedMs < MINUTE) return "WELCOME";
    if (elapsedMs < HOUR) return `${Math.floor(elapsedMs / MINUTE)}M AWAY`;
    if (elapsedMs < DAY) return `${Math.floor(elapsedMs / HOUR)}H AWAY`;
    return `${Math.floor(elapsedMs / DAY)}D AWAY`;
  }

  function simulateTime(milliseconds) {
    const elapsed = Math.max(0, Number(milliseconds) || 0);
    mutate(() => {
      applyOfflineTime(state, elapsed);
      activePanel = null;
      gameRound = null;
      state.message = state.isDead ? "DEAD" : formatOfflineMessage(elapsed);
      timers.flashUntil = Date.now() + 1200;
    });
    playSound(state.isDead ? "dead" : "click");
    return getState();
  }

  function playSound(type) {
    if (!state.soundEnabled || typeof window === "undefined") {
      return;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      return;
    }

    try {
      audioContext = audioContext || new AudioCtor();
      const now = audioContext.currentTime;
      const sequence = getSoundSequence(type);
      sequence.forEach(([frequency, start, duration]) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(frequency, now + start);
        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.08, now + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now + start);
        oscillator.stop(now + start + duration + 0.02);
      });
    } catch (error) {
      audioContext = null;
    }
  }

  function getSoundSequence(type) {
    const sounds = {
      click: [[660, 0, 0.06]],
      eat: [[420, 0, 0.06], [520, 0.08, 0.06]],
      win: [[520, 0, 0.07], [760, 0.09, 0.09]],
      miss: [[240, 0, 0.12]],
      error: [[160, 0, 0.08], [130, 0.1, 0.08]],
      clean: [[620, 0, 0.04], [620, 0.06, 0.04]],
      heal: [[520, 0, 0.06], [680, 0.08, 0.08]],
      sleep: [[330, 0, 0.1], [220, 0.11, 0.14]],
      dead: [[160, 0, 0.16], [100, 0.18, 0.22]],
    };
    return sounds[type] || sounds.click;
  }

  function bindControls() {
    document.addEventListener("click", (event) => {
      const petButton = event.target.closest("[data-pet-choice]");
      if (petButton) {
        selectPet(petButton.dataset.petChoice);
        return;
      }

      const gameButton = event.target.closest("[data-game-choice]");
      if (gameButton) {
        chooseGame(gameButton.dataset.gameChoice);
        return;
      }

      const rhythmButton = event.target.closest("[data-rhythm]");
      if (rhythmButton) {
        adjustRhythm(rhythmButton.dataset.rhythm);
        return;
      }

      const shopButton = event.target.closest("[data-shop-item]");
      if (shopButton) {
        buySupply(shopButton.dataset.shopItem);
        return;
      }

      const button = event.target.closest("[data-action]");
      if (!button) {
        return;
      }

      const action = button.dataset.action;
      const handler = actions[action];
      if (handler) {
        handler();
      }
    });
  }

  const actions = {
    selectPet,
    showFoodMenu,
    showShop,
    buySupply,
    feedMeal,
    feedSnack,
    feedTreat,
    playGame,
    chooseGame,
    toggleSleep,
    cleanPoop,
    healPet,
    disciplinePet,
    showStatus,
    showLog,
    showSettings,
    showManual,
    showAbout,
    finishOnboarding,
    adjustRhythm,
    requestNotifications,
    closePanel,
    toggleSound,
    resetGame,
  };

  window.tamagotchi = {
    ...actions,
    getState,
    getLogbook,
    getEvents,
    getInventory,
    getEvolution,
    saveState,
    rules: RULES,
    appVersion: APP_VERSION,
    dailyRefill: DAILY_REFILL,
    shopItems: SHOP_ITEMS,
    storageKey: STORAGE_KEY,
    backupDbName: IDB_NAME,
    simulateTime,
    simulateOffline(milliseconds) {
      return simulateTime(milliseconds);
    },
  };

  bindControls();
  render();
  restoreIndexedBackupIfNeeded();
  timers.tick = window.setInterval(tick, TICK_MS);
  timers.save = window.setInterval(saveState, SAVE_INTERVAL_MS);
  window.addEventListener("beforeunload", saveState);
  window.addEventListener("pagehide", saveBeforeBackground);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      saveBeforeBackground();
    }
  });
})();
