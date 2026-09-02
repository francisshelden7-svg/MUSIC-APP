/**
 * Core Audio Player Engine
 * Integrates HTML5 Audio element with Web Audio API AnalyserNode.
 */

export class AudioEngine {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    // Allow cross-origin analysis if headers permit
    this.audio.crossOrigin = 'anonymous';

    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
    this.isAudioContextInitialized = false;

    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 0.8;
    this.isMuted = false;
    this.repeatMode = 'all'; // 'all', 'one', 'none'
    this.isShuffled = false;

    // Callbacks
    this.onTrackChange = null;
    this.onPlayStateChange = null;
    this.onTimeUpdate = null;
    this.onVolumeChange = null;
    this.onModeChange = null;
    this.onTrackEnded = null;
    this.onError = null;

    this.initAudioEvents();
  }

  /**
   * Lazily initialize Web Audio API on first user interaction
   */
  initWebAudio() {
    if (this.isAudioContextInitialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.85;

      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.isAudioContextInitialized = true;
    } catch (e) {
      console.warn('Web Audio API initialized with direct destination fallback', e);
      // If CORS blocks createMediaElementSource, audio element will still output to hardware
    }
  }

  getAnalyser() {
    return this.analyser;
  }

  initAudioEvents() {
    this.audio.volume = this.volume;

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      if (this.onPlayStateChange) this.onPlayStateChange(true);
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      if (this.onPlayStateChange) this.onPlayStateChange(false);
    });

    this.audio.addEventListener('timeupdate', () => {
      const current = this.audio.currentTime || 0;
      const total = this.audio.duration || 0;
      const percent = total > 0 ? (current / total) * 100 : 0;
      if (this.onTimeUpdate) {
        this.onTimeUpdate(current, total, percent);
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.repeatMode === 'one') {
        this.audio.currentTime = 0;
        this.play();
      } else {
        if (this.onTrackEnded) this.onTrackEnded();
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio playback error occurred:', e);
      if (this.onError) {
        this.onError('Unable to play audio stream. It may be restricted or unsupported.');
      }
    });
  }

  /**
   * Load a track object
   */
  loadTrack(track, autoPlay = true) {
    this.currentTrack = track;
    this.audio.src = track.audioUrl;
    this.audio.currentTime = 0;

    if (this.onTrackChange) {
      this.onTrackChange(track);
    }

    if (autoPlay) {
      this.play();
    }
  }

  async play() {
    this.initWebAudio();

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (err) {
        console.warn('Could not resume audioContext', err);
      }
    }

    try {
      await this.audio.play();
      this.isPlaying = true;
      if (this.onPlayStateChange) this.onPlayStateChange(true);
    } catch (err) {
      console.warn('Audio play request interrupted:', err);
      this.isPlaying = false;
      if (this.onPlayStateChange) this.onPlayStateChange(false);
    }
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    if (this.onPlayStateChange) this.onPlayStateChange(false);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(percent) {
    if (this.audio.duration && !isNaN(this.audio.duration)) {
      const targetTime = (percent / 100) * this.audio.duration;
      this.audio.currentTime = Math.max(0, Math.min(targetTime, this.audio.duration));
    }
  }

  seekBySeconds(secondsDelta) {
    if (this.audio.duration && !isNaN(this.audio.duration)) {
      const targetTime = this.audio.currentTime + secondsDelta;
      this.audio.currentTime = Math.max(0, Math.min(targetTime, this.audio.duration));
    }
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    this.audio.volume = this.volume;
    this.isMuted = this.volume === 0;

    if (this.onVolumeChange) {
      this.onVolumeChange(this.volume, this.isMuted);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.audio.muted = this.isMuted;

    if (this.onVolumeChange) {
      this.onVolumeChange(this.audio.muted ? 0 : this.volume, this.isMuted);
    }
  }

  toggleRepeat() {
    const modes = ['all', 'one', 'none'];
    const nextIndex = (modes.indexOf(this.repeatMode) + 1) % modes.length;
    this.repeatMode = modes[nextIndex];

    if (this.onModeChange) {
      this.onModeChange({ repeatMode: this.repeatMode, isShuffled: this.isShuffled });
    }
    return this.repeatMode;
  }

  toggleShuffle() {
    this.isShuffled = !this.isShuffled;

    if (this.onModeChange) {
      this.onModeChange({ repeatMode: this.repeatMode, isShuffled: this.isShuffled });
    }
    return this.isShuffled;
  }
}
