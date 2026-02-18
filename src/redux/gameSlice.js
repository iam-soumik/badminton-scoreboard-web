import { createSlice } from '@reduxjs/toolkit'
import { createScoringEngine } from '../logic/scoringEngine'

const engine = createScoringEngine()

const gameSlice = createSlice({
  name: 'game',
  initialState: engine.getState(),
  reducers: {
    addPoint(state, action) {
      engine.addPoint(action.payload)
      return engine.getState()
    },
    undo() {
      engine.undo()
      return engine.getState()
    },
    reset() {
      engine.reset()
      return engine.getState()
    },
    loadFullState(state, action) {
      return action.payload;
    },
  },
})

export const { addPoint, undo, reset, loadFullState } = gameSlice.actions
export default gameSlice.reducer
