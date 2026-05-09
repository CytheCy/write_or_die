const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const textArea = document.getElementById('writer');

// Load Typewriter Sound
const typeSound = new Audio('https://www.soundjay.com/communication/typewriter-key-1.mp3');
const bellSound = new Audio('https://www.soundjay.com/communication/typewriter-bell-1.mp3');

// 1. Setup & Sizing
function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // Set starting position to far right
    if (!gameStarted) {
        player.x = canvas.width - 150;
    }
}
window.addEventListener('resize', resize);

// 2. Game State
let gameStarted = false;
let isGameOver = false;
let scrollSpeed = 1.5; 

let player = {
    x: 0,
    width: 50,
    height: 60,
    velocity: 0
};

// 3. The Input Engine
textArea.addEventListener('input', (e) => {
    if (!gameStarted) {
        gameStarted = true;
    }

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
    document.getElementById('wordCount').innerText = text ? text.split(/\s+/).length : 0;
});

function update() {
    if (!gameStarted || isGameOver) return;

    // Environmental slide (pulls player to lava)
    player.x -= scrollSpeed;

    // Typing momentum
    player.x += player.velocity;
    player.velocity *= 0.8; // Friction

    // Bounds
    if (player.x > canvas.width - 100) player.x = canvas.width - 100;

    // Death Condition (Far Left Lava)
    if (player.x < 70) {
        isGameOver = true;
        alert("The lava caught you! Your story ends here.");
        location.reload();
    }
}

// 4. Drawing the Visuals
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const groundY = canvas.height - 50;

    // Draw Sky
    ctx.fillStyle = "#a8d1df";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Lava (Left edge)
    ctx.fillStyle = "#e63946";
    ctx.fillRect(0, 0, 70, canvas.height);

    // Draw Ground (Autumn Leaves style)
    ctx.fillStyle = "#6b3e2e"; // Dirt
    ctx.fillRect(70, groundY, canvas.width, 50);
    ctx.fillStyle = "#c1121f"; // Red Autumn top
    ctx.fillRect(70, groundY, canvas.width, 8);

    // Draw Player Placeholder (The Writer)
    ctx.fillStyle = "#1d1d1f";
    ctx.fillRect(player.x, groundY - player.height, player.width, player.height);
    
    // Typewriter he's carrying
    ctx.fillStyle = "#fff";
    ctx.fillRect(player.x + 20, groundY - 40, 25, 15);

    update();
    requestAnimationFrame(draw);
}

// Start
resize();
draw();