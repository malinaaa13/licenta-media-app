import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';

function SearchResults() {
  const { query } = useParams(); // Gets the search term from the URL
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSearchResults = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:8080/api/media/movies/search/${query}`);
        setMovies(response.data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSearchResults();
  }, [query]); // Re-run this if the user searches for something else!

  return (
    <div>
      {/* Simple Navbar with Back Button */}
      <nav className="navbar nav-bg px-4 shadow-sm mb-4">
        <span className="navbar-brand mb-0 h1 fw-bold theme-link" style={{cursor: 'pointer'}} onClick={() => navigate('/home')}>
          ← Back to Home
        </span>
      </nav>

      <div className="container pb-5">
        <h2 className="text-center mb-4 text-light fw-bold">Search Results for: "{query}"</h2>

        {isLoading ? (
          <h4 className="text-center text-light mt-5">Searching...</h4>
        ) : movies.length === 0 ? (
          <h4 className="text-center text-light mt-5">No movies found. Try another search!</h4>
        ) : (
          <div className="d-flex flex-wrap gap-4 justify-content-center">
            {movies.map((movie) => (
              // Make sure to only show movies that actually have a poster image
              movie.poster_path && (
                <div key={movie.id} className="card shadow-sm border-0 card" style={{ width: '200px' }}>
                  <Link to={`/movie/${movie.id}`} className="text-decoration-none">
                    <img 
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                      className="card-img-top rounded-top" 
                      alt={movie.title} 
                      style={{ cursor: 'pointer' }}
                    />
                  </Link>
                  <div className="card-body d-flex flex-column">
                    <h6 className="card-title text-truncate" title={movie.title}>
                      {movie.title}
                    </h6>
                    <div className="mt-auto">
                      <span className="badge badge-bag text-dark">
                        ⭐ {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;