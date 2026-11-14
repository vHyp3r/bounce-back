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
const level3Button = document.querySelector("#level-3-button");
const level4Button = document.querySelector("#level-4-button");
const pauseButton = document.querySelector("#pause-button");
const startupScreen = document.querySelector("#startup-screen");
const loadingPanel = document.querySelector("#loading-panel");
const splashPanel = document.querySelector("#splash-panel");
const loadingBar = document.querySelector("#loading-bar");
const loadingStatus = document.querySelector("#loading-status");
const logoImage = document.querySelector("#logo-image");
const startButton = document.querySelector("#start-button");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const keys = new Set();
const spaceBackground = new Image();
spaceBackground.src = "assets/level-2-space.png";
const logoSource = new Image();
let processedLogo;
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
  spriteCanvas.width = 170;
  spriteCanvas.height = 125;
  const spriteContext = spriteCanvas.getContext("2d", { willReadFrequently: true });
  spriteContext.drawImage(monsterImage, 610, 325, 170, 125, 0, 0, 170, 125);
  const imageData = spriteContext.getImageData(0, 0, 170, 125);
  for (let index = 0; index < imageData.data.length; index += 4) {
    if (imageData.data[index] > 245 && imageData.data[index + 1] > 245 && imageData.data[index + 2] > 245) {
      imageData.data[index + 3] = 0;
    }
  }
  spriteContext.putImageData(imageData, 0, 0);
  monsterSprite = spriteCanvas;
});

logoSource.src = "assets/bounce-back-logo.png";
logoSource.addEventListener("load", () => {
  const logoCanvas = document.createElement("canvas");
  logoCanvas.width = 380;
  logoCanvas.height = 350;
  const logoContext = logoCanvas.getContext("2d", { willReadFrequently: true });
  logoContext.drawImage(logoSource, 490, 205, 390, 355, 0, 0, 380, 350);
  const imageData = logoContext.getImageData(0, 0, 380, 350);
  const { data } = imageData;
  const isDark = (index) => data[index] < 35 && data[index + 1] < 35 && data[index + 2] < 35;
  const visited = new Uint8Array(380 * 350);
  const stack = [];

  for (let x = 0; x < 380; x += 1) stack.push([x, 0], [x, 349]);
  for (let y = 0; y < 350; y += 1) stack.push([0, y], [379, y]);
  while (stack.length) {
    const [x, y] = stack.pop();
    const position = y * 380 + x;
    if (visited[position]) continue;
    visited[position] = 1;
    const index = position * 4;
    if (isDark(index)) {
      data[index + 3] = 0;
      if (x > 0) stack.push([x - 1, y]);
      if (x < 379) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < 349) stack.push([x, y + 1]);
    }
  }
  for (let index = 0; index < data.length; index += 4) {
    if (data[index] > 245 && data[index + 1] > 245 && data[index + 2] > 245) data[index + 3] = 0;
  }
  logoContext.putImageData(imageData, 0, 0);
  processedLogo = logoCanvas.toDataURL();
  logoImage.src = processedLogo;
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
    checkpoints: [{ x: 0, y: 433 }, { x: 1370, y: 393 }, { x: 2570, y: 363 }],
    slopes: [],
    jumpPads: [],
    gravity: 0.55,
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
    checkpoints: [{ x: 0, y: 433 }, { x: 1300, y: 383 }, { x: 2520, y: 348 }],
    slopes: [[460, 410, 110, 65, -1], [830, 335, 100, 75, -1], [1600, 350, 120, 75, -1]],
    jumpPads: [[815, 395, 38, 15, -15], [1565, 410, 38, 15, -16], [2405, 440, 38, 15, -15]],
    gravity: 0.32,
    goal: [3190, 405],
    theme: "space",
  },
  {
    name: "Solar Lift",
    worldWidth: 3350,
    platforms: [
      [0, 475, 420, 65], [620, 420, 210, 30], [1010, 350, 240, 30],
      [1430, 430, 250, 30], [1870, 350, 260, 30], [2280, 455, 420, 85],
      [2800, 390, 220, 30], [3150, 455, 200, 85], [760, 240, 150, 24],
      [1180, 190, 160, 24], [1600, 245, 160, 24], [2050, 180, 160, 24],
      [2600, 235, 150, 24],
    ],
    movingPlatforms: [
      { x: 420, y: 390, w: 130, h: 22, axis: "y", range: 100, speed: 0.035 },
      { x: 850, y: 300, w: 120, h: 22, axis: "x", range: 100, speed: 0.03 },
      { x: 1680, y: 300, w: 130, h: 22, axis: "y", range: 80, speed: 0.04 },
      { x: 2130, y: 270, w: 120, h: 22, axis: "x", range: 110, speed: 0.035 },
    ],
    fans: [[520, 345, 90, 130, 0.48], [1350, 300, 90, 145, 0.5], [2160, 300, 90, 155, 0.55]],
    coins: [[140, 420], [280, 420], [470, 340], [700, 365], [800, 185], [1070, 295],
      [1210, 135], [1470, 375], [1640, 190], [1910, 295], [2090, 125], [2340, 405],
      [2490, 405], [2640, 190], [2860, 340], [3260, 405]],
    enemies: [[260, 445, 60, 380, 0.7], [1090, 320, 1010, 1250, 0.75],
      [1500, 400, 1430, 1680, 0.7], [2380, 425, 2280, 2700, 0.8], [2860, 360, 2800, 3020, 0.8]],
    checkpoints: [{ x: 0, y: 433 }, { x: 1430, y: 388 }, { x: 2800, y: 348 }],
    slopes: [],
    jumpPads: [],
    gravity: 0.42,
    goal: [3260, 405],
    theme: "space",
  },
  {
    name: "Portal Paradox",
    worldWidth: 3500,
    platforms: [
      [0, 475, 500, 65], [650, 400, 230, 30], [1030, 320, 240, 30],
      [1400, 430, 260, 30], [1800, 350, 260, 30], [2200, 455, 360, 85],
      [2700, 380, 230, 30], [3090, 455, 410, 85], [820, 220, 150, 24],
      [1180, 170, 150, 24], [1530, 250, 150, 24], [1980, 190, 150, 24],
      [2460, 255, 150, 24], [2900, 190, 150, 24],
    ],
    portals: [
      { x: 470, y: 420, w: 30, h: 55, targetX: 1400, targetY: 388 },
      { x: 1270, y: 265, w: 30, h: 55, targetX: 2460, targetY: 213 },
      { x: 2580, y: 400, w: 30, h: 55, targetX: 3090, targetY: 413 },
    ],
    coins: [[160, 420], [310, 420], [700, 345], [850, 165], [1080, 265], [1220, 115],
      [1450, 375], [1570, 195], [1850, 295], [2020, 135], [2300, 405], [2440, 405],
      [2730, 325], [2860, 145], [3160, 405], [3350, 405]],
    enemies: [[300, 445, 70, 450, 0.75], [1090, 290, 1030, 1270, 0.8],
      [1460, 400, 1400, 1660, 0.7], [2320, 425, 2200, 2560, 0.8], [3170, 425, 3090, 3470, 0.9]],
    checkpoints: [{ x: 0, y: 433 }, { x: 1400, y: 388 }, { x: 2700, y: 338 }],
    slopes: [],
    jumpPads: [],
    gravity: 0.45,
    goal: [3370, 405],
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
  player = {
    x: 80, y: 420, w: 28, h: 42, vx: 0, vy: 0, grounded: false, facing: 1,
    bounceCount: 0, jumps: 0, portalCooldown: 0,
  };
  coins = level.coins.map(([x, y]) => ({ x, y, collected: preserveCoins && coins?.some((coin) => coin.x === x && coin.y === y && coin.collected), bob: Math.random() * Math.PI * 2 }));
  enemies = level.enemies.map(([x, y, left, right, speed]) => ({ x, y, left, right, speed, w: 30, h: 30, direction: 1 }));
  level.movingPlatforms = (level.movingPlatforms || []).map((platform) => ({
    ...platform, baseX: platform.x, baseY: platform.y, time: 0,
  }));
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
  level3Button.classList.add("is-hidden");
  level4Button.classList.add("is-hidden");
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
  player.vy += level.gravity * delta;
  player.x += player.vx * delta;
  player.y += player.vy * delta;
  player.grounded = false;
  player.x = Math.max(0, Math.min(level.worldWidth - player.w, player.x));

  for (const platform of level.movingPlatforms) {
    platform.time += platform.speed * delta;
    const offset = Math.sin(platform.time) * platform.range;
    if (platform.axis === "x") platform.x = platform.baseX + offset;
    else platform.y = platform.baseY + offset;
  }

  const solidPlatforms = [
    ...level.platforms.map(([x, y, w, h]) => ({ x, y, w, h })),
    ...level.movingPlatforms,
  ];
  for (const platform of solidPlatforms) {
    if (player.vy >= 0 && player.x + player.w > platform.x && player.x < platform.x + platform.w
      && player.y + player.h >= platform.y && player.y + player.h - player.vy * delta <= platform.y) {
      player.y = platform.y - player.h;
      player.grounded = true;
      player.jumps = 0;
      if (player.bounceCount === 0) {
        player.vy = -2.2;
        player.bounceCount = 1;
      } else player.vy = 0;
    }
  }

  for (const slope of level.slopes) {
    const [x, y, width, height, direction] = slope;
    const progress = (player.x + player.w / 2 - x) / width;
    const surfaceY = direction < 0 ? y + height - progress * height : y + progress * height;
    const previousBottom = player.y + player.h - player.vy * delta;
    if (progress >= 0 && progress <= 1 && player.vy >= 0
      && player.y + player.h >= surfaceY && previousBottom <= surfaceY + 14) {
      player.y = surfaceY - player.h;
      player.grounded = true;
      player.jumps = 0;
      player.vy = 0;
    }
  }

  for (const pad of level.jumpPads) {
    const [x, y, width, height, force] = pad;
    if (player.x + player.w > x && player.x < x + width
      && player.y + player.h >= y && player.y + player.h <= y + height + 12 && player.vy >= 0) {
      player.y = y - player.h;
      player.vy = force;
      player.grounded = false;
      player.jumps = 1;
    }
  }

  for (const fan of level.fans || []) {
    const [x, y, width, height, force] = fan;
    if (player.x + player.w > x && player.x < x + width && player.y + player.h > y && player.y < y + height) {
      player.vy -= force * delta;
    }
  }

  if (player.portalCooldown > 0) player.portalCooldown -= delta;
  for (const portal of level.portals || []) {
    if (player.portalCooldown <= 0 && overlaps(player, portal)) {
      player.x = portal.targetX;
      player.y = portal.targetY;
      player.vx = 0;
      player.vy = 0;
      player.portalCooldown = 30;
      break;
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
    if (player.x >= level.checkpoints[index].x) checkpointIndex = index;
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
  const checkpoint = level.checkpoints[checkpointIndex];
  player.x = checkpoint.x + 30;
  player.y = checkpoint.y;
  player.vx = 0;
  player.vy = 0;
  player.bounceCount = 0;
  player.jumps = 0;
  player.portalCooldown = 30;
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
  level3Button.textContent = "Level 3";
  level4Button.textContent = "Level 4";
  level3Button.classList.remove("is-hidden");
  level4Button.classList.remove("is-hidden");
  continueButton.style.display = "none";
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground();
  ctx.save();
  ctx.translate(-cameraX, 0);
  if (level.theme === "space") drawSpaceDecorations();
  level.platforms.forEach(drawPlatform);
  level.movingPlatforms.forEach(drawMovingPlatform);
  level.slopes.forEach(drawSlope);
  level.jumpPads.forEach(drawJumpPad);
  (level.fans || []).forEach(drawFan);
  (level.portals || []).forEach(drawPortal);
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
  ctx.fillStyle = level.theme === "space" ? "rgba(238, 191, 255, 0.85)" : "rgba(255, 226, 138, 0.85)";
  ctx.beginPath();
  ctx.arc(790, 92, level.theme === "space" ? 48 : 34, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpaceDecorations() {
  const stars = [
    [120, 110, 2], [300, 190, 3], [520, 90, 2], [840, 170, 2], [1120, 105, 3],
    [1460, 120, 2], [1710, 80, 3], [2050, 150, 2], [2390, 95, 3], [2780, 120, 2],
    [3140, 95, 3],
  ];
  stars.forEach(([x, y, radius]) => {
    ctx.fillStyle = "rgba(255, 226, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "rgba(255, 190, 246, 0.18)";
  ctx.beginPath();
  ctx.arc(1540, 110, 105, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(125, 226, 209, 0.18)";
  ctx.beginPath();
  ctx.arc(2740, 165, 70, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatform(platform) {
  const [x, y, w, h] = platform;
  ctx.fillStyle = level.theme === "space" ? "#6d3aa5" : "#ee9a5d";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = level.theme === "space" ? "#e78bdb" : "#5cd184";
  ctx.fillRect(x, y, w, 8);
  ctx.fillStyle = level.theme === "space" ? "rgba(34, 12, 72, 0.6)" : "rgba(94, 45, 69, 0.25)";
  for (let tileX = x + 8; tileX < x + w; tileX += 22) ctx.fillRect(tileX, y + 13, 9, 5);
  if (level.theme === "space") {
    ctx.strokeStyle = "rgba(255, 190, 246, 0.4)";
    ctx.strokeRect(x, y, w, h);
  }
}

function drawSlope(slope) {
  const [x, y, width, height, direction] = slope;
  ctx.fillStyle = "#6d3aa5";
  ctx.beginPath();
  ctx.moveTo(x, y + (direction < 0 ? height : 0));
  ctx.lineTo(x + width, y + (direction < 0 ? 0 : height));
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#e78bdb";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawMovingPlatform(platform) {
  drawPlatform([platform.x, platform.y, platform.w, platform.h]);
  ctx.strokeStyle = "#7de2d1";
  ctx.lineWidth = 2;
  ctx.strokeRect(platform.x - 2, platform.y - 2, platform.w + 4, platform.h + 4);
}

function drawJumpPad(pad) {
  const [x, y, width, height] = pad;
  ctx.fillStyle = "#7de2d1";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#fff1a6";
  ctx.beginPath();
  ctx.moveTo(x + 8, y + height);
  ctx.lineTo(x + width / 2, y - 7);
  ctx.lineTo(x + width - 8, y + height);
  ctx.closePath();
  ctx.fill();
}

function drawFan(fan) {
  const [x, y, width, height] = fan;
  ctx.fillStyle = "rgba(125, 226, 209, 0.14)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(125, 226, 209, 0.65)";
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = "#7de2d1";
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y + 12);
  ctx.lineTo(x + 12, y + height - 12);
  ctx.lineTo(x + width - 12, y + height - 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff1a6";
  ctx.fillRect(x + width / 2 - 3, y + height - 9, 6, 6);
}

function drawPortal(portal) {
  ctx.strokeStyle = "#ffb8f1";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(portal.x + portal.w / 2, portal.y + portal.h / 2, portal.w / 2, portal.h / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(125, 226, 209, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(portal.x + portal.w / 2, portal.y + portal.h / 2, portal.w / 2 - 5, portal.h / 2 - 5, 0, 0, Math.PI * 2);
  ctx.stroke();
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
    ctx.drawImage(monsterSprite, enemy.x, enemy.y, enemy.w, enemy.h);
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
  level.checkpoints.slice(1).forEach((checkpoint, index) => {
    const active = checkpointIndex >= index + 1;
    const flagY = checkpoint.y + player.h - 45;
    ctx.fillStyle = "#d9e8ff";
    ctx.fillRect(checkpoint.x, flagY, 4, 45);
    ctx.fillStyle = active ? "#7de2d1" : "#8a78a8";
    ctx.beginPath();
    ctx.moveTo(checkpoint.x + 4, flagY + 2);
    ctx.lineTo(checkpoint.x + 30, flagY + 11);
    ctx.lineTo(checkpoint.x + 4, flagY + 20);
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
  if (gameState === "playing" && !paused && (player.grounded || player.jumps < 2)) {
    player.vy = -11.5;
    player.grounded = false;
    player.bounceCount = 0;
    player.jumps += 1;
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
level3Button.addEventListener("click", () => loadLevel(2));
level4Button.addEventListener("click", () => loadLevel(3));
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

function preloadAssets() {
  const assets = [
    ["Star player", "assets/star-player.png"],
    ["Purple monsters", "assets/purple-monster.png"],
    ["Space background", "assets/level-2-space.png"],
    ["Bounce Back logo", "assets/bounce-back-logo.png"],
  ];
  let loaded = 0;
  const updateProgress = (label) => {
    loaded += 1;
    loadingBar.style.width = `${(loaded / assets.length) * 100}%`;
    loadingStatus.textContent = loaded === assets.length ? "Ready to launch!" : `Loading ${label}...`;
  };

  assets.forEach(([label, source]) => {
    const image = new Image();
    image.addEventListener("load", () => updateProgress(label), { once: true });
    image.addEventListener("error", () => updateProgress(`${label} (fallback)`), { once: true });
    image.src = source;
  });

  const finishLoading = () => {
    if (loaded !== assets.length) {
      window.setTimeout(finishLoading, 50);
      return;
    }
    loadingPanel.classList.add("is-hidden");
    splashPanel.classList.remove("is-hidden");
  };
  finishLoading();
}

function startGame() {
  startupScreen.classList.add("is-hidden");
  loadLevel(0);
  requestAnimationFrame(frame);
}

startButton.addEventListener("click", startGame, { once: true });
preloadAssets();
