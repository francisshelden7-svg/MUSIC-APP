/**
 * Cloudinary Dynamic Media Service
 * Handles direct unsigned uploads, URL transformations, and media optimization.
 */

const STORAGE_KEY_CONFIG = 'neonwave_cloudinary_config';

export class CloudinaryService {
  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load stored Cloudinary configuration or defaults
   */
  loadConfig() {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse Cloudinary config', e);
      }
    }
    return {
      cloudName: 'demo',
      uploadPreset: '', // Set by user for their unsigned upload preset
      audioQuality: 'auto', // '128k', '192k', '320k', 'auto'
      audioFormat: 'auto', // 'mp3', 'aac', 'ogg', 'auto'
    };
  }

  /**
   * Save configuration to localStorage
   */
  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
  }

  /**
   * Get current active Cloud Name
   */
  getCloudName() {
    return this.config.cloudName || 'demo';
  }

  /**
   * Get current Upload Preset
   */
  getUploadPreset() {
    return this.config.uploadPreset || '';
  }

  /**
   * Parse a Cloudinary URL to extract cloud name, resource type, and public ID
   */
  parseCloudinaryUrl(url) {
    if (!url || typeof url !== 'string') return null;

    // Pattern: https://res.cloudinary.com/<cloud_name>/<resource_type>/upload/(transformations/)?(v<version>/)?<public_id>
    const match = url.match(/res\.cloudinary\.com\/([^/]+)\/(image|video|raw)\/upload\/(?:([^/]+)\/)?(?:v\d+\/)?(.+)/);
    if (match) {
      return {
        cloudName: match[1],
        resourceType: match[2],
        transformations: match[3] || '',
        publicIdWithExt: match[4],
        publicId: match[4].replace(/\.[^/.]+$/, ''),
        extension: match[4].split('.').pop()
      };
    }
    return null;
  }

  /**
   * Build a dynamic Cloudinary audio streaming URL with transformations
   */
  buildAudioUrl(publicIdOrUrl, options = {}) {
    if (!publicIdOrUrl) return '';

    // If it's not a Cloudinary URL or already an external audio URL, check if we can wrap it or return as is
    if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
      const parsed = this.parseCloudinaryUrl(publicIdOrUrl);
      if (!parsed) {
        return publicIdOrUrl; // External non-cloudinary audio URL
      }
      // Re-use extracted cloud name and public ID
      return this.generateTransformedAudioUrl(parsed.cloudName, parsed.publicId, parsed.extension, options);
    }

    // It's a public ID
    const cloudName = options.cloudName || this.getCloudName();
    return this.generateTransformedAudioUrl(cloudName, publicIdOrUrl, 'mp3', options);
  }

  /**
   * Internal generator for transformed Cloudinary audio URL
   */
  generateTransformedAudioUrl(cloudName, publicId, ext = 'mp3', options = {}) {
    const quality = options.quality || this.config.audioQuality || 'auto';
    const format = options.format || this.config.audioFormat || 'auto';
    
    const transforms = [];

    // Format auto-negotiation or specific codec
    if (format && format !== 'auto') {
      transforms.push(`f_${format}`);
    } else {
      transforms.push('f_auto');
    }

    // Audio bitrate optimization
    if (quality && quality !== 'auto') {
      transforms.push(`br_${quality}`);
    }

    // Volume adjustment if specified
    if (options.volumeBoost) {
      transforms.push(`e_volume:${options.volumeBoost}`);
    }

    const transformStr = transforms.length > 0 ? `${transforms.join(',')}/` : '';
    const cleanPublicId = publicId.replace(/^\//, '');

    return `https://res.cloudinary.com/${cloudName}/video/upload/${transformStr}${cleanPublicId}`;
  }

  /**
   * Build an optimized image URL for album art
   */
  buildImageUrl(publicIdOrUrl, width = 500, height = 500) {
    if (!publicIdOrUrl) return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80';

    if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
      const parsed = this.parseCloudinaryUrl(publicIdOrUrl);
      if (!parsed) return publicIdOrUrl;
      return `https://res.cloudinary.com/${parsed.cloudName}/image/upload/c_fill,g_auto,w_${width},h_${height},f_auto,q_auto/${parsed.publicId}`;
    }

    const cloudName = this.getCloudName();
    return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_auto,w_${width},h_${height},f_auto,q_auto/${publicIdOrUrl}`;
  }

  /**
   * Dynamic Unsigned Upload of a file to Cloudinary
   * Supports audio (resource_type: 'video') and images (resource_type: 'image')
   */
  async uploadMedia(file, resourceType = 'auto', onProgress = null) {
    const cloudName = this.getCloudName();
    const uploadPreset = this.getUploadPreset();

    if (!cloudName) {
      throw new Error('Cloudinary Cloud Name is required in Settings.');
    }

    if (!uploadPreset) {
      throw new Error('Cloudinary Upload Preset is required for direct browser uploads. Please configure it in Cloudinary Settings.');
    }

    // Normalize audio file type to 'video' for Cloudinary
    let targetType = resourceType;
    if (targetType === 'auto') {
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i)) {
        targetType = 'video';
      } else if (file.type.startsWith('image/')) {
        targetType = 'image';
      } else {
        targetType = 'auto';
      }
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${targetType}/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('tags', 'neonwave_music_player');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint);

      if (onProgress && xhr.upload) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        });
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (err) {
            reject(new Error('Invalid response from Cloudinary API.'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.error?.message || `Cloudinary upload failed (HTTP ${xhr.status})`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during Cloudinary upload. Please check your internet connection or CORS settings.'));
      };

      xhr.send(formData);
    });
  }
}
