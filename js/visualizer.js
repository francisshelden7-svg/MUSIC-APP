/**
 * Audio Visualizer Engine
 * Renders real-time frequency spectrum and waveforms onto HTML5 Canvas.
 */

export class AudioVisualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.analyser = null;
    this.dataArray = null;
    this.bufferLength = 0;
    this.animationFrameId = null;
    this.mode = 'bars'; // 'bars', 'wave', 'circle'
    this.isPlaying = false;
    this.simulatedTime = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  setAnalyser(analyserNode) {
    this.analyser = analyserNode;
    if (this.analyser) {
      this.analyser.fftSize = 128;
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
    }
  }

  setMode(mode) {
    if (['bars', 'wave', 'circle'].includes(mode)) {
      this.mode = mode;
    }
  }

  start() {
    this.isPlaying = true;
    if (!this.animationFrameId) {
      this.render();
    }
  }

  stop() {
    this.isPlaying = false;
  }

  render() {
    this.animationFrameId = requestAnimationFrame(() => this.render());

    const width = this.width;
    const height = this.height;

    this.ctx.clearRect(0, 0, width, height);

    // Retrieve real frequency data or generate smooth idle/pulsing data
    let hasRealData = false;
    if (this.analyser && this.isPlaying) {
      try {
        this.analyser.getByteFrequencyData(this.dataArray);
        // Check if there is actual sound amplitude
        hasRealData = this.dataArray.some(val => val > 0);
      } catch (e) {
        hasRealData = false;
      }
    }

    if (!hasRealData) {
      this.renderIdleState(width, height);
      return;
    }

    switch (this.mode) {
      case 'wave':
        this.renderWave(width, height);
        break;
      case 'circle':
        this.renderCircle(width, height);
        break;
      case 'bars':
      default:
        this.renderBars(width, height);
        break;
    }
  }

  /**
   * High-tech Neon Spectrum Bars
   */
  renderBars(width, height) {
    const barCount = 36;
    const barSpacing = 4;
    const totalSpacing = (barCount - 1) * barSpacing;
    const barWidth = Math.max(3, (width - totalSpacing) / barCount);

    const step = Math.floor(this.bufferLength / barCount) || 1;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.min(i * step, this.bufferLength - 1);
      const value = this.dataArray[dataIndex] || 0;
      const percent = value / 255;
      const barHeight = Math.max(4, percent * (height - 12));

      const x = i * (barWidth + barSpacing);
      const y = height - barHeight;

      // Dynamic Gradient based on bar index & height
      const gradient = this.ctx.createLinearGradient(0, height, 0, y);
      gradient.addColorStop(0, '#6366f1');   // Indigo
      gradient.addColorStop(0.5, '#06b6d4'); // Cyan
      gradient.addColorStop(1, '#ec4899');   // Magenta

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
      } else {
        this.ctx.rect(x, y, barWidth, barHeight);
      }
      this.ctx.fill();

      // Top floating glow cap
      if (percent > 0.3) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x + barWidth / 2, Math.max(3, y - 3), 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  /**
   * Smooth Oscilloscope Sine Wave
   */
  renderWave(width, height) {
    this.ctx.lineWidth = 2.5;
    const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(0.5, '#06b6d4');
    gradient.addColorStop(1, '#ec4899');
    this.ctx.strokeStyle = gradient;

    this.ctx.beginPath();
    const sliceWidth = width / (this.bufferLength - 1);
    let x = 0;

    for (let i = 0; i < this.bufferLength; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = (v * (height / 2));

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.stroke();

    // Fill under wave with glowing subtle gradient
    this.ctx.lineTo(width, height);
    this.ctx.lineTo(0, height);
    this.ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
    this.ctx.fill();
  }

  /**
   * Radial Frequency Visualizer
   */
  renderCircle(width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.22;
    const barCount = 32;

    for (let i = 0; i < barCount; i++) {
      const rad = (Math.PI * 2 / barCount) * i;
      const dataIndex = Math.min(i * 2, this.bufferLength - 1);
      const val = (this.dataArray[dataIndex] || 0) / 255;
      const barLen = val * (height * 0.35);

      const x1 = centerX + Math.cos(rad) * baseRadius;
      const y1 = centerY + Math.sin(rad) * baseRadius;
      const x2 = centerX + Math.cos(rad) * (baseRadius + barLen);
      const y2 = centerY + Math.sin(rad) * (baseRadius + barLen);

      this.ctx.strokeStyle = `hsl(${220 + i * 3.5}, 90%, 65%)`;
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
  }

  /**
   * Smooth idle ambient pulse when paused or awaiting audio context
   */
  renderIdleState(width, height) {
    this.simulatedTime += 0.03;
    const barCount = 36;
    const barSpacing = 4;
    const totalSpacing = (barCount - 1) * barSpacing;
    const barWidth = Math.max(3, (width - totalSpacing) / barCount);

    for (let i = 0; i < barCount; i++) {
      const wave = Math.sin(this.simulatedTime + i * 0.25) * 0.5 + 0.5;
      const barHeight = this.isPlaying ? 8 + wave * 14 : 4;
      const x = i * (barWidth + barSpacing);
      const y = height - barHeight;

      this.ctx.fillStyle = this.isPlaying ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.06)';
      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
      } else {
        this.ctx.rect(x, y, barWidth, barHeight);
      }
      this.ctx.fill();
    }
  }
}
