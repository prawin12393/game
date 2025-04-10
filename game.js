const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Load assets
const playerImg = new Image();
playerImg.src = 'assets/player.png'; // Spaceship sprite

const alienImgs = [
    new Image(), // Fast, weak alien
    new Image()  // Slow, tough alien
];
alienImgs[0].src = 'assets/alien1.png';
alienImgs[1].src = 'assets/alien2.png';

const bulletImg = new Image();
bulletImg.src = 'assets/laser.png'; // Laser beam sprite

const backgroundLayers = [
    new Image(), // Far stars
    new Image()  // Near planets
];
backgroundLayers[0].src = 'assets/background_far.png';
backgroundLayers[1].src = 'assets/background_near.png';

// Audio
const shootSound = new Audio('assets/laser.wav');
const explosionSound = new Audio('assets/explosion.wav');
const backgroundMusic = new Audio('assets/epic_music.mp3');
backgroundMusic.loop = true;

// Game state and variables
let gameState = 'start';
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    speed: 6,
    shootCooldown: 20,
    currentCooldown: 0
};
let bullets = [];
let aliens = [];
let particles = []; // For explosion effects
let score = 0;
let wave = 1;
let backgroundOffset = 0; // For scrolling background

// Alien types with behaviors
const alienTypes = [
    { speed: 4, health: 1, image: alienImgs[0], pattern: 'zigzag' }, // Fast, zigzagging alien
    { speed: 2, health: 3, image: alienImgs[1], pattern: 'straight' } // Slow, tanky alien
];

// Controls
let rightPressed = false;
let leftPressed = false;
let spacePressed = false;

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
    if (gameState === 'start' && e.key === ' ') {
        initializeGame();
        gameState = 'playing';
        backgroundMusic.play();
    } else if (gameState === 'playing') {
        if (e.key === 'ArrowRight') rightPressed = true;
        if (e.key === 'ArrowLeft') leftPressed = true;
        if (e.key === ' ') spacePressed = true;
    } else if (gameState === 'gameOver' && e.key === ' ') {
        initializeGame();
        gameState = 'playing';
        backgroundMusic.play();
    }
}

function keyUpHandler(e) {
    if (gameState === 'playing') {
        if (e.key === 'ArrowRight') rightPressed = false;
        if (e.key === 'ArrowLeft') leftPressed = false;
        if (e.key === ' ') spacePressed = false;
    }
}

// Initialize game
function initializeGame() {
    player.x = canvas.width / 2 - player.width / 2;
    bullets = [];
    aliens = [];
    particles = [];
    score = 0;
    wave = 1;
    backgroundOffset = 0;
    player.currentCooldown = 0;
}

// Particle effect for explosions
function createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x + 15, // Center of alien
            y: y + 15,
            radius: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 4,
            speedY: (Math.random() - 0.5) * 4,
            life: 30 + Math.random() * 20,
            color: `hsl(${Math.random() * 60 + 20}, 100%, 50%)` // Orange-red hues
        });
    }
}

// Move player
function movePlayer() {
    if (rightPressed && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (leftPressed && player.x > 0) {
        player.x -= player.speed;
    }
}

// Shoot with cooldown
function shootBullet() {
    if (spacePressed && player.currentCooldown <= 0) {
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 16,
            speed: 8
        });
        shootSound.play();
        player.currentCooldown = player.shootCooldown;
    }
}

// Spawn aliens with wave-based difficulty
function spawnAlien() {
    const spawnChance = 0.01 + wave * 0.005; // Increases with wave
    if (Math.random() < spawnChance) {
        const typeIndex = Math.floor(Math.random() * alienTypes.length);
        const type = alienTypes[typeIndex];
        aliens.push({
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 40,
            height: 40,
            speed: type.speed,
            health: type.health,
            image: type.image,
            pattern: type.pattern,
            phase: 0 // For zigzag movement
        });
    }
}

// Update game objects
function update() {
    movePlayer();
    shootBullet();
    spawnAlien();

    if (player.currentCooldown > 0) player.currentCooldown--;

    // Scrolling background
    backgroundOffset += 1;
    if (backgroundOffset >= canvas.height) backgroundOffset = 0;

    // Update bullets
    for (let b = bullets.length - 1; b >= 0; b--) {
        bullets[b].y -= bullets[b].speed;
        if (bullets[b].y < -bullets[b].height) bullets.splice(b, 1);
    }

    // Update aliens
    for (let a = aliens.length - 1; a >= 0; a--) {
        const alien = aliens[a];
        if (alien.pattern === 'zigzag') {
            alien.phase += 0.1;
            alien.x += Math.sin(alien.phase) * 3;
            alien.y += alien.speed;
        } else {
            alien.y += alien.speed;
        }

        if (alien.y > canvas.height) {
            aliens.splice(a, 1);
            score -= 20;
            if (score < -100) gameState = 'gameOver';
        } else {
            // Collision with bullets
            for (let b = bullets.length - 1; b >= 0; b--) {
                const bullet = bullets[b];
                if (
                    bullet.x < alien.x + alien.width &&
                    bullet.x + bullet.width > alien.x &&
                    bullet.y < alien.y + alien.height &&
                    bullet.y + bullet.height > alien.y
                ) {
                    alien.health--;
                    bullets.splice(b, 1);
                    if (alien.health <= 0) {
                        aliens.splice(a, 1);
                        score += 20 * wave;
                        createExplosion(alien.x, alien.y);
                        explosionSound.play();
                        // Check for wave progression
                        if (aliens.length === 0 && Math.random() < 0.1) wave++;
                        break;
                    }
                }
            }
        }
    }

    // Update particles
    for (let p = particles.length - 1; p >= 0; p--) {
        const particle = particles[p];
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life--;
        if (particle.life <= 0) particles.splice(p, 1);
    }
}

// Draw everything
function draw() {
    // Parallax background
    ctx.drawImage(backgroundLayers[0], 0, backgroundOffset - canvas.height, canvas.width, canvas.height);
    ctx.drawImage(backgroundLayers[0], 0, backgroundOffset, canvas.width, canvas.height);
    ctx.drawImage(backgroundLayers[1], 0, backgroundOffset - canvas.height, canvas.width, canvas.height);
    ctx.drawImage(backgroundLayers[1], 0, backgroundOffset, canvas.width, canvas.height);

    // Player with slight hover effect
    const hoverOffset = Math.sin(Date.now() * 0.005) * 2;
    ctx.drawImage(playerImg, player.x, player.y + hoverOffset, player.width, player.height);

    // Bullets
    bullets.forEach(bullet => ctx.drawImage(bulletImg, bullet.x, bullet.y, bullet.width, bullet.height));

    // Aliens with scaling animation
    aliens.forEach(alien => {
        const scale = 1 + Math.sin(alien.phase) * 0.05; // Pulsing effect
        ctx.drawImage(alien.image, alien.x, alien.y, alien.width * scale, alien.height * scale);
    });

    // Particles
    particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
    });

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score} | Wave: ${wave}`, 10, 30);
}

// Start screen
function drawStartScreen() {
    drawBackground();
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Alien Invasion: Earth Defense', canvas.width / 2, canvas.height / 2 - 60);
    ctx.font = '24px Arial';
    ctx.fillText('Use arrow keys to move, space to shoot', canvas.width / 2, canvas.height / 2);
    ctx.fillText('Press Space to Start', canvas.width / 2, canvas.height / 2 + 60);
}

// Game over screen
function drawGameOverScreen() {
    drawBackground();
    ctx.fillStyle = 'red';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 60);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score} | Wave: ${wave}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 60);
}

// Helper to draw background for screens
function drawBackground() {
    ctx.drawImage(backgroundLayers[0], 0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundLayers[1], 0, 0, canvas.width, canvas.height);
}

// Game loop
function gameLoop() {
    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'playing') {
        update();
        draw();
    } else if (gameState === 'gameOver') {
        drawGameOverScreen();
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();
