// Twin Hunt — bootstrap: build the game, then honour screenshot staging
// (?shot=start | play | end, ?level=1..3, ?found=N) so the maker's
// screenshots show the real game in a staged, readable state.
import { TwinHuntGame } from './game.js';

const params = new URLSearchParams(window.location.search);
const game = new TwinHuntGame();

const shot = params.get('shot');
if (shot) {
  const level = Math.max(1, Math.min(3, Number(params.get('level') || 1))) - 1;
  const found = Math.max(0, Math.min(7, Number(params.get('found') || 3)));
  game.stageShot(shot, level, found);
}
