import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  signup, signin, getMe,
  searchTracks, listPlaylists, createPlaylist, getPlaylist, addTrackToPlaylist,
  streamUrl, logPlay, recentlyPlayed
} from '../api';
import Login from '../components/Login';

function Auth({ onAuth }) {
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState('signin');
  const submit = async (e) => {
    e.preventDefault();
    try {
      const fn = mode === 'signin' ? signin : signup;
      const res = await fn(email);
      localStorage.setItem('token', res.token);
      onAuth(res.user);
    } catch (e) {
      alert(e.message);
    }
  };
  return (
    <div style={{ padding: 24 }}>
      <h2>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</h2>
      <form onSubmit={submit}>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 8, width: 260 }} />
        <button type="submit" style={{ marginLeft: 8, padding: 8 }}>Submit</button>
      </form>
      <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={{ marginTop: 12 }}>
        {mode === 'signin' ? 'Need an account? Sign Up' : 'Have an account? Sign In'}
      </button>
    </div>
  );
}

function Search({ onPlay, onAddToPlaylist }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const search = async (e) => {
    e.preventDefault();
    try {
      const res = await searchTracks(q);
      setItems(res.items);
    } catch (e) {
      alert(e.message);
    }
  };
  return (
    <div style={{ padding: 16 }}>
      <h3>Search</h3>
      <form onSubmit={search}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search Audius..." style={{ padding: 8, width: 300 }} />
        <button type="submit" style={{ marginLeft: 8, padding: 8 }}>Search</button>
      </form>
      <ul>
        {items.map(t => (
          <li key={t.id} style={{ margin: '8px 0' }}>
            <img alt="" src={t.artwork} style={{ width: 40, height: 40, objectFit: 'cover', verticalAlign: 'middle', marginRight: 8 }} />
            <strong>{t.title}</strong> — {t.artist}
            <div style={{ display: 'inline-block', marginLeft: 12 }}>
              <button onClick={() => onPlay(t)} style={{ marginRight: 8 }}>Play</button>
              <button onClick={() => onAddToPlaylist(t)}>Add to Playlist</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Playlists({ onAddTrack }) {
  const [items, setItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  
  useEffect(() => {
    const reload = async () => {
      try {
        const res = await listPlaylists();
        setItems(res.items);
      } catch (e) {
        console.error(e);
      }
    };
    reload();
  }, []);
  
  const create = async () => {
    if (!name) return;
    try {
      await createPlaylist(name, '');
      setName('');
      setCreating(false);
      const res = await listPlaylists();
      setItems(res.items);
    } catch (e) {
      alert(e.message);
    }
  };
  
  return (
    <div style={{ padding: 16 }}>
      <h3>Playlists</h3>
      {!creating && <button onClick={() => setCreating(true)}>New Playlist</button>}
      {creating && (
        <div>
          <input placeholder="Playlist name" value={name} onChange={e => setName(e.target.value)} style={{ padding: 6 }} />
          <button onClick={create} style={{ marginLeft: 8 }}>Create</button>
        </div>
      )}
      <ul>
        {items.map(p => <PlaylistItem key={p.id} playlist={p} onAddTrack={onAddTrack} />)}
      </ul>
    </div>
  );
}

function PlaylistItem({ playlist, onAddTrack }) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState(null);
  
  useEffect(() => {
    const load = async () => {
      const res = await getPlaylist(playlist.id);
      setDetails(res);
    };
    if (expanded) {
      load();
    }
  }, [expanded, playlist.id]);
  
  return (
    <li style={{ margin: '8px 0' }}>
      <button onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide' : 'Show'}</button>
      <strong style={{ marginLeft: 8 }}>{playlist.name}</strong>
      <button onClick={() => onAddTrack(playlist.id)} style={{ marginLeft: 8 }}>Add track from last search</button>
      {expanded && details && (
        <ul>
          {details.tracks.map(t => (
            <li key={t.id || `${t.playlist_id}_${t.track_id}`} style={{ margin: '4px 0' }}>
              {t.track_title} — {t.artist_name}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function PlayerBar({ current, onEnded }) {
  const audioRef = useRef(null);
  useEffect(() => {
    if (audioRef.current && current?.id) {
      audioRef.current.src = current.stream;
      audioRef.current.play().catch(() => {});
    }
  }, [current]);
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#f3f4f6', padding: 8, borderTop: '1px solid #e5e7eb' }}>
      <audio ref={audioRef} controls onEnded={onEnded} style={{ width: '100%' }} />
      {current && (
        <div style={{ marginTop: 4 }}>
          Playing: <strong>{current.title}</strong> — {current.artist}
        </div>
      )}
    </div>
  );
}

function Recently() {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    const reload = async () => {
      try {
        const res = await recentlyPlayed();
        setItems(res.items);
      } catch (e) {
        console.error(e);
      }
    };
    reload();
  }, []);
  
  return (
    <div style={{ padding: 16 }}>
      <h3>Recently Played</h3>
      <ul>
        {items.map(x => (
          <li key={x.id} style={{ margin: '6px 0' }}>
            {new Date(x.played_at).toLocaleString()} — {x.track_title} — {x.artist_name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MainApp() {
  const [lastSearched, setLastSearched] = useState([]);
  const [current, setCurrent] = useState(null);

  const handlePlay = async (t) => {
    const track = {
      id: t.id,
      title: t.title,
      artist: t.artist,
      artwork: t.artwork
    };
    const url = streamUrl(t.id);
    setCurrent({ ...track, stream: url });
    try {
      await logPlay({ id: t.id, title: t.title, artist: t.artist });
    } catch (e) {
      console.error(e);
    }
  };

  const onAddToPlaylist = (t) => {
    setLastSearched(prev => {
      const next = [t, ...prev.filter(p => p.id !== t.id)];
      return next.slice(0, 50);
    });
    alert('Select a playlist from the list and click "Add track from last search" to add the most recent searched track.');
  };

  const addTrackFromLastToPlaylist = async (playlistId) => {
    const t = lastSearched[0];
    if (!t) {
      alert('No last searched track.');
      return;
    }
    try {
      await addTrackToPlaylist(playlistId, {
        track_id: t.id, track_title: t.title, artist_name: t.artist, artwork_url: t.artwork
      });
      alert('Added track to playlist!');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: 24, padding: 16 }}>
        <div style={{ flex: 2 }}>
          <Search onPlay={handlePlay} onAddToPlaylist={onAddToPlaylist} />
          <Recently />
        </div>
        <div style={{ flex: 1, borderLeft: '1px solid #e5e7eb', paddingLeft: 16 }}>
          <Playlists onAddTrack={addTrackFromLastToPlaylist} />
        </div>
      </div>
      <PlayerBar current={current} onEnded={() => {}} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await getMe();
        setUser(res.user);
      } catch {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/"
          element={user ? <MainApp /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}
