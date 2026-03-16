import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';
import { PiStarFourDuotone } from "react-icons/pi";

function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  // Hide the navbar entirely if the user is on the Login or Register pages
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // The Live Search Engine (Now works globally!)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const response = await axios.get(`http://localhost:8080/api/media/movies/search/${searchQuery}`);
          setSearchResults(response.data);
        } catch (error) {
          console.error("Error fetching search results:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <>
      <nav className="navbar nav-bg px-4 shadow-sm mb-4 d-flex align-items-center">
        {/* Brand Logo */}
        <span className="navbar-brand mb-0 h4 fw-bold text-info me-4" style={{ cursor: 'pointer' }} onClick={() => navigate('/home')}>
         <PiStarFourDuotone className='text-light'/> Muser  <PiStarFourDuotone className='text-light'/> 
        </span>
        
        {/* ✨ THE FIX: We use 'd-flex gap-4' to add perfect spacing between the links! */}
        <div className="d-flex align-items-center gap-4">
          <Link to="/home" className="text-light text-decoration-none fw-bold fs-5 theme-link">Home</Link>
          <Link to="/collections" className="text-light text-decoration-none fw-bold fs-5 theme-link">Collections</Link>
        </div>

        {/* Search and User Info on the Right */}
        <div className="d-flex align-items-center ms-auto gap-3">
          
          <div className="d-flex align-items-center">
            {!isSearchExpanded ? (
              <FaSearch 
                onClick={() => setIsSearchExpanded(true)} 
                className="text-light fs-5 me-3" 
                style={{ cursor: 'pointer', transition: '0.3s' }} 
              />
            ) : (
              <div className="d-flex align-items-center me-3 position-relative">
                <input
                  type="text"
                  autoFocus
                  className="form-control form-control-sm rounded-pill pe-4"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '250px', backgroundColor: 'rgba(255,255,255,0.9)' }}
                />
                <button 
                  className="btn btn-sm text-dark position-absolute border-0" 
                  style={{ right: '5px', background: 'transparent' }} 
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchExpanded(false);
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {user && <span className="text-light fw-bold">{user.username}</span>}
          <button onClick={handleLogout} className="btn btn-outline-info btn-sm fw-bold">
            Log Out
          </button>
        </div>
      </nav>

      {/* The Global Search Overlay */}
      {searchQuery.trim().length > 1 && (
        <div 
          className="search-overlay position-fixed w-100 h-100" 
          style={{
            top: '70px', left: 0,
            backgroundColor: 'rgba(10, 25, 31, 0.95)', backdropFilter: 'blur(5px)',
            zIndex: 1050, overflowY: 'auto', paddingBottom: '100px'
          }}
        >
          <div className="container mt-5">
            <h3 className="text-light fw-bold mb-4">Search Results for "{searchQuery}"</h3>
            {isSearching ? (
              <h5 className="text-info">Searching...</h5>
            ) : searchResults.length === 0 ? (
              <h5 className="text-muted">No movies found.</h5>
            ) : (
              <div className="d-flex flex-wrap gap-4 justify-content-start">
                {searchResults.map((movie) => (
                  movie.poster_path && (
                    <div key={movie.id} className="card shadow-sm border-0 bg-transparent" style={{ width: '180px' }}>
                      <Link 
                        to={`/movie/${movie.id}`} 
                        className="text-decoration-none"
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchExpanded(false);
                        }}
                      >
                        <img 
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                          className="card-img-top rounded shadow" 
                          alt={movie.title} 
                          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      </Link>
                      <div className="mt-2 text-center">
                        <h6 className="text-light text-truncate mb-1">{movie.title}</h6>
                        <span className="badge bg-warning text-dark">⭐ {movie.vote_average?.toFixed(1) || "N/A"}</span>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;