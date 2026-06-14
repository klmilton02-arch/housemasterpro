// Haptic feedback utility
// Uses Vibration API on Android, AudioContext impulse on iOS (triggers Taptic Engine)

function iosHaptic(type = 'light') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Different frequencies/durations for different feedback types
    const configs = {
      light:   { freq: 200, duration: 0.02, gain: 0.1 },
      medium:  { freq: 150, duration: 0.04, gain: 0.2 },
      heavy:   { freq: 100, duration: 0.06, gain: 0.3 },
      success: { freq: 300, duration: 0.03, gain: 0.15 },
      error:   { freq: 80,  duration: 0.08, gain: 0.3 },
    };
    const c = configs[type] || configs.light;

    gainNode.gain.setValueAtTime(c.gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + c.duration);
    oscillator.frequency.setValueAtTime(c.freq, ctx.currentTime);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + c.duration);

    oscillator.onended = () => ctx.close();
  } catch (e) {
    // Silently fail if AudioContext not available
  }
}

function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
    return true;
  }
  return false;
}

export const haptics = {
  light: () => {
    if (!vibrate(10)) iosHaptic('light');
  },
  medium: () => {
    if (!vibrate(20)) iosHaptic('medium');
  },
  heavy: () => {
    if (!vibrate(40)) iosHaptic('heavy');
  },
  success: () => {
    if (!vibrate([15, 50, 30])) iosHaptic('success');
  },
  error: () => {
    if (!vibrate([30, 30, 30])) iosHaptic('error');
  },
};