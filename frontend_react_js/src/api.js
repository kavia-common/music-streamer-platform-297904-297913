const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('token') || '';
}

async function request(path, opts = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }
  return json;
}

// PUBLIC_INTERFACE
export async function login(email, password) {
  /** Login using email and password (password is currently not validated by backend but included for UI compatibility)
   * Returns { token, user }
   */
  return request('/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) });
}

// PUBLIC_INTERFACE
export async function signup(email) {
  /** Signup using email only returns { token, user } */
  return request('/auth/signup', { method: 'POST', body: JSON.stringify({ email }) });
}

// PUBLIC_INTERFACE
export async function signin(email) {
  /** Signin returns { token, user } */
  return request('/auth/signin', { method: 'POST', body: JSON.stringify({ email }) });
}

// PUBLIC_INTERFACE
export async function getMe() {
  /** Get current user */
  return request('/me');
}

// PUBLIC_INTERFACE
export async function listPlaylists() {
  return request('/playlists');
}

// PUBLIC_INTERFACE
export async function createPlaylist(name, description = '') {
  return request('/playlists', { method: 'POST', body: JSON.stringify({ name, description }) });
}

// PUBLIC_INTERFACE
export async function getPlaylist(id) {
  return request(`/playlists/${id}`);
}

// PUBLIC_INTERFACE
export async function addTrackToPlaylist(id, track) {
  // track expected: { id, title, artist, artwork }
  const body = {
    audius_track_id: track.id,
    track_title: track.title,
    artist_name: track.artist,
    artwork_url: track.artwork || null
  };
  return request(`/playlists/${id}/tracks`, { method: 'POST', body: JSON.stringify(body) });
}

// PUBLIC_INTERFACE
export async function removeTrackFromPlaylist(id, trackId) {
  return request(`/playlists/${id}/tracks/${encodeURIComponent(trackId)}`, { method: 'DELETE' });
}

// PUBLIC_INTERFACE
export async function searchTracks(q) {
  return request(`/search?q=${encodeURIComponent(q)}`);
}

// PUBLIC_INTERFACE
export function streamUrl(trackId) {
  const token = getToken();
  const base = API_BASE.replace(/\/api$/, '');
  return `${base}/api/tracks/${encodeURIComponent(trackId)}/stream?token=${encodeURIComponent(token)}`;
}

// PUBLIC_INTERFACE
export async function recentlyPlayed() {
  return request('/recently-played');
}

// PUBLIC_INTERFACE
export async function logPlay(track) {
  // expects track = { id, title, artist }
  const body = {
    audius_track_id: track.id,
    track_title: track.title,
    artist_name: track.artist
  };
  return request('/recently-played', { method: 'POST', body: JSON.stringify(body) });
}
