// src/roadmap/engine/lifecycle.js
import { state } from '../state.js';

/**
 * Contains shared lifecycle functions used across modes and the manager,
 * preventing circular dependencies.
 */

export function startCountdown(seconds, sceneState) {
  if (!sceneState) return;
  sceneState.countdownT = seconds;
  state.ui.countdownActive = true;
  sceneState.lockedInStart = true;
  sceneState.launched = false;
  // This is a property of roadmap mode, so check for its existence.
  if ('timerRunning' in sceneState) {
    sceneState.timerRunning = false;
  }
}
