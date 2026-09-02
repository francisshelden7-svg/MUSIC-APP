/**
 * Playlist and Track Library Manager
 * Handles track state, search, filtering, favorites, and persistent local storage.
 */

const STORAGE_KEY_PLAYLIST = 'neonwave_playlist_tracks';
const STORAGE_KEY_FAVORITES = 'neonwave_favorite_track_ids';

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
    return newTrack;
  }

  removeTrack(id) {
    this.tracks = this.tracks.filter(t => t.id !== id);
    this.favorites.delete(id);
    this.saveTracks();
    this.saveFavorites();
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
    return this.getTracks();
  }
}
