import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function PopularMovies() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/media/movies/popular");
        setMovies(response.data);
      } catch (error) {
        console.error("Error fetching popular movies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopular();
  }, []);

  if (isLoading) return <h2 className="text-center text-light mt-5">Loading...</h2>;

  return (
    <div className="container pb-5 mt-4">
      <h2 className="text-light fw-bold mb-4">Popular Movies</h2>

      <div className="d-flex flex-wrap gap-4 pb-3">
        {movies.map((movie) => (
          movie.poster_path && (
            <div key={movie.id} className="card shadow-sm border-0 bg-transparent" style={{ width: '160px' }}>
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
  );
}

export default PopularMovies;