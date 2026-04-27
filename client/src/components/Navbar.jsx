import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';
import { PiStarFourDuotone } from "react-icons/pi";
import NotificationDropdown from './NotificationDropdown';

function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

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
          setSearchResults(response.data.slice(0,5));
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

    if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
    return null;
  }

  return (
    <nav className="navbar nav-bg px-4 shadow-sm mb-4 d-flex align-items-center">
      {/* Brand Logo */}
      <span className="navbar-brand mb-0 h4 fw-bold text-info me-4" style={{ cursor: 'pointer' }} onClick={() => navigate('/home')}>
        <PiStarFourDuotone className='text-light'/> Muser  <PiStarFourDuotone className='text-light'/> 
      </span>
      
      {/* Links */}
      <div className="d-flex align-items-center gap-4">
        <Link to="/home" className="text-light text-decoration-none fw-bold fs-5 theme-link">Home</Link>
        <Link to="/collections" className="text-light text-decoration-none fw-bold fs-5 theme-link">Collections</Link>
        <Link to="/lists" className="text-light text-decoration-none fw-bold fs-5 theme-link">Lists</Link>
        <Link to="/friends" className="text-light text-decoration-none fw-bold fs-5 theme-link">Friends</Link>
      </div>

      {/* Search and User Info on the Right */}
      <div className="d-flex align-items-center ms-auto gap-3">
        
        {/* The Search Container */}
        <div className="d-flex align-items-center position-relative">
          {!isSearchExpanded ? (
            <FaSearch 
              onClick={() => setIsSearchExpanded(true)} 
              className="text-light fs-5 me-3" 
              style={{ cursor: 'pointer', transition: '0.3s' }} 
            />
          ) : (
            <div className="d-flex align-items-center me-3">
              <input
                type="text"
                autoFocus
                className="form-control form-control-sm rounded-pill pe-4"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setTimeout(() => setIsSearchExpanded(false), 200)}
                style={{ width: '250px', backgroundColor: 'rgba(255,255,255,0.9)' }}
              />
              <button 
                className="btn btn-sm text-dark position-absolute border-0" 
                style={{ right: '15px', background: 'transparent' }} 
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchExpanded(false);
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* THE COMPACT DROPDOWN MENU */}
          {isSearchExpanded && searchResults.length > 0 && (
            <div 
              className="list-group position-absolute shadow mt-2" 
              style={{ top: '100%', right: '15px', width: '300px', zIndex: 1000 }}
              onMouseDown={(e) => e.preventDefault()} 
            >
              {searchResults.map((movie) => (
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
        {/* User Profile & Logout */}
        {user && (
          <div className="d-flex align-items-center gap-3 ms-3 border-start border-secondary ps-3">
            <Link 
              to="/profile" 
              className="text-decoration-none d-flex align-items-center gap-2"
              style={{ transition: 'opacity 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              <img 
                src={user.profilePicture || "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"} 
                alt="Profile" 
                className="rounded-circle border border-info bg-white" 
                style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
              />
              <span className="text-light fw-bold">{user.username}</span>
            </Link>
            <NotificationDropdown />
            
            <button onClick={handleLogout} className="btn btn-outline-info btn-sm fw-bold">
              Log Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;