const skyCanvas = document.getElementById("skyCanvas");
const skyCtx = skyCanvas?.getContext("2d");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas?.getContext("2d");
const textArea = document.getElementById("writer");
const saveConfirmOverlay = document.getElementById("save-confirm-overlay");
const saveConfirmYesBtn = document.getElementById("saveConfirmYesBtn");
const saveConfirmNoBtn = document.getElementById("saveConfirmNoBtn");
const gameOverOverlay = document.getElementById("game-over-overlay");
const gameWinOverlay = document.getElementById("game-win-overlay");
const explosionOverlay = document.getElementById("explosion-overlay");
const roseOverlay = document.getElementById("rose-overlay");
const appContainer = document.getElementById("app-container");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const shareLink = document.getElementById("shareLink");
const sharePopup = document.getElementById("share-popup");
const sharePopupPanel = document.getElementById("share-popup-panel");
const sharePopupClose = document.getElementById("share-popup-close");
const contactLink = document.getElementById("contactLink");
const contactPopup = document.getElementById("contact-popup");
const contactPopupPanel = document.getElementById("contact-popup-panel");
const contactPopupClose = document.getElementById("contact-popup-close");
const contactForm = document.getElementById("contact-form");
const contactEmailInput = document.getElementById("contact-email");
const contactMessageInput = document.getElementById("contact-message");
const contactSendBtn = document.getElementById("contact-send-btn");
const contactStatus = document.getElementById("contact-status");
const introPopup = document.getElementById("intro-popup");
const introPopupPanel = document.getElementById("intro-popup-panel");

if (
  !skyCanvas ||
  !skyCtx ||
  !canvas ||
  !ctx ||
  !textArea ||
  !saveConfirmOverlay ||
  !saveConfirmYesBtn ||
  !saveConfirmNoBtn ||
  !gameOverOverlay ||
  !gameWinOverlay ||
  !explosionOverlay ||
  !roseOverlay ||
  !appContainer ||
  !fullscreenBtn ||
  !shareLink ||
  !sharePopup ||
  !sharePopupPanel ||
  !sharePopupClose ||
  !contactLink ||
  !contactPopup ||
  !contactPopupPanel ||
  !contactPopupClose ||
  !contactForm ||
  !contactEmailInput ||
  !contactMessageInput ||
  !contactSendBtn ||
  !contactStatus ||
  !introPopup ||
  !introPopupPanel
) {
  throw new Error("Missing required DOM elements for game startup.");
}

const INTRO_POPUP_SEEN_KEY = "writingDashIntroSeen";
let isIntroPopupOpen = false;

function hasSeenIntroPopup() {
  try {
    return window.localStorage.getItem(INTRO_POPUP_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

function markIntroPopupSeen() {
  try {
    window.localStorage.setItem(INTRO_POPUP_SEEN_KEY, "true");
  } catch {
    // Continue without persistence when storage is unavailable.
  }
}

function showIntroPopupIfNeeded() {
  if (hasSeenIntroPopup()) return;

  isIntroPopupOpen = true;
  introPopup.classList.add("is-visible");
  introPopup.setAttribute("aria-hidden", "false");
  setTimeout(() => {
    introPopupPanel.focus({ preventScroll: true });
  }, 0);
}

function hideIntroPopup(event) {
  if (!isIntroPopupOpen) return;

  if (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  isIntroPopupOpen = false;
  introPopup.classList.remove("is-visible");
  introPopup.setAttribute("aria-hidden", "true");
  markIntroPopupSeen();
  refocusWriterSoon();
}

function focusWriter() {
  textArea.focus({ preventScroll: true });
}

function refocusWriterSoon() {
  setTimeout(focusWriter, 0);
}

function isSharePopupOpen() {
  return sharePopup.classList.contains("is-visible");
}

function isContactPopupOpen() {
  return contactPopup.classList.contains("is-visible");
}

function isOverlayOpen() {
  return isIntroPopupOpen || isSharePopupOpen() || isContactPopupOpen();
}

function openSharePopup() {
  closeContactPopup(false);
  sharePopup.classList.add("is-visible");
  sharePopup.setAttribute("aria-hidden", "false");
  shareLink.setAttribute("aria-expanded", "true");
}

function closeSharePopup() {
  sharePopup.classList.remove("is-visible");
  sharePopup.setAttribute("aria-hidden", "true");
  shareLink.setAttribute("aria-expanded", "false");
  refocusWriterSoon();
}

function openContactPopup() {
  closeSharePopup();
  contactPopup.classList.add("is-visible");
  contactPopup.setAttribute("aria-hidden", "false");
  contactLink.setAttribute("aria-expanded", "true");
  setTimeout(() => {
    contactEmailInput.focus({ preventScroll: true });
  }, 0);
}

function closeContactPopup(shouldRefocus = true) {
  contactPopup.classList.remove("is-visible");
  contactPopup.setAttribute("aria-hidden", "true");
  contactLink.setAttribute("aria-expanded", "false");
  contactStatus.textContent = "";
  if (shouldRefocus) {
    refocusWriterSoon();
  }
}

function isFullscreenActive() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
}

function updateFullscreenButtonState() {
  const active = Boolean(isFullscreenActive());
  fullscreenBtn.textContent = active ? "🗗" : "⛶";
  fullscreenBtn.setAttribute(
    "aria-label",
    active ? "Exit fullscreen mode" : "Enter fullscreen mode",
  );
  fullscreenBtn.title = active ? "Exit Fullscreen" : "Fullscreen";
}

async function toggleFullscreen() {
  const activeElement = isFullscreenActive();

  try {
    if (!activeElement) {
      if (appContainer.requestFullscreen) {
        await appContainer.requestFullscreen();
      } else if (appContainer.webkitRequestFullscreen) {
        appContainer.webkitRequestFullscreen();
      } else if (appContainer.msRequestFullscreen) {
        appContainer.msRequestFullscreen();
      }
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  } catch (error) {
    console.error("Fullscreen toggle failed:", error);
  }
}

// Load Player Images (walking animation frames)
const bookWalkFramePaths = [
  "assets/book_walk1.png",
  "assets/book_walk2.png",
  "assets/book_walk3.png",
  "assets/book_walk4.png",
];
const bookWalkFrames = bookWalkFramePaths.map((path) => {
  const image = new Image();
  image.src = path;
  return image;
});
const bookStandImage = new Image();
bookStandImage.src = "assets/book_stand.png";
let bookWalkFramesLoaded = 0;
let bookAspectRatio = 1;
bookWalkFrames.forEach((image) => {
  image.onload = () => {
    bookWalkFramesLoaded += 1;
    if (image.naturalWidth > 0 && image.naturalHeight > 0 && bookAspectRatio === 1) {
      bookAspectRatio = image.naturalWidth / image.naturalHeight;
    }
  };
});
bookStandImage.onload = () => {
  if (bookStandImage.naturalWidth > 0 && bookStandImage.naturalHeight > 0) {
    bookAspectRatio = bookStandImage.naturalWidth / bookStandImage.naturalHeight;
  }
};
let walkFrameIndex = 0;
let walkFrameTicker = 0;
const WALK_FRAME_TICK_INTERVAL = 6;
let isMovingForward = false;

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

function drawClouds(targetCtx) {
  for (let i = 0; i < clouds.length; i += 1) {
    const cloud = clouds[i];
    if (!cloud.image.complete) continue;
    targetCtx.drawImage(cloud.image, cloud.x, cloud.y, cloud.width, cloud.height);
  }
}

// 1. Setup & Sizing
function resize() {
  skyCanvas.width = skyCanvas.clientWidth;
  skyCanvas.height = skyCanvas.clientHeight;
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
let shouldHideBook = false;
let hasPlayedRipExplosion = false;

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

function playRipExplosion() {
  if (hasPlayedRipExplosion) return;
  hasPlayedRipExplosion = true;
  shouldHideBook = true;
  roseOverlay.classList.remove("is-active");
  explosionOverlay.classList.remove("is-active");
  void explosionOverlay.offsetWidth;
  explosionOverlay.classList.add("is-active");
  setTimeout(() => {
    roseOverlay.classList.remove("is-active");
    void roseOverlay.offsetWidth;
    roseOverlay.classList.add("is-active");
  }, 2000);
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

  const previousX = player.x;

  // Environmental slide (pulls player to lava)
  player.x -= scrollSpeed;

  // Typing momentum
  player.x += player.velocity;
  player.velocity *= 0.8; // Friction

  // Bounds
  if (player.x > canvas.width - player.width)
    player.x = canvas.width - player.width;

  isMovingForward = player.x > previousX;

  if (isMovingForward) {
    walkFrameTicker += 1;
    if (walkFrameTicker >= WALK_FRAME_TICK_INTERVAL) {
      walkFrameTicker = 0;
      walkFrameIndex = (walkFrameIndex + 1) % bookWalkFrames.length;
    }
  } else {
    walkFrameTicker = 0;
    walkFrameIndex = 0;
  }

  // Death Condition (Far Left Lava)
  if (player.x < 70) {
    if (!isGameOver) {
      isGameOver = true;
      playRipExplosion();
      stopTimer();
      showGameOverOverlay();
    }
  }
}

// 4. Drawing the Visuals
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const visibleSkyHeight = skyCanvas.height;
  const groundY = canvas.height - 50;
  const bookHeight = player.height;

  // Draw Sky + Clouds (background layer)
  skyCtx.clearRect(0, 0, skyCanvas.width, skyCanvas.height);
  skyCtx.fillStyle = "#a8d1df";
  skyCtx.fillRect(0, 0, skyCanvas.width, visibleSkyHeight);

  // Draw moving clouds behind player
  updateClouds();
  drawClouds(skyCtx);

  // Draw foreground gameplay layer (book)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Player (The Book)
  if (!shouldHideBook && bookWalkFramesLoaded > 0) {
    const currentBookImage = isMovingForward
      ? bookWalkFrames[walkFrameIndex]?.complete &&
        bookWalkFrames[walkFrameIndex].naturalHeight > 0
        ? bookWalkFrames[walkFrameIndex]
        : bookWalkFrames.find(
            (frame) => frame.complete && frame.naturalHeight > 0,
          )
      : bookStandImage.complete && bookStandImage.naturalHeight > 0
      ? bookStandImage
      : bookWalkFrames.find((frame) => frame.complete && frame.naturalHeight > 0);

    if (currentBookImage) {
      if (
        currentBookImage.naturalWidth > 0 &&
        currentBookImage.naturalHeight > 0
      ) {
        bookAspectRatio =
          currentBookImage.naturalWidth / currentBookImage.naturalHeight;
      }
      const bookWidth = bookHeight * bookAspectRatio;
      player.width = bookWidth;
      ctx.drawImage(
        currentBookImage,
        player.x,
        groundY - bookHeight,
        bookWidth,
        bookHeight,
      );
    } else {
      ctx.fillStyle = "#1d1d1f";
      ctx.fillRect(
        player.x,
        groundY - player.height,
        player.width,
        player.height,
      );
    }
  } else if (!shouldHideBook) {
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
showIntroPopupIfNeeded();
window.addEventListener("load", () => {
  if (isIntroPopupOpen) {
    introPopupPanel.focus({ preventScroll: true });
    return;
  }
  focusWriter();
  setTimeout(focusWriter, 75);
});

document.addEventListener("click", hideIntroPopup, true);
document.addEventListener("keydown", hideIntroPopup, true);

// Keep typing focus after clicks outside the textarea (including control buttons).
document.addEventListener("click", (event) => {
  if (isOverlayOpen()) {
    return;
  }
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

fullscreenBtn.addEventListener("click", () => {
  toggleFullscreen();
});

shareLink.addEventListener("click", (event) => {
  event.preventDefault();
  if (isSharePopupOpen()) {
    closeSharePopup();
    return;
  }
  openSharePopup();
});

sharePopupClose.addEventListener("click", () => {
  closeSharePopup();
});

sharePopup.addEventListener("click", (event) => {
  if (event.target === sharePopup) {
    closeSharePopup();
  }
});

contactLink.addEventListener("click", (event) => {
  event.preventDefault();
  if (isContactPopupOpen()) {
    closeContactPopup();
    return;
  }
  openContactPopup();
});

contactPopupClose.addEventListener("click", () => {
  closeContactPopup();
});

contactPopup.addEventListener("click", (event) => {
  if (event.target === contactPopup) {
    closeContactPopup();
  }
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) {
    return;
  }

  const senderEmail = contactEmailInput.value.trim();
  const message = contactMessageInput.value.trim();
  if (!senderEmail || !message) {
    return;
  }

  contactSendBtn.disabled = true;
  contactSendBtn.textContent = "Sending...";
  contactStatus.textContent = "";

  fetch("https://formsubmit.co/ajax/cyporter@in20xx.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: senderEmail,
      message,
      _subject: "Writing Dash Contact Form",
      _captcha: "false",
      _template: "table",
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to send message.");
      }
      return response.json();
    })
    .then(() => {
      contactStatus.textContent = "Message sent.";
      contactForm.reset();
      setTimeout(() => {
        closeContactPopup();
      }, 700);
    })
    .catch(() => {
      contactStatus.textContent =
        "Send failed. Try again in a moment.";
    })
    .finally(() => {
      contactSendBtn.disabled = false;
      contactSendBtn.textContent = "Send";
    });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (isContactPopupOpen()) {
    closeContactPopup();
    return;
  }
  if (isSharePopupOpen()) {
    closeSharePopup();
  }
});

document.addEventListener("fullscreenchange", updateFullscreenButtonState);
document.addEventListener("webkitfullscreenchange", updateFullscreenButtonState);
document.addEventListener("MSFullscreenChange", updateFullscreenButtonState);
updateFullscreenButtonState();

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
