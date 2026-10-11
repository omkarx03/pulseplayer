/**
 * PulseStream — Complete Music Player Application
 * YouTube Data API v3 + IFrame Player + YMusic Feature Suite
 */

const GENRES = [
  { label: "Pop Hits", emoji: "🎤", q: "pop hits 2024 music", bg: "linear-gradient(135deg,#ec4899,#8b5cf6)" },
  { label: "Hip Hop", emoji: "🎧", q: "hip hop rap music", bg: "linear-gradient(135deg,#f59e0b,#ef4444)" },
  { label: "Lofi Chill", emoji: "☕", q: "lofi chill beats relax", bg: "linear-gradient(135deg,#6366f1,#06b6d4)" },
  { label: "Rock", emoji: "🎸", q: "rock music classics", bg: "linear-gradient(135deg,#dc2626,#991b1b)" },
  { label: "Electronic", emoji: "⚡", q: "electronic dance EDM music", bg: "linear-gradient(135deg,#8b5cf6,#ec4899)" },
  { label: "R&B Soul", emoji: "💜", q: "R&B soul music", bg: "linear-gradient(135deg,#7c3aed,#4f46e5)" },
  { label: "Jazz", emoji: "🎷", q: "jazz instrumental smooth", bg: "linear-gradient(135deg,#0d9488,#065f46)" },
  { label: "Classical", emoji: "🎻", q: "classical music orchestra", bg: "linear-gradient(135deg,#b45309,#78350f)" },
  { label: "Bollywood", emoji: "🇮🇳", q: "bollywood hindi songs latest", bg: "linear-gradient(135deg,#e11d48,#f97316)" },
  { label: "K-Pop", emoji: "🇰🇷", q: "kpop music video latest", bg: "linear-gradient(135deg,#db2777,#9333ea)" },
  { label: "Latin", emoji: "💃", q: "latin reggaeton music", bg: "linear-gradient(135deg,#ea580c,#dc2626)" },
  { label: "Ambient", emoji: "🌊", q: "ambient relaxing peaceful music", bg: "linear-gradient(135deg,#0891b2,#1d4ed8)" },
  { label: "Country", emoji: "🤠", q: "country music hits", bg: "linear-gradient(135deg,#ca8a04,#a16207)" },
  { label: "Devotional", emoji: "🙏", q: "devotional spiritual bhajan", bg: "linear-gradient(135deg,#f59e0b,#d97706)" },
  { label: "Workout", emoji: "💪", q: "workout gym motivation music", bg: "linear-gradient(135deg,#16a34a,#0d9488)" },
  { label: "NCS / Free", emoji: "🆓", q: "NCS no copyright sounds", bg: "linear-gradient(135deg,#334155,#1e293b)" }
];

const QUICK_PLAY_TRACKS = [
  { id: "jfKfPfyJRdk", title: "Lofi Radio - Beats to Relax", channel: "Lofi Girl" },
  { id: "5qap5aO4i9A", title: "Synthwave Radio - Chill Beats", channel: "Lofi Girl" },
  { id: "DWcJFNfaw9c", title: "Chillhop Radio - Jazzy Beats", channel: "Chillhop Music" },
  { id: "K4DyBUG242c", title: "Cartoon - On & On", channel: "NCS" },
  { id: "bM7SZ5SBzyY", title: "Alan Walker - Fade", channel: "NCS" },
  { id: "7NOSDKb0HlU", title: "Cozy Coffee Shop Jazz", channel: "Cafe Music BGM" }
];

class PulseStreamApp {
  constructor() {
    this.player = null;
    this.isReady = false;
    this.isPlaying = false;
    this.currentTrack = null;
    this.queue = [];
    this.history = [];
    this.favorites = [];
    this.playlists = [];
    this.currentQueueIndex = -1;
    this.currentPlaylistId = null;
    this.shuffle = false;
    this.repeat = false;
    this.volume = 80;
    this.muted = false;
    this.dragging = false;
    this.playbackRate = 1.0;
    this.tickInterval = null;
    this.searchDebounce = null;
    this.trendingPageToken = '';
    this.apiKey = '';

    // Sleep Timer state
    this.sleepTimerEnd = null;
    this.sleepTimerInterval = null;

    // PiP State
    this.pipActive = false;

    // Track for modal picker
    this.trackToAdd = null;

    this.loadState();
    this.cacheDom();
    this.bindEvents();
    this.renderGenres();
    this.renderQuickPlay();
    this.renderHome();
    this.renderQueue();
    this.renderHistory();
    this.renderFavorites();
    this.renderPlaylists();
    this.updateGreeting();
    this.initYouTube();
    this.setupMediaSession();
  }

  // ========== LOCAL STORAGE ==========
  loadState() {
    try {
      this.queue = JSON.parse(localStorage.getItem('ps_queue')) || [];
      this.history = JSON.parse(localStorage.getItem('ps_history')) || [];
      this.favorites = JSON.parse(localStorage.getItem('ps_favorites')) || [];
      this.playlists = JSON.parse(localStorage.getItem('ps_playlists')) || [
        { id: 'fav_pl_1', name: 'Chill Vibes', tracks: QUICK_PLAY_TRACKS.slice(0, 3) }
      ];
      this.volume = parseInt(localStorage.getItem('ps_vol') || '80', 10);
      this.apiKey = localStorage.getItem('ps_apikey') || '';
    } catch {
      this.queue = []; this.history = []; this.favorites = []; this.playlists = [];
    }
  }

  saveState() {
    try {
      localStorage.setItem('ps_queue', JSON.stringify(this.queue));
      localStorage.setItem('ps_history', JSON.stringify(this.history));
      localStorage.setItem('ps_favorites', JSON.stringify(this.favorites));
      localStorage.setItem('ps_playlists', JSON.stringify(this.playlists));
      localStorage.setItem('ps_vol', this.volume.toString());
      if (this.apiKey) localStorage.setItem('ps_apikey', this.apiKey);
      else localStorage.removeItem('ps_apikey');
    } catch {}
  }

  // ========== DOM ACCESS ==========
  cacheDom() {
    this.$ = id => document.getElementById(id);
    this.$$ = sel => document.querySelectorAll(sel);
    this.views = this.$$('.view');
    this.navItems = this.$$('.nav-item[data-view]');
  }

  // ========== YOUTUBE API INIT ==========
  initYouTube() {
    window.onYouTubeIframeAPIReady = () => this.createPlayer();
    if (window.YT && window.YT.Player) {
      this.createPlayer();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  createPlayer() {
    this.player = new YT.Player('yt-player', {
      height: '1', width: '1',
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: () => {
          this.isReady = true;
          this.player.setVolume(this.volume);
          this.startProgressTicker();
          this.toast('Player engine ready!', 'success');
        },
        onStateChange: e => this.handlePlayerState(e),
        onError: e => this.handlePlayerError(e)
      }
    });
  }

  handlePlayerState(e) {
    switch (e.data) {
      case YT.PlayerState.PLAYING:
        this.isPlaying = true;
        this.updatePlayStateUI(true);
        this.syncTrackMetadata();
        this.updateMediaSessionState('playing');
        break;
      case YT.PlayerState.PAUSED:
        this.isPlaying = false;
        this.updatePlayStateUI(false);
        this.updateMediaSessionState('paused');
        break;
      case YT.PlayerState.ENDED:
        this.isPlaying = false;
        this.updatePlayStateUI(false);
        this.updateMediaSessionState('none');
        if (this.repeat) {
          this.player.seekTo(0, true);
          this.player.playVideo();
        } else {
          this.playNext();
        }
        break;
      case YT.PlayerState.BUFFERING:
        break;
    }
  }

  handlePlayerError(e) {
    const errorMap = {
      2: 'Invalid video ID parameter',
      5: 'HTML5 player error',
      100: 'Video not found or removed',
      101: 'Playback disallowed by video owner',
      150: 'Playback disallowed by video owner'
    };
    this.toast(errorMap[e.data] || 'Playback encountered an error', 'error');
    if (this.queue.length > 1) {
      setTimeout(() => this.playNext(), 1200);
    }
  }

  // ========== PLAYBACK CONTROLS ==========
  playTrack(track) {
    if (!this.player || !this.isReady) {
      this.toast('Player is initializing...', 'warn');
      return;
    }
    this.currentTrack = track;

    // Queue sync
    const index = this.queue.findIndex(t => t.id === track.id);
    if (index >= 0) {
      this.currentQueueIndex = index;
    } else {
      this.queue.unshift(track);
      this.currentQueueIndex = 0;
      this.saveState();
    }

    this.addToHistory(track);
    this.player.loadVideoById(track.id);
    if (this.playbackRate !== 1.0) {
      this.player.setPlaybackRate(this.playbackRate);
    }

    this.updateNowPlayingUI(track);
    this.renderQueue();
    this.renderHome();
    this.updateMediaSessionMetadata(track);
    this.loadRelatedTracks(track);

    if (this.pipActive) this.updatePiP();
  }

  togglePlay() {
    if (!this.player || !this.isReady) return;
    if (this.isPlaying) {
      this.player.pauseVideo();
    } else {
      if (!this.currentTrack && this.queue.length > 0) {
        this.playTrack(this.queue[0]);
        return;
      }
      this.player.playVideo();
    }
  }

  playNext() {
    if (this.queue.length === 0) return;
    if (this.shuffle) {
      this.currentQueueIndex = Math.floor(Math.random() * this.queue.length);
    } else {
      this.currentQueueIndex = (this.currentQueueIndex + 1) % this.queue.length;
    }
    this.playTrack(this.queue[this.currentQueueIndex]);
  }

  playPrev() {
    if (this.queue.length === 0) return;
    if (this.player && this.player.getCurrentTime() > 3) {
      this.player.seekTo(0, true);
      return;
    }
    this.currentQueueIndex = (this.currentQueueIndex - 1 + this.queue.length) % this.queue.length;
    this.playTrack(this.queue[this.currentQueueIndex]);
  }

  setSpeed(rate) {
    this.playbackRate = parseFloat(rate);
    if (this.player && this.isReady) {
      this.player.setPlaybackRate(this.playbackRate);
    }
    this.$('speed-badge').textContent = `${this.playbackRate}x`;
    this.$$('.speed-opt').forEach(btn => {
      btn.classList.toggle('active', parseFloat(btn.dataset.speed) === this.playbackRate);
    });
    this.toast(`Speed set to ${this.playbackRate}x`, 'info');
  }

  syncTrackMetadata() {
    if (!this.player || !this.player.getVideoData) return;
    try {
      const data = this.player.getVideoData();
      if (data && data.title && this.currentTrack) {
        this.currentTrack.title = data.title;
        this.currentTrack.channel = data.author || this.currentTrack.channel;
        this.updateNowPlayingUI(this.currentTrack);
        this.updateMediaSessionMetadata(this.currentTrack);
        this.renderQueue();
      }
    } catch {}
  }

  updateNowPlayingUI(track) {
    const thumb = track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
    this.$('npb-title').textContent = track.title || 'Playing';
    this.$('npb-artist').textContent = track.channel || 'YouTube';
    this.$('npb-art').src = thumb;

    this.$('ep-title').textContent = track.title || 'Playing';
    this.$('ep-artist').textContent = track.channel || 'YouTube';
    this.$('ep-art-img').src = thumb;
    this.$('ep-bg').style.backgroundImage = `url(${thumb})`;
    this.$('ep-bg').style.backgroundSize = 'cover';
    this.$('ep-bg').style.filter = 'blur(60px) brightness(0.25)';

    this.updateFavoriteButton();
  }

  updatePlayStateUI(playing) {
    this.$('ic-play').style.display = playing ? 'none' : 'block';
    this.$('ic-pause').style.display = playing ? 'block' : 'none';

    const epPlay = this.$('ep-pp');
    epPlay.querySelector('.ic-play').style.display = playing ? 'none' : 'block';
    epPlay.querySelector('.ic-pause').style.display = playing ? 'block' : 'none';

    this.$('npb-bars').classList.toggle('active', playing);
    this.$('ep-viz').classList.toggle('active', playing);
  }

  startProgressTicker() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => {
      if (!this.player || !this.isReady || this.dragging) return;
      const cur = this.player.getCurrentTime() || 0;
      const dur = this.player.getDuration() || 0;
      const buf = this.player.getVideoLoadedFraction() || 0;
      const pct = dur > 0 ? (cur / dur) * 100 : 0;

      this.$('npb-fill').style.width = `${pct}%`;
      this.$('npb-scrub').style.left = `${pct}%`;
      this.$('npb-buffered').style.width = `${buf * 100}%`;
      this.$('t-cur').textContent = this.formatTime(cur);
      this.$('t-dur').textContent = this.formatTime(dur);

      this.$('ep-fill').style.width = `${pct}%`;
      this.$('ep-tc').textContent = this.formatTime(cur);
      this.$('ep-td').textContent = this.formatTime(dur);
    }, 200);
  }

  formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // ========== MEDIA SESSION API (Lock screen / Background controls) ==========
  setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
      navigator.mediaSession.setActionHandler('seekto', details => {
        if (details.seekTime && this.player && this.isReady) {
          this.player.seekTo(details.seekTime, true);
        }
      });
    } catch {}
  }

  updateMediaSessionMetadata(track) {
    if (!('mediaSession' in navigator)) return;
    try {
      const artworkUrl = track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.channel || 'PulseStream',
        album: 'PulseStream Music',
        artwork: [
          { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    } catch {}
  }

  updateMediaSessionState(state) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch {}
  }

  // ========== SLEEP TIMER ==========
  startSleepTimer(minutes) {
    this.cancelSleepTimer();
    const durationMs = minutes * 60 * 1000;
    this.sleepTimerEnd = Date.now() + durationMs;

    this.$('timer-badge').style.display = 'inline-block';
    this.$('timer-badge').textContent = `${minutes}m`;
    this.$('timer-active').style.display = 'block';

    const updateDisplay = () => {
      const remainingMs = this.sleepTimerEnd - Date.now();
      if (remainingMs <= 0) {
        this.cancelSleepTimer();
        if (this.player && this.isReady) {
          this.player.pauseVideo();
        }
        this.toast('🌙 Sleep timer finished. Music paused.', 'info');
        return;
      }
      const remMin = Math.ceil(remainingMs / 60000);
      this.$('timer-remaining-text').textContent = `${remMin} min remaining`;
      this.$('timer-badge').textContent = `${remMin}m`;
    };

    updateDisplay();
    this.sleepTimerInterval = setInterval(updateDisplay, 10000);
    this.toast(`Sleep timer set for ${minutes} minutes`, 'success');
  }

  cancelSleepTimer() {
    if (this.sleepTimerInterval) {
      clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }
    this.sleepTimerEnd = null;
    this.$('timer-badge').style.display = 'none';
    this.$('timer-active').style.display = 'none';
  }

  // ========== EQUALIZER PRESETS ==========
  applyEqPreset(preset) {
    this.$$('.eq-preset').forEach(btn => btn.classList.toggle('active', btn.dataset.preset === preset));
    const presets = {
      flat: [0, 0, 0, 0, 0],
      bass: [8, 5, 1, 0, -1],
      treble: [-2, 0, 2, 6, 8],
      vocal: [-2, 2, 6, 3, -1],
      rock: [6, 3, -1, 4, 7],
      electronic: [7, 4, 0, 3, 6]
    };
    const gains = presets[preset] || presets.flat;
    const sliders = this.$$('.eq-slider');
    sliders.forEach((slider, idx) => {
      slider.value = gains[idx] || 0;
      const valSpan = slider.parentElement.querySelector('.eq-val');
      if (valSpan) valSpan.textContent = gains[idx] > 0 ? `+${gains[idx]}` : `${gains[idx]}`;
    });
    this.toast(`Equalizer: ${preset.toUpperCase()} preset applied`, 'info');
  }

  // ========== MINI PLAYER / PICTURE-IN-PICTURE ==========
  togglePiP() {
    let pipEl = document.getElementById('pip-floating-player');
    if (pipEl) {
      pipEl.remove();
      this.pipActive = false;
      this.toast('Mini Player closed', 'info');
      return;
    }

    if (!this.currentTrack) {
      this.toast('Play a track first to use Mini Player', 'warn');
      return;
    }

    this.pipActive = true;
    pipEl = document.createElement('div');
    pipEl.id = 'pip-floating-player';
    pipEl.className = 'pip-player';
    document.body.appendChild(pipEl);
    this.updatePiP();
    this.toast('Mini Player activated', 'success');
  }

  updatePiP() {
    const pipEl = document.getElementById('pip-floating-player');
    if (!pipEl || !this.currentTrack) return;
    const thumb = this.currentTrack.thumbnail || `https://i.ytimg.com/vi/${this.currentTrack.id}/hqdefault.jpg`;
    pipEl.innerHTML = `
      <div class="pip-header">
        <span>Mini Player</span>
        <button class="pip-close" id="pip-btn-close">✕</button>
      </div>
      <div class="pip-body">
        <img class="pip-thumb" src="${this.esc(thumb)}" alt="">
        <div class="pip-info">
          <div class="pip-title">${this.esc(this.currentTrack.title)}</div>
          <div class="pip-artist">${this.esc(this.currentTrack.channel)}</div>
        </div>
      </div>
      <div class="pip-ctrls">
        <button class="npb-btn sm" id="pip-prev"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="3"/></svg></button>
        <button class="npb-play-btn" id="pip-pp" style="width:36px;height:36px;"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20"/></svg></button>
        <button class="npb-btn sm" id="pip-next"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="3"/></svg></button>
      </div>
    `;

    pipEl.querySelector('#pip-btn-close').addEventListener('click', () => this.togglePiP());
    pipEl.querySelector('#pip-prev').addEventListener('click', () => this.playPrev());
    pipEl.querySelector('#pip-next').addEventListener('click', () => this.playNext());
    pipEl.querySelector('#pip-pp').addEventListener('click', () => this.togglePlay());
  }

  // ========== RELATED TRACKS ==========
  async loadRelatedTracks(track) {
    const listEl = this.$('ep-related-list');
    listEl.innerHTML = '<div class="shimmer" style="height:40px;"></div>';

    // Search related query or genre
    const query = `${track.channel || ''} music`;
    const results = await this.apiSearch(query, 6);
    listEl.innerHTML = '';

    const filtered = results.filter(t => t.id !== track.id);
    if (filtered.length === 0) {
      listEl.innerHTML = '<p style="font-size:0.78rem;color:var(--text-3);padding:6px;">No related suggestions.</p>';
      return;
    }

    filtered.forEach(t => {
      const item = document.createElement('div');
      item.className = 'ep-rel-item';
      const thumb = t.thumbnail || `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`;
      item.innerHTML = `
        <img src="${this.esc(thumb)}" alt="">
        <div class="ep-rel-text">
          <div class="ep-rel-title">${this.esc(t.title)}</div>
          <div class="ep-rel-channel">${this.esc(t.channel)}</div>
        </div>
      `;
      item.addEventListener('click', () => this.playTrack(t));
      listEl.appendChild(item);
    });
  }

  // ========== PLAYLIST MANAGEMENT ==========
  renderPlaylists() {
    const grid = this.$('playlists-grid');
    grid.innerHTML = '';
    if (this.playlists.length === 0) {
      grid.innerHTML = this.emptyState('No custom playlists yet. Click "+ New Playlist" to create one.');
      return;
    }
    this.playlists.forEach(pl => {
      const card = document.createElement('div');
      card.className = 'playlist-card';
      const firstThumb = pl.tracks.length > 0 ? (pl.tracks[0].thumbnail || `https://i.ytimg.com/vi/${pl.tracks[0].id}/hqdefault.jpg`) : '';
      card.innerHTML = `
        <div class="pl-card-thumb">
          ${firstThumb ? `<img src="${this.esc(firstThumb)}" alt="">` : '🎵'}
        </div>
        <div class="pl-card-title">${this.esc(pl.name)}</div>
        <div class="pl-card-count">${pl.tracks.length} track${pl.tracks.length === 1 ? '' : 's'}</div>
      `;
      card.addEventListener('click', () => this.openPlaylist(pl.id));
      grid.appendChild(card);
    });
  }

  openPlaylist(id) {
    const pl = this.playlists.find(p => p.id === id);
    if (!pl) return;
    this.currentPlaylistId = id;

    this.$('playlists-grid').style.display = 'none';
    this.$('btn-new-playlist').style.display = 'none';
    this.$('playlist-detail').style.display = 'block';

    this.$('pl-detail-name').textContent = pl.name;
    this.$('pl-detail-count').textContent = `${pl.tracks.length} track${pl.tracks.length === 1 ? '' : 's'}`;

    const listEl = this.$('pl-detail-tracks');
    listEl.innerHTML = '';
    if (pl.tracks.length === 0) {
      listEl.innerHTML = this.emptyState('This playlist is empty.');
      return;
    }
    pl.tracks.forEach((t, i) => {
      const row = this.createTrackRow(t, i, pl.tracks, 'playlist');
      listEl.appendChild(row);
    });
  }

  closePlaylistDetail() {
    this.currentPlaylistId = null;
    this.$('playlists-grid').style.display = 'grid';
    this.$('btn-new-playlist').style.display = 'inline-block';
    this.$('playlist-detail').style.display = 'none';
    this.renderPlaylists();
  }

  createPlaylist(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const pl = { id: 'pl_' + Date.now(), name: trimmed, tracks: [] };
    this.playlists.push(pl);
    this.saveState();
    this.renderPlaylists();
    this.toast(`Playlist "${trimmed}" created!`, 'success');
  }

  deleteCurrentPlaylist() {
    if (!this.currentPlaylistId) return;
    this.playlists = this.playlists.filter(p => p.id !== this.currentPlaylistId);
    this.saveState();
    this.closePlaylistDetail();
    this.toast('Playlist deleted', 'info');
  }

  openAddToPlaylistPicker(track) {
    this.trackToAdd = track;
    const listEl = this.$('pick-pl-list');
    listEl.innerHTML = '';
    if (this.playlists.length === 0) {
      listEl.innerHTML = '<p class="hint">No playlists available. Create one first!</p>';
    } else {
      this.playlists.forEach(pl => {
        const item = document.createElement('div');
        item.className = 'pl-pick-item';
        item.innerHTML = `<span class="pl-pick-name">${this.esc(pl.name)}</span><span class="pl-pick-cnt">${pl.tracks.length} tracks</span>`;
        item.addEventListener('click', () => {
          if (!pl.tracks.some(t => t.id === track.id)) {
            pl.tracks.push(track);
            this.saveState();
            this.toast(`Added to "${pl.name}"`, 'success');
          } else {
            this.toast(`Already in "${pl.name}"`, 'warn');
          }
          this.$('modal-pick-pl').style.display = 'none';
        });
        listEl.appendChild(item);
      });
    }
    this.$('modal-pick-pl').style.display = 'flex';
  }

  // ========== LISTS (History / Favorites / Queue) ==========
  addToHistory(track) {
    this.history = this.history.filter(t => t.id !== track.id);
    this.history.unshift({ ...track });
    if (this.history.length > 100) this.history.pop();
    this.saveState();
    this.renderHistory();
  }

  toggleFavorite(track) {
    const idx = this.favorites.findIndex(t => t.id === track.id);
    if (idx >= 0) {
      this.favorites.splice(idx, 1);
      this.toast('Removed from favorites', 'info');
    } else {
      this.favorites.unshift({ ...track });
      this.toast('Added to favorites ❤️', 'success');
    }
    this.saveState();
    this.renderFavorites();
    this.renderHome();
    this.updateFavoriteButton();
    this.updateBadges();
  }

  isFavorite(id) {
    return this.favorites.some(t => t.id === id);
  }

  addToQueue(track) {
    if (this.queue.some(t => t.id === track.id)) {
      this.toast('Already in queue', 'warn');
      return;
    }
    this.queue.push(track);
    this.saveState();
    this.renderQueue();
    this.updateBadges();
    this.toast(`Added to queue: ${track.title.slice(0, 28)}...`, 'info');
  }

  removeFromQueue(index) {
    this.queue.splice(index, 1);
    if (this.currentQueueIndex >= index) {
      this.currentQueueIndex = Math.max(0, this.currentQueueIndex - 1);
    }
    this.saveState();
    this.renderQueue();
    this.updateBadges();
  }

  updateBadges() {
    this.$('queue-badge').textContent = this.queue.length;
    this.$('fav-badge').textContent = this.favorites.length;
  }

  updateFavoriteButton() {
    if (!this.currentTrack) return;
    const fav = this.isFavorite(this.currentTrack.id);
    this.$('btn-fav-cur').classList.toggle('active', fav);
    this.$('fav-icon').setAttribute('fill', fav ? 'currentColor' : 'none');
    this.$('fav-icon').style.color = fav ? '#ec4899' : '';

    const epFav = this.$('ep-fav');
    epFav.textContent = fav ? '♥ Favorited' : '♡ Favorite';
    epFav.classList.toggle('faved', fav);
  }

  // ========== SHARE FUNCTIONALITY ==========
  shareCurrentTrack() {
    if (!this.currentTrack) return;
    const url = `https://www.youtube.com/watch?v=${this.currentTrack.id}`;
    if (navigator.share) {
      navigator.share({
        title: this.currentTrack.title,
        text: `Listen to "${this.currentTrack.title}" on PulseStream`,
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.toast('Link copied to clipboard! 📋', 'success');
      }).catch(() => {
        this.toast('Failed to copy link', 'error');
      });
    }
  }

  // ========== YOUTUBE DATA API ==========
  async apiSearch(query, maxResults = 24) {
    if (!this.apiKey) {
      return this.localSearchFallback(query);
    }
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${this.apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        this.toast(`API: ${data.error.message}`, 'error');
        return this.localSearchFallback(query);
      }
      return (data.items || []).map(i => ({
        id: i.id.videoId,
        title: this.unescapeHtml(i.snippet.title),
        channel: i.snippet.channelTitle,
        thumbnail: i.snippet.thumbnails?.medium?.url || i.snippet.thumbnails?.default?.url || '',
        publishedAt: i.snippet.publishedAt
      }));
    } catch {
      return this.localSearchFallback(query);
    }
  }

  localSearchFallback(query) {
    const qLower = query.toLowerCase();
    const matches = QUICK_PLAY_TRACKS.filter(t =>
      t.title.toLowerCase().includes(qLower) || t.channel.toLowerCase().includes(qLower)
    );
    return matches.map(t => ({
      ...t,
      thumbnail: `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`
    }));
  }

  async apiTrending(pageToken = '') {
    if (!this.apiKey) {
      this.promptApiKeyModal();
      return { items: QUICK_PLAY_TRACKS, nextPageToken: '' };
    }
    try {
      let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&videoCategoryId=10&regionCode=IN&maxResults=24&key=${this.apiKey}`;
      if (pageToken) url += `&pageToken=${pageToken}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        this.toast(`API: ${data.error.message}`, 'error');
        return { items: [], nextPageToken: '' };
      }
      const items = (data.items || []).map(i => ({
        id: i.id,
        title: this.unescapeHtml(i.snippet.title),
        channel: i.snippet.channelTitle,
        thumbnail: i.snippet.thumbnails?.medium?.url || '',
        duration: this.parseIsoDuration(i.contentDetails?.duration),
        views: this.formatViews(i.statistics?.viewCount),
        publishedAt: i.snippet.publishedAt
      }));
      return { items, nextPageToken: data.nextPageToken || '' };
    } catch {
      this.toast('Failed to load trending tracks', 'error');
      return { items: [], nextPageToken: '' };
    }
  }

  parseIsoDuration(iso) {
    if (!iso) return '';
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return '';
    const h = parseInt(m[1] || 0);
    const min = parseInt(m[2] || 0);
    const sec = parseInt(m[3] || 0);
    if (h > 0) return `${h}:${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  formatViews(v) {
    if (!v) return '';
    const n = parseInt(v, 10);
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
  }

  unescapeHtml(s) {
    if (!s) return '';
    const el = document.createElement('div');
    el.innerHTML = s;
    return el.textContent;
  }

  esc(s) {
    if (!s) return '';
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  parseInput(input) {
    const t = input.trim();
    if (!t) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(t)) return { type: 'id', id: t };
    const m = t.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    if (m) return { type: 'url', id: m[1] };
    return { type: 'query', query: t };
  }

  promptApiKeyModal() {
    this.toast('Set your YouTube Data API Key in Settings to unlock live Search & Trending.', 'warn');
    this.$('modal-settings').style.display = 'flex';
  }

  // ========== RENDERING UI ==========
  createMediaCard(track) {
    const thumb = track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
    const div = document.createElement('div');
    div.className = 'media-card';
    div.innerHTML = `
      <div class="mc-thumb">
        <img src="${this.esc(thumb)}" alt="${this.esc(track.title)}" loading="lazy">
        <div class="mc-overlay"><div class="mc-play-circle"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg></div></div>
        ${track.duration ? `<span class="mc-duration">${track.duration}</span>` : ''}
      </div>
      <div class="mc-actions">
        <button class="mc-act-btn act-fav" title="Favorite"><svg viewBox="0 0 24 24" fill="${this.isFavorite(track.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
        <button class="mc-act-btn act-queue" title="Add to Queue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
      </div>
      <div class="mc-body">
        <div class="mc-title">${this.esc(track.title)}</div>
        <div class="mc-channel">${this.esc(track.channel)}</div>
        ${track.views ? `<div class="mc-meta"><span>👁 ${track.views} views</span></div>` : ''}
      </div>
    `;
    div.addEventListener('click', e => {
      if (e.target.closest('.mc-act-btn')) return;
      this.playTrack(track);
    });
    div.querySelector('.act-fav')?.addEventListener('click', e => {
      e.stopPropagation();
      this.toggleFavorite(track);
    });
    div.querySelector('.act-queue')?.addEventListener('click', e => {
      e.stopPropagation();
      this.addToQueue(track);
    });
    return div;
  }

  createTrackRow(track, index, list, type = 'queue') {
    const div = document.createElement('div');
    const isCur = this.currentTrack && this.currentTrack.id === track.id;
    div.className = `tl-item ${isCur ? 'playing' : ''}`;
    const thumb = track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
    div.innerHTML = `
      <span class="tl-idx">${index + 1}</span>
      <div class="tl-thumb"><img src="${this.esc(thumb)}" alt="" loading="lazy"></div>
      <div class="tl-info">
        <div class="tl-title">${this.esc(track.title)}</div>
        <div class="tl-sub">${this.esc(track.channel)}</div>
      </div>
      <div class="tl-actions">
        <button class="tl-act act-fav" title="Favorite"><svg viewBox="0 0 24 24" fill="${this.isFavorite(track.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" style="color:${this.isFavorite(track.id) ? '#ec4899' : ''}"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
        ${type === 'queue' ? `<button class="tl-act rm" title="Remove"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : ''}
      </div>
    `;
    div.addEventListener('click', e => {
      if (e.target.closest('.tl-act')) return;
      this.playTrack(track);
    });
    div.querySelector('.act-fav')?.addEventListener('click', e => {
      e.stopPropagation();
      this.toggleFavorite(track);
    });
    div.querySelector('.rm')?.addEventListener('click', e => {
      e.stopPropagation();
      this.removeFromQueue(index);
    });
    return div;
  }

  emptyState(msg) {
    return `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><p>${msg}</p></div>`;
  }

  renderQueue() {
    const el = this.$('queue-list');
    el.innerHTML = '';
    this.updateBadges();
    if (this.queue.length === 0) {
      el.innerHTML = this.emptyState('Your queue is empty. Search or browse to add tracks.');
      return;
    }
    this.queue.forEach((t, i) => el.appendChild(this.createTrackRow(t, i, this.queue, 'queue')));
  }

  renderHistory() {
    const el = this.$('history-list');
    el.innerHTML = '';
    if (this.history.length === 0) {
      el.innerHTML = this.emptyState('No recently played tracks yet.');
      return;
    }
    this.history.forEach((t, i) => el.appendChild(this.createTrackRow(t, i, this.history, 'history')));
  }

  renderFavorites() {
    const el = this.$('favorites-grid');
    el.innerHTML = '';
    this.updateBadges();
    if (this.favorites.length === 0) {
      el.innerHTML = this.emptyState('No favorites saved. Click the ♥ icon on any track.');
      return;
    }
    this.favorites.forEach(t => el.appendChild(this.createMediaCard(t)));
  }

  renderQuickPlay() {
    const el = this.$('quick-play-grid');
    el.innerHTML = '';
    QUICK_PLAY_TRACKS.forEach(t => {
      const track = { ...t, thumbnail: `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg` };
      const card = document.createElement('div');
      card.className = 'quick-card';
      card.innerHTML = `
        <img src="${track.thumbnail}" alt="">
        <div class="qc-text">
          <div class="qc-title">${this.esc(track.title)}</div>
          <div class="qc-sub">${this.esc(track.channel)}</div>
        </div>
      `;
      card.addEventListener('click', () => this.playTrack(track));
      el.appendChild(card);
    });
  }

  renderHome() {
    const recentEl = this.$('home-recent');
    recentEl.innerHTML = '';
    if (this.history.length === 0) {
      recentEl.innerHTML = '<p style="color:var(--text-4);font-size:0.85rem;padding:10px;">Play tracks to see them here.</p>';
    } else {
      this.history.slice(0, 12).forEach(t => recentEl.appendChild(this.createMediaCard(t)));
    }

    const favEl = this.$('home-fav');
    favEl.innerHTML = '';
    if (this.favorites.length === 0) {
      favEl.innerHTML = '<p style="color:var(--text-4);font-size:0.85rem;padding:10px;">Click ♥ on any track to add favorites.</p>';
    } else {
      this.favorites.slice(0, 12).forEach(t => favEl.appendChild(this.createMediaCard(t)));
    }
  }

  renderGenres() {
    const el = this.$('genre-grid');
    el.innerHTML = '';
    GENRES.forEach(g => {
      const card = document.createElement('div');
      card.className = 'genre-card';
      card.style.background = g.bg;
      card.innerHTML = `<span class="genre-emoji">${g.emoji}</span><span class="genre-label">${g.label}</span>`;
      card.addEventListener('click', () => this.browseGenre(g));
      el.appendChild(card);
    });
  }

  async browseGenre(genre) {
    this.$('genre-grid').style.display = 'none';
    this.$('genre-results').style.display = 'grid';
    this.$('btn-back-genres').style.display = 'inline-flex';
    this.$('genre-results').innerHTML = '<div class="shimmer" style="height:200px;grid-column:1/-1;"></div>';

    const results = await this.apiSearch(genre.q, 24);
    this.$('genre-results').innerHTML = '';
    if (results.length === 0) {
      this.$('genre-results').innerHTML = this.emptyState('No results for this genre.');
      return;
    }
    results.forEach(t => this.$('genre-results').appendChild(this.createMediaCard(t)));
  }

  updateGreeting() {
    const h = new Date().getHours();
    let g = 'Evening';
    if (h < 12) g = 'Morning';
    else if (h < 17) g = 'Afternoon';
    this.$('greeting-time').textContent = g;
  }

  // ========== SEARCH ==========
  async performSearch(query) {
    const parsed = this.parseInput(query);
    if (!parsed) return;

    if (parsed.type === 'id' || parsed.type === 'url') {
      const track = {
        id: parsed.id,
        title: `Track (${parsed.id})`,
        channel: 'YouTube',
        thumbnail: `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`
      };
      this.playTrack(track);
      this.toast(`Loading video: ${parsed.id}`, 'info');
      return;
    }

    this.$('search-status').textContent = 'Searching...';
    this.$('search-results').innerHTML = '<div class="shimmer" style="height:200px;grid-column:1/-1;"></div>';

    const results = await this.apiSearch(parsed.query, 24);
    this.$('search-results').innerHTML = '';
    if (results.length === 0) {
      this.$('search-status').textContent = 'No tracks found.';
      this.$('search-results').innerHTML = this.emptyState('No results. Try another keyword or verify API key.');
      return;
    }
    this.$('search-status').textContent = `${results.length} results for "${parsed.query}"`;
    results.forEach(t => this.$('search-results').appendChild(this.createMediaCard(t)));
  }

  // ========== TRENDING ==========
  async loadTrending(append = false) {
    if (!append) {
      this.$('trending-results').innerHTML = '<div class="shimmer" style="height:200px;grid-column:1/-1;"></div>';
      this.trendingPageToken = '';
    }
    const { items, nextPageToken } = await this.apiTrending(this.trendingPageToken);
    if (!append) this.$('trending-results').innerHTML = '';

    if (items.length === 0 && !append) {
      this.$('trending-results').innerHTML = this.emptyState('Trending items unavailable.');
      this.$('btn-more-trending').style.display = 'none';
      return;
    }

    items.forEach(t => this.$('trending-results').appendChild(this.createMediaCard(t)));
    this.trendingPageToken = nextPageToken;
    this.$('btn-more-trending').style.display = nextPageToken ? 'block' : 'none';
  }

  // ========== NAVIGATION ==========
  switchView(viewName) {
    this.views.forEach(v => v.classList.remove('active'));
    this.navItems.forEach(n => n.classList.remove('active'));

    const targetView = this.$(`view-${viewName}`);
    if (targetView) targetView.classList.add('active');

    const activeNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeNav) activeNav.classList.add('active');

    if (viewName === 'trending' && this.$('trending-results').children.length === 0) {
      this.loadTrending();
    }
    if (viewName === 'playlists') {
      this.renderPlaylists();
    }

    this.$('sidebar').classList.remove('open');
  }

  // ========== BAR SCRUBBING ==========
  seekFromElement(e, el) {
    if (!this.player || !this.isReady) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    const dur = this.player.getDuration() || 0;
    this.player.seekTo(pct * dur, true);
  }

  // ========== TOAST ==========
  toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    this.$('toasts').appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(30px)';
      el.style.transition = 'all .3s';
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  // ========== EVENT BINDINGS ==========
  bindEvents() {
    // Navigation
    this.navItems.forEach(btn => btn.addEventListener('click', () => this.switchView(btn.dataset.view)));
    this.$$('.link-btn[data-view]').forEach(btn => btn.addEventListener('click', () => this.switchView(btn.dataset.view)));

    // Bottom playback controls
    this.$('btn-pp').addEventListener('click', () => this.togglePlay());
    this.$('btn-next').addEventListener('click', () => this.playNext());
    this.$('btn-prev').addEventListener('click', () => this.playPrev());
    this.$('btn-shuffle').addEventListener('click', () => {
      this.shuffle = !this.shuffle;
      this.$('btn-shuffle').classList.toggle('active', this.shuffle);
      this.toast(this.shuffle ? 'Shuffle enabled' : 'Shuffle disabled', 'info');
    });
    this.$('btn-repeat').addEventListener('click', () => {
      this.repeat = !this.repeat;
      this.$('btn-repeat').classList.toggle('active', this.repeat);
      this.toast(this.repeat ? 'Repeat enabled' : 'Repeat disabled', 'info');
    });

    // Expanded Player controls
    this.$('ep-pp').addEventListener('click', () => this.togglePlay());
    this.$('ep-next').addEventListener('click', () => this.playNext());
    this.$('ep-prev').addEventListener('click', () => this.playPrev());
    this.$('ep-shuffle').addEventListener('click', () => {
      this.shuffle = !this.shuffle;
      this.$('ep-shuffle').classList.toggle('active', this.shuffle);
      this.$('btn-shuffle').classList.toggle('active', this.shuffle);
    });
    this.$('ep-repeat').addEventListener('click', () => {
      this.repeat = !this.repeat;
      this.$('ep-repeat').classList.toggle('active', this.repeat);
      this.$('btn-repeat').classList.toggle('active', this.repeat);
    });

    // Volume
    this.$('vol-slider').value = this.volume;
    this.$('vol-slider').addEventListener('input', e => {
      this.volume = parseInt(e.target.value, 10);
      if (this.player && this.isReady) {
        this.player.setVolume(this.volume);
        if (this.muted) { this.player.unMute(); this.muted = false; }
      }
      this.updateVolumeIcon();
      this.saveState();
    });
    this.$('btn-mute').addEventListener('click', () => {
      if (!this.player || !this.isReady) return;
      this.muted = !this.muted;
      if (this.muted) {
        this.player.mute();
      } else {
        this.player.unMute();
        this.player.setVolume(this.volume);
      }
      this.updateVolumeIcon();
    });

    // Seek Bar (Bottom)
    this.$('npb-progress').addEventListener('mousedown', e => {
      this.dragging = true;
      this.seekFromElement(e, this.$('npb-progress'));
    });
    window.addEventListener('mousemove', e => {
      if (this.dragging) this.seekFromElement(e, this.$('npb-progress'));
    });
    window.addEventListener('mouseup', () => { this.dragging = false; });

    // Seek Bar (Expanded)
    this.$('ep-bar').addEventListener('click', e => this.seekFromElement(e, this.$('ep-bar')));

    // Expand & Close
    this.$('btn-expand').addEventListener('click', () => { this.$('exp-player').style.display = 'flex'; });
    this.$('ep-close').addEventListener('click', () => { this.$('exp-player').style.display = 'none'; });

    // Current Track actions
    this.$('btn-fav-cur').addEventListener('click', () => { if (this.currentTrack) this.toggleFavorite(this.currentTrack); });
    this.$('ep-fav').addEventListener('click', () => { if (this.currentTrack) this.toggleFavorite(this.currentTrack); });
    this.$('ep-add-q').addEventListener('click', () => { if (this.currentTrack) this.addToQueue(this.currentTrack); });
    this.$('ep-add-pl').addEventListener('click', () => { if (this.currentTrack) this.openAddToPlaylistPicker(this.currentTrack); });
    this.$('ep-share').addEventListener('click', () => this.shareCurrentTrack());

    // Search events
    const searchInput = this.$('search-input');
    searchInput.addEventListener('input', () => {
      this.$('search-clear').style.display = searchInput.value ? 'block' : 'none';
      clearTimeout(this.searchDebounce);
      if (searchInput.value.trim().length >= 2) {
        this.searchDebounce = setTimeout(() => this.performSearch(searchInput.value), 600);
      }
    });
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        clearTimeout(this.searchDebounce);
        this.performSearch(searchInput.value);
      }
    });
    this.$('search-clear').addEventListener('click', () => {
      searchInput.value = '';
      this.$('search-clear').style.display = 'none';
      this.$('search-results').innerHTML = '';
      this.$('search-status').textContent = '';
      searchInput.focus();
    });

    // Trending pagination
    this.$('btn-more-trending').addEventListener('click', () => this.loadTrending(true));

    // Genre Back
    this.$('btn-back-genres').addEventListener('click', () => {
      this.$('genre-grid').style.display = 'grid';
      this.$('genre-results').style.display = 'none';
      this.$('btn-back-genres').style.display = 'none';
    });

    // Queue / History clear
    this.$('btn-clear-queue').addEventListener('click', () => {
      this.queue = [];
      this.currentQueueIndex = -1;
      this.saveState();
      this.renderQueue();
      this.toast('Queue emptied', 'info');
    });
    this.$('btn-clear-history').addEventListener('click', () => {
      this.history = [];
      this.saveState();
      this.renderHistory();
      this.renderHome();
      this.toast('Listening history cleared', 'info');
    });

    // Playlists UI
    this.$('btn-new-playlist').addEventListener('click', () => {
      this.$('input-pl-name').value = '';
      this.$('modal-new-pl').style.display = 'flex';
      this.$('input-pl-name').focus();
    });
    this.$('mx-new-pl').addEventListener('click', () => { this.$('modal-new-pl').style.display = 'none'; });
    this.$('btn-cancel-pl').addEventListener('click', () => { this.$('modal-new-pl').style.display = 'none'; });
    this.$('btn-create-pl').addEventListener('click', () => {
      this.createPlaylist(this.$('input-pl-name').value);
      this.$('modal-new-pl').style.display = 'none';
    });
    this.$('btn-back-playlists').addEventListener('click', () => this.closePlaylistDetail());
    this.$('btn-delete-playlist').addEventListener('click', () => this.deleteCurrentPlaylist());

    // Tools Buttons & Modals
    // Sleep Timer
    this.$('btn-sleep-timer').addEventListener('click', () => { this.$('modal-sleep').style.display = 'flex'; });
    this.$('mx-sleep').addEventListener('click', () => { this.$('modal-sleep').style.display = 'none'; });
    this.$$('.timer-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        this.startSleepTimer(parseInt(opt.dataset.min, 10));
        this.$('modal-sleep').style.display = 'none';
      });
    });
    this.$('btn-cancel-timer').addEventListener('click', () => {
      this.cancelSleepTimer();
      this.toast('Sleep timer cancelled', 'info');
    });

    // Speed Modal
    this.$('btn-speed').addEventListener('click', () => { this.$('modal-speed').style.display = 'flex'; });
    this.$('mx-speed').addEventListener('click', () => { this.$('modal-speed').style.display = 'none'; });
    this.$$('.speed-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        this.setSpeed(opt.dataset.speed);
        this.$('modal-speed').style.display = 'none';
      });
    });

    // Equalizer Modal
    this.$('btn-equalizer').addEventListener('click', () => { this.$('modal-eq').style.display = 'flex'; });
    this.$('mx-eq').addEventListener('click', () => { this.$('modal-eq').style.display = 'none'; });
    this.$$('.eq-preset').forEach(btn => {
      btn.addEventListener('click', () => this.applyEqPreset(btn.dataset.preset));
    });
    this.$$('.eq-slider').forEach(slider => {
      slider.addEventListener('input', () => {
        const valSpan = slider.parentElement.querySelector('.eq-val');
        if (valSpan) valSpan.textContent = slider.value > 0 ? `+${slider.value}` : slider.value;
      });
    });

    // Mini Player / PiP
    this.$('btn-pip').addEventListener('click', () => this.togglePiP());

    // Settings Modal
    this.$('btn-settings').addEventListener('click', () => {
      this.$('input-api-key').value = this.apiKey;
      this.$('modal-settings').style.display = 'flex';
    });
    this.$('mx-settings').addEventListener('click', () => { this.$('modal-settings').style.display = 'none'; });
    this.$('btn-cancel-set').addEventListener('click', () => { this.$('modal-settings').style.display = 'none'; });
    this.$('btn-save-set').addEventListener('click', () => {
      this.apiKey = this.$('input-api-key').value.trim();
      this.saveState();
      this.$('modal-settings').style.display = 'none';
      this.toast('Settings saved successfully', 'success');
    });

    // Playlist Picker Modal
    this.$('mx-pick-pl').addEventListener('click', () => { this.$('modal-pick-pl').style.display = 'none'; });

    // Close overlays on outside click
    this.$$('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.style.display = 'none';
      });
    });

    // Mobile Hamburger
    this.$('btn-hamburger').addEventListener('click', () => { this.$('sidebar').classList.toggle('open'); });
    document.addEventListener('click', e => {
      if (!e.target.closest('.sidebar') && !e.target.closest('#btn-hamburger')) {
        this.$('sidebar').classList.remove('open');
      }
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', e => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') document.activeElement.blur();
        return;
      }
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (this.player && this.isReady) this.player.seekTo(Math.max(0, this.player.getCurrentTime() - 5), true);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (this.player && this.isReady) this.player.seekTo(this.player.getCurrentTime() + 5, true);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.volume = Math.min(100, this.volume + 5);
          this.$('vol-slider').value = this.volume;
          if (this.player && this.isReady) this.player.setVolume(this.volume);
          this.updateVolumeIcon();
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.volume = Math.max(0, this.volume - 5);
          this.$('vol-slider').value = this.volume;
          if (this.player && this.isReady) this.player.setVolume(this.volume);
          this.updateVolumeIcon();
          break;
        case 'KeyM':
          this.$('btn-mute').click();
          break;
        case 'KeyN':
          this.playNext();
          break;
        case 'KeyP':
          this.playPrev();
          break;
        case 'Slash':
          e.preventDefault();
          this.switchView('search');
          setTimeout(() => this.$('search-input').focus(), 100);
          break;
      }
    });
  }

  updateVolumeIcon() {
    const svg = this.$('vol-icon');
    if (this.muted || this.volume === 0) {
      svg.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
    } else if (this.volume < 50) {
      svg.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>';
    } else {
      svg.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new PulseStreamApp();
});
