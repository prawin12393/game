const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 40,
    height: 20,
    speed: 5,
    dx: 0
};

// Bullet array
let bullets = [];
// Alien array
let aliens = [];
let score = 0;
let gameOver = false;

// Controls
let rightPressed = false;
let leftPressed = false;
let spacePressed = false;

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    if (e.key === " ") spacePressed = true;
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
    if (e.key === " ") spacePressed = false;
}

// Move player
function movePlayer() {
    player.dx = 0;
    if (rightPressed && player.x < canvas.width - player.width) player.dx = player.speed;
    if (leftPressed && player.x > 0) player.dx = -player.speed;
    player.x += player.dx;
}

// Shoot bullet
function shootBullet() {
    if (spacePressed) {
        bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 10 });
        spacePressed = false; // Prevent continuous shooting
    }
}

// Alien spawn
function spawnAlien() {
    if (Math.random() < 0.02) { // Adjust spawn rate
        aliens.push({ x: Math.random() * (canvas.width - 30), y: 0, width: 30, height: 30, speed: 2 });
    }
}

// Update game objects
function update() {
    movePlayer();
    shootBullet();
    spawnAlien();

    // Update bullets
    bullets.forEach((bullet, bIndex) => {
        bullet.y -= 5;
        if (bullet.y < 0) bullets.splice(bIndex, 1);
    });

    // Update aliens
    aliens.forEach((alien, aIndex) => {
        alien.y += alien.speed;
        if (alien.y > canvas.height) {
            aliens.splice(aIndex, 1);
            score -= 10; // Penalty for letting alien land
            if (score < -50) gameOver = true;
        }

        // Collision detection (bullet vs alien)
        bullets.forEach((bullet, bIndex) => {
            if (
                bullet.x < alien.x + alien.width &&
                bullet.x + bullet.width > alien.x &&
                bullet.y < alien.y + alien.height &&
                bullet.y + bullet.height > alien.y
            ) {
                aliens.splice(aIndex, 1);
                bullets.splice(bIndex, 1);
                score += 10;
            }
        });
    });
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw bullets
    ctx.fillStyle = "red";
    bullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height));

    // Draw aliens
    ctx.fillStyle = "green";
    aliens.forEach(alien => ctx.fillRect(alien.x, alien.y, alien.width, alien.height));

    // Draw score
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 30);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
    }
}

// Game loop
function gameLoop() {
    if (!gameOver) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

gameLoop();
