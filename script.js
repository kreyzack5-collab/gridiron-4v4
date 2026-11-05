const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const blueScoreEl = document.getElementById('blueScore');
const redScoreEl = document.getElementById('redScore');

const field = {
  width: canvas.width,
  height: canvas.height,
  goalWidth: 120,
  goalDepth: 20,
};

const keys = {};

window.addEventListener('keydown', (event) => {
  keys[event.key.toLowerCase()] = true;
  if (event.key.toLowerCase() === 'q') {
    attemptTackle();
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

const state = {
  blueScore: 0,
  redScore: 0,
};

function createPlayer(team, x, y, number, isHuman = false) {
  return {
    team,
    number,
    x,
    y,
    radius: 16,
    speed: 2.4,
    isHuman,
    hasBall: false,
    tackleCooldown: 0,
    color: team === 'blue' ? '#2f6bff' : '#ef4444',
  };
}

let players = [
  createPlayer('blue', 200, 210, 1, true),
  createPlayer('blue', 280, 340, 2),
  createPlayer('red', 760, 210, 9),
  createPlayer('red', 680, 340, 11),
];

const ball = {
  x: field.width / 2,
  y: field.height / 2,
  radius: 8,
  owner: null,
  vx: 0,
  vy: 0,
};

function resetPositions() {
  players = [
    createPlayer('blue', 200, 210, 1, true),
    createPlayer('blue', 280, 340, 2),
    createPlayer('red', 760, 210, 9),
    createPlayer('red', 680, 340, 11),
  ];

  ball.x = field.width / 2;
  ball.y = field.height / 2;
  ball.owner = null;
  ball.vx = 0;
  ball.vy = 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function hasBallCarrier() {
  return players.find((player) => player.hasBall);
}

function updateScoreboard() {
  blueScoreEl.textContent = state.blueScore;
  redScoreEl.textContent = state.redScore;
}

function findNearestEnemy(player) {
  const enemies = players.filter((p) => p.team !== player.team);
  let nearest = null;
  let shortest = Infinity;

  for (const enemy of enemies) {
    const d = dist(player, enemy);
    if (d < shortest) {
      shortest = d;
      nearest = enemy;
    }
  }

  return nearest;
}

function attemptTackle() {
  const user = players.find((player) => player.isHuman);
  if (!user || user.tackleCooldown > 0) return;

  const target = findNearestEnemy(user);
  if (!target) return;

  const reach = 46;
  const closeEnough = dist(user, target) < reach;
  if (!closeEnough) return;

  user.tackleCooldown = 0.9;

  if (target.hasBall) {
    target.hasBall = false;
    ball.owner = null;
    ball.vx = (target.x - user.x) * 0.15;
    ball.vy = (target.y - user.y) * 0.15;
  }

  if (ball.owner === target) {
    ball.owner = null;
    ball.vx = (target.x - user.x) * 0.2;
    ball.vy = (target.y - user.y) * 0.2;
  }

  if (user.hasBall) {
    user.hasBall = false;
    ball.owner = null;
    ball.vx = 1.8;
    ball.vy = 0;
  }
}

function movePlayer(player, dx, dy) {
  const length = Math.hypot(dx, dy) || 1;
  const moveX = (dx / length) * player.speed;
  const moveY = (dy / length) * player.speed;

  player.x = clamp(player.x + moveX, 30, field.width - 30);
  player.y = clamp(player.y + moveY, 30, field.height - 30);
}

function controlHumanPlayer() {
  const user = players.find((player) => player.isHuman);
  if (!user) return;

  let dx = 0;
  let dy = 0;

  if (keys.w || keys.arrowup) dy -= 1;
  if (keys.s || keys.arrowdown) dy += 1;
  if (keys.a || keys.arrowleft) dx -= 1;
  if (keys.d || keys.arrowright) dx += 1;

  if (dx || dy) {
    movePlayer(user, dx, dy);
  }

  const ballNearby = dist(user, ball) < user.radius + ball.radius + 12;
  if (ball.owner === null && ballNearby && !hasBallCarrier()) {
    ball.owner = user;
    user.hasBall = true;
  }

  if (user.hasBall) {
    ball.x = user.x + 18;
    ball.y = user.y;
  }
}

function controlAiPlayers() {
  for (const player of players) {
    if (player.isHuman) continue;

    player.tackleCooldown = Math.max(0, player.tackleCooldown - 1 / 60);

    if (player.team === 'blue') {
      const target = ball.owner && ball.owner.team === 'blue' ? findNearestEnemy(player) : ball;
      const ballTarget = ball.owner && ball.owner.team === 'blue' ? ball.owner : ball;
      const goalTarget = { x: field.width - 70, y: field.height / 2 };
      const focus = ball.owner && ball.owner.team === 'blue' ? goalTarget : ballTarget;

      if (player.hasBall) {
        movePlayer(player, focus.x - player.x, focus.y - player.y);
      } else if (ball.owner === player) {
        movePlayer(player, focus.x - player.x, focus.y - player.y);
      } else {
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        movePlayer(player, dx, dy);
      }
    } else {
      const target = ball.owner && ball.owner.team === 'red' ? findNearestEnemy(player) : ball;
      const goalTarget = { x: 70, y: field.height / 2 };
      const focus = ball.owner && ball.owner.team === 'red' ? goalTarget : target;

      if (player.hasBall) {
        movePlayer(player, focus.x - player.x, focus.y - player.y);
      } else if (ball.owner === player) {
        movePlayer(player, focus.x - player.x, focus.y - player.y);
      } else {
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        movePlayer(player, dx, dy);
      }
    }

    const ballCarrier = ball.owner;
    if (ballCarrier && player !== ballCarrier) {
      const distance = dist(player, ballCarrier);
      if (distance < 30) {
        const tackleChance = player.team !== ballCarrier.team;
        if (tackleChance && player.tackleCooldown <= 0) {
          player.tackleCooldown = 1.1;
          ball.owner = null;
          ball.vx = (player.x - ballCarrier.x) * 0.25;
          ball.vy = (player.y - ballCarrier.y) * 0.25;
        }
      }
    }

    if (player.hasBall) {
      ball.x = player.x + 18;
      ball.y = player.y;
    }
  }
}

function updateBall() {
  if (ball.owner) {
    const owner = ball.owner;
    ball.x = owner.x + 18;
    ball.y = owner.y;
    return;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  ball.vx *= 0.96;
  ball.vy *= 0.96;

  if (Math.abs(ball.vx) < 0.02) ball.vx = 0;
  if (Math.abs(ball.vy) < 0.02) ball.vy = 0;

  for (const player of players) {
    if (dist(player, ball) < player.radius + ball.radius + 4) {
      ball.owner = player;
      player.hasBall = true;
      break;
    }
  }

  if (ball.x < 10 || ball.x > field.width - 10) {
    if (ball.x < 10) {
      state.redScore += 1;
    } else {
      state.blueScore += 1;
    }
    updateScoreboard();
    resetPositions();
  }
}

function drawField() {
  ctx.fillStyle = '#1b7a38';
  ctx.fillRect(0, 0, field.width, field.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, field.width - 60, field.height - 60);

  ctx.beginPath();
  ctx.moveTo(field.width / 2, 30);
  ctx.lineTo(field.width / 2, field.height - 30);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(field.width / 2, field.height / 2, 52, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(30, field.height / 2 - 60, 50, 120);
  ctx.fillRect(field.width - 80, field.height / 2 - 60, 50, 120);

  for (let i = 0; i < 10; i++) {
    const x = 110 + i * 78;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(x, 30);
    ctx.lineTo(x, field.height - 30);
    ctx.stroke();
  }
}

function drawBall() {
  ctx.fillStyle = '#f4f0ea';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius - 2, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPlayer(player) {
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(String(player.number), player.x, player.y + 4);

  if (player.hasBall) {
    ctx.fillStyle = '#f8d76d';
    ctx.beginPath();
    ctx.arc(player.x + 18, player.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGoalText() {
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Blue Goal', 65, 25);
  ctx.fillText('Red Goal', field.width - 65, 25);
}

function tick() {
  controlHumanPlayer();
  controlAiPlayers();
  updateBall();

  drawField();
  drawGoalText();

  for (const player of players) {
    drawPlayer(player);
  }

  drawBall();

  requestAnimationFrame(tick);
}

updateScoreboard();
requestAnimationFrame(tick);
