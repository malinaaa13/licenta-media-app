import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

// ✨ NOU: Avatarul clasic, standard (silueta gri)
const DEFAULT_AVATAR = "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(user?.bio || "I love movies!");
  
  // ✨ Folosim noul avatar default dacă user-ul nu are poză
  const [editPic, setEditPic] = useState(user?.profilePicture || DEFAULT_AVATAR);
  
  const initialFavs = user?.favorites?.length ? user.favorites : [null, null, null, null];
  while(initialFavs.length < 4) initialFavs.push(null);
  
  const [editFavorites, setEditFavorites] = useState(initialFavs);
  const [activeSlot, setActiveSlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        try {
          const response = await axios.get(`http://localhost:8080/api/media/movies/search/${searchQuery}`);
          setSearchResults(response.data.slice(0, 5));
        } catch (error) {
          console.error("Error searching movies:", error);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // ✨ NOU: Funcția care procesează imaginea încărcată
  const handleImageUpload = (e) => {
    const file = e.target.files[0]; // Prinde fișierul selectat
    if (file) {
      // Opțional: Verificăm mărimea (ex: maxim 2MB) ca să nu blocăm baza de date
      if (file.size > 2 * 1024 * 1024) {
        alert("Imaginea este prea mare! Te rugăm să alegi o imagine sub 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // Când a terminat de citit, setăm rezultatul (un string Base64) ca poză
        setEditPic(reader.result);
      };
      reader.readAsDataURL(file); // Transformă imaginea în text
    }
  };

  const handleSelectMovie = (movie) => {
    const newFavs = [...editFavorites];
    newFavs[activeSlot] = {
      tmdbId: movie.id.toString(),
      title: movie.title,
      posterPath: movie.poster_path
    };
    setEditFavorites(newFavs);
    setActiveSlot(null);
    setSearchQuery('');
  };

  const handleRemoveMovie = (index) => {
    const newFavs = [...editFavorites];
    newFavs[index] = null;
    setEditFavorites(newFavs);
  };

  const handleSaveProfile = async () => {
    try {
      const cleanFavorites = editFavorites.filter(movie => movie !== null);

      await axios.put(`http://localhost:8080/api/users/${user.id}/profile`, {
        profilePicture: editPic,
        bio: editBio,
        favorites: cleanFavorites
      });

      const updatedUser = { ...user, profilePicture: editPic, bio: editBio, favorites: cleanFavorites };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to update profile.");
    }
  };

  if (!user) return null;

  return (
    <div className="container mt-5 pb-5">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10">
          
          {/* --- HEADER-UL PROFILULUI --- */}
          <div className="card bg-dark border-secondary shadow-lg text-light p-4 mb-5">
            <div className="d-flex flex-column flex-md-row align-items-center gap-4">
              
              <img 
                src={isEditing ? editPic : (user.profilePicture || DEFAULT_AVATAR)} 
                alt="Profile Avatar" 
                className="rounded-circle border border-3 border-info shadow bg-white"
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />

              <div className="flex-grow-1 w-100 text-center text-md-start">
                <h2 className="fw-bold text-info mb-1">@{user.username}</h2>
                <p className="text-muted small mb-3">Cinephile</p>

                {!isEditing ? (
                  <>
                    <p className="fs-5" style={{ whiteSpace: 'pre-wrap' }}>{user.bio || "I love movies!"}</p>
                    <button className="btn btn-outline-info btn-sm fw-bold mt-2" onClick={() => setIsEditing(true)}>
                      ✎ Edit Profile
                    </button>
                  </>
                ) : (
                  <div className="bg-secondary bg-opacity-25 p-3 rounded">
                    
                    {/* ✨ NOU: Input-ul pentru Upload fișiere */}
                    <label className="small fw-bold mb-1">Profile Picture (Browse or Drag & Drop)</label>
                    <input 
                      type="file" 
                      accept="image/*" // Permite doar imagini
                      className="form-control form-control-sm mb-3 bg-dark text-light border-secondary" 
                      onChange={handleImageUpload}
                    />
                    
                    <label className="small fw-bold mb-1">About Me</label>
                    <textarea 
                      className="form-control form-control-sm mb-3 bg-dark text-light border-secondary" 
                      rows="3" 
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                    ></textarea>
                    
                    <div className="d-flex gap-2">
                      <button className="btn btn-info btn-sm fw-bold" onClick={handleSaveProfile}>Save Changes</button>
                      <button className="btn btn-outline-light btn-sm" onClick={() => {
                        setIsEditing(false);
                        setActiveSlot(null);
                        setEditPic(user.profilePicture || DEFAULT_AVATAR); // Reset la vechea poză dacă dă cancel
                      }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- TOP 4 FAVORITES --- */}
          <h3 className="text-light fw-bold mb-4 border-bottom border-secondary pb-2">Top 4 Favorites</h3>
          
          <div className="d-flex justify-content-between gap-3 mb-5">
            {editFavorites.map((favMovie, index) => (
              <div key={index} className="position-relative" style={{ width: '23%', aspectRatio: '2/3' }}>
                
                {favMovie ? (
                  <div className="h-100 w-100 position-relative group">
                    <Link to={!isEditing ? `/movie/${favMovie.tmdbId}` : "#"}>
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${favMovie.posterPath}`} 
                        alt={favMovie.title} 
                        className={`rounded shadow w-100 h-100 ${isEditing ? 'opacity-50' : ''}`}
                        style={{ objectFit: 'cover', transition: '0.2s' }}
                      />
                    </Link>
                    
                    {isEditing && (
                      <button 
                        className="btn btn-danger btn-sm position-absolute top-50 start-50 translate-middle rounded-circle shadow"
                        style={{ width: '40px', height: '40px' }}
                        onClick={() => handleRemoveMovie(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : (
                  <div 
                    className={`h-100 w-100 rounded border border-2 border-secondary d-flex justify-content-center align-items-center ${isEditing ? 'bg-dark' : 'bg-transparent'}`}
                    style={{ borderStyle: 'dashed !important', cursor: isEditing ? 'pointer' : 'default' }}
                    onClick={() => isEditing && setActiveSlot(index)}
                  >
                    {isEditing ? <span className="fs-1 text-secondary">+</span> : <span className="text-secondary">Empty</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {isEditing && activeSlot !== null && (
            <div className="card bg-dark border-info shadow p-3 mb-5">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="text-info fw-bold">Search for a movie for Slot {activeSlot + 1}:</label>
                <button className="btn btn-sm btn-outline-secondary py-0" onClick={() => setActiveSlot(null)}>Close</button>
              </div>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Type movie name..." 
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              {searchResults.length > 0 && (
                <div className="list-group mt-2 shadow-sm">
                  {searchResults.map((movie) => (
                    <button 
                      key={movie.id} 
                      className="list-group-item list-group-item-action bg-secondary text-light d-flex align-items-center gap-3 border-dark"
                      onClick={() => handleSelectMovie(movie)}
                    >
                      {movie.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt="poster" style={{ width: '30px' }} />
                      ) : (
                        <div style={{ width: '30px', height: '45px', backgroundColor: '#333' }}></div>
                      )}
                      <span><strong>{movie.title}</strong> <small className="text-light opacity-75">({movie.release_date?.split('-')[0]})</small></span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Profile;