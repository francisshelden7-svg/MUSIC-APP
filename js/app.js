/**
 * Main Application Coordinator
 * Connects UI, Cloudinary Services, Visualizer, Audio Engine, and Playlist.
 */

import { CloudinaryService } from './cloudinary.js';
import { AudioEngine } from './player.js';
import { AudioVisualizer } from './visualizer.js';
import { PlaylistManager } from './playlist.js';

class App {
  constructor() {
    this.cloudinary = new CloudinaryService();
    this.player = new AudioEngine();
    this.playlist = new PlaylistManager(this.cloudinary);
    this.visualizer = null;

    this.currentTrackIndex = 0;
    this.activeGenreFilter = 'all';
    this.searchQuery = '';
    this.isDraggingProgress = false;

    // Upload state
    this.uploadAudioFile = null;
    this.uploadCoverFile = null;

    this.init();
  }

  init() {
    this.cacheDom();
    this.initVisualizer();
    this.bindEvents();
    this.bindPlayerCallbacks();
    this.updateCloudinaryBadge();
    this.renderPlaylist();

    // Load initial track
    const tracks = this.playlist.getTracks();
    if (tracks.length > 0) {
      this.selectTrack(0, false);
    }

    this.showToast('Welcome to NeonWave Player! Cloudinary ready.', 'info');
  }

  cacheDom() {
    // Player DOM
    this.playerCard = document.getElementById('playerCard');
    this.coverImage = document.getElementById('coverImage');
    this.vinylDisc = document.getElementById('vinylDisc');
    this.trackTitle = document.getElementById('trackTitle');
    this.trackArtist = document.getElementById('trackArtist');
    this.trackBadge = document.getElementById('trackBadge');
    this.currentTimeEl = document.getElementById('currentTime');
    this.totalTimeEl = document.getElementById('totalTime');
    this.seekTrack = document.getElementById('seekTrack');
    this.seekProgress = document.getElementById('seekProgress');
    this.seekThumb = document.getElementById('seekThumb');

    // Controls
    this.playPauseBtn = document.getElementById('playPauseBtn');
    this.playIcon = document.getElementById('playIcon');
    this.pauseIcon = document.getElementById('pauseIcon');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.repeatBtn = document.getElementById('repeatBtn');
    this.shuffleBtn = document.getElementById('shuffleBtn');

    // Volume
    this.muteBtn = document.getElementById('muteBtn');
    this.volumeTrack = document.getElementById('volumeTrack');
    this.volumeProgress = document.getElementById('volumeProgress');
    this.qualitySelect = document.getElementById('qualitySelect');

    // Visualizer
    this.canvas = document.getElementById('visualizerCanvas');
    this.vizModeBtns = document.querySelectorAll('.viz-mode-btn');

    // Playlist DOM
    this.playlistTracksContainer = document.getElementById('playlistTracks');
    this.trackCountBadge = document.getElementById('trackCountBadge');
    this.searchInput = document.getElementById('searchInput');
    this.filterPills = document.querySelectorAll('.filter-pill');

    // Header & Modals
    this.cloudStatusPill = document.getElementById('cloudStatusPill');
    this.openUploadBtn = document.getElementById('openUploadBtn');
    this.openSettingsBtn = document.getElementById('openSettingsBtn');
    this.uploadModal = document.getElementById('uploadModal');
    this.closeUploadModalBtn = document.getElementById('closeUploadModalBtn');
    this.settingsModal = document.getElementById('settingsModal');
    this.closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');

    // Upload Form DOM
    this.tabUploadFile = document.getElementById('tabUploadFile');
    this.tabUploadUrl = document.getElementById('tabUploadUrl');
    this.fileUploadSection = document.getElementById('fileUploadSection');
    this.urlUploadSection = document.getElementById('urlUploadSection');

    this.audioDropzone = document.getElementById('audioDropzone');
    this.audioFileInput = document.getElementById('audioFileInput');
    this.audioFilePill = document.getElementById('audioFilePill');
    this.audioFileName = document.getElementById('audioFileName');

    this.coverDropzone = document.getElementById('coverDropzone');
    this.coverFileInput = document.getElementById('coverFileInput');
    this.coverFilePill = document.getElementById('coverFilePill');
    this.coverFileName = document.getElementById('coverFileName');

    this.newTrackTitle = document.getElementById('newTrackTitle');
    this.newTrackArtist = document.getElementById('newTrackArtist');
    this.newTrackGenre = document.getElementById('newTrackGenre');
    this.submitUploadBtn = document.getElementById('submitUploadBtn');
    this.uploadProgressContainer = document.getElementById('uploadProgressContainer');
    this.uploadProgressFill = document.getElementById('uploadProgressFill');
    this.uploadProgressText = document.getElementById('uploadProgressText');

    // URL Form DOM
    this.urlTrackAudio = document.getElementById('urlTrackAudio');
    this.urlTrackCover = document.getElementById('urlTrackCover');
    this.urlTrackTitle = document.getElementById('urlTrackTitle');
    this.urlTrackArtist = document.getElementById('urlTrackArtist');
    this.urlTrackGenre = document.getElementById('urlTrackGenre');
    this.submitUrlBtn = document.getElementById('submitUrlBtn');

    // Settings DOM
    this.settingsCloudName = document.getElementById('settingsCloudName');
    this.settingsUploadPreset = document.getElementById('settingsUploadPreset');
    this.settingsAudioQuality = document.getElementById('settingsAudioQuality');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    this.resetDemoTracksBtn = document.getElementById('resetDemoTracksBtn');

    // Toast Container
    this.toastContainer = document.getElementById('toastContainer');
  }

  initVisualizer() {
    this.visualizer = new AudioVisualizer(this.canvas);
    this.visualizer.start();
  }

  bindPlayerCallbacks() {
    this.player.onTrackChange = (track) => {
      this.trackTitle.textContent = track.title;
      this.trackArtist.textContent = track.artist;
      this.coverImage.src = track.coverUrl;
      this.trackBadge.textContent = track.source === 'cloudinary' ? `Cloudinary / ${track.cloudinaryPublicId || 'Live'}` : (track.genre || 'Cloud Track');
      this.currentTimeEl.textContent = '0:00';
      this.totalTimeEl.textContent = track.duration || '--:--';
      this.seekProgress.style.width = '0%';
      this.seekThumb.style.left = '0%';
      this.renderPlaylist();
    };

    this.player.onPlayStateChange = (isPlaying) => {
      if (isPlaying) {
        this.playIcon.style.display = 'none';
        this.pauseIcon.style.display = 'block';
        this.vinylDisc.classList.add('spin');
        this.vinylDisc.classList.remove('paused');
        this.playerCard.classList.add('is-playing');
        this.visualizer.setAnalyser(this.player.getAnalyser());
        this.visualizer.start();
      } else {
        this.playIcon.style.display = 'block';
        this.pauseIcon.style.display = 'none';
        this.vinylDisc.classList.add('paused');
        this.playerCard.classList.remove('is-playing');
        this.visualizer.stop();
      }
      this.renderPlaylist();
    };

    this.player.onTimeUpdate = (currentTime, totalTime, percent) => {
      if (!this.isDraggingProgress) {
        this.currentTimeEl.textContent = this.formatTime(currentTime);
        if (totalTime > 0) {
          this.totalTimeEl.textContent = this.formatTime(totalTime);
        }
        this.seekProgress.style.width = `${percent}%`;
        this.seekThumb.style.left = `${percent}%`;
      }
    };

    this.player.onVolumeChange = (vol, isMuted) => {
      this.volumeProgress.style.width = `${isMuted ? 0 : vol * 100}%`;
    };

    this.player.onModeChange = ({ repeatMode, isShuffled }) => {
      // Update repeat button state
      this.repeatBtn.classList.toggle('active', repeatMode !== 'none');
      this.repeatBtn.title = `Repeat: ${repeatMode}`;

      // Update shuffle button state
      this.shuffleBtn.classList.toggle('active', isShuffled);
    };

    this.player.onTrackEnded = () => {
      this.playNextTrack();
    };

    this.player.onError = (msg) => {
      this.showToast(msg, 'error');
    };
  }

  bindEvents() {
    // Play/Pause Controls
    this.playPauseBtn.addEventListener('click', () => this.player.togglePlay());
    this.prevBtn.addEventListener('click', () => this.playPrevTrack());
    this.nextBtn.addEventListener('click', () => this.playNextTrack());
    this.repeatBtn.addEventListener('click', () => {
      const mode = this.player.toggleRepeat();
      this.showToast(`Repeat mode: ${mode.toUpperCase()}`, 'info');
    });
    this.shuffleBtn.addEventListener('click', () => {
      const isShuffled = this.player.toggleShuffle();
      this.showToast(`Shuffle: ${isShuffled ? 'ON' : 'OFF'}`, 'info');
    });

    // Seek Bar Scrubbing
    this.seekTrack.addEventListener('click', (e) => {
      const rect = this.seekTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
      this.player.seek(percent);
    });

    // Volume Bar
    this.volumeTrack.addEventListener('click', (e) => {
      const rect = this.volumeTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const vol = Math.max(0, Math.min(1, clickX / rect.width));
      this.player.setVolume(vol);
    });
    this.muteBtn.addEventListener('click', () => this.player.toggleMute());

    // Quality Selector (Dynamic Cloudinary transformation)
    this.qualitySelect.addEventListener('change', (e) => {
      const quality = e.target.value;
      this.cloudinary.saveConfig({ audioQuality: quality });
      this.applyQualityTransformation(quality);
    });

    // Visualizer Mode Buttons
    this.vizModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.vizModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.visualizer.setMode(mode);
      });
    });

    // Playlist Search & Filters
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderPlaylist();
    });

    this.filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeGenreFilter = pill.dataset.genre;
        this.renderPlaylist();
      });
    });

    // Modals
    this.openUploadBtn.addEventListener('click', () => this.openModal(this.uploadModal));
    this.closeUploadModalBtn.addEventListener('click', () => this.closeModal(this.uploadModal));

    this.cloudStatusPill.addEventListener('click', () => this.openSettingsModal());
    this.openSettingsBtn.addEventListener('click', () => this.openSettingsModal());
    this.closeSettingsModalBtn.addEventListener('click', () => this.closeModal(this.settingsModal));

    // Close on overlay click
    [this.uploadModal, this.settingsModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal);
      });
    });

    // Upload Form Tabs
    this.tabUploadFile.addEventListener('click', () => {
      this.tabUploadFile.classList.add('active');
      this.tabUploadUrl.classList.remove('active');
      this.fileUploadSection.style.display = 'block';
      this.urlUploadSection.style.display = 'none';
    });
    this.tabUploadUrl.addEventListener('click', () => {
      this.tabUploadUrl.classList.add('active');
      this.tabUploadFile.classList.remove('active');
      this.fileUploadSection.style.display = 'none';
      this.urlUploadSection.style.display = 'block';
    });

    // File Dropzones
    this.setupDropzone(this.audioDropzone, this.audioFileInput, (file) => {
      this.uploadAudioFile = file;
      this.audioFileName.textContent = file.name;
      this.audioFilePill.style.display = 'inline-flex';
      if (!this.newTrackTitle.value) {
        this.newTrackTitle.value = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      }
    });

    this.setupDropzone(this.coverDropzone, this.coverFileInput, (file) => {
      this.uploadCoverFile = file;
      this.coverFileName.textContent = file.name;
      this.coverFilePill.style.display = 'inline-flex';
    });

    // Submit Direct Cloudinary Upload
    this.submitUploadBtn.addEventListener('click', () => this.handleDirectUpload());

    // Submit URL Importer
    this.submitUrlBtn.addEventListener('click', () => this.handleUrlImport());

    // Settings Modal Save & Reset
    this.saveSettingsBtn.addEventListener('click', () => this.handleSaveSettings());
    this.resetDemoTracksBtn.addEventListener('click', () => {
      this.playlist.resetToDefaults();
      this.renderPlaylist();
      this.selectTrack(0, false);
      this.showToast('Reset playlist to curated Cloudinary sample tracks!', 'success');
      this.closeModal(this.settingsModal);
    });

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.player.togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.player.seekBySeconds(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.player.seekBySeconds(5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.player.setVolume(this.player.volume + 0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.player.setVolume(this.player.volume - 0.05);
          break;
        case 'KeyM':
          this.player.toggleMute();
          break;
        case 'KeyL':
          this.player.toggleRepeat();
          break;
        case 'KeyS':
          this.player.toggleShuffle();
          break;
      }
    });
  }

  setupDropzone(zoneEl, inputEl, onFileSelected) {
    zoneEl.addEventListener('click', () => inputEl.click());

    inputEl.addEventListener('change', () => {
      if (inputEl.files && inputEl.files[0]) {
        onFileSelected(inputEl.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      zoneEl.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        zoneEl.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      zoneEl.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        zoneEl.classList.remove('dragover');
      });
    });

    zoneEl.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files[0]) {
        onFileSelected(files[0]);
      }
    });
  }

  renderPlaylist() {
    const tracks = this.playlist.filterTracks({
      query: this.searchQuery,
      genre: this.activeGenreFilter
    });

    this.trackCountBadge.textContent = `${tracks.length} tracks`;
    this.playlistTracksContainer.innerHTML = '';

    if (tracks.length === 0) {
      this.playlistTracksContainer.innerHTML = `
        <div class="empty-playlist-msg">
          <p>No tracks found matching your search.</p>
        </div>
      `;
      return;
    }

    const currentTrack = this.player.currentTrack;

    tracks.forEach((track) => {
      const isCurrent = currentTrack && currentTrack.id === track.id;
      const isPlaying = isCurrent && this.player.isPlaying;

      const item = document.createElement('div');
      item.className = `track-item ${isCurrent ? 'is-current' : ''} ${isPlaying ? 'is-playing' : ''}`;
      item.innerHTML = `
        <div class="track-index-cover">
          <img src="${track.coverUrl}" alt="${track.title}" loading="lazy" />
          <div class="playing-equalizer-bars">
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
          </div>
        </div>
        <div class="track-item-meta">
          <div class="track-item-title">${this.escapeHtml(track.title)}</div>
          <div class="track-item-artist">${this.escapeHtml(track.artist)}</div>
        </div>
        <div class="track-item-right">
          <span class="track-source-tag">${track.source === 'cloudinary' ? 'Cloudinary' : (track.genre || 'Cloud')}</span>
          <span class="track-duration-text">${track.duration}</span>
          <button class="track-item-action-btn ${track.isFavorite ? 'is-fav' : ''}" title="Favorite" data-fav-id="${track.id}">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
          <button class="track-item-action-btn" title="Remove track" data-del-id="${track.id}">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      `;

      // Click to play track
      item.addEventListener('click', (e) => {
        if (e.target.closest('.track-item-action-btn')) return;
        this.selectTrackById(track.id, true);
      });

      // Favorite toggle
      const favBtn = item.querySelector('[data-fav-id]');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isFav = this.playlist.toggleFavorite(track.id);
        favBtn.classList.toggle('is-fav', isFav);
        this.showToast(`${track.title} ${isFav ? 'added to' : 'removed from'} favorites`, 'info');
      });

      // Remove track
      const delBtn = item.querySelector('[data-del-id]');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playlist.removeTrack(track.id);
        this.renderPlaylist();
        this.showToast(`Removed "${track.title}"`, 'info');
      });

      this.playlistTracksContainer.appendChild(item);
    });
  }

  selectTrackById(trackId, autoPlay = true) {
    const tracks = this.playlist.getTracks();
    const index = tracks.findIndex(t => t.id === trackId);
    if (index !== -1) {
      this.selectTrack(index, autoPlay);
    }
  }

  selectTrack(index, autoPlay = true) {
    const tracks = this.playlist.getTracks();
    if (tracks.length === 0) return;

    this.currentTrackIndex = (index + tracks.length) % tracks.length;
    const track = tracks[this.currentTrackIndex];
    this.player.loadTrack(track, autoPlay);
  }

  playNextTrack() {
    const tracks = this.playlist.getTracks();
    if (tracks.length <= 1) {
      this.player.seek(0);
      this.player.play();
      return;
    }

    if (this.player.isShuffled) {
      let randomIndex = Math.floor(Math.random() * tracks.length);
      if (randomIndex === this.currentTrackIndex) {
        randomIndex = (randomIndex + 1) % tracks.length;
      }
      this.selectTrack(randomIndex, true);
    } else {
      this.selectTrack(this.currentTrackIndex + 1, true);
    }
  }

  playPrevTrack() {
    if (this.player.audio.currentTime > 3) {
      this.player.seek(0);
      return;
    }
    this.selectTrack(this.currentTrackIndex - 1, true);
  }

  applyQualityTransformation(quality) {
    const track = this.player.currentTrack;
    if (!track) return;

    if (track.source === 'cloudinary') {
      const transformedUrl = this.cloudinary.buildAudioUrl(track.audioUrl, { quality });
      const wasPlaying = this.player.isPlaying;
      const prevTime = this.player.audio.currentTime;

      this.player.audio.src = transformedUrl;
      this.player.audio.currentTime = prevTime;
      if (wasPlaying) {
        this.player.play();
      }
      this.showToast(`Applied Cloudinary bitrate: ${quality.toUpperCase()}`, 'success');
    } else {
      this.showToast(`Quality preference set to ${quality.toUpperCase()}`, 'info');
    }
  }

  async handleDirectUpload() {
    if (!this.uploadAudioFile) {
      this.showToast('Please select an audio file to upload.', 'error');
      return;
    }

    const preset = this.cloudinary.getUploadPreset();
    if (!preset) {
      this.showToast('Upload Preset not set! Open Settings and enter an unsigned preset name first.', 'error');
      this.openSettingsModal();
      return;
    }

    this.submitUploadBtn.disabled = true;
    this.uploadProgressContainer.style.display = 'block';
    this.uploadProgressFill.style.width = '0%';
    this.uploadProgressText.textContent = 'Uploading audio to Cloudinary... 0%';

    try {
      // 1. Upload audio
      const audioResult = await this.cloudinary.uploadMedia(
        this.uploadAudioFile,
        'video',
        (pct) => {
          this.uploadProgressFill.style.width = `${pct * 0.7}%`;
          this.uploadProgressText.textContent = `Uploading audio... ${Math.round(pct * 0.7)}%`;
        }
      );

      // 2. Upload cover if selected
      let coverUrl = 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500/sample.jpg';
      if (this.uploadCoverFile) {
        this.uploadProgressText.textContent = 'Uploading album cover... 75%';
        const coverResult = await this.cloudinary.uploadMedia(this.uploadCoverFile, 'image');
        coverUrl = coverResult.secure_url;
      }

      this.uploadProgressFill.style.width = '100%';
      this.uploadProgressText.textContent = 'Cloudinary Processing Complete!';

      const newTrack = this.playlist.addTrack({
        title: this.newTrackTitle.value.trim() || this.uploadAudioFile.name,
        artist: this.newTrackArtist.value.trim() || 'Custom Upload',
        genre: this.newTrackGenre.value || 'Cloudinary',
        audioUrl: audioResult.secure_url,
        coverUrl: coverUrl,
        duration: audioResult.duration ? this.formatTime(audioResult.duration) : '--:--',
        source: 'cloudinary',
        cloudinaryPublicId: audioResult.public_id
      });

      this.showToast(`Successfully uploaded "${newTrack.title}" to Cloudinary!`, 'success');

      // Reset form
      this.resetUploadForm();
      this.closeModal(this.uploadModal);
      this.renderPlaylist();
      this.selectTrack(0, true);
    } catch (err) {
      console.error(err);
      this.showToast(err.message || 'Upload failed.', 'error');
    } finally {
      this.submitUploadBtn.disabled = false;
      this.uploadProgressContainer.style.display = 'none';
    }
  }

  handleUrlImport() {
    const audioUrl = this.urlTrackAudio.value.trim();
    if (!audioUrl) {
      this.showToast('Audio URL is required.', 'error');
      return;
    }

    const title = this.urlTrackTitle.value.trim() || 'Cloudinary Track';
    const artist = this.urlTrackArtist.value.trim() || 'Dynamic Stream';
    const genre = this.urlTrackGenre.value || 'Cloudinary';
    const coverUrl = this.urlTrackCover.value.trim() || 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500/sample.jpg';

    const parsed = this.cloudinary.parseCloudinaryUrl(audioUrl);

    const newTrack = this.playlist.addTrack({
      title,
      artist,
      genre,
      audioUrl,
      coverUrl,
      duration: '--:--',
      source: parsed ? 'cloudinary' : 'cloud',
      cloudinaryPublicId: parsed ? parsed.publicId : ''
    });

    this.showToast(`Added track "${newTrack.title}"!`, 'success');
    this.closeModal(this.uploadModal);
    this.renderPlaylist();
    this.selectTrack(0, true);

    this.urlTrackAudio.value = '';
    this.urlTrackCover.value = '';
    this.urlTrackTitle.value = '';
    this.urlTrackArtist.value = '';
  }

  resetUploadForm() {
    this.uploadAudioFile = null;
    this.uploadCoverFile = null;
    this.audioFileInput.value = '';
    this.coverFileInput.value = '';
    this.audioFilePill.style.display = 'none';
    this.coverFilePill.style.display = 'none';
    this.newTrackTitle.value = '';
    this.newTrackArtist.value = '';
  }

  openSettingsModal() {
    this.settingsCloudName.value = this.cloudinary.getCloudName();
    this.settingsUploadPreset.value = this.cloudinary.getUploadPreset();
    this.settingsAudioQuality.value = this.cloudinary.config.audioQuality || 'auto';
    this.openModal(this.settingsModal);
  }

  handleSaveSettings() {
    const cloudName = this.settingsCloudName.value.trim() || 'demo';
    const uploadPreset = this.settingsUploadPreset.value.trim();
    const audioQuality = this.settingsAudioQuality.value;

    this.cloudinary.saveConfig({ cloudName, uploadPreset, audioQuality });
    this.qualitySelect.value = audioQuality;
    this.updateCloudinaryBadge();
    this.showToast('Cloudinary settings saved successfully!', 'success');
    this.closeModal(this.settingsModal);
  }

  updateCloudinaryBadge() {
    const cloudName = this.cloudinary.getCloudName();
    const preset = this.cloudinary.getUploadPreset();
    const statusText = document.getElementById('cloudStatusText');
    if (statusText) {
      statusText.textContent = preset ? `Cloud: ${cloudName}` : `Cloud: ${cloudName} (Demo)`;
    }
  }

  openModal(modal) {
    modal.classList.add('open');
  }

  closeModal(modal) {
    modal.classList.remove('open');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return m;
      }
    });
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.neonwaveApp = new App();
});
