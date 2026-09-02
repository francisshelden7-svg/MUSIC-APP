/**
 * NeonWave Admin Studio & Catalog Controller
 * Full CRUD, dynamic Cloudinary media playground, metrics analytics, and library backup/restore.
 */

import { CloudinaryService } from './cloudinary.js';
import { PlaylistManager, DEFAULT_TRACKS } from './playlist.js';

class AdminController {
  constructor() {
    this.cloudinary = new CloudinaryService();
    this.playlist = new PlaylistManager(this.cloudinary);

    // State
    this.currentTab = 'overview';
    this.searchQuery = '';
    this.selectedGenre = 'all';
    this.selectedSource = 'all';
    this.sortBy = 'default';
    this.selectedTrackIds = new Set();
    this.trackToDeleteId = null;

    // Inline audio preview engine
    this.previewAudio = new Audio();
    this.previewAudio.preload = 'none';
    this.currentPreviewId = null;

    // Studio upload state
    this.studioAudioFile = null;
    this.studioCoverFile = null;

    this.init();
  }

  init() {
    this.cacheDom();
    this.bindTabNavigation();
    this.bindCatalogEvents();
    this.bindStudioEvents();
    this.bindPlaygroundEvents();
    this.bindBackupEvents();
    this.bindModals();
    this.bindStorageSync();
    this.bindAudioPreviewEvents();

    // Initial renders
    this.updateHeaderCloud();
    this.renderOverview();
    this.renderCatalog();
    this.updateStorageStats();
    this.populatePlaygroundTracks();
    this.updatePlaygroundPreview();

    this.showToast('NeonWave Admin Studio ready', 'info');
  }

  cacheDom() {
    // Header & Tabs
    this.headerCloudName = document.getElementById('headerCloudName');
    this.tabButtons = document.querySelectorAll('.admin-tab-btn');
    this.tabPanels = document.querySelectorAll('.admin-view-panel');
    this.tabCountTracks = document.getElementById('tabCountTracks');
    this.quickAddTrackBtn = document.getElementById('quickAddTrackBtn');

    // Overview KPIs & Widgets
    this.statTotalTracks = document.getElementById('statTotalTracks');
    this.statTotalArtists = document.getElementById('statTotalArtists');
    this.statTotalGenres = document.getElementById('statTotalGenres');
    this.statCloudinaryTracks = document.getElementById('statCloudinaryTracks');
    this.statTotalDuration = document.getElementById('statTotalDuration');
    this.genreBarsContainer = document.getElementById('genreBarsContainer');
    this.genreCountTag = document.getElementById('genreCountTag');
    this.activityLogContainer = document.getElementById('activityLogContainer');
    this.clearActivityLogBtn = document.getElementById('clearActivityLogBtn');

    // Catalog DOM
    this.adminSearchInput = document.getElementById('adminSearchInput');
    this.adminGenreFilter = document.getElementById('adminGenreFilter');
    this.adminSourceFilter = document.getElementById('adminSourceFilter');
    this.adminSortSelect = document.getElementById('adminSortSelect');
    this.catalogTableBody = document.getElementById('catalogTableBody');
    this.selectAllCheckbox = document.getElementById('selectAllCheckbox');
    this.catalogAddTrackBtn = document.getElementById('catalogAddTrackBtn');

    // Floating Bulk Action Bar
    this.bulkActionBar = document.getElementById('bulkActionBar');
    this.bulkCountLabel = document.getElementById('bulkCountLabel');
    this.bulkGenreSelect = document.getElementById('bulkGenreSelect');
    this.bulkExportBtn = document.getElementById('bulkExportBtn');
    this.bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    this.bulkCancelBtn = document.getElementById('bulkCancelBtn');

    // Studio DOM
    this.studioTabUpload = document.getElementById('studioTabUpload');
    this.studioTabUrl = document.getElementById('studioTabUrl');
    this.studioSectionUpload = document.getElementById('studioSectionUpload');
    this.studioSectionUrl = document.getElementById('studioSectionUrl');
    this.studioAudioDropzone = document.getElementById('studioAudioDropzone');
    this.studioAudioInput = document.getElementById('studioAudioInput');
    this.studioAudioFilePill = document.getElementById('studioAudioFilePill');
    this.studioAudioFileName = document.getElementById('studioAudioFileName');
    this.studioCoverDropzone = document.getElementById('studioCoverDropzone');
    this.studioCoverInput = document.getElementById('studioCoverInput');
    this.studioCoverFilePill = document.getElementById('studioCoverFilePill');
    this.studioCoverFileName = document.getElementById('studioCoverFileName');
    this.studioAudioUrl = document.getElementById('studioAudioUrl');
    this.studioCoverUrl = document.getElementById('studioCoverUrl');
    this.studioTitle = document.getElementById('studioTitle');
    this.studioArtist = document.getElementById('studioArtist');
    this.studioGenre = document.getElementById('studioGenre');
    this.studioDuration = document.getElementById('studioDuration');
    this.studioProgressContainer = document.getElementById('studioProgressContainer');
    this.studioProgressText = document.getElementById('studioProgressText');
    this.studioProgressFill = document.getElementById('studioProgressFill');
    this.studioSubmitBtn = document.getElementById('studioSubmitBtn');

    // Studio Preview
    this.studioPreviewCoverImg = document.getElementById('studioPreviewCoverImg');
    this.studioPreviewTitle = document.getElementById('studioPreviewTitle');
    this.studioPreviewArtist = document.getElementById('studioPreviewArtist');
    this.studioPreviewGenre = document.getElementById('studioPreviewGenre');

    // Cloudinary Media Hub DOM
    this.hubCloudName = document.getElementById('hubCloudName');
    this.hubUploadPreset = document.getElementById('hubUploadPreset');
    this.hubSelectTrack = document.getElementById('hubSelectTrack');
    this.hubBitrate = document.getElementById('hubBitrate');
    this.hubAudioFormat = document.getElementById('hubAudioFormat');
    this.hubVolumeBoost = document.getElementById('hubVolumeBoost');
    this.hubImageCrop = document.getElementById('hubImageCrop');
    this.hubSaveConfigBtn = document.getElementById('hubSaveConfigBtn');
    this.hubGenerateBtn = document.getElementById('hubGenerateBtn');
    this.hubOutputUrl = document.getElementById('hubOutputUrl');
    this.hubCopyUrlBtn = document.getElementById('hubCopyUrlBtn');
    this.hubAudioPlayer = document.getElementById('hubAudioPlayer');
    this.hubImagePreview = document.getElementById('hubImagePreview');

    // Database & Backup DOM
    this.backupExportBtn = document.getElementById('backupExportBtn');
    this.backupImportBtn = document.getElementById('backupImportBtn');
    this.backupFileInput = document.getElementById('backupFileInput');
    this.importOverwriteCheck = document.getElementById('importOverwriteCheck');
    this.backupResetDemoBtn = document.getElementById('backupResetDemoBtn');
    this.backupWipeAllBtn = document.getElementById('backupWipeAllBtn');
    this.storageBytesText = document.getElementById('storageBytesText');
    this.storageMeterFill = document.getElementById('storageMeterFill');

    // Edit Modal DOM
    this.editTrackModal = document.getElementById('editTrackModal');
    this.closeEditModalBtn = document.getElementById('closeEditModalBtn');
    this.cancelEditBtn = document.getElementById('cancelEditBtn');
    this.saveEditBtn = document.getElementById('saveEditBtn');
    this.editTrackId = document.getElementById('editTrackId');
    this.editTrackTitle = document.getElementById('editTrackTitle');
    this.editTrackArtist = document.getElementById('editTrackArtist');
    this.editTrackGenre = document.getElementById('editTrackGenre');
    this.editTrackAudioUrl = document.getElementById('editTrackAudioUrl');
    this.editTrackCoverUrl = document.getElementById('editTrackCoverUrl');
    this.editTrackDuration = document.getElementById('editTrackDuration');
    this.editTrackPublicId = document.getElementById('editTrackPublicId');

    // Delete Modal DOM
    this.deleteConfirmModal = document.getElementById('deleteConfirmModal');
    this.closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
    this.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    this.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    this.deleteTargetTitle = document.getElementById('deleteTargetTitle');

    // Toast Container
    this.toastContainer = document.getElementById('toastContainer');
  }

  updateHeaderCloud() {
    const cloudName = this.cloudinary.getCloudName();
    const preset = this.cloudinary.getUploadPreset();
    this.headerCloudName.textContent = preset ? `Cloud: ${cloudName}` : `Cloud: ${cloudName} (Demo)`;
    if (this.hubCloudName) this.hubCloudName.value = cloudName;
    if (this.hubUploadPreset) this.hubUploadPreset.value = preset;
  }

  bindTabNavigation() {
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    if (this.quickAddTrackBtn) {
      this.quickAddTrackBtn.addEventListener('click', () => this.switchTab('studio'));
    }
    if (this.catalogAddTrackBtn) {
      this.catalogAddTrackBtn.addEventListener('click', () => this.switchTab('studio'));
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    this.tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    this.tabPanels.forEach(p => p.classList.toggle('active', p.id === `tab-${tabName}`));

    if (tabName === 'overview') {
      this.renderOverview();
    } else if (tabName === 'catalog') {
      this.renderCatalog();
    } else if (tabName === 'cloudinary') {
      this.populatePlaygroundTracks();
      this.updatePlaygroundPreview();
    } else if (tabName === 'backup') {
      this.updateStorageStats();
    }
  }

  bindCatalogEvents() {
    this.adminSearchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim();
      this.renderCatalog();
    });

    this.adminGenreFilter.addEventListener('change', (e) => {
      this.selectedGenre = e.target.value;
      this.renderCatalog();
    });

    this.adminSourceFilter.addEventListener('change', (e) => {
      this.selectedSource = e.target.value;
      this.renderCatalog();
    });

    this.adminSortSelect.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.renderCatalog();
    });

    // Select All Checkbox
    this.selectAllCheckbox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const visibleTracks = this.getFilteredTracks();
      if (isChecked) {
        visibleTracks.forEach(t => this.selectedTrackIds.add(t.id));
      } else {
        this.selectedTrackIds.clear();
      }
      this.renderCatalog();
    });

    // Bulk Toolbar Events
    this.bulkCancelBtn.addEventListener('click', () => {
      this.selectedTrackIds.clear();
      this.renderCatalog();
    });

    this.bulkDeleteBtn.addEventListener('click', () => {
      if (this.selectedTrackIds.size === 0) return;
      const count = this.selectedTrackIds.size;
      if (confirm(`Permanently remove all ${count} selected tracks from catalog?`)) {
        this.playlist.bulkRemove(Array.from(this.selectedTrackIds));
        this.selectedTrackIds.clear();
        this.renderCatalog();
        this.renderOverview();
        this.populatePlaygroundTracks();
        this.showToast(`Deleted ${count} tracks`, 'success');
      }
    });

    this.bulkGenreSelect.addEventListener('change', (e) => {
      const newGenre = e.target.value;
      if (!newGenre || this.selectedTrackIds.size === 0) return;
      const count = this.playlist.bulkUpdateGenre(Array.from(this.selectedTrackIds), newGenre);
      this.bulkGenreSelect.value = '';
      this.renderCatalog();
      this.renderOverview();
      this.showToast(`Updated genre to "${newGenre}" for ${count} tracks`, 'success');
    });

    this.bulkExportBtn.addEventListener('click', () => {
      const selected = this.playlist.getTracks().filter(t => this.selectedTrackIds.has(t.id));
      if (selected.length === 0) return;
      this.downloadJson(selected, `neonwave-selected-${selected.length}-tracks.json`);
    });
  }

  bindAudioPreviewEvents() {
    this.previewAudio.addEventListener('ended', () => {
      this.currentPreviewId = null;
      this.updatePreviewButtonsUi();
    });

    this.previewAudio.addEventListener('error', () => {
      this.showToast('Preview audio playback failed or CORS restricted', 'error');
      this.currentPreviewId = null;
      this.updatePreviewButtonsUi();
    });
  }

  updatePreviewButtonsUi() {
    const allPreviewBtns = document.querySelectorAll('.preview-play-btn');
    allPreviewBtns.forEach(btn => {
      const trackId = btn.dataset.previewId;
      const isCurrentPlaying = trackId === this.currentPreviewId;
      btn.classList.toggle('is-previewing', isCurrentPlaying);
      btn.innerHTML = isCurrentPlaying
        ? `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
        : `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
      btn.title = isCurrentPlaying ? 'Stop preview' : 'Preview audio';
    });
  }

  togglePreview(track, btn) {
    if (this.currentPreviewId === track.id) {
      // Pause
      this.previewAudio.pause();
      this.previewAudio.currentTime = 0;
      this.currentPreviewId = null;
      this.updatePreviewButtonsUi();
    } else {
      // Play new
      this.currentPreviewId = track.id;
      this.previewAudio.src = track.audioUrl;
      this.previewAudio.play().catch(err => {
        console.warn('Audio preview play error', err);
        this.showToast('Unable to preview audio format', 'error');
        this.currentPreviewId = null;
        this.updatePreviewButtonsUi();
      });
      this.updatePreviewButtonsUi();
      this.showToast(`Previewing "${track.title}"`, 'info');
    }
  }

  bindStudioEvents() {
    // Mode tabs
    this.studioTabUpload.addEventListener('click', () => {
      this.studioTabUpload.classList.add('active');
      this.studioTabUrl.classList.remove('active');
      this.studioSectionUpload.style.display = 'block';
      this.studioSectionUrl.style.display = 'none';
    });

    this.studioTabUrl.addEventListener('click', () => {
      this.studioTabUrl.classList.add('active');
      this.studioTabUpload.classList.remove('active');
      this.studioSectionUpload.style.display = 'none';
      this.studioSectionUrl.style.display = 'block';
    });

    // File Dropzones
    this.setupDropzone(this.studioAudioDropzone, this.studioAudioInput, (file) => {
      this.studioAudioFile = file;
      this.studioAudioFileName.textContent = file.name;
      this.studioAudioFilePill.style.display = 'inline-flex';
      if (!this.studioTitle.value) {
        this.studioTitle.value = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      }
      this.updateStudioLivePreview();
    });

    this.setupDropzone(this.studioCoverDropzone, this.studioCoverInput, (file) => {
      this.studioCoverFile = file;
      this.studioCoverFileName.textContent = file.name;
      this.studioCoverFilePill.style.display = 'inline-flex';
      // Local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.studioPreviewCoverImg.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

    // Live preview update listeners
    [this.studioTitle, this.studioArtist, this.studioGenre, this.studioCoverUrl].forEach(input => {
      input.addEventListener('input', () => this.updateStudioLivePreview());
    });

    // Submit button
    this.studioSubmitBtn.addEventListener('click', () => this.handleStudioPublish());
  }

  updateStudioLivePreview() {
    const title = this.studioTitle.value.trim() || 'Untitled Track';
    const artist = this.studioArtist.value.trim() || 'Artist Name';
    const genre = this.studioGenre.value.trim() || 'Synthwave';
    const coverUrl = this.studioCoverUrl.value.trim();

    this.studioPreviewTitle.textContent = title;
    this.studioPreviewArtist.textContent = artist;
    this.studioPreviewGenre.textContent = genre;
    this.studioPreviewGenre.className = `genre-badge ${genre.toLowerCase()}`;

    if (coverUrl) {
      this.studioPreviewCoverImg.src = coverUrl;
    }
  }

  async handleStudioPublish() {
    const isUploadMode = this.studioTabUpload.classList.contains('active');
    const title = this.studioTitle.value.trim() || 'New Track';
    const artist = this.studioArtist.value.trim() || 'Unknown Artist';
    const genre = this.studioGenre.value.trim() || 'Synthwave';
    const duration = this.studioDuration.value.trim() || '--:--';

    if (isUploadMode) {
      if (!this.studioAudioFile) {
        this.showToast('Please select or drop an audio file', 'error');
        return;
      }

      const preset = this.cloudinary.getUploadPreset();
      if (!preset) {
        this.showToast('Cloudinary Upload Preset not configured! Open Cloud Hub tab.', 'error');
        this.switchTab('cloudinary');
        return;
      }

      this.studioSubmitBtn.disabled = true;
      this.studioProgressContainer.style.display = 'block';
      this.studioProgressFill.style.width = '0%';
      this.studioProgressText.textContent = 'Uploading audio to Cloudinary... 0%';

      try {
        const audioResult = await this.cloudinary.uploadMedia(
          this.studioAudioFile,
          'video',
          (pct) => {
            this.studioProgressFill.style.width = `${pct * 0.7}%`;
            this.studioProgressText.textContent = `Uploading audio... ${Math.round(pct * 0.7)}%`;
          }
        );

        let coverUrl = 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500/sample.jpg';
        if (this.studioCoverFile) {
          this.studioProgressText.textContent = 'Uploading artwork... 80%';
          const coverResult = await this.cloudinary.uploadMedia(this.studioCoverFile, 'image');
          coverUrl = coverResult.secure_url;
        }

        this.studioProgressFill.style.width = '100%';
        this.studioProgressText.textContent = 'Uploaded & Processed!';

        const newTrack = this.playlist.addTrack({
          title,
          artist,
          genre,
          audioUrl: audioResult.secure_url,
          coverUrl,
          duration: audioResult.duration ? this.formatSeconds(audioResult.duration) : duration,
          source: 'cloudinary',
          cloudinaryPublicId: audioResult.public_id
        });

        this.showToast(`Published "${newTrack.title}" to catalog!`, 'success');
        this.resetStudioForm();
        this.switchTab('catalog');
      } catch (err) {
        console.error(err);
        this.showToast(err.message || 'Upload failed', 'error');
      } finally {
        this.studioSubmitBtn.disabled = false;
        this.studioProgressContainer.style.display = 'none';
      }
    } else {
      // Stream Link Mode
      const audioUrl = this.studioAudioUrl.value.trim();
      if (!audioUrl) {
        this.showToast('Audio stream link is required', 'error');
        return;
      }

      const coverUrl = this.studioCoverUrl.value.trim() || 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500/sample.jpg';
      const parsed = this.cloudinary.parseCloudinaryUrl(audioUrl);

      const newTrack = this.playlist.addTrack({
        title,
        artist,
        genre,
        audioUrl,
        coverUrl,
        duration,
        source: parsed ? 'cloudinary' : 'cloud',
        cloudinaryPublicId: parsed ? parsed.publicId : ''
      });

      this.showToast(`Added track "${newTrack.title}"!`, 'success');
      this.resetStudioForm();
      this.switchTab('catalog');
    }
  }

  resetStudioForm() {
    this.studioAudioFile = null;
    this.studioCoverFile = null;
    this.studioAudioInput.value = '';
    this.studioCoverInput.value = '';
    this.studioAudioFilePill.style.display = 'none';
    this.studioCoverFilePill.style.display = 'none';
    this.studioAudioUrl.value = '';
    this.studioCoverUrl.value = '';
    this.studioTitle.value = '';
    this.studioArtist.value = '';
    this.studioDuration.value = '';
    this.updateStudioLivePreview();
  }

  bindPlaygroundEvents() {
    this.hubSaveConfigBtn.addEventListener('click', () => {
      const cloudName = this.hubCloudName.value.trim() || 'demo';
      const uploadPreset = this.hubUploadPreset.value.trim();
      this.cloudinary.saveConfig({ cloudName, uploadPreset });
      this.updateHeaderCloud();
      this.showToast('Cloudinary configuration saved!', 'success');
    });

    [this.hubSelectTrack, this.hubBitrate, this.hubAudioFormat, this.hubVolumeBoost, this.hubImageCrop].forEach(el => {
      el.addEventListener('change', () => this.updatePlaygroundPreview());
    });

    this.hubGenerateBtn.addEventListener('click', () => {
      this.updatePlaygroundPreview();
      this.showToast('Updated dynamic stream transformation!', 'info');
    });

    this.hubCopyUrlBtn.addEventListener('click', () => {
      const text = this.hubOutputUrl.textContent.trim();
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Copied transformation URL to clipboard!', 'success');
      }).catch(() => {
        this.showToast('Failed to copy', 'error');
      });
    });
  }

  populatePlaygroundTracks() {
    const tracks = this.playlist.getTracks();
    this.hubSelectTrack.innerHTML = '';
    tracks.forEach(track => {
      const opt = document.createElement('option');
      opt.value = track.id;
      opt.textContent = `${track.title} (${track.artist}) - [${track.source}]`;
      this.hubSelectTrack.appendChild(opt);
    });
  }

  updatePlaygroundPreview() {
    const trackId = this.hubSelectTrack.value;
    const track = this.playlist.getTrackById(trackId) || this.playlist.getTracks()[0];
    if (!track) return;

    const bitrate = this.hubBitrate.value;
    const format = this.hubAudioFormat.value;
    const volume = this.hubVolumeBoost.value;
    const cropMode = this.hubImageCrop.value;

    // Generate transformed audio stream URL
    let audioUrl = track.audioUrl;
    if (track.source === 'cloudinary') {
      audioUrl = this.cloudinary.buildAudioUrl(track.audioUrl, {
        quality: bitrate,
        format: format,
        volumeBoost: volume ? Number(volume) : null
      });
    }

    this.hubOutputUrl.textContent = audioUrl;
    this.hubAudioPlayer.src = audioUrl;

    // Generate transformed image cover URL
    let coverUrl = track.coverUrl;
    if (coverUrl.includes('res.cloudinary.com')) {
      const parsed = this.cloudinary.parseCloudinaryUrl(coverUrl);
      if (parsed) {
        let cropTransform = 'c_fill,g_auto,w_300,h_300,f_auto,q_auto';
        if (cropMode === 'thumb') cropTransform = 'c_thumb,g_auto,w_300,h_300,f_auto,q_auto';
        if (cropMode === 'pad') cropTransform = 'c_pad,w_300,h_300,b_black,f_auto,q_auto';
        if (cropMode === 'round') cropTransform = 'c_fill,w_300,h_300,r_max,f_auto,q_auto';
        coverUrl = `https://res.cloudinary.com/${parsed.cloudName}/image/upload/${cropTransform}/${parsed.publicId}`;
      }
    }
    this.hubImagePreview.src = coverUrl;
  }

  bindBackupEvents() {
    // Export
    this.backupExportBtn.addEventListener('click', () => {
      const tracks = this.playlist.getTracks();
      const payload = {
        app: 'NeonWave',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        cloudConfig: this.cloudinary.config,
        trackCount: tracks.length,
        tracks: tracks
      };
      this.downloadJson(payload, `neonwave-catalog-${Date.now()}.json`);
      this.showToast(`Exported ${tracks.length} tracks to backup file`, 'success');
    });

    // Import file button
    this.backupImportBtn.addEventListener('click', () => {
      this.backupFileInput.click();
    });

    this.backupFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const overwrite = this.importOverwriteCheck.checked;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          const trackList = Array.isArray(parsed) ? parsed : (parsed.tracks || []);
          const total = this.playlist.importTracks(trackList, overwrite);
          this.renderCatalog();
          this.renderOverview();
          this.populatePlaygroundTracks();
          this.updateStorageStats();
          this.showToast(`Successfully restored ${trackList.length} tracks! Total catalog: ${total}`, 'success');
        } catch (err) {
          console.error(err);
          this.showToast(`Failed to parse backup: ${err.message}`, 'error');
        } finally {
          this.backupFileInput.value = '';
        }
      };
      reader.readAsText(file);
    });

    // Reset Demo
    this.backupResetDemoBtn.addEventListener('click', () => {
      if (confirm('Reset catalog to curated default tracks?')) {
        this.playlist.resetToDefaults();
        this.renderCatalog();
        this.renderOverview();
        this.populatePlaygroundTracks();
        this.updateStorageStats();
        this.showToast('Reset catalog to sample tracks', 'success');
      }
    });

    // Wipe All
    this.backupWipeAllBtn.addEventListener('click', () => {
      if (confirm('DANGER: This will delete ALL tracks in the catalog. Continue?')) {
        this.playlist.tracks = [];
        this.playlist.favorites.clear();
        this.playlist.saveTracks();
        this.playlist.saveFavorites();
        this.playlist.logActivity('WIPE_ALL', 'Wiped all tracks from catalog');
        this.renderCatalog();
        this.renderOverview();
        this.populatePlaygroundTracks();
        this.updateStorageStats();
        this.showToast('Wiped library', 'info');
      }
    });

    // Clear Activity Log
    this.clearActivityLogBtn.addEventListener('click', () => {
      this.playlist.clearActivityLog();
      this.renderActivityLog();
      this.showToast('Activity log cleared', 'info');
    });
  }

  bindModals() {
    // Edit Modal
    this.closeEditModalBtn.addEventListener('click', () => this.closeModal(this.editTrackModal));
    this.cancelEditBtn.addEventListener('click', () => this.closeModal(this.editTrackModal));
    this.saveEditBtn.addEventListener('click', () => this.handleSaveEdit());

    // Delete Modal
    this.closeDeleteModalBtn.addEventListener('click', () => this.closeModal(this.deleteConfirmModal));
    this.cancelDeleteBtn.addEventListener('click', () => this.closeModal(this.deleteConfirmModal));
    this.confirmDeleteBtn.addEventListener('click', () => this.handleConfirmDelete());

    // Click outside overlay to close
    [this.editTrackModal, this.deleteConfirmModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal);
      });
    });
  }

  bindStorageSync() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'neonwave_playlist_tracks' || e.key === 'neonwave_admin_activity_log') {
        this.playlist.tracks = this.playlist.loadTracks();
        this.renderOverview();
        this.renderCatalog();
        this.populatePlaygroundTracks();
      }
      if (e.key === 'neonwave_cloudinary_config') {
        this.cloudinary.config = this.cloudinary.loadConfig();
        this.updateHeaderCloud();
      }
    });
  }

  getFilteredTracks() {
    let tracks = this.playlist.getTracks();

    // Genre filter
    if (this.selectedGenre !== 'all') {
      tracks = tracks.filter(t => (t.genre || '').toLowerCase() === this.selectedGenre.toLowerCase());
    }

    // Source filter
    if (this.selectedSource !== 'all') {
      tracks = tracks.filter(t => (t.source || '').toLowerCase() === this.selectedSource.toLowerCase());
    }

    // Search query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      tracks = tracks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q)) ||
        (t.cloudinaryPublicId && t.cloudinaryPublicId.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (this.sortBy === 'title-asc') {
      tracks.sort((a, b) => a.title.localeCompare(b.title));
    } else if (this.sortBy === 'title-desc') {
      tracks.sort((a, b) => b.title.localeCompare(a.title));
    } else if (this.sortBy === 'artist-asc') {
      tracks.sort((a, b) => a.artist.localeCompare(b.artist));
    } else if (this.sortBy === 'duration') {
      tracks.sort((a, b) => (this.parseDurationToSeconds(b.duration) - this.parseDurationToSeconds(a.duration)));
    }

    return tracks;
  }

  renderCatalog() {
    const tracks = this.getFilteredTracks();
    const allTracks = this.playlist.getTracks();
    this.tabCountTracks.textContent = allTracks.length;
    this.catalogTableBody.innerHTML = '';

    if (tracks.length === 0) {
      this.catalogTableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-table-state">
              <div class="empty-table-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              </div>
              <h4>No tracks match your current filter criteria</h4>
              <p style="font-size: 0.85rem; margin-top: 0.4rem;">Try resetting search terms or add a new track in the studio.</p>
            </div>
          </td>
        </tr>
      `;
      this.updateBulkActionBar();
      return;
    }

    tracks.forEach(track => {
      const isSelected = this.selectedTrackIds.has(track.id);
      const isPreviewing = this.currentPreviewId === track.id;
      const genreClass = this.getGenreBadgeClass(track.genre);

      const tr = document.createElement('tr');
      if (isSelected) tr.classList.add('row-selected');

      tr.innerHTML = `
        <td style="text-align: center;">
          <input type="checkbox" class="admin-checkbox row-checkbox" data-track-id="${track.id}" ${isSelected ? 'checked' : ''} />
        </td>
        <td>
          <div class="track-cell">
            <div class="track-thumb-wrapper">
              <img src="${track.coverUrl}" alt="${this.escapeHtml(track.title)}" class="track-thumb-img" loading="lazy" />
              <button class="preview-play-btn ${isPreviewing ? 'is-previewing' : ''}" data-preview-id="${track.id}" title="${isPreviewing ? 'Stop preview' : 'Preview track'}">
                ${isPreviewing ? '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'}
              </button>
            </div>
            <div class="track-names">
              <span class="track-name-title">${this.escapeHtml(track.title)}</span>
              <span class="track-name-artist">${this.escapeHtml(track.artist)}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="genre-badge ${genreClass}">${this.escapeHtml(track.genre || 'General')}</span>
        </td>
        <td style="font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-muted);">
          ${track.duration || '--:--'}
        </td>
        <td>
          <span class="source-pill ${track.source === 'cloudinary' ? 'is-cloudinary' : ''}">
            ${track.source === 'cloudinary' ? '&#9729; Cloudinary' : 'External URL'}
          </span>
        </td>
        <td style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-subtle); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${this.escapeHtml(track.cloudinaryPublicId || track.audioUrl)}">
          ${this.escapeHtml(track.cloudinaryPublicId || 'ext-stream')}
        </td>
        <td style="text-align: right;">
          <div class="table-actions-cell" style="justify-content: flex-end;">
            <button class="table-action-btn btn-transform" data-inspect-id="${track.id}" title="Test dynamic Cloudinary transformations">
              <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>
            </button>
            <button class="table-action-btn btn-edit" data-edit-id="${track.id}" title="Edit metadata">
              <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button class="table-action-btn btn-delete" data-delete-id="${track.id}" title="Delete track">
              <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </td>
      `;

      // Checkbox listener
      const chk = tr.querySelector('.row-checkbox');
      chk.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectedTrackIds.add(track.id);
        } else {
          this.selectedTrackIds.delete(track.id);
        }
        tr.classList.toggle('row-selected', e.target.checked);
        this.updateBulkActionBar();
      });

      // Preview Audio listener
      const previewBtn = tr.querySelector('.preview-play-btn');
      previewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePreview(track, previewBtn);
      });

      // Inspect / Transform test
      const inspectBtn = tr.querySelector('[data-inspect-id]');
      inspectBtn.addEventListener('click', () => {
        this.switchTab('cloudinary');
        this.hubSelectTrack.value = track.id;
        this.updatePlaygroundPreview();
      });

      // Edit metadata
      const editBtn = tr.querySelector('[data-edit-id]');
      editBtn.addEventListener('click', () => this.openEditModal(track.id));

      // Delete track
      const delBtn = tr.querySelector('[data-delete-id]');
      delBtn.addEventListener('click', () => this.openDeleteModal(track.id));

      this.catalogTableBody.appendChild(tr);
    });

    this.updateBulkActionBar();
  }

  updateBulkActionBar() {
    const count = this.selectedTrackIds.size;
    if (count > 0) {
      this.bulkCountLabel.textContent = `${count} track${count > 1 ? 's' : ''} selected`;
      this.bulkActionBar.classList.add('visible');
    } else {
      this.bulkActionBar.classList.remove('visible');
    }

    // Update select all checkbox state
    const visibleTracks = this.getFilteredTracks();
    if (visibleTracks.length > 0 && visibleTracks.every(t => this.selectedTrackIds.has(t.id))) {
      this.selectAllCheckbox.checked = true;
      this.selectAllCheckbox.indeterminate = false;
    } else if (this.selectedTrackIds.size > 0) {
      this.selectAllCheckbox.checked = false;
      this.selectAllCheckbox.indeterminate = true;
    } else {
      this.selectAllCheckbox.checked = false;
      this.selectAllCheckbox.indeterminate = false;
    }
  }

  renderOverview() {
    const tracks = this.playlist.getTracks();

    // 1. KPIs
    this.statTotalTracks.textContent = tracks.length;

    const uniqueArtists = new Set(tracks.map(t => (t.artist || '').trim())).size;
    this.statTotalArtists.textContent = uniqueArtists;

    const genresMap = {};
    tracks.forEach(t => {
      const g = (t.genre || 'General').trim();
      genresMap[g] = (genresMap[g] || 0) + 1;
    });
    const uniqueGenres = Object.keys(genresMap).length;
    this.statTotalGenres.textContent = uniqueGenres;
    this.genreCountTag.textContent = `${uniqueGenres} Genres`;

    const cloudinaryCount = tracks.filter(t => t.source === 'cloudinary').length;
    this.statCloudinaryTracks.textContent = cloudinaryCount;

    // Total Duration calculation
    let totalSecs = 0;
    tracks.forEach(t => {
      totalSecs += this.parseDurationToSeconds(t.duration);
    });
    this.statTotalDuration.textContent = this.formatSeconds(totalSecs);

    // 2. Genre Distribution Progress Bars
    this.genreBarsContainer.innerHTML = '';
    const sortedGenres = Object.entries(genresMap).sort((a, b) => b[1] - a[1]);

    sortedGenres.forEach(([genre, count]) => {
      const pct = Math.round((count / Math.max(1, tracks.length)) * 100);
      const row = document.createElement('div');
      row.className = 'genre-bar-row';
      row.innerHTML = `
        <div class="genre-bar-info">
          <span style="font-weight: 600;">${this.escapeHtml(genre)}</span>
          <span style="color: var(--text-muted);">${count} tracks (${pct}%)</span>
        </div>
        <div class="genre-bar-track">
          <div class="genre-bar-fill" style="width: ${pct}%;"></div>
        </div>
      `;
      this.genreBarsContainer.appendChild(row);
    });

    // 3. Activity Log
    this.renderActivityLog();
  }

  renderActivityLog() {
    const logs = this.playlist.getActivityLog();
    this.activityLogContainer.innerHTML = '';

    if (logs.length === 0) {
      this.activityLogContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-subtle); font-size: 0.85rem;">
          No recorded administrative actions yet.
        </div>
      `;
      return;
    }

    logs.forEach(item => {
      const div = document.createElement('div');
      div.className = 'activity-item';
      div.innerHTML = `
        <div class="activity-icon-pill">
          ${this.getActivityIcon(item.action)}
        </div>
        <div class="activity-content">
          <div class="activity-details">${this.escapeHtml(item.details)}</div>
          <div class="activity-time">${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</div>
        </div>
      `;
      this.activityLogContainer.appendChild(div);
    });
  }

  getActivityIcon(action) {
    switch (action) {
      case 'ADD_TRACK': return '&#xFF0B;';
      case 'DELETE_TRACK': return '&#x2715;';
      case 'UPDATE_TRACK': return '&#x270E;';
      case 'BULK_DELETE': return '&#x1F5D1;';
      case 'BULK_GENRE': return '&#x1F3F7;';
      case 'IMPORT_CATALOG': return '&#x21E9;';
      case 'RESET_DEFAULTS': return '&#x21BA;';
      default: return '&#x25CF;';
    }
  }

  openEditModal(trackId) {
    const track = this.playlist.getTrackById(trackId);
    if (!track) return;

    this.editTrackId.value = track.id;
    this.editTrackTitle.value = track.title || '';
    this.editTrackArtist.value = track.artist || '';
    this.editTrackGenre.value = track.genre || '';
    this.editTrackAudioUrl.value = track.audioUrl || '';
    this.editTrackCoverUrl.value = track.coverUrl || '';
    this.editTrackDuration.value = track.duration || '';
    this.editTrackPublicId.value = track.cloudinaryPublicId || '';

    this.openModal(this.editTrackModal);
  }

  handleSaveEdit() {
    const id = this.editTrackId.value;
    const title = this.editTrackTitle.value.trim();
    const artist = this.editTrackArtist.value.trim();
    const genre = this.editTrackGenre.value.trim();
    const audioUrl = this.editTrackAudioUrl.value.trim();
    const coverUrl = this.editTrackCoverUrl.value.trim();
    const duration = this.editTrackDuration.value.trim();
    const cloudinaryPublicId = this.editTrackPublicId.value.trim();

    if (!title || !audioUrl) {
      this.showToast('Title and Audio Stream URL are required', 'error');
      return;
    }

    const updated = this.playlist.updateTrack(id, {
      title,
      artist,
      genre,
      audioUrl,
      coverUrl,
      duration,
      cloudinaryPublicId,
      source: cloudinaryPublicId || audioUrl.includes('cloudinary') ? 'cloudinary' : 'cloud'
    });

    if (updated) {
      this.closeModal(this.editTrackModal);
      this.renderCatalog();
      this.renderOverview();
      this.populatePlaygroundTracks();
      this.showToast(`Updated "${updated.title}" successfully!`, 'success');
    }
  }

  openDeleteModal(trackId) {
    const track = this.playlist.getTrackById(trackId);
    if (!track) return;

    this.trackToDeleteId = track.id;
    this.deleteTargetTitle.textContent = `"${track.title}"`;
    this.openModal(this.deleteConfirmModal);
  }

  handleConfirmDelete() {
    if (!this.trackToDeleteId) return;
    const track = this.playlist.getTrackById(this.trackToDeleteId);
    this.playlist.removeTrack(this.trackToDeleteId);
    this.selectedTrackIds.delete(this.trackToDeleteId);
    this.closeModal(this.deleteConfirmModal);
    this.renderCatalog();
    this.renderOverview();
    this.populatePlaygroundTracks();
    this.showToast(`Deleted track "${track ? track.title : ''}"`, 'success');
    this.trackToDeleteId = null;
  }

  updateStorageStats() {
    try {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('neonwave_')) {
          const val = localStorage.getItem(key);
          totalBytes += (key.length + (val ? val.length : 0)) * 2; // UTF-16 approx
        }
      }

      const kb = (totalBytes / 1024).toFixed(1);
      this.storageBytesText.textContent = `${kb} KB`;
      // Max typical localStorage is ~5MB (5120KB)
      const pct = Math.min(100, Math.max(3, (totalBytes / (5 * 1024 * 1024)) * 100));
      this.storageMeterFill.style.width = `${pct}%`;
    } catch (e) {
      console.warn('Storage stat calc failed', e);
    }
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

  getGenreBadgeClass(genre) {
    if (!genre) return 'default';
    const g = genre.toLowerCase();
    if (g.includes('synth')) return 'synthwave';
    if (g.includes('electro') || g.includes('dance')) return 'electronic';
    if (g.includes('ambient') || g.includes('chill')) return 'ambient';
    if (g.includes('cloud')) return 'cloudinary';
    return 'default';
  }

  parseDurationToSeconds(durStr) {
    if (!durStr || durStr === '--:--') return 0;
    const parts = durStr.split(':').map(Number);
    if (parts.length === 2) {
      return (parts[0] * 60) + parts[1];
    } else if (parts.length === 3) {
      return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }
    return 0;
  }

  formatSeconds(secs) {
    if (isNaN(secs) || secs <= 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  }

  downloadJson(obj, filename) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
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

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (m) => {
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
  window.neonwaveAdmin = new AdminController();
});
