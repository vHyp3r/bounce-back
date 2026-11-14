const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const coinCount = document.querySelector("#coin-count");
const lifeCount = document.querySelector("#life-count");
const message = document.querySelector("#game-message");
const messageKicker = document.querySelector("#message-kicker");
const messageTitle = document.querySelector("#message-title");
const messageCopy = document.querySelector("#message-copy");
const restartButton = document.querySelector("#restart-button");
const pauseButton = document.querySelector("#pause-button");
const playerImage = new Image();
let playerSprite;

playerImage.src = "assets/star-player.png";
playerImage.addEventListener("load", () => {
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = 320;
  spriteCanvas.height = 320;
  const spriteContext = spriteCanvas.getContext("2d", { willReadFrequently: true });
  spriteContext.drawImage(playerImage, 500, 200, 360, 360, 0, 0, 320, 320);
  const imageData = spriteContext.getImageData(0, 0, spriteCanvas.width, spriteCanvas.height);

  for (let index = 0; index < imageData.data.length; index += 4) {
    const red = imageData.data[index];
    const green = imageData.data[index + 1];
    const blue = imageData.data[index + 2];
    if (red > 245 && green > 245 && blue > 245) imageData.data[index + 3] = 0;
  }

  spriteContext.putImageData(imageData, 0, 0);
  playerSprite = spriteCanvas;
});

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const worldWidth = 3400;
const gravity = 0.55;
const keys = new Set();

const platforms = [
  { x: 0, y: 475, w: 570, h: 65 },
  { x: 670, y: 420, w: 250, h: 30 },
  { x: 1010, y: 340, w: 280, h: 30 },
  { x: 1370, y: 435, w: 310, h: 30 },
  { x: 1770, y: 360, w: 260, h: 30 },
  { x: 2110, y: 455, w: 390, h: 85 },
  { x: 2570, y: 405, w: 220, h: 30 },
  { x: 2920, y: 335, w: 250, h: 30 },
  { x: 3250, y: 455, w: 150, h: 85 },
  { x: 420, y: 320, w: 180, h: 24 },
  { x: 780, y: 240, w: 150, h: 24 },
  { x: 1180, y: 180, w: 180, h: 24 },
  { x: 1530, y: 265, w: 160, h: 24 },
  { x: 1970, y: 185, w: 150, h: 24 },
  { x: 2670, y: 260, w: 150, h: 24 },
  { x: 3050, y: 190, w: 150, h: 24 },
];

const coinSpots = [
  [180, 420], [280, 420], [455, 265], [520, 265], [730, 370],
  [820, 190], [1060, 290], [1150, 290], [1240, 130], [1450, 385],
  [1570, 215], [1810, 310], [1910, 310], [2020, 135], [2220, 405],
  [2320, 405], [2420, 405], [2630, 350], [2730, 350], [2990, 280],
  [3090, 280], [3310, 405],
];

const enemySpots = [
  { x: 350, y: 445, left: 80, right: 520, speed: 0.7 },
  { x: 1090, y: 310, left: 1010, right: 1290, speed: 0.8 },
  { x: 1490, y: 405, left: 1370, right: 1680, speed: 0.65 },
  { x: 2190, y: 425, left: 2110, right: 2480, speed: 0.9 },
  { x: 2630, y: 375, left: 2570, right: 2790, speed: 0.7 },
  { x: 2990, y: 305, left: 2920, right: 3170, speed: 0.75 },
];

const goal = { x: 3300, y: 405, w: 42, h: 50 };
let player;
let coins;
let enemies;
let cameraX;
let lives;
let gameState;
let paused;
let lastTime = 0;

function resetGame() {
  player = { x: 80, y: 420, w: 28, h: 42, vx: 0, vy: 0, grounded: false, facing: 1, bounceCount: 0 };
  coins = coinSpots.map(([x, y]) => ({ x, y, collected: false, bob: Math.random() * Math.PI * 2 }));
  enemies = enemySpots.map((enemy) => ({ ...enemy, y: enemy.y, w: 30, h: 30, direction: 1 }));
  cameraX = 0;
  lives = 3;
  gameState = "playing";
  paused = false;
  pauseButton.textContent = "Pause";
  message.classList.add("is-hidden");
  updateHud();
}

function updateHud() {
  const collected = coins.filter((coin) => coin.collected).length;
  coinCount.textContent = `${collected}/${coins.length}`;
  lifeCount.textContent = lives;
}

function isDown(...names) {
  return names.some((name) => keys.has(name));
}

function update(delta) {
  if (gameState !== "playing" || paused) return;

  const move = (isDown("ArrowRight", "d", "D") ? 1 : 0) - (isDown("ArrowLeft", "a", "A") ? 1 : 0);
  player.vx += move * 0.7 * delta;
  player.vx *= Math.pow(0.82, delta);
  player.vx = Math.max(-5.4, Math.min(5.4, player.vx));
  if (move) player.facing = move;

  player.vy += gravity * delta;
  player.x += player.vx * delta;
  player.y += player.vy * delta;
  player.grounded = false;
  player.x = Math.max(0, Math.min(worldWidth - player.w, player.x));

  for (const platform of platforms) {
    const fallingIntoPlatform = player.vy >= 0
      && player.x + player.w > platform.x
      && player.x < platform.x + platform.w
      && player.y + player.h >= platform.y
      && player.y + player.h - player.vy * delta <= platform.y;
    if (fallingIntoPlatform) {
      player.y = platform.y - player.h;
      player.grounded = true;
      if (player.bounceCount === 0) {
        player.vy = -2.2;
        player.bounceCount = 1;
      } else {
        player.vy = 0;
      }
    }
  }

  for (const enemy of enemies) {
    enemy.x += enemy.speed * enemy.direction * delta;
    if (enemy.x <= enemy.left || enemy.x + enemy.w >= enemy.right) enemy.direction *= -1;
    if (overlaps(player, enemy)) loseLife();
  }

  for (const coin of coins) {
    coin.bob += 0.05 * delta;
    if (!coin.collected && Math.abs(player.x + player.w / 2 - coin.x) < 22
      && Math.abs(player.y + player.h / 2 - coin.y) < 30) {
      coin.collected = true;
      updateHud();
    }
  }

  if (overlaps(player, goal)) finishGame();
  if (player.y > HEIGHT + 100) loseLife();
  cameraX += ((player.x - WIDTH * 0.35) - cameraX) * 0.08 * delta;
  cameraX = Math.max(0, Math.min(worldWidth - WIDTH, cameraX));
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function loseLife() {
  if (gameState !== "playing") return;
  lives -= 1;
  updateHud();
  if (lives <= 0) {
    showMessage("RUN OVER", "The sky can wait.", "Press R or tap the button to try again.");
    gameState = "lost";
    return;
  }
  player.x = 80;
  player.y = 420;
  player.vx = 0;
  player.vy = 0;
  player.bounceCount = 0;
}

function finishGame() {
  gameState = "won";
  const collected = coins.filter((coin) => coin.collected).length;
  showMessage("LEVEL COMPLETE", `${collected === coins.length ? "Perfect run!" : "You made it!"}`, "Press R or tap the button to run it back.");
}

function showMessage(kicker, title, copy) {
  messageKicker.textContent = kicker;
  messageTitle.textContent = title;
  messageCopy.textContent = copy;
  message.classList.remove("is-hidden");
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground();
  ctx.save();
  ctx.translate(-cameraX, 0);
  platforms.forEach(drawPlatform);
  coins.filter((coin) => !coin.collected).forEach(drawCoin);
  enemies.forEach(drawEnemy);
  drawGoal();
  drawPlayer();
  ctx.restore();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#102e52");
  sky.addColorStop(1, "#28627b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "rgba(151, 215, 228, 0.12)";
  for (let i = 0; i < 12; i += 1) {
    const x = i * 230 - (cameraX * 0.18 % 230);
    ctx.beginPath();
    ctx.arc(x, 350, 130, Math.PI, 0);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255, 226, 138, 0.85)";
  ctx.beginPath();
  ctx.arc(790, 92, 34, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatform(platform) {
  ctx.fillStyle = "#ee9a5d";
  ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
  ctx.fillStyle = "#5cd184";
  ctx.fillRect(platform.x, platform.y, platform.w, 8);
  ctx.fillStyle = "rgba(94, 45, 69, 0.25)";
  for (let x = platform.x + 8; x < platform.x + platform.w; x += 22) {
    ctx.fillRect(x, platform.y + 13, 9, 5);
  }
}

function drawCoin(coin) {
  const y = coin.y + Math.sin(coin.bob) * 4;
  ctx.fillStyle = "#ffcf4a";
  ctx.beginPath();
  ctx.ellipse(coin.x, y, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff1a6";
  ctx.fillRect(coin.x - 2, y - 7, 3, 7);
}

function drawEnemy(enemy) {
  ctx.fillStyle = "#d94e76";
  ctx.beginPath();
  ctx.arc(enemy.x + 15, enemy.y + 15, 15, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#f9d3be";
  ctx.fillRect(enemy.x + 7, enemy.y + 11, 5, 5);
  ctx.fillRect(enemy.x + 18, enemy.y + 11, 5, 5);
  ctx.fillStyle = "#172033";
  ctx.fillRect(enemy.x + 9, enemy.y + 13, 2, 2);
  ctx.fillRect(enemy.x + 20, enemy.y + 13, 2, 2);
}

function drawGoal() {
  ctx.fillStyle = "#d9e8ff";
  ctx.fillRect(goal.x + 5, goal.y, 5, goal.h);
  ctx.fillStyle = "#ffcf4a";
  ctx.beginPath();
  ctx.moveTo(goal.x + 10, goal.y + 3);
  ctx.lineTo(goal.x + goal.w, goal.y + 14);
  ctx.lineTo(goal.x + 10, goal.y + 25);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer() {
  if (playerSprite) {
    ctx.drawImage(playerSprite, player.x - 12, player.y - 7, 52, 52);
    return;
  }

  ctx.fillStyle = "#7de2d1";
  ctx.fillRect(player.x, player.y + 9, player.w, player.h - 9);
  ctx.fillStyle = "#f8c8a9";
  ctx.beginPath();
  ctx.arc(player.x + player.w / 2, player.y + 9, 11, 0, Math.PI * 2);
  ctx.fill();
}

function jump() {
  if (gameState === "playing" && player.grounded) {
    player.vy = -11.5;
    player.grounded = false;
    player.bounceCount = 0;
  }
}

function togglePause() {
  if (gameState !== "playing") return;
  paused = !paused;
  pauseButton.textContent = paused ? "Resume" : "Pause";
  if (paused) {
    showMessage("PAUSED", "Take a breather.", "Press P or tap Resume when you are ready.");
    restartButton.textContent = "Resume";
  } else {
    message.classList.add("is-hidden");
    restartButton.textContent = "Play again";
  }
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  if (event.key.toLowerCase() === "r") resetGame();
  if (!event.repeat && event.key.toLowerCase() === "p") togglePause();
  if (!event.repeat && ["ArrowUp", "w", "W", " "].includes(event.key)) jump();
  keys.add(event.key);
});

window.addEventListener("keyup", (event) => keys.delete(event.key));
restartButton.addEventListener("click", () => {
  if (paused) {
    togglePause();
  } else {
    resetGame();
  }
});
pauseButton.addEventListener("click", togglePause);

function frame(time) {
  const delta = Math.min((time - lastTime) / 16.67 || 1, 2);
  lastTime = time;
  update(delta);
  draw();
  requestAnimationFrame(frame);
}

resetGame();
requestAnimationFrame(frame);
