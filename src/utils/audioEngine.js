class SoundscapeEngine {
  constructor() {
    this.ctx = null;
    this.noiseNode = null;
    this.gainNode = null;
    this.isPlaying = false;
  }

  _initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startBrownNoise() {
    if (this.isPlaying) return;
    this._initContext();

    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.8; // Kompensasi volume
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.noiseNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
    this.noiseNode.start();
    this.isPlaying = true;
  }

  stopBrownNoise() {
    if (!this.isPlaying) return;
    try {
      this.noiseNode?.stop();
      this.noiseNode?.disconnect();
    } catch {
      // Abaikan jika node sudah berhenti
    }
    this.noiseNode = null;
    this.isPlaying = false;
  }

  toggleBrownNoise() {
    if (this.isPlaying) {
      this.stopBrownNoise();
      return false;
    } else {
      this.startBrownNoise();
      return true;
    }
  }

  playCompletionChime() {
    try {
      this._initContext();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.7);
    } catch {
      // Abaikan jika audio diblokir browser
    }
  }
}

export const soundEngine = new SoundscapeEngine();