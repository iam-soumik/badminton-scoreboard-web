import { createSlice } from '@reduxjs/toolkit'
import { createScoringEngine } from '../logic/scoringEngine'

const engine = createScoringEngine();

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
    loadFullState: (state, action) => {
      engine.setFullState(action.payload);  // 🔥 Sync engine
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

    loadPrematch(state, action) {
      engine.loadPrematchData(action.payload);
      return engine.getState();
    },

    startMatch(state) {
      engine.startMatch();
      return engine.getState();
    },

    swapPlayers(state, action) {
      engine.swapPlayers(action.payload);
      return engine.getState();
    },

    swapTeams(state) {
      engine.swapTeams();
      return engine.getState();
    },

    clearLastSetResult(state) {
      engine.clearLastSetResult();
      return engine.getState();
    },

    startNewMatch(state) {
      engine.startNewMatch();
      return engine.getState();
    },

    setFirstServerTeam(state, action) {
      engine.setFirstServerTeam(action.payload);
      return engine.getState();
    }

  },
})

export const { addPoint, undo, reset, 
               loadFullState, setFullState, 
               startMatch, pauseMatch, resumeMatch, 
               loadPrematch, swapPlayers, swapTeams,
               clearLastSetResult, startNewMatch,
               setFirstServerTeam
} = gameSlice.actions;

export default gameSlice.reducer;
