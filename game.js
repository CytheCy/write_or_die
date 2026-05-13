const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const textArea = document.getElementById("writer");

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

// Load Player Image
const bookImage = new Image();
let bookImageLoaded = false;
bookImage.onload = () => {
  bookImageLoaded = true;
};
bookImage.src = "assets/book.png";

// Load Lava/RIP Image
const ripImage = new Image();
let ripImageLoaded = false;
ripImage.onload = () => {
  ripImageLoaded = true;
};
ripImage.src = "assets/RIP.png";

// 1. Setup & Sizing
function resize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  // Set starting position to far right
  if (!gameStarted) {
    player.x = canvas.width - 150;
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

let player = {
  x: 0,
  width: 100,
  height: 120,
  velocity: 0,
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
  document.getElementById("clockDisplay").innerText = formatTime(remainingSeconds);
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
        alert("You won! You can live to write another day!");
      }
    }
  }, 1000);
}

// 3. The Input Engine
textArea.addEventListener("input", (e) => {
  if (!gameStarted) {
    gameStarted = true;
  }
  startTimerIfNeeded();

  // Play Sound
  typeSound.currentTime = 0;
  typeSound.volume = 0.3;
  typeSound.play();

  // If they hit space or enter, play the 'bell' sound
  if (e.inputType === "insertLineBreak") {
    bellSound.play();
  }

  // Character Boost
  player.velocity += 6;

  // Word Count UI
  const text = textArea.value.trim();
  document.getElementById("wordCount").innerText = text
    ? text.split(/\s+/).length
    : 0;
});

function update() {
  if (!gameStarted || isGameOver) return;

  // Environmental slide (pulls player to lava)
  player.x -= scrollSpeed;

  // Typing momentum
  player.x += player.velocity;
  player.velocity *= 0.8; // Friction

  // Bounds
  if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;

  // Death Condition (Far Left Lava)
  if (player.x < 70) {
    if (!isGameOver) {
      isGameOver = true;
      stopTimer();
      alert("The lava caught you! Your story ends here.");
    }
  }
}

// 4. Drawing the Visuals
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const groundY = canvas.height - 50;
  const ripHeight = 200;
  const bookHeight = player.height;

  // Draw Sky
  ctx.fillStyle = "#a8d1df";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Ground (Autumn Leaves style)
  ctx.fillStyle = "#557064"; // Dirt
  ctx.fillRect(0, groundY, canvas.width, 50);
  ctx.fillStyle = "#387080"; // Red Autumn top
  ctx.fillRect(0, groundY, canvas.width, 4);

  // Draw Lava (Left edge)
  if (ripImageLoaded) {
    const ripAspectRatio = ripImage.naturalWidth / ripImage.naturalHeight;
    const ripWidth = ripHeight * ripAspectRatio;
    const ripYOffset = 50; // positive = lower, negative = higher
    ctx.drawImage(
      ripImage,
      0,
      groundY - ripHeight + ripYOffset,
      ripWidth,
      ripHeight,
    );
  } else {
    ctx.fillStyle = "#e63946";
    ctx.fillRect(0, 0, 70, canvas.height);
  }

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

// Copy Button Logic
document.getElementById("copyBtn").addEventListener("click", () => {
  const textToCopy = textArea.value;
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      const btn = document.getElementById("copyBtn");
      const originalText = btn.innerText;
      btn.innerText = "COPIED!";
      setTimeout(() => {
        btn.innerText = originalText;
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
});

// Clean Sheet Logic
document.getElementById("cleanSheetBtn").addEventListener("click", () => {
  textArea.value = "";
  document.getElementById("wordCount").innerText = "0";
  refocusWriterSoon();
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
