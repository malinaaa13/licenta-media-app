import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Home() {
  const [popularMovies, setPopularMovies] = useState([]);
  const [inProgressMovies, setInProgressMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));

  // Format the username securely to be lowercase and without spaces
  const formattedUsername = user?.username ? user.username.toLowerCase().replace(/\s+/g, '') : 'guest';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Popular Movies
        const popularRes = await axios.get("http://localhost:8080/api/media/movies/popular");
        setPopularMovies(popularRes.data);

        // 2. Fetch User's Library (if logged in)
        if (user) {
          const libraryRes = await axios.get(`http://localhost:8080/api/media/user/${user.id}/library`);
          
          // Filter to only keep the "in progress" items
          const inProgress = libraryRes.data.filter(item => item.status === 'in progress');
          setInProgressMovies(inProgress);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  if (isLoading) return <h2 className="text-center text-light mt-5">Loading your dashboard...</h2>;

  return (
    <div className="container pb-5 mt-4">
      
      {/* The Custom Greeting */}
      <h2 className="text-light fw-bold mb-5">
        Welcome back, <span className="text-info">{formattedUsername}</span>
      </h2>

      {/* --- ROW 1: IN PROGRESS --- */}
      {user && (
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-end mb-3">
            <h4 className="text-light fw-bold mb-0">In Progress</h4>
            {/* We pass a 'state' object to tell the Collections page to open the 'in progress' tab */}
            <Link to="/collections" state={{ targetTab: 'in progress' }} className="text-info text-decoration-none small fw-bold">
              See More →
            </Link>
          </div>
          
          {inProgressMovies.length === 0 ? (
            <p className="text-muted">You have no movies currently in progress.</p>
          ) : (
            // ✨ MODIFIED: Changed overflow-auto to overflow-hidden
            <div className="d-flex overflow-hidden gap-4 pb-3">
              {inProgressMovies.map((item) => (
                <div key={item._id} className="card shadow-sm border-0 bg-transparent flex-shrink-0" style={{ width: '160px' }}>
                  <Link to={`/movie/${item.mediaId.externalId}`} className="text-decoration-none">
                    <img 
                      src={`https://image.tmdb.org/t/p/w500${item.mediaId.posterPath}`} 
                      className="card-img-top rounded shadow" 
                      alt={item.mediaId.title} 
                      style={{ transition: 'transform 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  </Link>
                  <div className="mt-2 text-center">
                    <h6 className="text-light text-truncate mb-0" title={item.mediaId.title}>{item.mediaId.title}</h6>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- ROW 2: POPULAR MOVIES --- */}
      <div>
        <div className="d-flex justify-content-between align-items-end mb-3">
          <h4 className="text-light fw-bold mb-0">Popular Movies</h4>
          {/* Links to a dedicated page for all popular movies */}
          <Link to="/popular" className="text-info text-decoration-none small fw-bold">
            See More →
          </Link>
        </div>

        {/* ✨ MODIFIED: Changed overflow-auto to overflow-hidden */}
        <div className="d-flex overflow-hidden gap-4 pb-3">
          {popularMovies.map((movie) => (
            movie.poster_path && (
              <div key={movie.id} className="card shadow-sm border-0 bg-transparent flex-shrink-0" style={{ width: '160px' }}>
                <Link to={`/movie/${movie.id}`} className="text-decoration-none">
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                    className="card-img-top rounded shadow" 
                    alt={movie.title} 
                    style={{ transition: 'transform 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </Link>
                <div className="mt-2 text-center">
                  <h6 className="text-light text-truncate mb-0" title={movie.title}>{movie.title}</h6>
                  <span className="badge badge-bag text-dark mt-1">⭐ {movie.vote_average?.toFixed(1)}</span>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

    </div>
  );
}

export default Home;