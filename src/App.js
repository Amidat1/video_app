import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function App() {
  const [videos, setVideos] = useState([]);
  const [userVideos, setUserVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentView, setCurrentView] = useState('feed'); // 'feed' or 'my-videos'
  
  useEffect(() => {
    // Check for saved user token
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      // Verify token by calling a protected endpoint
      fetch(`${API_URL}/api/users/me/videos`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Extract user from token or make another call to get user info
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          setUser(userData);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
    }
    
    fetchVideos();
  }, []);

  // Fetch user videos when user changes
  useEffect(() => {
    if (user) {
      fetchUserVideos();
    }
  }, [user]);

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/videos`);
      const data = await response.json();
      if (data.success) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVideos = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/me/videos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUserVideos(data.videos.filter(video => 
          video.creatorUsername === user.username || video.username === user.username
        ));
      }
    } catch (error) {
      console.error('Error fetching user videos:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setShowLogin(false);
      }
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  };

  const signup = async (email, username, password, role) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password, role }),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setShowSignup(false);
      }
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Signup failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentVideoIndex(0);
  };

  const uploadVideo = async (formData) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/videos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        fetchVideos(); // Refresh video list
        fetchUserVideos(); // Refresh user videos
        setShowUpload(false);
      }
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, message: 'Upload failed' };
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowUp' && currentVideoIndex > 0) {
        setCurrentVideoIndex(currentVideoIndex - 1);
      } else if (e.key === 'ArrowDown' && currentVideoIndex < videos.length - 1) {
        setCurrentVideoIndex(currentVideoIndex + 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentVideoIndex, videos.length, isPlaying]);

  // Show auth screen if no user
  if (!user) {
    return (
      <div className="tiktok-app">
        <div className="auth-overlay">
          <div className="auth-container">
            <h1 className="app-title">🎬 VideoShare</h1>
            <p className="app-subtitle">Watch and share amazing videos</p>
            
            <div className="auth-buttons">
              <button onClick={() => setShowLogin(true)} className="auth-btn login-btn">
                Login
              </button>
              <button onClick={() => setShowSignup(true)} className="auth-btn signup-btn">
                Sign Up
              </button>
            </div>
          </div>
        </div>

        {showLogin && (
          <AuthModal
            type="login"
            onClose={() => setShowLogin(false)}
            onAuth={login}
            onSwitchMode={() => {
              setShowLogin(false);
              setShowSignup(true);
            }}
          />
        )}

        {showSignup && (
          <AuthModal
            type="signup"
            onClose={() => setShowSignup(false)}
            onAuth={signup}
            onSwitchMode={() => {
              setShowSignup(false);
              setShowLogin(true);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="tiktok-app">
      {/* Top Header */}
      <div className="top-header">
        <div className="header-left">
          <h1 className="app-logo">🎬 VideoShare</h1>
        </div>
        <div className="header-center">
          <span 
            className={`nav-item ${currentView === 'feed' ? 'active' : ''}`}
            onClick={() => setCurrentView('feed')}
          >
            For You
          </span>
          {user && (
            <span 
              className={`nav-item ${currentView === 'my-videos' ? 'active' : ''}`}
              onClick={() => setCurrentView('my-videos')}
            >
              My Videos ({userVideos.length})
            </span>
          )}
        </div>
        <div className="header-right">
          <span className="user-info">Welcome, {user.username}!</span>
          {user.role === 'creator' && (
            <button onClick={() => setShowUpload(true)} className="upload-btn">
              + Upload
            </button>
          )}
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="video-container">
        {currentView === 'feed' ? (
          // Main Video Feed
          <>
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading videos...</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="no-videos">
                <div className="no-videos-icon">🎬</div>
                <p>No videos available</p>
                {user.role === 'creator' && (
                  <button onClick={() => setShowUpload(true)} className="upload-first-btn">
                    Upload the first video!
                  </button>
                )}
              </div>
            ) : (
              <div className="video-feed">
                {videos.map((video, index) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isActive={index === currentVideoIndex}
                    isPlaying={isPlaying}
                    onPlayToggle={() => setIsPlaying(!isPlaying)}
                  />
                ))}
              </div>
            )}

            {/* Navigation Dots for Feed */}
            {videos.length > 0 && (
              <div className="video-nav">
                {videos.map((_, index) => (
                  <div
                    key={index}
                    className={`nav-dot ${index === currentVideoIndex ? 'active' : ''}`}
                    onClick={() => setCurrentVideoIndex(index)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          // User Videos Dashboard
          <UserVideosDashboard 
            userVideos={userVideos}
            user={user}
            onUpload={() => setShowUpload(true)}
            onRefresh={fetchUserVideos}
          />
        )}
      </div>

      {showUpload && user && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUpload={uploadVideo}
        />
      )}
    </div>
  );
}

function VideoCard({ video, isActive, isPlaying, onPlayToggle }) {
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (isActive && videoRef.current && videoLoaded) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isActive, videoLoaded]);

  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setVideoError(false);
  };

  const handleVideoError = (e) => {
    console.error('Video load error:', e.target.error);
    setVideoError(true);
    setVideoLoaded(false);
  };

  const handleVideoCanPlay = () => {
    setVideoLoaded(true);
    setVideoError(false);
  };

  return (
    <div className={`video-card ${isActive ? 'active' : ''}`}>
      <div className="video-content">
        <div className="video-wrapper" onClick={onPlayToggle}>
          {videoError ? (
            <div className="video-error">
              <div className="error-icon">⚠️</div>
              <p>Video unavailable</p>
              <p className="error-title">{video.title}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="video-player"
                loop
                muted
                playsInline
                preload="metadata"
                onLoadedData={handleVideoLoad}
                onCanPlay={handleVideoCanPlay}
                onError={handleVideoError}
                crossOrigin="anonymous"
              >
                <source src={video.videoUrl || '#'} type="video/mp4" />
                <source src={video.videoUrl || '#'} type="video/webm" />
                <source src={video.videoUrl || '#'} type="video/ogg" />
                Your browser does not support the video tag.
              </video>
              
              {!videoLoaded && (
                <div className="video-loading">
                  <div className="spinner"></div>
                </div>
              )}
              
              {!isPlaying && isActive && videoLoaded && (
                <div className="play-overlay">
                  <div className="play-button">▶</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Minimal Video Info */}
        <div className="video-info">
          <h3 className="video-title">{video.title}</h3>
          <p className="video-creator">@{video.creatorUsername || video.username}</p>
          {video.description && (
            <p className="video-description">{video.description}</p>
          )}
        </div>

        {/* Minimal Actions */}
        <div className="side-actions">
          <div className="action-item">
            <div className="action-btn like-btn">❤️</div>
            <span className="action-count">{video.likes || 0}</span>
          </div>
          <div className="action-item">
            <div className="action-btn share-btn">📤</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ type, onClose, onAuth, onSwitchMode }) {
  const [email, setEmail] = useState(type === 'login' ? 'admin@videoshare.com' : '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(type === 'login' ? 'admin123' : '');
  const [role, setRole] = useState('consumer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    let result;
    if (type === 'login') {
      result = await onAuth(email, password);
    } else {
      result = await onAuth(email, username, password, role);
    }
    
    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="auth-header">
          <h2>{type === 'login' ? 'Welcome Back' : 'Join VideoShare'}</h2>
          <p>Watch and share amazing videos</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`tab ${type === 'login' ? 'active' : ''}`}
            onClick={type === 'signup' ? onSwitchMode : undefined}
          >
            Login
          </button>
          <button 
            className={`tab ${type === 'signup' ? 'active' : ''}`}
            onClick={type === 'login' ? onSwitchMode : undefined}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
          />
          
          {type === 'signup' && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
          />

          {type === 'signup' && (
            <div className="role-selector">
              <label>Account Type</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="form-select"
              >
                <option value="consumer">Consumer (Watch Videos)</option>
                <option value="creator">Creator (Upload Videos)</option>
              </select>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            disabled={loading} 
            className="submit-btn"
          >
            {loading 
              ? (type === 'login' ? 'Signing in...' : 'Creating account...')
              : (type === 'login' ? 'Sign In' : 'Create Account')
            }
          </button>
        </form>
      </div>
    </div>
  );
}

function UploadModal({ onClose, onUpload }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      setError('');
      
      // Create video preview
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      
      // Auto-generate title from filename if empty
      if (!title) {
        const filename = selectedFile.name.split('.')[0];
        setTitle(filename.replace(/[_-]/g, ' '));
      }
    } else {
      setError('Please select a valid video file');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a video file');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('genre', 'entertainment');

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 200);

    const result = await onUpload(formData);
    clearInterval(progressInterval);
    
    if (result.success) {
      setUploadProgress(100);
      setTimeout(() => {
        if (preview) URL.revokeObjectURL(preview);
        onClose();
      }, 1000);
    } else {
      setError(result.message);
      setUploadProgress(0);
    }
    setLoading(false);
  };

  const removeFile = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>Upload Video</h2>
        <form onSubmit={handleSubmit}>
          
          {/* File Upload Area */}
          <div 
            className={`file-upload-area ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            {file ? (
              <div className="file-preview">
                <video src={preview} className="video-thumbnail" muted />
                <div className="file-info">
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                  <button type="button" className="remove-file-btn" onClick={removeFile}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📹</div>
                <p>Drop your video here or click to browse</p>
                <p className="upload-hint">MP4, MOV, AVI up to 100MB</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden-file-input"
            style={{ display: 'none' }}
          />
          
          <input
            type="text"
            placeholder="Video title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="form-input"
            maxLength={100}
          />
          
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="form-input"
            maxLength={500}
          />
          
          {error && <div className="error-message">{error}</div>}
          
          {loading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="progress-text">{Math.round(uploadProgress)}% uploaded</p>
            </div>
          )}
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !file} className="submit-btn">
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserVideosDashboard({ userVideos, user, onUpload, onRefresh }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (url) => {
    // Mock duration for demo - in real app you'd get this from video metadata
    return '1:23';
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>My Videos</h2>
          <p>{userVideos.length} video{userVideos.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div className="dashboard-actions">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⊞
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
          </div>
          
          {user.role === 'creator' && (
            <button onClick={onUpload} className="upload-btn">
              + Upload New
            </button>
          )}
        </div>
      </div>

      {userVideos.length === 0 ? (
        <div className="empty-dashboard">
          <div className="empty-icon">📹</div>
          <h3>No videos yet</h3>
          <p>Upload your first video to get started</p>
          {user.role === 'creator' && (
            <button onClick={onUpload} className="upload-first-btn">
              Upload Video
            </button>
          )}
        </div>
      ) : (
        <div className={`videos-${viewMode}`}>
          {userVideos.map((video) => (
            <div key={video.id} className="user-video-card">
              <div className="video-thumbnail-container">
                <video 
                  className="video-thumbnail-preview" 
                  src={video.videoUrl}
                  muted
                />
                <div className="video-duration">{formatDuration(video.videoUrl)}</div>
                <div className="video-overlay">
                  <button className="play-btn">▶</button>
                </div>
              </div>
              
              <div className="video-details">
                <h4 className="video-title-dash">{video.title}</h4>
                <p className="video-meta">
                  {formatDate(video.createdAt)} • {video.likes || 0} likes
                </p>
                {video.description && (
                  <p className="video-desc">{video.description}</p>
                )}
                
                <div className="video-actions">
                  <button className="action-btn-small">Edit</button>
                  <button className="action-btn-small delete">Delete</button>
                  <button className="action-btn-small">Share</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;