import { createScoringEngine } from '../logic/scoringEngine'

const engine = createScoringEngine()

function logState(label) {
  const s = engine.getState()
  console.log(`\n=== ${label} ===`)
  console.log('Score:', s.score)
  console.log('Server:', s.server)
  console.log('Left players:', s.players.left)
  console.log('Right players:', s.players.right)
}

/* TEST 1: Initial server */
logState('Initial state')

/* TEST 2: Same server continues (left scores twice) */
engine.addPoint('left')
logState('Left scores 1')

engine.addPoint('left')
logState('Left scores 2 (same server continues)')

/* TEST 3: Service break (right scores) */
engine.addPoint('right')
logState('Right scores (service break)')

/* TEST 4: Right scores again (same server) */
engine.addPoint('right')
logState('Right scores again')

/* TEST 5: Undo */
engine.undo()
logState('After undo')
