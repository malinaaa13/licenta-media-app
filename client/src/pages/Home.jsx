import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

function Home() {
  const [movies, setMovies] = useState([]);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false); 
  const [suggestions, setSuggestions] = useState([]);


  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/media/movies/popular");
        setMovies(response.data);
      } catch (error) {
        console.error("Error fetching movies:", error);
      }
    };
    fetchMovies();
  }, []);


  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) { // Only search if they typed at least 2 letters
        try {
          const response = await axios.get(`http://localhost:8080/api/media/movies/search/${searchQuery}`);
          // We only take the top 5 results for the little dropdown menu
          setSuggestions(response.data.slice(0, 5)); 
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      } else {
        setSuggestions([]); // Clear suggestions if the box is empty
      }
    }, 500); // Wait 500ms after the user stops typing

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div>
      
      <nav className="navbar nav-bg px-4 shadow-sm mb-4 d-flex justify-content-between align-items-center">
        {/* Brand on the Left */}
        <span className="navbar-brand mb-0 h1 fw-bold theme-link">Muser</span>
        
        {/* Everything else grouped on the Right */}
        <div className="d-flex align-items-center gap-3 ms-auto">
          
          {/* Expandable Search Container */}
          <div style={{ position: 'relative' }}>
            
            {!isSearchExpanded ? (
              // 1. The Magnifying Glass Icon
              <FaSearch 
                onClick={() => setIsSearchExpanded(true)} 
                className="text-light fs-5" 
                style={{ cursor: 'pointer', transition: '0.3s' }} 
              />
            ) : (
              // 2. The Input Field (Appears when clicked)
              <input
                type="text"
                autoFocus // Automatically puts the blinking cursor inside
                className="form-control form-control-sm rounded-pill"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                // If they click away, hide the search bar (delayed slightly so links still work)
                onBlur={() => setTimeout(() => setIsSearchExpanded(false), 200)} 
                style={{ width: '250px', backgroundColor: 'rgba(255,255,255,0.9)' }}
              />
            )}

            {isSearchExpanded && suggestions.length > 0 && (
              <div 
                className="list-group position-absolute shadow mt-2" 
                style={{ top: '100%', right: '0', width: '300px', zIndex: 1000 }}
                
                onMouseDown={(e) => e.preventDefault()} 
              >
                {suggestions.map((movie) => (
                  <Link 
                    key={movie.id} 
                    to={`/movie/${movie.id}`} 
                    
                    onClick={() => {
                      setIsSearchExpanded(false);
                      setSearchQuery(''); 
                    }} 
                    
                    className="list-group-item list-group-item-action d-flex align-items-center gap-2"
                  >
                    {movie.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} 
                        alt={movie.title} 
                        style={{ width: '40px', borderRadius: '4px' }} 
                      />
                    ) : (
                      <div style={{ width: '40px', height: '60px', backgroundColor: '#ccc', borderRadius: '4px' }}></div>
                    )}
                    <div className="text-truncate">
                      <strong className="d-block text-truncate">{movie.title}</strong>
                      <small className="text-muted">{movie.release_date?.split('-')[0]}</small>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
          </div>

          {user && <span className="text-light fw-bold ms-3">{user.username}</span>}
          <button onClick={handleLogout} className="btn btn-outline-info btn-sm fw-bold">
            Log Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container pb-5">
        <h2 className="text-center mb-4 text-light fw-bold">Popular Movies</h2>

        <div className="d-flex flex-wrap gap-4 justify-content-center">
          {movies.map((movie) => (
            <div key={movie.id} className="card shadow-sm border-0 card" style={{ width: '200px' }}>
              <Link to={`/movie/${movie.id}`} className="text-decoration-none">
              <img 
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                className="card-img-top rounded-top" 
                alt={movie.title} 
              />
              </Link>
              <div className="card-body d-flex flex-column">
                <h6 className="card-title movie-title-color text-truncate" title={movie.title}>
                  {movie.title}
                </h6>
                <div className="mt-auto">
                  <span className="badge badge-bag text-dark">
                    ⭐ {movie.vote_average.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Home;

