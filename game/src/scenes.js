// Twin Hunt — three original hand-drawn scenes. Each scene draws the same picture
// twice: the left panel always in its base state, the right panel with the
// differences in `changed` applied. Every difference is one small, fair change
// a player can spot by studying the two pictures side by side.
import { mulberry32, range } from './random.js';

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function poly(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---------------------------------------------------------------- harbour
function drawHarbour(ctx, changed) {
  // sky + sun
  const sky = ctx.createLinearGradient(0, 0, 0, 260);
  sky.addColorStop(0, '#ffd9a0');
  sky.addColorStop(0.55, '#ffeecf');
  sky.addColorStop(1, '#bfe3ff');
  rect(ctx, 0, 0, 560, 260, sky);
  // sun with rays
  ctx.save();
  ctx.translate(95, 62);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    line(ctx, Math.cos(a) * 40, Math.sin(a) * 40, Math.cos(a) * 50, Math.sin(a) * 50, '#f59e0b', 4);
  }
  circle(ctx, 0, 0, 34, '#fbbf24');
  if (changed.has('sunshades')) {
    // the sun wears cool sunglasses in the changed picture
    rect(ctx, -24, -8, 20, 12, '#111827');
    rect(ctx, 4, -8, 20, 12, '#111827');
    line(ctx, -4, -4, 4, -4, '#111827', 3);
    line(ctx, -24, -4, -30, -8, '#111827', 3);
  } else {
    circle(ctx, -12, -4, 3, '#78350f');
    circle(ctx, 12, -4, 3, '#78350f');
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 6, 12, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
  // clouds
  const cloud = (x, y, s) => {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(x, y, 18 * s, 0, Math.PI * 2);
    ctx.arc(x + 20 * s, y - 6 * s, 15 * s, 0, Math.PI * 2);
    ctx.arc(x + 40 * s, y, 17 * s, 0, Math.PI * 2);
    ctx.fill();
  };
  cloud(220, 55, 1);
  cloud(380, 42, 0.8);
  cloud(470, 95, 0.7);
  // birds (three; the middle one is missing in the changed picture)
  const bird = (x, y) => {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x - 8, y, 8, Math.PI * 1.1, Math.PI * 1.9);
    ctx.arc(x + 8, y, 8, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  };
  bird(280, 72);
  if (!changed.has('bird')) bird(320, 56);
  bird(356, 78);
  // sea + sand
  const sea = ctx.createLinearGradient(0, 250, 0, 400);
  sea.addColorStop(0, '#38bdf8');
  sea.addColorStop(1, '#0369a1');
  rect(ctx, 0, 250, 560, 150, sea);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  [275, 305, 335].forEach((y) => {
    ctx.beginPath();
    for (let x = 0; x <= 560; x += 28) ctx.lineTo(x, y + Math.sin(x / 40 + y) * 4);
    ctx.stroke();
  });
  rect(ctx, 0, 362, 560, 38, '#fcd34d');
  // lighthouse
  ctx.save();
  ctx.translate(470, 0);
  poly(ctx, [[-26, 362], [26, 362], [18, 150], [-18, 150]], '#f8fafc');
  const stripeColor = changed.has('stripe') ? '#22c55e' : '#ef4444';
  rect(ctx, -22, 250, 44, 26, stripeColor);
  rect(ctx, -20, 185, 40, 26, '#ef4444');
  rect(ctx, -17, 118, 34, 34, '#1e293b');
  circle(ctx, 0, 118, 10, '#fef08a');
  poly(ctx, [[-24, 118], [24, 118], [0, 88]], '#ef4444');
  ctx.fillStyle = 'rgba(254,240,138,0.35)';
  ctx.beginPath();
  ctx.moveTo(-17, 118);
  ctx.lineTo(-90, 96);
  ctx.lineTo(-90, 140);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // boats
  const boat = (x, y, s, sailColor) => {
    poly(ctx, [[x - 42 * s, y], [x + 42 * s, y], [x + 30 * s, y + 18 * s], [x - 30 * s, y + 18 * s]], '#92400e');
    line(ctx, x, y, x, y - 52 * s, '#78350f', 4);
    poly(ctx, [[x + 3, y - 50 * s], [x + 3, y - 4], [x + 34 * s, y - 4]], sailColor);
    poly(ctx, [[x - 3, y - 44 * s], [x - 3, y - 4], [x - 24 * s, y - 4]], '#fef3c7');
  };
  boat(200, 292, 1, changed.has('sail') ? '#ef4444' : '#ffffff');
  boat(330, 322, 0.65, '#ffffff');
  // buoy (missing in the changed picture)
  if (!changed.has('buoy')) {
    ctx.save();
    ctx.translate(390, 336);
    poly(ctx, [[-12, 0], [12, 0], [8, -18], [-8, -18]], '#f97316');
    rect(ctx, -12, -4, 24, 6, '#fff');
    circle(ctx, 0, -22, 4, '#f97316');
    ctx.restore();
  }
  // jumping fish (only in the changed picture)
  if (changed.has('fish')) {
    ctx.save();
    ctx.translate(150, 318);
    ctx.rotate(-0.5);
    ellipse(ctx, 0, 0, 18, 8, '#f472b6');
    poly(ctx, [[-16, 0], [-26, -8], [-26, 8]], '#f472b6');
    circle(ctx, 10, -2, 2, '#111827');
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(150, 340, 16, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  // palm tree with coconuts (3, or 2 in the changed picture)
  ctx.save();
  ctx.translate(52, 362);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -50, -8, -95);
  ctx.stroke();
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 7;
  const frond = (a) => {
    ctx.beginPath();
    ctx.moveTo(-8, -95);
    ctx.quadraticCurveTo(-8 + Math.cos(a) * 45, -95 + Math.sin(a) * 30 - 18, -8 + Math.cos(a) * 62, -95 + Math.sin(a) * 34 + 14);
    ctx.stroke();
  };
  [-2.6, -2.0, -1.4, -0.8, -0.2].forEach(frond);
  circle(ctx, -14, -88, 7, '#78350f');
  circle(ctx, -2, -84, 7, '#78350f');
  if (!changed.has('coconut')) circle(ctx, -10, -76, 7, '#78350f');
  ctx.restore();
}

export const HARBOUR = {
  id: 'harbour',
  name: 'Sunrise Harbour',
  blurb: 'A sleepy harbour wakes up. Boats, birds and one very cool sun.',
  draw: drawHarbour,
  differences: [
    { id: 'sunshades', x: 95, y: 62, r: 36, label: 'The sun wears sunglasses' },
    { id: 'bird', x: 320, y: 56, r: 20, label: 'A bird went missing' },
    { id: 'stripe', x: 470, y: 263, r: 26, label: 'Lighthouse stripe turned green' },
    { id: 'sail', x: 214, y: 258, r: 30, label: 'The sail turned red' },
    { id: 'buoy', x: 390, y: 326, r: 22, label: 'The buoy vanished' },
    { id: 'fish', x: 150, y: 318, r: 24, label: 'A pink fish jumps out' },
    { id: 'coconut', x: 44, y: 282, r: 18, label: 'A coconut is gone' },
  ],
};

// ------------------------------------------------------------------ cafe
function drawCafe(ctx, changed) {
  // wall + floor
  rect(ctx, 0, 0, 560, 320, '#f7e8d0');
  rect(ctx, 0, 320, 560, 80, '#b45309');
  ctx.fillStyle = '#92400e';
  for (let x = 0; x < 560; x += 70) rect(ctx, x, 320, 4, 80, '#92400e');
  // window with sky
  rect(ctx, 52, 52, 190, 150, '#7dd3fc');
  circle(ctx, 200, 90, 22, '#fde047');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(100, 90, 16, 0, Math.PI * 2);
  ctx.arc(120, 84, 13, 0, Math.PI * 2);
  ctx.arc(138, 92, 15, 0, Math.PI * 2);
  ctx.fill();
  rect(ctx, 52, 52, 190, 150, 'rgba(0,0,0,0)');
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 8;
  ctx.strokeRect(52, 52, 190, 150);
  line(ctx, 147, 52, 147, 202, '#78350f', 6);
  line(ctx, 52, 127, 242, 127, '#78350f', 6);
  // shelf with books and jars
  rect(ctx, 330, 108, 200, 10, '#78350f');
  const bookColors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];
  bookColors.forEach((c, i) => {
    const color = i === 1 && changed.has('book') ? '#8b5cf6' : c;
    rect(ctx, 344 + i * 24, 62 + (i % 2) * 6, 20, 46 - (i % 2) * 6, color);
  });
  circle(ctx, 470, 88, 16, '#fda4af');
  rect(ctx, 462, 70, 16, 6, '#78350f');
  circle(ctx, 505, 90, 14, '#a5b4fc');
  // wall clock (3:00, or 4:30 in the changed picture)
  circle(ctx, 282, 92, 32, '#ffffff');
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(282, 92, 32, 0, Math.PI * 2);
  ctx.stroke();
  if (changed.has('clock')) {
    line(ctx, 282, 92, 282, 114, '#1e293b', 4);
    line(ctx, 282, 92, 300, 92, '#1e293b', 3);
  } else {
    line(ctx, 282, 92, 282, 70, '#1e293b', 4);
    line(ctx, 282, 92, 302, 92, '#1e293b', 3);
  }
  circle(ctx, 282, 92, 3, '#ef4444');
  // hanging lamp (glowing, or dark in the changed picture)
  line(ctx, 430, 0, 430, 46, '#475569', 3);
  poly(ctx, [[412, 78], [448, 78], [440, 46], [420, 46]], '#f59e0b');
  if (!changed.has('lamp')) {
    const glow = ctx.createRadialGradient(430, 84, 4, 430, 84, 60);
    glow.addColorStop(0, 'rgba(253,230,138,0.85)');
    glow.addColorStop(1, 'rgba(253,230,138,0)');
    circle(ctx, 430, 84, 60, glow);
    circle(ctx, 430, 82, 10, '#fef9c3');
  } else {
    circle(ctx, 430, 82, 9, '#94a3b8');
  }
  // menu board (price 5, or 6 in the changed picture)
  rect(ctx, 428, 150, 112, 92, '#1e293b');
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.strokeRect(428, 150, 112, 92);
  text(ctx, 'MENU', 484, 168, 15, '#fde68a');
  text(ctx, '☕ Latte', 484, 192, 14, '#f1f5f9');
  text(ctx, changed.has('price') ? '$6' : '$5', 484, 218, 20, '#4ade80');
  // counter
  rect(ctx, 0, 300, 560, 100, '#78350f');
  rect(ctx, 0, 300, 560, 10, '#a16207');
  // potted plant (with a pink flower, or none in the changed picture)
  ctx.save();
  ctx.translate(118, 300);
  poly(ctx, [[-22, 0], [22, 0], [16, -30], [-16, -30]], '#dc2626');
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.quadraticCurveTo(-14, -55, -24, -62);
  ctx.moveTo(0, -30);
  ctx.quadraticCurveTo(12, -58, 22, -66);
  ctx.moveTo(0, -30);
  ctx.lineTo(0, -70);
  ctx.stroke();
  ellipse(ctx, -24, -62, 12, 6, '#22c55e');
  ellipse(ctx, 22, -66, 12, 6, '#22c55e');
  if (!changed.has('flower')) {
    circle(ctx, 0, -74, 9, '#f472b6');
    circle(ctx, 0, -74, 4, '#fde047');
  }
  ctx.restore();
  // the cat on the counter
  ctx.save();
  ctx.translate(300, 300);
  ellipse(ctx, 0, -8, 52, 34, '#f97316');
  circle(ctx, -6, -52, 26, '#f97316');
  poly(ctx, [[-28, -68], [-20, -88], [-10, -70]], '#f97316');
  poly(ctx, [[8, -70], [16, -88], [24, -68]], '#f97316');
  poly(ctx, [[-26, -70], [-20, -84], [-13, -71]], '#fda4af');
  poly(ctx, [[10, -71], [16, -84], [22, -70]], '#fda4af');
  circle(ctx, -15, -56, 3, '#111827');
  circle(ctx, 3, -56, 3, '#111827');
  poly(ctx, [[-8, -46], [-4, -46], [-6, -42]], '#f472b6');
  // whiskers (missing in the changed picture)
  if (!changed.has('whiskers')) {
    ctx.strokeStyle = '#fff7ed';
    ctx.lineWidth = 2;
    [[-30, -48, -52, -54], [-30, -44, -52, -42], [18, -48, 40, -54], [18, -44, 40, -42]].forEach(([x1, y1, x2, y2]) => line(ctx, x1, y1, x2, y2, '#fff7ed', 2));
  }
  // tail
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(48, -6);
  ctx.quadraticCurveTo(72, -18, 66, -44);
  ctx.stroke();
  ctx.restore();
  // extra cup (only in the changed picture)
  if (changed.has('cup')) {
    ctx.save();
    ctx.translate(212, 300);
    rect(ctx, -12, -26, 24, 26, '#38bdf8');
    ellipse(ctx, 0, -26, 12, 4, '#e0f2fe');
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(14, -14, 7, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.restore();
  }
  // a cup in front of the cat (always there)
  ctx.save();
  ctx.translate(372, 300);
  rect(ctx, -12, -24, 24, 24, '#ffffff');
  ellipse(ctx, 0, -24, 12, 4, '#fecdd3');
  ctx.restore();
}

export const CAFE = {
  id: 'cafe',
  name: 'The Cat Café',
  blurb: 'Fresh coffee, warm light, and a cat who runs the place.',
  draw: drawCafe,
  differences: [
    { id: 'whiskers', x: 262, y: 252, r: 28, label: 'The cat lost its whiskers' },
    { id: 'clock', x: 282, y: 92, r: 34, label: 'The clock shows a new time' },
    { id: 'book', x: 380, y: 88, r: 22, label: 'A book changed colour' },
    { id: 'lamp', x: 430, y: 84, r: 28, label: 'The lamp went dark' },
    { id: 'flower', x: 118, y: 226, r: 20, label: 'The plant lost its flower' },
    { id: 'price', x: 484, y: 218, r: 20, label: 'The latte price went up' },
    { id: 'cup', x: 212, y: 286, r: 20, label: 'An extra cup appeared' },
  ],
};

// ---------------------------------------------------------------- garden
function drawGarden(ctx, changed) {
  const rng = mulberry32(20261121);
  // night sky
  const sky = ctx.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#0b1030');
  sky.addColorStop(0.6, '#1b2a52');
  sky.addColorStop(1, '#2c4a6e');
  rect(ctx, 0, 0, 560, 400, sky);
  // moon (craters, or smooth in the changed picture)
  circle(ctx, 90, 70, 30, '#fef9c3');
  if (!changed.has('moon')) {
    circle(ctx, 80, 62, 6, '#eab308');
    circle(ctx, 100, 78, 5, '#eab308');
    circle(ctx, 96, 58, 3, '#eab308');
  }
  // stars (one is missing in the changed picture)
  const stars = [];
  for (let i = 0; i < 26; i++) stars.push([range(rng, 20, 540), range(rng, 14, 190), range(rng, 1.5, 3.5)]);
  stars.forEach(([x, y, r], i) => {
    if (changed.has('star') && i === 7) return;
    circle(ctx, x, y, r, i % 3 === 0 ? '#fde68a' : '#e2e8f0');
  });
  // big tree
  ctx.save();
  ctx.translate(440, 360);
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.quadraticCurveTo(-10, -90, -26, -150);
  ctx.lineTo(6, -150);
  ctx.quadraticCurveTo(14, -80, 18, 0);
  ctx.closePath();
  ctx.fill();
  circle(ctx, -30, -160, 62, '#14532d');
  circle(ctx, 30, -170, 66, '#166534');
  circle(ctx, 0, -205, 58, '#15803d');
  circle(ctx, -58, -120, 34, '#14532d');
  circle(ctx, 62, -125, 32, '#166534');
  // an owl perched in the tree (only in the changed picture)
  if (changed.has('owl')) {
    ctx.save();
    ctx.translate(-34, -138);
    ellipse(ctx, 0, 0, 16, 20, '#78350f');
    circle(ctx, -7, -8, 5, '#fef9c3');
    circle(ctx, 7, -8, 5, '#fef9c3');
    circle(ctx, -7, -8, 2, '#111827');
    circle(ctx, 7, -8, 2, '#111827');
    poly(ctx, [[-3, -2], [3, -2], [0, 3]], '#f59e0b');
    ctx.restore();
  }
  ctx.restore();
  // hanging lanterns (one is teal in the changed picture)
  const lantern = (x, y, color) => {
    line(ctx, x, y - 34, x, y - 14, '#78350f', 2);
    ellipse(ctx, x, y, 13, 17, color);
    rect(ctx, x - 8, y - 20, 16, 5, '#451a03');
    rect(ctx, x - 8, y + 15, 16, 5, '#451a03');
    const glow = ctx.createRadialGradient(x, y, 4, x, y, 42);
    glow.addColorStop(0, color === '#f97316' ? 'rgba(251,146,60,0.5)' : 'rgba(45,212,191,0.5)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    circle(ctx, x, y, 42, glow);
  };
  lantern(368, 196, '#f97316');
  lantern(486, 214, changed.has('lantern') ? '#2dd4bf' : '#f97316');
  // grass
  rect(ctx, 0, 330, 560, 70, '#14532d');
  ctx.fillStyle = '#166534';
  for (let x = 0; x < 560; x += 26) {
    poly(ctx, [[x, 330], [x + 8, 306], [x + 16, 330]], '#166534');
  }
  // pond with lily pads and a frog (missing in the changed picture)
  ellipse(ctx, 180, 356, 130, 34, '#0ea5e9');
  ellipse(ctx, 180, 352, 118, 28, '#38bdf8');
  ellipse(ctx, 120, 350, 26, 9, '#16a34a');
  ellipse(ctx, 240, 360, 30, 10, '#16a34a');
  circle(ctx, 128, 348, 4, '#f472b6');
  if (!changed.has('frog')) {
    ctx.save();
    ctx.translate(180, 342);
    ellipse(ctx, 0, 0, 22, 14, '#22c55e');
    circle(ctx, -12, -12, 9, '#22c55e');
    circle(ctx, 12, -12, 9, '#22c55e');
    circle(ctx, -12, -14, 4, '#ffffff');
    circle(ctx, 12, -14, 4, '#ffffff');
    circle(ctx, -12, -14, 2, '#111827');
    circle(ctx, 12, -14, 2, '#111827');
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 2, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }
  // mushrooms (3 spots, or 5 in the changed picture)
  const mushroom = (x, y, s, spots) => {
    rect(ctx, x - 5 * s, y, 10 * s, 16 * s, '#fef3c7');
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(x, y, 20 * s, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    circle(ctx, x - 9 * s, y - 8 * s, 3 * s, '#fff');
    circle(ctx, x + 8 * s, y - 12 * s, 3 * s, '#fff');
    if (spots === 5) {
      circle(ctx, x, y - 14 * s, 3 * s, '#fff');
      circle(ctx, x - 2 * s, y - 4 * s, 2.5 * s, '#fff');
      circle(ctx, x + 12 * s, y - 5 * s, 2.5 * s, '#fff');
    } else {
      circle(ctx, x + 1 * s, y - 5 * s, 3 * s, '#fff');
    }
  };
  mushroom(330, 368, 1, changed.has('spots') ? 5 : 3);
  mushroom(368, 376, 0.7, 3);
  // flowers (one is yellow in the changed picture)
  const flower = (x, y, color) => {
    line(ctx, x, y, x, y - 22, '#16a34a', 3);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      circle(ctx, x + Math.cos(a) * 8, y - 22 + Math.sin(a) * 8, 5, color);
    }
    circle(ctx, x, y - 22, 4, '#fde047');
  };
  flower(80, 372, changed.has('flower') ? '#facc15' : '#a855f7');
  flower(140, 382, '#f472b6');
  flower(500, 380, '#f472b6');
  flower(530, 360, '#a855f7');
  // fireflies
  const flies = [];
  for (let i = 0; i < 14; i++) flies.push([range(rng, 30, 530), range(rng, 200, 330)]);
  flies.forEach(([x, y], i) => {
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 12);
    glow.addColorStop(0, 'rgba(253,224,71,0.9)');
    glow.addColorStop(1, 'rgba(253,224,71,0)');
    circle(ctx, x, y, 12, glow);
    circle(ctx, x, y, 2.5, '#fef08a');
  });
}

export const GARDEN = {
  id: 'garden',
  name: 'Firefly Garden',
  blurb: 'A quiet garden at night. Something small is always moving.',
  draw: drawGarden,
  differences: [
    { id: 'moon', x: 90, y: 70, r: 32, label: 'The moon lost its craters' },
    { id: 'frog', x: 180, y: 342, r: 24, label: 'The frog hopped away' },
    { id: 'lantern', x: 486, y: 214, r: 24, label: 'A lantern turned teal' },
    { id: 'spots', x: 330, y: 356, r: 22, label: 'The mushroom grew more spots' },
    { id: 'star', x: 0, y: 0, r: 18, label: 'A star blinked out' },
    { id: 'flower', x: 80, y: 350, r: 18, label: 'A flower changed colour' },
    { id: 'owl', x: 406, y: 222, r: 26, label: 'An owl moved into the tree' },
  ],
};

// The star that disappears is the 8th star the seeded generator places;
// its coordinates are computed here so the marker lands exactly on it.
{
  const rng = mulberry32(20261121);
  for (let i = 0; i < 8; i++) {
    const x = range(rng, 20, 540);
    const y = range(rng, 14, 190);
    range(rng, 1.5, 3.5);
    if (i === 7) {
      GARDEN.differences.find((d) => d.id === 'star').x = Math.round(x);
      GARDEN.differences.find((d) => d.id === 'star').y = Math.round(y);
    }
  }
}

export const SCENES = [HARBOUR, CAFE, GARDEN];
