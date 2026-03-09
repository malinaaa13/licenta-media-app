import { useState, useEffect } from 'react';
import axios from 'axios';

function Home() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/movies/popular");
        setMovies(response.data);
      } catch (error) {
        console.error("Error fetching movies:", error);
      }
    };
    fetchMovies();
  }, []);

  return (
    <div className="p-4 bg-light min-vh-100">
      <h2 className="text-center mb-4">Popular Movies</h2>
      <div className="d-flex flex-wrap gap-4 justify-content-center">
        {movies.map((movie) => (
          <div key={movie.id} className="card shadow-sm border-0" style={{ width: '200px' }}>
            <img 
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
              className="card-img-top rounded" 
              alt={movie.title} 
            />
            <div className="card-body">
              <h6 className="card-title text-truncate">{movie.title}</h6>
              <span className="badge bg-warning text-dark">⭐ {movie.vote_average.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;