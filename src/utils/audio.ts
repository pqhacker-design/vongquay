/**
 * Audio Engine powered by Web Audio API & HTML5 Audio
 * Supports both high-fidelity synthesized procedural audio AND custom external sound files
 * (e.g., /sounds/spin.mp3, /sounds/win.mp3 or uploaded custom audio files).
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private volume: number = 0.85;
  private enabled: boolean = true;
  private drumOsc: OscillatorNode | null = null;
  private drumGain: GainNode | null = null;
  private spinNoiseNode: AudioBufferSourceNode | null = null;
  private spinGainNode: GainNode | null = null;
  private spinFilterNode: BiquadFilterNode | null = null;

  // Custom audio elements
  private customSpinAudio: HTMLAudioElement | null = null;
  private customWinAudio: HTMLAudioElement | null = null;
  private customSpinUrl: string | null = null;
  private customWinUrl: string | null = null;

  constructor() {
    // Check if default static audio files exist in /public/sounds/
    this.checkStaticFiles();
  }

  private async checkStaticFiles() {
    try {
      const checkSpinMp3 = await fetch('/sounds/spin.mp3', { method: 'HEAD' });
      if (checkSpinMp3.ok && !this.customSpinUrl) {
        this.setCustomSpinSound('/sounds/spin.mp3');
      } else {
        const checkSpinWav = await fetch('/sounds/spin.wav', { method: 'HEAD' });
        if (checkSpinWav.ok && !this.customSpinUrl) {
          this.setCustomSpinSound('/sounds/spin.wav');
        }
      }
    } catch {
      // not found, will use synthesized audio
    }

    try {
      const checkWinMp3 = await fetch('/sounds/win.mp3', { method: 'HEAD' });
      if (checkWinMp3.ok && !this.customWinUrl) {
        this.setCustomWinSound('/sounds/win.mp3');
      } else {
        const checkWinWav = await fetch('/sounds/win.wav', { method: 'HEAD' });
        if (checkWinWav.ok && !this.customWinUrl) {
          this.setCustomWinSound('/sounds/win.wav');
        }
      }
    } catch {
      // not found, will use synthesized audio
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.customSpinAudio) this.customSpinAudio.volume = this.volume;
    if (this.customWinAudio) this.customWinAudio.volume = this.volume;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public setCustomSpinSound(urlOrBase64?: string | null) {
    this.customSpinUrl = urlOrBase64 || null;
    if (this.customSpinUrl) {
      this.customSpinAudio = new Audio(this.customSpinUrl);
      this.customSpinAudio.volume = this.volume;
      this.customSpinAudio.loop = true;
    } else {
      this.customSpinAudio = null;
    }
  }

  public setCustomWinSound(urlOrBase64?: string | null) {
    this.customWinUrl = urlOrBase64 || null;
    if (this.customWinUrl) {
      this.customWinAudio = new Audio(this.customWinUrl);
      this.customWinAudio.volume = this.volume;
    } else {
      this.customWinAudio = null;
    }
  }

  /**
   * Preview sound in Settings
   */
  public previewSound(type: 'spin' | 'win') {
    if (!this.enabled || this.volume === 0) return;
    if (type === 'spin') {
      if (this.customSpinAudio) {
        this.customSpinAudio.currentTime = 0;
        this.customSpinAudio.volume = this.volume;
        this.customSpinAudio.play().catch(() => {});
        setTimeout(() => {
          this.customSpinAudio?.pause();
        }, 2500);
      } else {
        this.playSpinStart();
        setTimeout(() => this.stopSpinFlutter(), 2000);
      }
    } else {
      if (this.customWinAudio) {
        this.customWinAudio.currentTime = 0;
        this.customWinAudio.volume = this.volume;
        this.customWinAudio.play().catch(() => {});
      } else {
        this.playWinnerCelebration();
      }
    }
  }

  /**
   * Mechanical Wheel Tick (Single pin click)
   */
  public playTick(speedRatio = 0.5) {
    if (!this.enabled || this.volume === 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Sharp ratchet / wooden wheel pin sound
      const baseFreq = 480 + speedRatio * 450;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900 + speedRatio * 900, now);
      filter.Q.setValueAtTime(3.5, now);

      const clickVolume = (0.28 + speedRatio * 0.22) * this.volume;
      gain.gain.setValueAtTime(clickVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);

      // Add wooden click snap noise transient
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.012);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3 * this.volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
      whiteNoise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      whiteNoise.start(now);
    } catch {
      // AudioContext could be blocked if user hasn't interacted yet
    }
  }

  /**
   * Continuous Spinning Wheel Sound (Whirring flutter of spinning reel)
   */
  public startSpinFlutter() {
    if (!this.enabled || this.volume === 0) return;
    try {
      this.initCtx();
      if (!this.ctx || this.spinNoiseNode) return;

      const duration = 2.0; // looped buffer
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Create rhythmic fluttering wheel noise texture
      for (let i = 0; i < bufferSize; i++) {
        const pulse = Math.sin((i / this.ctx.sampleRate) * 120 * Math.PI * 2);
        data[i] = (Math.random() * 2 - 1) * 0.5 * (0.6 + 0.4 * pulse);
      }

      this.spinNoiseNode = this.ctx.createBufferSource();
      this.spinNoiseNode.buffer = buffer;
      this.spinNoiseNode.loop = true;

      this.spinFilterNode = this.ctx.createBiquadFilter();
      this.spinFilterNode.type = 'lowpass';
      this.spinFilterNode.frequency.setValueAtTime(1600, this.ctx.currentTime);

      this.spinGainNode = this.ctx.createGain();
      this.spinGainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.spinGainNode.gain.linearRampToValueAtTime(0.22 * this.volume, this.ctx.currentTime + 0.25);

      this.spinNoiseNode.connect(this.spinFilterNode);
      this.spinFilterNode.connect(this.spinGainNode);
      this.spinGainNode.connect(this.ctx.destination);

      this.spinNoiseNode.start(this.ctx.currentTime);
    } catch {
      // ignore
    }
  }

  /**
   * Modulate continuous spinning sound as wheel decelerates
   */
  public updateSpinFlutter(speedRatio: number) {
    if (this.customSpinAudio) {
      // If custom audio is playing, modulate playback rate slightly with wheel speed
      try {
        this.customSpinAudio.playbackRate = Math.max(0.65, Math.min(1.3, 0.65 + speedRatio * 0.65));
      } catch {
        // ignore
      }
    }

    if (!this.ctx || !this.spinFilterNode || !this.spinGainNode) return;
    try {
      const now = this.ctx.currentTime;
      const targetFreq = 400 + Math.max(0, speedRatio) * 1400;
      this.spinFilterNode.frequency.setTargetAtTime(targetFreq, now, 0.05);

      const targetGain = Math.max(0.02, speedRatio * 0.22) * this.volume;
      this.spinGainNode.gain.setTargetAtTime(targetGain, now, 0.05);
    } catch {
      // ignore
    }
  }

  public stopSpinFlutter() {
    if (this.customSpinAudio) {
      try {
        this.customSpinAudio.pause();
        this.customSpinAudio.currentTime = 0;
      } catch {
        // ignore
      }
    }

    if (this.spinNoiseNode && this.spinGainNode && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.spinGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        this.spinNoiseNode.stop(now + 0.12);
      } catch {
        // ignore
      }
      this.spinNoiseNode = null;
      this.spinGainNode = null;
      this.spinFilterNode = null;
    }
  }

  /**
   * Spin Start Whoosh / Acceleration Swoop
   */
  public playSpinStart() {
    if (!this.enabled || this.volume === 0) return;

    // If custom spin audio is configured, play it!
    if (this.customSpinAudio) {
      try {
        this.customSpinAudio.currentTime = 0;
        this.customSpinAudio.volume = this.volume;
        this.customSpinAudio.play().catch(() => {});
      } catch {
        // ignore
      }
    }

    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.35);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.45 * this.volume, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);

      // Start continuous spin flutter loop
      this.startSpinFlutter();
    } catch {
      // ignore
    }
  }

  /**
   * Suspense drum roll / tension build
   */
  public startTensionRoll() {
    if (!this.enabled || this.volume === 0) return;
    try {
      this.initCtx();
      if (!this.ctx || this.drumOsc) return;

      const now = this.ctx.currentTime;
      this.drumOsc = this.ctx.createOscillator();
      this.drumGain = this.ctx.createGain();

      this.drumOsc.type = 'sawtooth';
      this.drumOsc.frequency.setValueAtTime(68, now);

      this.drumGain.gain.setValueAtTime(0.05 * this.volume, now);
      this.drumGain.gain.linearRampToValueAtTime(0.24 * this.volume, now + 1.8);

      this.drumOsc.connect(this.drumGain);
      this.drumGain.connect(this.ctx.destination);
      this.drumOsc.start(now);
    } catch {
      // ignore
    }
  }

  public stopTensionRoll() {
    if (this.drumOsc && this.drumGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.drumGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        this.drumOsc.stop(now + 0.09);
      } catch {
        // ignore
      }
      this.drumOsc = null;
      this.drumGain = null;
    }
  }

  /**
   * Enthusiastic Realistic Applause
   */
  public playApplause() {
    if (!this.enabled || this.volume === 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const duration = 3.8;
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = Math.floor(sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      // Synthesize individual hand claps at randomized timings
      const numClaps = 260;
      for (let c = 0; c < numClaps; c++) {
        const timePos = Math.pow(Math.random(), 0.85) * (duration - 0.2);
        const startIndex = Math.floor(timePos * sampleRate);
        const clapDuration = Math.floor((0.02 + Math.random() * 0.035) * sampleRate);
        const clapIntensity = (0.35 + Math.random() * 0.65) * Math.sin((timePos / duration) * Math.PI);

        for (let i = 0; i < clapDuration && (startIndex + i) < bufferSize; i++) {
          const envelope = Math.exp(-i / (clapDuration * 0.28));
          data[startIndex + i] += (Math.random() * 2 - 1) * clapIntensity * envelope * 0.45;
        }
      }

      for (let i = 0; i < bufferSize; i++) {
        const t = i / sampleRate;
        const envelope = Math.sin((t / duration) * Math.PI) * 0.25;
        data[i] += (Math.random() * 2 - 1) * envelope;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const clapFilter = this.ctx.createBiquadFilter();
      clapFilter.type = 'bandpass';
      clapFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      clapFilter.Q.setValueAtTime(1.1, this.ctx.currentTime);

      const masterGain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      masterGain.gain.setValueAtTime(0.01, now);
      masterGain.gain.linearRampToValueAtTime(0.65 * this.volume, now + 0.2);
      masterGain.gain.setValueAtTime(0.6 * this.volume, now + duration * 0.65);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(clapFilter);
      clapFilter.connect(masterGain);
      masterGain.connect(this.ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + duration + 0.1);
    } catch {
      // ignore
    }
  }

  /**
   * Complete Celebration: Custom win audio if provided, else Fanfare + Applause
   */
  public playWinnerCelebration() {
    if (!this.enabled || this.volume === 0) return;

    this.stopSpinFlutter();
    this.stopTensionRoll();

    // If custom winning sound file exists, play it!
    if (this.customWinAudio) {
      try {
        this.customWinAudio.currentTime = 0;
        this.customWinAudio.volume = this.volume;
        this.customWinAudio.play().catch(() => {});
        // Also play applause along with it for extra cheer
        this.playApplause();
        return;
      } catch {
        // fallback
      }
    }

    try {
      this.initCtx();
      if (!this.ctx) return;

      // 1. Immediately fire the applause
      this.playApplause();

      // 2. Play royal victory fanfare chord sequence
      const notes = [
        { f: 523.25, d: 0.14, gap: 0 },    // C5
        { f: 659.25, d: 0.14, gap: 0.12 }, // E5
        { f: 783.99, d: 0.16, gap: 0.24 }, // G5
        { f: 1046.50, d: 0.6, gap: 0.38 }, // C6
        { f: 783.99, d: 0.14, gap: 0.72 }, // G5
        { f: 1046.50, d: 0.9, gap: 0.86 }  // C6 grand finish
      ];

      const now = this.ctx.currentTime + 0.02;

      notes.forEach(({ f, d, gap }) => {
        if (!this.ctx) return;
        const noteStart = now + gap;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, noteStart);

        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.42 * this.volume, noteStart + 0.02);
        gain.gain.setValueAtTime(0.38 * this.volume, noteStart + d * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + d + 0.05);

        // Sub harmonic warmth
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(f / 2, noteStart);
        subGain.gain.setValueAtTime(0.22 * this.volume, noteStart);
        subGain.gain.exponentialRampToValueAtTime(0.001, noteStart + d);
        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(noteStart);
        subOsc.stop(noteStart + d + 0.05);
      });
    } catch {
      // ignore
    }
  }
}

export const soundEngine = new SoundEngine();
