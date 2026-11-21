// Twin Hunt — game state, input, scoring, timer and rendering.
import {
  PANEL, CANVAS, LEVEL_TIME_SECONDS, HINTS_PER_LEVEL, POINTS_PER_FIND,
  COMBO_STEP_BONUS, COMBO_WINDOW_MS, WRONG_CLICK_PENALTY_SECONDS, HINT_COST,
  TIME_BONUS_PER_SECOND, LEVELS, formatTime, starsForLevel,
} from './config.js';
import { SCENES } from './scenes.js';
import { sfx, toggleMuted, isMuted } from './audio.js';

const $ = (id) => document.getElementById(id);

export class TwinHuntGame {
  constructor() {
    this.canvas = $('game');
    this.ctx = this.canvas.getContext('2d');
    this.state = 'title';
    this.levelIndex = 0;
    this.found = new Set();
    this.hintsLeft = HINTS_PER_LEVEL;
    this.score = 0;
    this.totalScore = 0;
    this.stars = [];
    this.combo = 0;
    this.lastFindAt = 0;
    this.wrongClicks = 0;
    this.timeLeft = LEVEL_TIME_SECONDS;
    this.frozen = false;
    this.wrongMarks = [];
    this.hintPulse = null;
    this.floaters = [];
    this.timerId = null;
    this.deadline = 0;
    this.shotMode = false;

    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    $('btn-hint').addEventListener('click', () => this.useHint());
    $('btn-sound').addEventListener('click', () => this.toggleSound());
    $('btn-restart').addEventListener('click', () => this.restartLevel());
    $('btn-menu').addEventListener('click', () => this.showTitle());
    $('overlay-btn').addEventListener('click', () => this.onOverlayButton());
    document.addEventListener('keydown', (e) => this.onKey(e));

    this.overlayAction = null;
    this.showTitle();
    requestAnimationFrame(() => this.render());
  }

  scene() {
    return SCENES[this.levelIndex];
  }

  // ---------------------------------------------------------- screens
  showTitle() {
    this.stopTimer();
    this.state = 'title';
    this.levelIndex = 0;
    this.totalScore = 0;
    this.stars = [];
    this.score = 0;
    this.found = new Set();
    this.setOverlay(
      'Twin Hunt',
      'Two pictures. Seven sneaky differences.\nFind them all before the clock runs out!\n\nClick a difference in either picture to mark it.\nWrong clicks cost 5 seconds — hints cost 50 points.',
      '',
      '▶ Start hunting',
      () => this.startLevel(0),
    );
    this.updateHud();
    this.setMessage('Welcome, detective — three scenes are waiting for you.');
  }

  startLevel(index) {
    this.levelIndex = index;
    this.found = new Set();
    this.hintsLeft = HINTS_PER_LEVEL;
    this.score = index === 0 ? 0 : this.score;
    this.combo = 0;
    this.wrongClicks = 0;
    this.wrongMarks = [];
    this.hintPulse = null;
    this.floaters = [];
    this.timeLeft = LEVEL_TIME_SECONDS;
    this.state = 'playing';
    this.levelScoreBase = this.score;
    this.hideOverlay();
    this.buildDots();
    this.updateHud();
    this.updateHintButton();
    this.setMessage(`Level ${index + 1}: ${this.scene().name} — ${this.scene().blurb}`);
    this.startTimer();
  }

  restartLevel() {
    if (this.state === 'title') return;
    sfx.click();
    this.startLevel(this.levelIndex);
  }

  levelComplete() {
    this.stopTimer();
    this.state = 'levelDone';
    const timeBonus = Math.ceil(this.timeLeft) * TIME_BONUS_PER_SECOND;
    const levelScore = this.score - this.levelScoreBase + timeBonus;
    this.score += timeBonus;
    const stars = starsForLevel(this.timeLeft, this.wrongClicks);
    this.stars[this.levelIndex] = stars;
    this.totalScore += levelScore;
    sfx.levelClear();
    const last = this.levelIndex === SCENES.length - 1;
    this.setOverlay(
      last ? 'Case closed!' : 'Level complete!',
      last
        ? `You found every difference in ${this.scene().name}.\nTime bonus +${timeBonus} · Level score ${levelScore}`
        : `You found all 7 differences in ${this.scene().name}!\nTime bonus +${timeBonus} · Level score ${levelScore}`,
      '★'.repeat(stars) + '☆'.repeat(3 - stars),
      last ? 'See your results' : 'Next level ▶',
      () => (last ? this.showResults() : this.startLevel(this.levelIndex + 1)),
    );
    this.updateHud();
  }

  timeUp() {
    this.stopTimer();
    this.state = 'gameOver';
    sfx.gameOver();
    const remaining = this.scene().differences.length - this.found.size;
    this.setOverlay(
      "Time's up!",
      `The clock beat you in ${this.scene().name}.\n${remaining} difference${remaining === 1 ? '' : 's'} still hiding — try again!`,
      '',
      '↻ Try this level again',
      () => this.startLevel(this.levelIndex),
    );
  }

  showResults() {
    this.state = 'results';
    const totalStars = this.stars.reduce((a, b) => a + b, 0);
    const maxStars = SCENES.length * 3;
    this.setOverlay(
      'You did it, detective!',
      `All three scenes solved!\nTotal score ${this.totalScore} · ${totalStars} / ${maxStars} stars\n\nHarbour, café and garden — no difference escaped you.`,
      '★'.repeat(totalStars) + '☆'.repeat(Math.max(0, maxStars - totalStars)),
      '↻ Play again',
      () => {
        this.totalScore = 0;
        this.stars = [];
        this.score = 0;
        this.startLevel(0);
      },
    );
  }

  // ---------------------------------------------------------- timer
  startTimer() {
    this.stopTimer();
    if (this.frozen) return;
    this.deadline = Date.now() + this.timeLeft * 1000;
    this.timerId = setInterval(() => {
      this.timeLeft = Math.max(0, (this.deadline - Date.now()) / 1000);
      this.updateHud();
      if (this.timeLeft <= 0) this.timeUp();
    }, 200);
  }

  stopTimer() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
  }

  // ---------------------------------------------------------- input
  onCanvasClick(event) {
    if (this.state !== 'playing') return;
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (CANVAS.w / rect.width);
    const y = (event.clientY - rect.top) * (CANVAS.h / rect.height);
    const panel = this.panelAt(x, y);
    if (!panel) return;
    const sx = x - panel.x;
    const sy = y - PANEL.y;
    const hit = this.scene().differences.find(
      (d) => !this.found.has(d.id) && Math.hypot(sx - d.x, sy - d.y) <= d.r + 10,
    );
    if (hit) this.registerFind(hit, sx, sy);
    else this.registerMiss(sx, sy);
  }

  panelAt(x, y) {
    if (y < PANEL.y || y > PANEL.y + PANEL.h) return null;
    if (x >= PANEL.leftX && x <= PANEL.leftX + PANEL.w) return { x: PANEL.leftX };
    if (x >= PANEL.rightX && x <= PANEL.rightX + PANEL.w) return { x: PANEL.rightX };
    return null;
  }

  registerFind(diff, sx, sy) {
    this.found.add(diff.id);
    const now = Date.now();
    this.combo = now - this.lastFindAt < COMBO_WINDOW_MS ? this.combo + 1 : 1;
    this.lastFindAt = now;
    const bonus = POINTS_PER_FIND + COMBO_STEP_BONUS * (this.combo - 1);
    this.score += bonus;
    this.floaters.push({ x: sx, y: sy, text: `+${bonus}`, until: now + 1100, born: now });
    sfx.find();
    this.setMessage(`Found it — ${diff.label}! ${this.scene().differences.length - this.found.size} to go.`, 'good');
    this.buildDots();
    this.updateHud();
    if (this.found.size === this.scene().differences.length) {
      setTimeout(() => this.levelComplete(), 650);
    }
  }

  registerMiss(sx, sy) {
    this.wrongClicks += 1;
    this.combo = 0;
    this.timeLeft = Math.max(0, this.timeLeft - WRONG_CLICK_PENALTY_SECONDS);
    if (!this.frozen) this.deadline -= WRONG_CLICK_PENALTY_SECONDS * 1000;
    this.wrongMarks.push({ x: sx, y: sy, until: Date.now() + 900, born: Date.now() });
    sfx.wrong();
    this.setMessage('Not a difference — 5 seconds lost. Look closer!', 'bad');
    this.updateHud();
    if (this.timeLeft <= 0) this.timeUp();
  }

  useHint() {
    if (this.state !== 'playing' || this.hintsLeft <= 0) return;
    const remaining = this.scene().differences.filter((d) => !this.found.has(d.id));
    if (!remaining.length) return;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    this.hintsLeft -= 1;
    this.score = Math.max(0, this.score - HINT_COST);
    this.hintPulse = { id: pick.id, until: Date.now() + 3000 };
    sfx.hint();
    this.setMessage(`Hint: ${pick.label} — watch the golden ring! (−${HINT_COST} pts)`);
    this.updateHintButton();
    this.updateHud();
    this.buildDots(pick.id);
  }

  toggleSound() {
    const muted = toggleMuted();
    $('btn-sound').textContent = muted ? '🔇 Sound off' : '🔊 Sound on';
    if (!muted) sfx.click();
  }

  onKey(event) {
    if (event.key === 'h' || event.key === 'H') this.useHint();
    if (event.key === 'r' || event.key === 'R') this.restartLevel();
    if (event.key === 'm' || event.key === 'M') this.toggleSound();
    if (event.key === 'Escape') this.showTitle();
    if (event.key === 'Enter' && this.state !== 'playing' && !this.overlayHidden()) this.onOverlayButton();
  }

  onOverlayButton() {
    if (this.overlayAction) this.overlayAction();
  }

  overlayHidden() {
    return $('overlay').classList.contains('hidden');
  }

  // ---------------------------------------------------------- HUD
  updateHud() {
    const scene = this.scene();
    $('level-pill').textContent = `Level ${this.levelIndex + 1} · ${scene.name}`;
    $('found-pill').textContent = `Found ${this.found.size} / ${scene.differences.length}`;
    const timer = $('timer-pill');
    timer.textContent = `⏱ ${formatTime(this.timeLeft)}`;
    timer.classList.toggle('low', this.timeLeft <= 30 && this.state === 'playing');
    $('score-pill').textContent = `Score ${this.score}`;
  }

  updateHintButton() {
    const btn = $('btn-hint');
    btn.textContent = `💡 Hint (H) · ${this.hintsLeft} left`;
    btn.disabled = this.hintsLeft <= 0 || this.state !== 'playing';
  }

  buildDots(hintedId = null) {
    const dots = $('dots');
    dots.innerHTML = '';
    this.scene().differences.forEach((d) => {
      const dot = document.createElement('span');
      dot.className = 'dot' + (this.found.has(d.id) ? ' found' : '') + (d.id === hintedId ? ' hinted' : '');
      dot.title = this.found.has(d.id) ? d.label : 'Not found yet';
      dots.appendChild(dot);
    });
  }

  setMessage(text, kind = '') {
    const el = $('message');
    el.textContent = text;
    el.className = kind;
  }

  setOverlay(title, text, stars, buttonLabel, action) {
    $('overlay-title').textContent = title;
    $('overlay-text').textContent = text;
    $('overlay-stars').textContent = stars;
    $('overlay-btn').textContent = buttonLabel;
    this.overlayAction = action;
    $('overlay').classList.remove('hidden');
    this.updateHintButton();
  }

  hideOverlay() {
    $('overlay').classList.add('hidden');
    this.updateHintButton();
  }

  // ---------------------------------------------------------- screenshots
  // Deterministic staged states for screenshots (?shot=...): the game is
  // shown mid-hunt with real markers, or on its title / results screen.
  stageShot(mode, level, foundCount) {
    this.shotMode = true;
    this.frozen = true;
    this.levelIndex = Math.min(level, SCENES.length - 1);
    const scene = this.scene();
    this.state = 'playing';
    this.hideOverlay();
    if (mode === 'start') {
      this.showTitle();
      return;
    }
    if (mode === 'end') {
      this.totalScore = 2480;
      this.stars = [3, 2, 3];
      this.score = 2480;
      this.found = new Set(scene.differences.map((d) => d.id));
      this.buildDots();
      this.updateHud();
      this.showResults();
      return;
    }
    // play: pre-find the first `foundCount` differences, freeze the clock
    this.found = new Set(scene.differences.slice(0, foundCount).map((d) => d.id));
    this.score = foundCount * POINTS_PER_FIND + 50;
    this.timeLeft = 107;
    this.hintsLeft = 2;
    this.buildDots();
    this.updateHud();
    this.updateHintButton();
    this.setMessage(
      `Found ${foundCount} — ${scene.differences.length - foundCount} differences still hiding. Can you spot them all?`,
      'good',
    );
  }

  // ---------------------------------------------------------- render
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS.w, CANVAS.h);
    const scene = this.scene();
    this.drawPanel(PANEL.leftX, scene, new Set());
    this.drawPanel(PANEL.rightX, scene, new Set(scene.differences.map((d) => d.id)));
    requestAnimationFrame(() => this.render());
  }

  drawPanel(x, scene, changedSet) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, PANEL.y, PANEL.w, PANEL.h);
    ctx.clip();
    ctx.translate(x, PANEL.y);
    scene.draw(ctx, changedSet, 0);
    // markers for found differences (on both panels)
    for (const diff of scene.differences) {
      if (!this.found.has(diff.id)) continue;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(diff.x, diff.y, diff.r + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(diff.x - 9, diff.y);
      ctx.lineTo(diff.x - 2, diff.y + 8);
      ctx.lineTo(diff.x + 11, diff.y - 8);
      ctx.stroke();
    }
    // hint pulse on both panels
    if (this.hintPulse && Date.now() < this.hintPulse.until) {
      const diff = scene.differences.find((d) => d.id === this.hintPulse.id);
      if (diff) {
        const pulse = 1 + 0.18 * Math.sin(Date.now() / 130);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, (diff.r + 8) * pulse, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // wrong-click marks
    const now = Date.now();
    this.wrongMarks = this.wrongMarks.filter((m) => now < m.until);
    for (const m of this.wrongMarks) {
      const fade = 1 - (now - m.born) / 900;
      ctx.strokeStyle = `rgba(239,68,68,${fade})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(m.x - 12, m.y - 12);
      ctx.lineTo(m.x + 12, m.y + 12);
      ctx.moveTo(m.x + 12, m.y - 12);
      ctx.lineTo(m.x - 12, m.y + 12);
      ctx.stroke();
    }
    // floating score text
    this.floaters = this.floaters.filter((f) => now < f.until);
    for (const f of this.floaters) {
      const age = (now - f.born) / 1100;
      ctx.fillStyle = `rgba(34,197,94,${1 - age})`;
      ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y - age * 34);
    }
    ctx.restore();
    // panel frame
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, PANEL.y + 1.5, PANEL.w - 3, PANEL.h - 3);
  }
}
