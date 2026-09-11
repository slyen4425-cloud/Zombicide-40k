import assert from 'node:assert/strict';
import { createPuzzleDefinition, createPuzzleState, revealPuzzleHint, submitPuzzleAnswer, puzzleProgress } from '../src/modes/rpg/puzzle-engine.js';

const puzzle=createPuzzleDefinition({
  id:'puzzle-rune',
  name:'La rune ancienne',
  prompt:'Quel mot ouvre la porte ?',
  answers:['Aube','lever du soleil'],
  hints:['Regarde vers l’est.','Le jour commence ainsi.'],
  caseSensitive:false,
  maxAttempts:2,
  penaltyEffectIds:['lose-hp'],
  failureEventId:'event-alarm',
  successEventId:'event-open-door',
  audioId:'sfx-puzzle-success',
});

let state=createPuzzleState(puzzle);
assert.equal(state.solved,false);
assert.equal(state.attempts,0);

let hint=revealPuzzleHint(puzzle,state);
assert.equal(hint.ok,true);
assert.equal(hint.hint,'Regarde vers l’est.');
state=hint.state;

hint=revealPuzzleHint(puzzle,state);
assert.equal(hint.ok,true);
assert.equal(hint.hint,'Le jour commence ainsi.');
state=hint.state;

const noHint=revealPuzzleHint(puzzle,state);
assert.equal(noHint.ok,false);
assert.equal(noHint.reason,'no-more-hints');

let attempt=submitPuzzleAnswer(puzzle,state,'midi');
assert.equal(attempt.ok,true);
assert.equal(attempt.correct,false);
assert.deepEqual(attempt.effectIds,['lose-hp']);
assert.equal(attempt.eventId,null);
assert.equal(attempt.attemptsRemaining,1);
state=attempt.state;

attempt=submitPuzzleAnswer(puzzle,state,'nuit');
assert.equal(attempt.correct,false);
assert.equal(attempt.state.failed,true);
assert.equal(attempt.eventId,'event-alarm');
state=attempt.state;

const blocked=submitPuzzleAnswer(puzzle,state,'Aube');
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'already-failed');

const retryPuzzle=createPuzzleDefinition({...puzzle,id:'puzzle-rune-2',maxAttempts:null});
let retryState=createPuzzleState(retryPuzzle);
const solved=submitPuzzleAnswer(retryPuzzle,retryState,'  AUBE  ');
assert.equal(solved.ok,true);
assert.equal(solved.correct,true);
assert.equal(solved.state.solved,true);
assert.equal(solved.state.completedAtAttempt,1);
assert.equal(solved.eventId,'event-open-door');
assert.equal(solved.audioId,'sfx-puzzle-success');

const solvedAgain=submitPuzzleAnswer(retryPuzzle,solved.state,'Aube');
assert.equal(solvedAgain.ok,false);
assert.equal(solvedAgain.reason,'already-solved');

const progress=puzzleProgress(retryPuzzle,solved.state);
assert.deepEqual(progress,{solved:true,failed:false,attempts:1,maxAttempts:null,revealedHints:0,totalHints:2,nextHintAvailable:false});

console.log('rpg-puzzle-engine.test.mjs OK');
