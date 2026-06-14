// Haptic feedback utility using the Vibration API
// Falls back silently on devices that don't support it

export const haptics = {
  // Light tap — for button presses, selections
  light: () => {
    if (navigator.vibrate) navigator.vibrate(10);
  },

  // Medium tap — for confirmations, toggles
  medium: () => {
    if (navigator.vibrate) navigator.vibrate(20);
  },

  // Success pattern — for task completion
  success: () => {
    if (navigator.vibrate) navigator.vibrate([15, 50, 30]);
  },

  // Error pattern — for failures, destructive actions
  error: () => {
    if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
  },

  // Heavy — for long press, drag start
  heavy: () => {
    if (navigator.vibrate) navigator.vibrate(40);
  },
};