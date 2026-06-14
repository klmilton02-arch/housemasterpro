// Haptic feedback utility
// Uses Vibration API on Android, AudioContext click on iOS (triggers Taptic Engine)
// IMPORTANT: Must be called synchronously inside a user gesture handler (onClick/onPointerUp)
// Do NOT call inside setTimeout, async callbacks, or useEffect — iOS will block it.

let _audioCtx = null;

function getAudioContext() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume();
  }
  return _audioCtx;
}

function iosClick(durationSeconds = 0.02) {
  try {
    const ctx = getAudioContext();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * durationSeconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // White noise burst — inaudible at low gain but triggers Taptic Engine
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(0.00001, ctx.currentTime);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  } catch (e) {
    // Silently fail
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
    if (!vibrate(10)) iosClick(0.015);
  },
  medium: () => {
    if (!vibrate(25)) iosClick(0.03);
  },
  heavy: () => {
    if (!vibrate(50)) iosClick(0.05);
  },
  success: () => {
    if (!vibrate([15, 40, 20])) iosClick(0.02);
  },
  error: () => {
    if (!vibrate([30, 30, 60])) iosClick(0.06);
  },
};