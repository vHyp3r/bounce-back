const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const coinCount = document.querySelector("#coin-count");
const lifeCount = document.querySelector("#life-count");
const message = document.querySelector("#game-message");
const messageKicker = document.querySelector("#message-kicker");
const messageTitle = document.querySelector("#message-title");
const messageCopy = document.querySelector("#message-copy");
const restartButton = document.querySelector("#restart-button");
const levelSelectButton = document.querySelector("#level-select-button");
const continueButton = document.querySelector("#continue-button");
const pauseButton = document.querySelector("#pause-button");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const gravity = 0.55;
const keys = new Set();
const spaceBackground = new Image();
spaceBackground.src = "assets/level-2-space.png";
let playerSprite;

const playerImage = new Image();
playerImage.src = "assets/star-player.png";
playerImage.addEventListener("load", () => {
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = 320;
  spriteCanvas.height = 320;
  const spriteContext = spriteCanvas.getContext("2d", { willReadFrequently: true });
  spriteContext.drawImage(playerImage, 500, 200, 360, 360, 0, 0, 320, 320);
  const imageData = spriteContext.getImageData(0, 0, 320, 320);
  for (let index = 0; index < imageData.data.length; index += 4) {
    if (imageData.data[index] > 245 && imageData.data[index + 1] > 245 && imageData.data[index + 2] > 245) {
      imageData.data[index + 3] = 0;
    }
  }
  spriteContext.putImageData(imageData, 0, 0);
  playerSprite = spriteCanvas;
});

const monsterImage = new Image();
monsterImage.src = "assets/purple-monster.png";
let monsterSprite;
monsterImage.addEventListener("load", () => {
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = 260;
  spriteCanvas.height = 180;
  const spriteContext = spriteCanvas.getContext("2d", { willReadFrequently: true });
  spriteContext.drawImage(monsterImage, 520, 300, 330, 220, 0, 0, 260, 180);
  const imageData = spriteContext.getImageData(0, 0, 260, 180);
  for (let index = 0; index < imageData.data.length; index += 4) {
    if (imageData.data[index] > 245 && imageData.data[index + 1] > 245 && imageData.data[index + 2] > 245) {
      imageData.data[index + 3] = 0;
    }
  }
  spriteContext.putImageData(imageData, 0, 0);
  monsterSprite = spriteCanvas;
});

const levels = [
  {
    name: "Meadow Run",
    worldWidth: 3400,
    platforms: [
      [0, 475, 570, 65], [670, 420, 250, 30], [1010, 340, 280, 30],
      [1370, 435, 310, 30], [1770, 360, 260, 30], [2110, 455, 390, 85],
      [2570, 405, 220, 30], [2920, 335, 250, 30], [3250, 455, 150, 85],
      [420, 320, 180, 24], [780, 240, 150, 24], [1180, 180, 180, 24],
      [1530, 265, 160, 24], [1970, 185, 150, 24], [2670, 260, 150, 24],
      [3050, 190, 150, 24],
    ],
    coins: [[180, 420], [280, 420], [455, 265], [520, 265], [730, 370], [820, 190],
      [1060, 290], [1150, 290], [1240, 130], [1450, 385], [1570, 215], [1810, 310],
      [1910, 310], [2020, 135], [2220, 405], [2320, 405], [2420, 405], [2630, 350],
      [2730, 350], [2990, 280], [3090, 280], [3310, 405]],
    enemies: [[350, 445, 80, 520, 0.7], [1090, 310, 1010, 1290, 0.8],
      [1490, 405, 1370, 1680, 0.65], [2190, 425, 2110, 2480, 0.9],
      [2630, 375, 2570, 2790, 0.7], [2990, 305, 2920, 3170, 0.75]],
    checkpoints: [0, 1370, 2570],
    goal: [3300, 405],
    theme: "meadow",
  },
  {
    name: "Moonlit Drift",
    worldWidth: 3300,
    platforms: [
      [0, 475, 460, 65], [570, 410, 260, 30], [930, 335, 260, 30],
      [1300, 425, 300, 30], [1720, 350, 260, 30], [2070, 455, 360, 85],
      [2520, 390, 250, 30], [2870, 455, 430, 85], [300, 280, 160, 24],
      [730, 235, 150, 24], [1100, 180, 170, 24], [1450, 255, 170, 24],
      [1880, 190, 160, 24], [2290, 250, 160, 24], [2650, 205, 150, 24],
    ],
    coins: [[150, 420], [260, 420], [630, 355], [750, 355], [790, 185], [980, 280],
      [1100, 125], [1160, 280], [1370, 370], [1510, 370], [1520, 200], [1800, 295],
      [1920, 135], [2160, 405], [2280, 405], [2400, 340], [2580, 335], [2700, 335],
      [2920, 405], [3090, 405], [3200, 405]],
    enemies: [[290, 445, 60, 420, 0.75], [1000, 305, 930, 1190, 0.7],
      [1410, 395, 1300, 1600, 0.8], [2200, 425, 2070, 2430, 0.9],
      [2610, 360, 2520, 2770, 0.75], [3030, 425, 2870, 3270, 0.8]],
    checkpoints: [0, 1300, 2520],
    goal: [3190, 405],
    theme: "space",
  },
];

let levelIndex = 0;
let level;
let player;
let coins;
let enemies;
let cameraX;
let lives;
let checkpointIndex;
let gameState;
let paused;
let lastTime = 0;

function loadLevel(index, preserveCoins = false) {
  levelIndex = index;
  level = levels[levelIndex];
  player = { x: 80, y: 420, w: 28, h: 42, vx: 0, vy: 0, grounded: false, facing: 1, bounceCount: 0 };
  coins = level.coins.map(([x, y]) => ({ x, y, collected: preserveCoins && coins?.some((coin) => coin.x === x && coin.y === y && coin.collected), bob: Math.random() * Math.PI * 2 }));
  enemies = level.enemies.map(([x, y, left, right, speed]) => ({ x, y, left, right, speed, w: 30, h: 30, direction: 1 }));
  cameraX = 0;
  lives = 3;
  checkpointIndex = 0;
  gameState = "playing";
  paused = false;
  pauseButton.textContent = "Pause";
  restartButton.textContent = "Restart level";
  levelSelectButton.textContent = "Level select";
  levelSelectButton.style.display = "inline-block";
  continueButton.style.display = "inline-block";
  message.classList.add("is-hidden");
  updateHud();
}

function resetLevel() {
  loadLevel(levelIndex);
}

function updateHud() {
  coinCount.textContent = `${coins.filter((coin) => coin.collected).length}/${coins.length}`;
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
  player.x = Math.max(0, Math.min(level.worldWidth - player.w, player.x));

  for (const platform of level.platforms) {
    const [x, y, w, h] = platform;
    if (player.vy >= 0 && player.x + player.w > x && player.x < x + w
      && player.y + player.h >= y && player.y + player.h - player.vy * delta <= y) {
      player.y = y - player.h;
      player.grounded = true;
      if (player.bounceCount === 0) {
        player.vy = -2.2;
        player.bounceCount = 1;
      } else player.vy = 0;
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
  const [goalX, goalY] = level.goal;
  if (overlaps(player, { x: goalX, y: goalY, w: 42, h: 50 })) finishGame();
  if (player.y > HEIGHT + 100) loseLife();
  for (let index = checkpointIndex + 1; index < level.checkpoints.length; index += 1) {
    if (player.x >= level.checkpoints[index]) checkpointIndex = index;
  }
  cameraX += ((player.x - WIDTH * 0.35) - cameraX) * 0.08 * delta;
  cameraX = Math.max(0, Math.min(level.worldWidth - WIDTH, cameraX));
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function loseLife() {
  if (gameState !== "playing") return;
  lives -= 1;
  updateHud();
  if (lives <= 0) {
    showMessage("RUN OVER", "The sky can wait.", "Your coins return when you restart the level.");
    gameState = "lost";
    return;
  }
  const respawnX = level.checkpoints[checkpointIndex] + 30;
  const platform = level.platforms.find(([x, y, w]) => respawnX >= x && respawnX <= x + w);
  player.x = respawnX;
  player.y = platform ? platform[1] - player.h : 420;
  player.vx = 0;
  player.vy = 0;
  player.bounceCount = 0;
}

function finishGame() {
  gameState = "won";
  const collected = coins.filter((coin) => coin.collected).length;
  showMessage("LEVEL COMPLETE", `${level.name} cleared!`, `${collected}/${coins.length} coins collected.`);
}

function showMessage(kicker, title, copy, showContinue = true) {
  messageKicker.textContent = kicker;
  messageTitle.textContent = title;
  messageCopy.textContent = copy;
  continueButton.style.display = showContinue ? "inline-block" : "none";
  message.classList.remove("is-hidden");
}

function showLevelSelect() {
  gameState = "menu";
  showMessage("LEVEL SELECT", "Choose your route", "Start a level below.", false);
  restartButton.textContent = "Level 1";
  levelSelectButton.textContent = "Level 2";
  continueButton.style.display = "none";
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground();
  ctx.save();
  ctx.translate(-cameraX, 0);
  level.platforms.forEach(drawPlatform);
  coins.filter((coin) => !coin.collected).forEach(drawCoin);
  enemies.forEach(drawEnemy);
  drawGoal();
  drawCheckpoints();
  drawPlayer();
  ctx.restore();
}

function drawBackground() {
  if (level.theme === "space" && spaceBackground.complete) {
    ctx.globalAlpha = 0.72;
    ctx.drawImage(spaceBackground, 0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(25, 9, 54, 0.58)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, level.theme === "space" ? "#190c3d" : "#102e52");
    sky.addColorStop(1, level.theme === "space" ? "#5d2073" : "#28627b");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "rgba(151, 215, 228, 0.12)";
    for (let i = 0; i < 12; i += 1) {
      const x = i * 230 - (cameraX * 0.18 % 230);
      ctx.beginPath();
      ctx.arc(x, 350, 130, Math.PI, 0);
      ctx.fill();
    }
  }
  ctx.fillStyle = "rgba(255, 226, 138, 0.85)";
  ctx.beginPath();
  ctx.arc(790, 92, 34, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatform(platform) {
  const [x, y, w, h] = platform;
  ctx.fillStyle = level.theme === "space" ? "#9a5bd4" : "#ee9a5d";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = level.theme === "space" ? "#f287d7" : "#5cd184";
  ctx.fillRect(x, y, w, 8);
  ctx.fillStyle = level.theme === "space" ? "rgba(36, 12, 72, 0.35)" : "rgba(94, 45, 69, 0.25)";
  for (let tileX = x + 8; tileX < x + w; tileX += 22) ctx.fillRect(tileX, y + 13, 9, 5);
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
  if (monsterSprite) {
    ctx.drawImage(monsterSprite, enemy.x - 5, enemy.y - 7, 40, 35);
  } else {
    ctx.fillStyle = "#d94e76";
    ctx.fillRect(enemy.x, enemy.y + 8, enemy.w, enemy.h - 8);
  }
}

function drawGoal() {
  const [x, y] = level.goal;
  ctx.fillStyle = "#d9e8ff";
  ctx.fillRect(x + 5, y, 5, 50);
  ctx.fillStyle = "#ffcf4a";
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 3);
  ctx.lineTo(x + 42, y + 14);
  ctx.lineTo(x + 10, y + 25);
  ctx.closePath();
  ctx.fill();
}

function drawCheckpoints() {
  level.checkpoints.slice(1).forEach((x, index) => {
    const active = checkpointIndex >= index + 1;
    ctx.fillStyle = "#d9e8ff";
    ctx.fillRect(x, 390, 4, 45);
    ctx.fillStyle = active ? "#7de2d1" : "#8a78a8";
    ctx.beginPath();
    ctx.moveTo(x + 4, 392);
    ctx.lineTo(x + 30, 401);
    ctx.lineTo(x + 4, 410);
    ctx.closePath();
    ctx.fill();
  });
}

function drawPlayer() {
  if (playerSprite) ctx.drawImage(playerSprite, player.x - 12, player.y - 7, 52, 52);
  else {
    ctx.fillStyle = "#7de2d1";
    ctx.fillRect(player.x, player.y + 9, player.w, player.h - 9);
  }
}

function jump() {
  if (gameState === "playing" && !paused && player.grounded) {
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
    showMessage("PAUSED", "Take a breather.", "Press P or tap Resume when ready.", false);
    restartButton.textContent = "Resume";
    levelSelectButton.style.display = "none";
  } else {
    message.classList.add("is-hidden");
    restartButton.textContent = "Restart level";
    levelSelectButton.style.display = "inline-block";
  }
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  if (event.key.toLowerCase() === "r") resetLevel();
  if (!event.repeat && event.key.toLowerCase() === "p") togglePause();
  if (!event.repeat && ["ArrowUp", "w", "W", " "].includes(event.key)) jump();
  keys.add(event.key);
});
window.addEventListener("keyup", (event) => keys.delete(event.key));

restartButton.addEventListener("click", () => {
  if (gameState === "menu") loadLevel(0);
  else if (paused) togglePause();
  else resetLevel();
});
levelSelectButton.addEventListener("click", () => {
  if (gameState === "menu") loadLevel(1);
  else showLevelSelect();
});
continueButton.addEventListener("click", () => {
  if (gameState === "won" && levelIndex < levels.length - 1) loadLevel(levelIndex + 1);
  else showLevelSelect();
});
pauseButton.addEventListener("click", togglePause);

function frame(time) {
  const delta = Math.min((time - lastTime) / 16.67 || 1, 2);
  lastTime = time;
  update(delta);
  draw();
  requestAnimationFrame(frame);
}

loadLevel(0);
requestAnimationFrame(frame);
