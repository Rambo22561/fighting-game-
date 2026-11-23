// Procedural Web Audio API sound synthesizer for Kensei Arena
// Zero external audio files — 100% synthesized fighting impacts, whooshes, blocks, chimes, and reactive arena crowd.

class CombatAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private crowdNoiseBuffer: AudioBuffer | null = null;
  private muted = false;

  // Dynamic crowd audio graph
  private crowdBus: GainNode | null = null;
  private crowdAmbientGain: GainNode | null = null;
  private crowdAmbientFilter: BiquadFilterNode | null = null;
  private crowdAmbientActive = false;
  private crowdTension = 0;

  public unlock(): void {
    if (this.muted) return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
      this.crowdNoiseBuffer = this.createPinkNoiseBuffer(this.ctx, 3.0);
      this.initCrowdLayer(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (this.ctx && this.crowdBus) {
      const now = this.ctx.currentTime;
      this.crowdBus.gain.cancelScheduledValues(now);
      this.crowdBus.gain.setTargetAtTime(mute ? 0 : 1, now, 0.04);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 1.0;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Smooth pink-weighted noise loop for organic crowd cheering, murmur, and applause
  private createPinkNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
      data[i] = Math.max(-1, Math.min(1, pink));
    }
    // Crossfade start/end slightly so the 3s loop has zero seam clicks
    const fadeSamples = Math.min(2048, Math.floor(length * 0.05));
    for (let i = 0; i < fadeSamples; i++) {
      const t = i / fadeSamples;
      const tailIdx = length - fadeSamples + i;
      const blended = data[i] * t + data[tailIdx] * (1 - t);
      data[i] = blended;
      data[tailIdx] = blended;
    }
    return buffer;
  }

  private initCrowdLayer(ctx: AudioContext): void {
    if (this.crowdBus || !this.crowdNoiseBuffer) return;

    const bus = ctx.createGain();
    bus.gain.value = this.muted ? 0 : 1;
    bus.connect(ctx.destination);
    this.crowdBus = bus;

    // Continuous arena murmur loop modulated by match tension
    const src = ctx.createBufferSource();
    src.buffer = this.crowdNoiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 460;
    filter.Q.value = 0.85;

    const ambientGain = ctx.createGain();
    ambientGain.gain.value = 0;

    // Gentle breathing LFO so stadium murmur undulates naturally
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.38;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 75;
    lfo.connect(lfoDepth);
    lfoDepth.connect(filter.frequency);

    src.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(bus);

    src.start();
    lfo.start();

    this.crowdAmbientFilter = filter;
    this.crowdAmbientGain = ambientGain;
  }

  private ensureReady(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return null;
    if (!this.crowdBus) this.initCrowdLayer(this.ctx);
    return this.ctx;
  }

  public setCrowdActive(active: boolean): void {
    this.crowdAmbientActive = active;
    if (!this.ctx || !this.crowdAmbientGain) return;
    const now = this.ctx.currentTime;
    const target = active && !this.muted ? 0.028 + this.crowdTension * 0.065 : 0;
    this.crowdAmbientGain.gain.setTargetAtTime(target, now, active ? 0.35 : 0.2);
  }

  public updateCrowdTension(tension: number): void {
    this.crowdTension = Math.max(0, Math.min(1, tension));
    if (!this.ctx || !this.crowdAmbientGain || !this.crowdAmbientFilter) return;
    if (this.muted || !this.crowdAmbientActive) return;

    const now = this.ctx.currentTime;
    const targetGain = 0.028 + this.crowdTension * 0.068;
    const targetFreq = 440 + this.crowdTension * 380;
    this.crowdAmbientGain.gain.setTargetAtTime(targetGain, now, 0.25);
    this.crowdAmbientFilter.frequency.setTargetAtTime(targetFreq, now, 0.25);
  }

  // Celebratory arena crowd roar + formant cheer + staggered applause bursts
  public playCrowdCheer(intensity = 0.8): void {
    const ctx = this.ensureReady();
    if (!ctx || !this.crowdNoiseBuffer || !this.crowdBus) return;

    const clamped = Math.max(0.25, Math.min(1, intensity));
    const now = ctx.currentTime;
    const dur = 1.25 + clamped * 1.1;

    // 1. Dual vocal-formant stadium roar layers
    const formants = [
      { startFreq: 540, endFreq: 760, q: 1.4, peak: 0.2 * clamped },
      { startFreq: 1220, endFreq: 1740, q: 1.8, peak: 0.14 * clamped },
    ];

    formants.forEach((f) => {
      const src = ctx.createBufferSource();
      src.buffer = this.crowdNoiseBuffer;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = f.q;
      filter.frequency.setValueAtTime(f.startFreq, now);
      filter.frequency.exponentialRampToValueAtTime(f.endFreq, now + dur * 0.32);
      filter.frequency.exponentialRampToValueAtTime(f.startFreq * 1.05, now + dur);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(f.peak, now + 0.16);
      gain.gain.setValueAtTime(f.peak * 0.88, now + dur * 0.45);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.crowdBus!);
      src.start(now, Math.random() * 1.5);
      src.stop(now + dur + 0.05);
    });

    // 2. Staggered rhythmic hand-clap / applause transients
    const clapCount = Math.round(6 + clamped * 8);
    for (let i = 0; i < clapCount; i++) {
      const offset = 0.08 + (i / clapCount) * (dur * 0.72) + Math.random() * 0.05;
      const clapSrc = ctx.createBufferSource();
      clapSrc.buffer = this.noiseBuffer;

      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.value = 1700 + Math.random() * 1200;
      hp.Q.value = 1.6;

      const clapGain = ctx.createGain();
      const clapPeak = (0.045 + Math.random() * 0.04) * clamped;
      clapGain.gain.setValueAtTime(0.001, now + offset);
      clapGain.gain.linearRampToValueAtTime(clapPeak, now + offset + 0.01);
      clapGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.085);

      clapSrc.connect(hp);
      hp.connect(clapGain);
      clapGain.connect(this.crowdBus!);
      clapSrc.start(now + offset, Math.random() * 0.5);
      clapSrc.stop(now + offset + 0.1);
    }
  }

  // Disappointed/tense crowd boo & groan reaction (e.g. player under 20% HP, enemy combo, or player KO)
  public playCrowdBoo(intensity = 0.8, includeGasp = false): void {
    const ctx = this.ensureReady();
    if (!ctx || !this.crowdNoiseBuffer || !this.crowdBus) return;

    const clamped = Math.max(0.25, Math.min(1, intensity));
    const now = ctx.currentTime;
    const dur = 1.15 + clamped * 0.8;

    // Optional sharp crowd inhale/gasp transient on sudden danger (<20% HP)
    if (includeGasp && this.noiseBuffer) {
      const gaspSrc = ctx.createBufferSource();
      gaspSrc.buffer = this.noiseBuffer;

      const gaspFilter = ctx.createBiquadFilter();
      gaspFilter.type = 'bandpass';
      gaspFilter.frequency.setValueAtTime(950, now);
      gaspFilter.frequency.exponentialRampToValueAtTime(1650, now + 0.14);
      gaspFilter.Q.value = 2.0;

      const gaspGain = ctx.createGain();
      gaspGain.gain.setValueAtTime(0.001, now);
      gaspGain.gain.linearRampToValueAtTime(0.11 * clamped, now + 0.05);
      gaspGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      gaspSrc.connect(gaspFilter);
      gaspFilter.connect(gaspGain);
      gaspGain.connect(this.crowdBus);
      gaspSrc.start(now);
      gaspSrc.stop(now + 0.24);
    }

    // 1. Low descending vocal "boooo / ooooh" chorus oscillators
    const booVoices = [134, 141, 198];
    booVoices.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 2 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.74, now + dur);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now + 0.06);
      filter.frequency.exponentialRampToValueAtTime(195, now + dur);
      filter.Q.value = 1.9;

      const gain = ctx.createGain();
      const peak = (idx === 2 ? 0.05 : 0.036) * clamped;
      gain.gain.setValueAtTime(0.001, now + 0.05);
      gain.gain.linearRampToValueAtTime(peak, now + 0.26);
      gain.gain.setValueAtTime(peak * 0.85, now + dur * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.crowdBus!);
      osc.start(now + 0.05);
      osc.stop(now + dur + 0.05);
    });

    // 2. Low-mid turbulent crowd rumble
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = this.crowdNoiseBuffer;
    noiseSrc.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(370, now + 0.04);
    noiseFilter.frequency.exponentialRampToValueAtTime(215, now + dur);
    noiseFilter.Q.value = 1.3;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now + 0.04);
    noiseGain.gain.linearRampToValueAtTime(0.16 * clamped, now + 0.24);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.crowdBus);
    noiseSrc.start(now + 0.04, Math.random() * 1.5);
    noiseSrc.stop(now + dur + 0.05);
  }

  public playWhoosh(pitch = 1.0): void {
    const ctx = this.ensureReady();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600 * pitch, now);
    filter.frequency.exponentialRampToValueAtTime(180 * pitch, now + 0.14);
    filter.Q.value = 1.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.16);
  }

  public playHit(heavy = false): void {
    const ctx = this.ensureReady();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const dur = heavy ? 0.24 : 0.14;

    const osc = ctx.createOscillator();
    osc.type = heavy ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(heavy ? 165 : 210, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + dur);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(heavy ? 0.45 : 0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(heavy ? 2400 : 1800, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.09);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(heavy ? 0.35 : 0.22, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.11);
  }

  public playBlock(): void {
    const ctx = this.ensureReady();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [420, 740];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.65, now + 0.12);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 900;
      filter.Q.value = 3;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    });
  }

  public playJump(): void {
    const ctx = this.ensureReady();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.13);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playSpecial(): void {
    const ctx = this.ensureReady();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(520, now + 0.22);
    osc1.frequency.exponentialRampToValueAtTime(75, now + 0.55);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.55);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

    osc1.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);
  }

  public playGong(): void {
    const ctx = this.ensureReady();
    if (!ctx) return;

    const now = ctx.currentTime;
    const partials = [110, 165, 224, 293];
    partials.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.97, now + 1.1);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.25);
    });
  }

  public playPropBreak(kind: 'pillar' | 'vase'): void {
    const ctx = this.ensureReady();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;

    if (kind === 'pillar') {
      // Heavy stone/timber crumble: low sub-bass thud + staggered crunchy masonry debris bursts
      const thud = ctx.createOscillator();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(118, now);
      thud.frequency.exponentialRampToValueAtTime(32, now + 0.36);

      const thudGain = ctx.createGain();
      thudGain.gain.setValueAtTime(0.42, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      thud.connect(thudGain);
      thudGain.connect(ctx.destination);
      thud.start(now);
      thud.stop(now + 0.4);

      const rumbleOffsets = [0, 0.06, 0.14];
      rumbleOffsets.forEach((offset, idx) => {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950 - idx * 180, now + offset);
        filter.frequency.exponentialRampToValueAtTime(160, now + offset + 0.22);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.28 / (idx + 1), now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.24);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now + offset, idx * 0.12);
        noise.stop(now + offset + 0.26);
      });
    } else {
      // Exploding vase / canister: crisp explosive pop + high-frequency shattering ceramic/glass shards
      const pop = ctx.createOscillator();
      pop.type = 'sine';
      pop.frequency.setValueAtTime(190, now);
      pop.frequency.exponentialRampToValueAtTime(48, now + 0.18);

      const popGain = ctx.createGain();
      popGain.gain.setValueAtTime(0.36, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      pop.connect(popGain);
      popGain.connect(ctx.destination);
      pop.start(now);
      pop.stop(now + 0.21);

      const blastNoise = ctx.createBufferSource();
      blastNoise.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1400, now);
      bp.frequency.exponentialRampToValueAtTime(340, now + 0.22);
      bp.Q.value = 0.9;

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.32, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      blastNoise.connect(bp);
      bp.connect(nGain);
      nGain.connect(ctx.destination);
      blastNoise.start(now);
      blastNoise.stop(now + 0.25);

      const shardFreqs = [1820, 2480, 3150, 2120];
      shardFreqs.forEach((freq, idx) => {
        const offset = idx * 0.025;
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.72, now + offset + 0.08);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.11, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    }
  }

  public playUiClick(): void {
    const ctx = this.ensureReady();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }
}

export const combatAudio = new CombatAudioEngine();
