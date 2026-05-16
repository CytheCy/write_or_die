const canvas = document.getElementById("gameCanvas");
const ctx = canvas?.getContext("2d");
const textArea = document.getElementById("writer");
const saveConfirmOverlay = document.getElementById("save-confirm-overlay");
const saveConfirmYesBtn = document.getElementById("saveConfirmYesBtn");
const saveConfirmNoBtn = document.getElementById("saveConfirmNoBtn");
const gameOverOverlay = document.getElementById("game-over-overlay");
const gameWinOverlay = document.getElementById("game-win-overlay");

if (
  !canvas ||
  !ctx ||
  !textArea ||
  !saveConfirmOverlay ||
  !saveConfirmYesBtn ||
  !saveConfirmNoBtn ||
  !gameOverOverlay ||
  !gameWinOverlay
) {
  throw new Error("Missing required DOM elements for game startup.");
}

function focusWriter() {
  textArea.focus({ preventScroll: true });
}

function refocusWriterSoon() {
  setTimeout(focusWriter, 0);
}

// Load Typewriter Sound
const typeSound = new Audio(
  "https://www.soundjay.com/communication/typewriter-key-1.mp3",
);
const bellSound = new Audio(
  "https://www.soundjay.com/communication/typewriter-bell-1.mp3",
);

function safePlay(audio) {
  if (!audio) return;
  const playResult = audio.play();
  if (playResult && typeof playResult.catch === "function") {
    playResult.catch(() => {});
  }
}

// Load Player Image
const bookImage = new Image();
let bookImageLoaded = false;
bookImage.onload = () => {
  bookImageLoaded = true;
};
bookImage.src = "assets/book.png";

const cloudSprites = [
  { path: "assets/cloud01.png", width: 366, height: 150 },
  { path: "assets/cloud02.png", width: 216, height: 87 },
  { path: "assets/cloud03.png", width: 256, height: 114 },
  { path: "assets/cloud04.png", width: 297, height: 134 },
  { path: "assets/cloud05.png", width: 373, height: 130 },
  { path: "assets/cloud06.png", width: 252, height: 136 },
  { path: "assets/cloud07.png", width: 271, height: 122 },
  { path: "assets/cloud08.png", width: 247, height: 106 },
].map((sprite) => {
  const image = new Image();
  image.src = sprite.path;
  return {
    ...sprite,
    image,
  };
});

const clouds = [];
const CLOUD_COUNT = 10;
const CLOUD_SPEED_MIN = 0.2;
const CLOUD_SPEED_MAX = 0.7;
const CLOUD_SCALE_MIN = 0.55;
const CLOUD_SCALE_MAX = 1.0;

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randomCloudImage() {
  return cloudSprites[Math.floor(Math.random() * cloudSprites.length)];
}

function spawnCloud(startingRight = false) {
  const sprite = randomCloudImage();
  const scale = randomRange(CLOUD_SCALE_MIN, CLOUD_SCALE_MAX);
  const width = sprite.width * scale;
  const height = sprite.height * scale;
  const margin = 24;
  const x = startingRight
    ? canvas.width + randomRange(0, canvas.width * 0.35)
    : randomRange(-width, canvas.width + margin);
  const y = randomRange(8, Math.max(12, canvas.height * 0.38 - height));
  const speed = randomRange(CLOUD_SPEED_MIN, CLOUD_SPEED_MAX);

  return {
    image: sprite.image,
    x,
    y,
    width,
    height,
    speed,
  };
}

function setupClouds() {
  clouds.length = 0;
  for (let i = 0; i < CLOUD_COUNT; i += 1) {
    clouds.push(spawnCloud(false));
  }
}

function updateClouds() {
  for (let i = 0; i < clouds.length; i += 1) {
    const cloud = clouds[i];
    cloud.x -= cloud.speed;

    if (cloud.x + cloud.width < -30) {
      clouds[i] = spawnCloud(true);
    }
  }
}

function drawClouds() {
  for (let i = 0; i < clouds.length; i += 1) {
    const cloud = clouds[i];
    if (!cloud.image.complete) continue;
    ctx.drawImage(cloud.image, cloud.x, cloud.y, cloud.width, cloud.height);
  }
}

// 1. Setup & Sizing
function resize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  // Set starting position to far right
  if (!gameStarted) {
    player.x = canvas.width - 150;
  }
  if (!clouds.length) {
    setupClouds();
  }
}
window.addEventListener("resize", resize);

// 2. Game State
let gameStarted = false;
let isGameOver = false;
let scrollSpeed = 1.5;
let timerStarted = false;
let timerIntervalId = null;
let remainingSeconds = 10 * 60;
let selectedMinutes = 10;
let hasCopiedCurrentText = false;
let in20xxCheatCountApplied = 0;

let player = {
  x: 0,
  width: 100,
  height: 120,
  velocity: 0,
};

const SPEED_BY_KEY = {
  slow: 0.75,
  medium: 1.5,
  fast: 3,
};

function getSelectedMinutesFromButton() {
  const selectedButton = document.querySelector(".time-btn.is-selected");
  const minutes = Number.parseInt(selectedButton?.dataset.minutes || "10", 10);
  return Number.isNaN(minutes) ? 10 : minutes;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes)}:${String(secs).padStart(2, "0")}`;
}

function updateClockDisplay() {
  document.getElementById("clockDisplay").innerText =
    formatTime(remainingSeconds);
}

function resetTimerForSelection() {
  selectedMinutes = getSelectedMinutesFromButton();
  remainingSeconds = selectedMinutes * 60;
  updateClockDisplay();
}

function stopTimer() {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function showGameOverOverlay() {
  gameOverOverlay.classList.add("is-visible");
  gameOverOverlay.setAttribute("aria-hidden", "false");
}

function hideGameOverOverlay() {
  gameOverOverlay.classList.remove("is-visible");
  gameOverOverlay.setAttribute("aria-hidden", "true");
}

function showGameWinOverlay() {
  gameWinOverlay.classList.add("is-visible");
  gameWinOverlay.setAttribute("aria-hidden", "false");
}

function hideGameWinOverlay() {
  gameWinOverlay.classList.remove("is-visible");
  gameWinOverlay.setAttribute("aria-hidden", "true");
}

function startTimerIfNeeded() {
  if (timerStarted || isGameOver) return;
  timerStarted = true;

  timerIntervalId = setInterval(() => {
    if (isGameOver) {
      stopTimer();
      return;
    }

    remainingSeconds -= 1;
    if (remainingSeconds < 0) remainingSeconds = 0;
    updateClockDisplay();

    if (remainingSeconds === 0) {
      stopTimer();
      if (player.x >= 70 && !isGameOver) {
        isGameOver = true;
        showGameWinOverlay();
      }
    }
  }, 1000);
}

// 3. The Input Engine
textArea.addEventListener("input", (e) => {
  hasCopiedCurrentText = false;

  if (!gameStarted) {
    gameStarted = true;
  }
  startTimerIfNeeded();

  // Play Sound
  typeSound.currentTime = 0;
  typeSound.volume = 0.3;
  safePlay(typeSound);

  // If they hit space or enter, play the 'bell' sound
  if (e.inputType === "insertLineBreak") {
    safePlay(bellSound);
  }

  // Character Boost: only advance on insertion, not deletion.
  if (e.inputType && e.inputType.startsWith("insert")) {
    player.velocity += 6;
  }

  // Word Count UI
  const rawText = textArea.value;
  const text = rawText.trim();
  document.getElementById("wordCount").innerText = text
    ? text.split(/\s+/).length
    : 0;

  // Test hook: each new "in20xx" occurrence fast-forwards the timer by 9 minutes.
  const in20xxMatches = rawText.toLowerCase().match(/in20xx/g);
  const in20xxCountNow = in20xxMatches ? in20xxMatches.length : 0;
  if (in20xxCountNow > in20xxCheatCountApplied) {
    const newlyTypedCount = in20xxCountNow - in20xxCheatCountApplied;
    remainingSeconds = Math.max(0, remainingSeconds - newlyTypedCount * 9 * 60);
    in20xxCheatCountApplied = in20xxCountNow;
    updateClockDisplay();
  } else if (in20xxCountNow < in20xxCheatCountApplied) {
    in20xxCheatCountApplied = in20xxCountNow;
  }
});

function update() {
  if (!gameStarted || isGameOver) return;

  // Environmental slide (pulls player to lava)
  player.x -= scrollSpeed;

  // Typing momentum
  player.x += player.velocity;
  player.velocity *= 0.8; // Friction

  // Bounds
  if (player.x > canvas.width - player.width)
    player.x = canvas.width - player.width;

  // Death Condition (Far Left Lava)
  if (player.x < 70) {
    if (!isGameOver) {
      isGameOver = true;
      stopTimer();
      showGameOverOverlay();
    }
  }
}

// 4. Drawing the Visuals
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const deskOverlapRaw = getComputedStyle(
    document.documentElement,
  ).getPropertyValue("--desk-overlap");
  const deskOverlap = Number.parseInt(deskOverlapRaw, 10) || 90;
  const visibleSkyHeight = Math.max(0, canvas.height - deskOverlap);
  const groundY = canvas.height - 50;
  const bookHeight = player.height;

  // Draw Sky
  ctx.fillStyle = "#a8d1df";
  ctx.fillRect(0, 0, canvas.width, visibleSkyHeight);

  // Draw moving clouds behind hazards/player
  updateClouds();
  drawClouds();

  // Draw Player (The Book)
  if (bookImageLoaded) {
    const bookAspectRatio = bookImage.naturalWidth / bookImage.naturalHeight;
    const bookWidth = bookHeight * bookAspectRatio;
    player.width = bookWidth;
    ctx.drawImage(
      bookImage,
      player.x,
      groundY - bookHeight,
      bookWidth,
      bookHeight,
    );
  } else {
    // Fallback placeholder while loading
    ctx.fillStyle = "#1d1d1f";
    ctx.fillRect(
      player.x,
      groundY - player.height,
      player.width,
      player.height,
    );
  }

  update();
  requestAnimationFrame(draw);
}

// Start
resize();
draw();
focusWriter();
window.addEventListener("load", () => {
  focusWriter();
  setTimeout(focusWriter, 75);
});

// Keep typing focus after clicks outside the textarea (including control buttons).
document.addEventListener("click", (event) => {
  if (event.target !== textArea) {
    refocusWriterSoon();
  }
});

async function copyCurrentWriting() {
  const textToCopy = textArea.value;
  const btn = document.getElementById("copyBtn");
  const originalText = btn.innerText;

  const showCopiedState = () => {
    btn.innerText = "COPIED!";
    setTimeout(() => {
      btn.innerText = originalText;
    }, 2000);
  };

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      hasCopiedCurrentText = true;
      showCopiedState();
      return true;
    } catch (err) {
      console.error("Failed to copy text: ", err);
      return false;
    }
  }

  textArea.select();
  try {
    const copied = document.execCommand("copy");
    if (copied) {
      hasCopiedCurrentText = true;
      showCopiedState();
    }
    return copied;
  } catch (err) {
    console.error("Failed to copy text: ", err);
    return false;
  } finally {
    textArea.setSelectionRange(textArea.value.length, textArea.value.length);
    refocusWriterSoon();
  }
}

// Copy Button Logic
document.getElementById("copyBtn").addEventListener("click", () => {
  copyCurrentWriting();
});

function resetForNewGame() {
  hideGameOverOverlay();
  hideGameWinOverlay();
  saveConfirmOverlay.classList.remove("is-visible");
  saveConfirmOverlay.setAttribute("aria-hidden", "true");
  textArea.value = "";
  document.getElementById("wordCount").innerText = "0";
  window.location.reload();
}

function askToSaveBeforeNewGame() {
  return new Promise((resolve) => {
    function closePrompt(shouldSave) {
      saveConfirmOverlay.classList.remove("is-visible");
      saveConfirmOverlay.setAttribute("aria-hidden", "true");
      saveConfirmYesBtn.removeEventListener("click", onYes);
      saveConfirmNoBtn.removeEventListener("click", onNo);
      resolve(shouldSave);
    }

    function onYes() {
      closePrompt(true);
    }

    function onNo() {
      closePrompt(false);
    }

    saveConfirmYesBtn.addEventListener("click", onYes);
    saveConfirmNoBtn.addEventListener("click", onNo);
    saveConfirmOverlay.classList.add("is-visible");
    saveConfirmOverlay.setAttribute("aria-hidden", "false");
  });
}

// New Game Logic
document.getElementById("newGameBtn").addEventListener("click", async () => {
  const isDeathBoxVisible = gameOverOverlay.classList.contains("is-visible");
  const isWinBoxVisible = gameWinOverlay.classList.contains("is-visible");
  const hasText = textArea.value.trim().length > 0;

  if (!hasText) {
    resetForNewGame();
    return;
  }

  if (hasCopiedCurrentText) {
    if (isDeathBoxVisible) {
      hideGameOverOverlay();
    }
    if (isWinBoxVisible) {
      hideGameWinOverlay();
    }
    resetForNewGame();
    return;
  }

  if (isDeathBoxVisible) {
    hideGameOverOverlay();
  }
  if (isWinBoxVisible) {
    hideGameWinOverlay();
  }

  const shouldSaveFirst = await askToSaveBeforeNewGame();
  if (shouldSaveFirst) {
    const copied = await copyCurrentWriting();
    if (copied) {
      resetForNewGame();
    }
    return;
  }

  resetForNewGame();
});

// in20xx.com Button Logic
document.getElementById("in20xxBtn").addEventListener("click", () => {
  window.open("https://in20xx.com", "_blank", "noopener,noreferrer");
});

// Time Button Group Logic (single-select)
const timeButtons = document.querySelectorAll(".time-btn");

function selectTimeButton(selectedButton) {
  if (timerStarted) return;

  timeButtons.forEach((button) => {
    const isSelected = button === selectedButton;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  resetTimerForSelection();
}

timeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectTimeButton(button);
  });
});

resetTimerForSelection();

// Speed Button Group Logic (single-select)
const speedButtons = document.querySelectorAll(".speed-btn");

function getScrollSpeedForButton(button) {
  const speedKey = button?.dataset.speed || "medium";
  return SPEED_BY_KEY[speedKey] ?? SPEED_BY_KEY.medium;
}

function selectSpeedButton(selectedButton) {
  speedButtons.forEach((button) => {
    const isSelected = button === selectedButton;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  scrollSpeed = getScrollSpeedForButton(selectedButton);
}

speedButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectSpeedButton(button);
  });
});

selectSpeedButton(
  document.querySelector(".speed-btn.is-selected") ||
    speedButtons[1] ||
    speedButtons[0],
);
