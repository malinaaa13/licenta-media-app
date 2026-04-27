import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';

function EditList() {
  const navigate = useNavigate();
  const { listId } = useParams(); // ✨ NOU: Extragem ID-ul listei din URL
  const user = JSON.parse(localStorage.getItem('user'));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Aducem datele listei la încărcarea paginii
  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/lists/${listId}`);
        setTitle(res.data.title);
        setDescription(res.data.description);
        setSelectedMovies(res.data.movies);
        setVisibility(res.data.visibility);
      } catch (error) {
        console.error("Error fetching list:", error);
      }
    };
    fetchList();
  }, [listId]);

  // 2. Motorul de căutare live pentru adăugarea altor filme
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

  const handleAddMovie = (movie) => {
    if (selectedMovies.some(m => m.tmdbId === movie.id.toString())) {
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    const newMovie = {
      tmdbId: movie.id.toString(),
      title: movie.title,
      posterPath: movie.poster_path
    };

    setSelectedMovies([...selectedMovies, newMovie]);
    setSearchQuery(''); 
    setSearchResults([]);
  };

  const handleRemoveMovie = (tmdbId) => {
    setSelectedMovies(selectedMovies.filter(movie => movie.tmdbId !== tmdbId));
  };

  const handleSaveList = async () => {
    if (!title.trim()) return alert("Please enter a title for your list.");
    if (selectedMovies.length === 0) return alert("Please add at least one movie to your list.");

    setIsSubmitting(true);
    
    try {
      // ✨ Folosim PUT pentru a updata
      await axios.put(`http://localhost:8080/api/lists/${listId}`, {
        title: title,
        description: description,
        creator: user.id,
        movies: selectedMovies,
        visibility: visibility
      });

      // După salvare, ne întoarcem direct la pagina listei
      navigate(`/list/${listId}`);
    } catch (error) {
      console.error("Error updating list:", error);
      alert("There was an error updating your list.");
      setIsSubmitting(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container mt-5 pb-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card bg-dark border-secondary shadow p-4 text-light">
            <h2 className="fw-bold text-warning mb-4">Edit List</h2>

            {/* List Details */}
            <div className="mb-3">
              <label className="form-label fw-bold">List Name</label>
              <input 
                type="text" 
                className="form-control bg-secondary text-light border-dark" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label className="form-label fw-bold">Description</label>
              <textarea 
                className="form-control bg-secondary text-light border-dark" 
                rows="3" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">Privacy Setting</label>
              <select 
                className="form-select bg-secondary text-light border-dark"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="public">🌐 Public (Anyone can search and find this list)</option>
                <option value="unlisted">🔗 Unlisted (Only people with the exact link can see it)</option>
                <option value="private">🔒 Private (Only you can see this list)</option>
              </select>
            </div>

            <hr className="border-secondary mb-4" />

            {/* Movie Search Area */}
            <h5 className="fw-bold mb-3">Add Movies</h5>
            <div className="position-relative mb-4">
              <div className="input-group">
                <span className="input-group-text bg-secondary border-dark text-light"><FaSearch /></span>
                <input 
                  type="text" 
                  className="form-control bg-secondary text-light border-dark" 
                  placeholder="Search for a movie to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="list-group position-absolute w-100 shadow mt-1" style={{ zIndex: 1000 }}>
                  {searchResults.map((movie) => (
                    <button 
                      key={movie.id} 
                      type="button"
                      className="list-group-item list-group-item-action bg-dark text-light border-secondary d-flex align-items-center gap-3"
                      onClick={() => handleAddMovie(movie)}
                    >
                      {movie.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt="poster" style={{ width: '30px' }} />
                      ) : (
                        <div style={{ width: '30px', height: '45px', backgroundColor: '#444' }}></div>
                      )}
                      <span><strong>{movie.title}</strong> <small className="text-muted">({movie.release_date?.split('-')[0]})</small></span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Movies Staging Area */}
            <div className="d-flex flex-wrap gap-3 mb-4 p-3 rounded border border-secondary" style={{ minHeight: '150px', backgroundColor: '#2a2a2a' }}>
              {selectedMovies.length === 0 ? (
                <p className="text-muted w-100 text-center mt-4">No movies added yet.</p>
              ) : (
                selectedMovies.map((movie, index) => (
                  <div key={movie.tmdbId} className="position-relative" style={{ width: '100px' }}>
                    <img 
                      src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`} 
                      alt={movie.title} 
                      className="img-fluid rounded shadow-sm"
                    />
                    <div className="mt-1 text-center text-truncate small">{index + 1}. {movie.title}</div>
                    
                    <button 
                      className="btn btn-danger btn-sm position-absolute rounded-circle p-1 d-flex justify-content-center align-items-center shadow"
                      style={{ top: '-10px', right: '-10px', width: '24px', height: '24px' }}
                      onClick={() => handleRemoveMovie(movie.tmdbId)}
                      title="Remove"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Submit Button */}
            <button 
              className="btn btn-warning w-100 fw-bold py-2 text-dark" 
              onClick={handleSaveList}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update List'}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default EditList;