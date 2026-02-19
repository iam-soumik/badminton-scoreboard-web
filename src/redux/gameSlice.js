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
    setFullState(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
    pauseMatch(state) {
      if (state.matchStatus === "live") {
        state.matchStatus = "paused";
      }
    },

    resumeMatch(state) {
      if (state.matchStatus === "paused") {
        state.matchStatus = "live";
      }
    },

  },
})

export const { addPoint, undo, reset, loadFullState, setFullState, pauseMatch, resumeMatch  } = gameSlice.actions
export default gameSlice.reducer
