/**
 * Playlist and Track Library Manager
 * Handles track state, search, filtering, favorites, and persistent local storage.
 */

const STORAGE_KEY_PLAYLIST = 'neonwave_playlist_tracks';
const STORAGE_KEY_FAVORITES = 'neonwave_favorite_track_ids';
const STORAGE_KEY_ACTIVITY = 'neonwave_admin_activity_log';

export const DEFAULT_TRACKS = [
  {
    id: 'track-1',
    title: 'Midnight Horizon',
    artist: 'CyberPulse',
    genre: 'Synthwave',
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3',
    coverUrl: 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500/sample.jpg',
    duration: '2:48',
    source: 'cloudinary',
    cloudinaryPublicId: 'sample'
  },
  {
    id: 'track-2',
    title: 'The Neverwritten Quest',
    artist: 'Kangaroo MusiQue',
    genre: 'Electronic',
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3',
    coverUrl: 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500/lady.jpg',
    duration: '3:15',
    source: 'cloud',
    cloudinaryPublicId: 'lady'
  },
  {
    id: 'track-3',
    title: 'Lepidoptera Wings',
    artist: 'Epoq Collective',
    genre: 'Ambient',
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
    coverUrl: 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500/runner.jpg',
    duration: '4:20',
    source: 'cloud',
    cloudinaryPublicId: 'runner'
  },
  {
    id: 'track-4',
    title: 'Cloudinary Sonic Pulse',
    artist: 'Cloudinary Audio Lab',
    genre: 'Cloudinary',
    audioUrl: 'https://res.cloudinary.com/demo/video/upload/br_192k/dog.mp3',
    coverUrl: 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500/dog.jpg',
    duration: '0:35',
    source: 'cloudinary',
    cloudinaryPublicId: 'dog'
  }
];

export class PlaylistManager {
  constructor(cloudinaryService) {
    this.cloudinary = cloudinaryService;
    this.tracks = this.loadTracks();
    this.favorites = this.loadFavorites();
  }

  loadTracks() {
    const saved = localStorage.getItem(STORAGE_KEY_PLAYLIST);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to load playlist from storage, fallback to defaults', e);
      }
    }
    return [...DEFAULT_TRACKS];
  }

  saveTracks() {
    localStorage.setItem(STORAGE_KEY_PLAYLIST, JSON.stringify(this.tracks));
  }

  loadFavorites() {
    const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse favorites', e);
      }
    }
    return new Set(['track-1']);
  }

  saveFavorites() {
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(Array.from(this.favorites)));
  }

  getTracks() {
    return this.tracks.map(t => ({
      ...t,
      isFavorite: this.favorites.has(t.id)
    }));
  }

  getTrackById(id) {
    const track = this.tracks.find(t => t.id === id);
    if (!track) return null;
    return {
      ...track,
      isFavorite: this.favorites.has(track.id)
    };
  }

  addTrack(trackData) {
    const newTrack = {
      id: `track-${Date.now()}`,
      title: trackData.title || 'Untitled Track',
      artist: trackData.artist || 'Unknown Artist',
      genre: trackData.genre || 'Cloud Upload',
      audioUrl: trackData.audioUrl,
      coverUrl: trackData.coverUrl || 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500/sample.jpg',
      duration: trackData.duration || '--:--',
      source: trackData.source || 'cloudinary',
      cloudinaryPublicId: trackData.cloudinaryPublicId || ''
    };

    // Prepend to top of playlist
    this.tracks.unshift(newTrack);
    this.saveTracks();
    this.logActivity('ADD_TRACK', `Added new track "${newTrack.title}" by ${newTrack.artist}`);
    return newTrack;
  }

  removeTrack(id) {
    const track = this.getTrackById(id);
    this.tracks = this.tracks.filter(t => t.id !== id);
    this.favorites.delete(id);
    this.saveTracks();
    this.saveFavorites();
    if (track) {
      this.logActivity('DELETE_TRACK', `Deleted track "${track.title}" by ${track.artist}`);
    }
  }

  updateTrack(id, updatedFields) {
    const index = this.tracks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const existing = this.tracks[index];
    const updated = {
      ...existing,
      ...updatedFields,
      id: existing.id // preserve immutable ID
    };

    this.tracks[index] = updated;
    this.saveTracks();
    this.logActivity('UPDATE_TRACK', `Updated track "${updated.title}"`);
    return updated;
  }

  bulkRemove(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const idSet = new Set(ids);
    const prevCount = this.tracks.length;
    this.tracks = this.tracks.filter(t => !idSet.has(t.id));
    ids.forEach(id => this.favorites.delete(id));
    this.saveTracks();
    this.saveFavorites();
    const removedCount = prevCount - this.tracks.length;
    this.logActivity('BULK_DELETE', `Bulk removed ${removedCount} tracks`);
    return removedCount;
  }

  bulkUpdateGenre(ids, newGenre) {
    if (!Array.isArray(ids) || ids.length === 0 || !newGenre) return 0;
    const idSet = new Set(ids);
    let count = 0;
    this.tracks.forEach(track => {
      if (idSet.has(track.id)) {
        track.genre = newGenre;
        count++;
      }
    });
    this.saveTracks();
    this.logActivity('BULK_GENRE', `Updated genre to "${newGenre}" for ${count} tracks`);
    return count;
  }

  importTracks(incomingTracks, overwrite = false) {
    if (!Array.isArray(incomingTracks)) throw new Error('Invalid catalog format: expected track array');

    const validTracks = incomingTracks.filter(t => t && t.title && (t.audioUrl || t.cloudinaryPublicId));
    if (validTracks.length === 0) throw new Error('No valid track objects found in import data');

    if (overwrite) {
      this.tracks = validTracks.map((t, idx) => ({
        id: t.id || `track-imp-${Date.now()}-${idx}`,
        title: t.title || 'Untitled',
        artist: t.artist || 'Unknown Artist',
        genre: t.genre || 'General',
        audioUrl: t.audioUrl || '',
        coverUrl: t.coverUrl || 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500/sample.jpg',
        duration: t.duration || '--:--',
        source: t.source || 'cloud',
        cloudinaryPublicId: t.cloudinaryPublicId || ''
      }));
    } else {
      // Merge unique by title + artist or id
      const existingIds = new Set(this.tracks.map(t => t.id));
      validTracks.forEach((t, idx) => {
        const id = t.id && !existingIds.has(t.id) ? t.id : `track-imp-${Date.now()}-${idx}`;
        this.tracks.unshift({
          id,
          title: t.title || 'Untitled',
          artist: t.artist || 'Unknown Artist',
          genre: t.genre || 'General',
          audioUrl: t.audioUrl || '',
          coverUrl: t.coverUrl || 'https://res.cloudinary.com/demo/image/upload/c_fill,w_500,h_500/sample.jpg',
          duration: t.duration || '--:--',
          source: t.source || 'cloud',
          cloudinaryPublicId: t.cloudinaryPublicId || ''
        });
      });
    }

    this.saveTracks();
    this.logActivity('IMPORT_CATALOG', `${overwrite ? 'Overwrote' : 'Merged'} catalog with ${validTracks.length} tracks`);
    return this.tracks.length;
  }

  toggleFavorite(id) {
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
    } else {
      this.favorites.add(id);
    }
    this.saveFavorites();
    return this.favorites.has(id);
  }

  filterTracks({ query = '', genre = 'all' } = {}) {
    let result = this.getTracks();

    if (genre === 'favorites') {
      result = result.filter(t => t.isFavorite);
    } else if (genre !== 'all') {
      result = result.filter(t => (t.genre || '').toLowerCase() === genre.toLowerCase());
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q))
      );
    }

    return result;
  }

  resetToDefaults() {
    this.tracks = [...DEFAULT_TRACKS];
    this.favorites = new Set(['track-1']);
    this.saveTracks();
    this.saveFavorites();
    this.logActivity('RESET_DEFAULTS', 'Reset catalog to default demo tracks');
    return this.getTracks();
  }

  logActivity(action, details) {
    try {
      const entry = {
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        action,
        details,
        timestamp: new Date().toISOString()
      };
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVITY);
      const list = saved ? JSON.parse(saved) : [];
      list.unshift(entry);
      // Keep up to 50 recent items
      if (list.length > 50) list.length = 50;
      localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to log admin activity', e);
    }
  }

  getActivityLog() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVITY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  clearActivityLog() {
    localStorage.removeItem(STORAGE_KEY_ACTIVITY);
  }
}

