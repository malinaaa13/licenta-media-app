import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

function Home() {
  const [movies, setMovies] = useState([]);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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


  return (
    <div>
      
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

