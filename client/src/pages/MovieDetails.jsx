import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { IoMdTime } from "react-icons/io";
import { BsHourglassSplit } from "react-icons/bs";
import { FaBookmark } from "react-icons/fa";

function MovieDetails() {
  const { id } = useParams(); // Prinde ID-ul din link (ex: localhost:5173/movie/550)
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  
  // Stările pentru butoanele tale speciale
  const [status, setStatus] = useState(''); // 'in_progress', 'saved', 'finished'
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/media/movies/${id}`);
        setMovie(response.data);
      } catch (error) {
        console.error("Error fetching details:", error);
      }
    };
    fetchDetails();
  }, [id]);

  if (!movie) return <h2 className="text-center text-white mt-5">Loading...</h2>;

  return (
    <div>
      {/* Bara de navigație simplă pentru a ne întoarce */}
      <nav className="navbar nav-bg px-4 shadow-sm mb-4">
        <span className="navbar-brand mb-0 h1 fw-bold theme-link" style={{cursor: 'pointer'}} onClick={() => navigate('/home')}>
          ← Back to Home
        </span>
      </nav>

      <div className="container pb-5">
        <div className="row mt-4">
          
          {/* 1. LEFT COLUMN: Just the Poster (Takes up 3/12 spaces on large screens) */}
          <div className="col-lg-3 col-md-4 mb-4">
            <img 
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
              alt={movie.title} 
              className="img-fluid rounded shadow w-100"
            />
          </div>

          {/* 2. MIDDLE COLUMN: Movie Details (Takes up 6/12 spaces) */}
          <div className="col-lg-6 col-md-8 mb-4">
            <h1 className="fw-bold mb-1">{movie.title}</h1>
            
            <div className="d-flex gap-3 mb-4" style={{ color: 'var(--text-primary)'}}>
              <span className="d-flex align-items-center">
                {movie.release_date?.split('-')[0]}
                </span>
              <span className="d-flex align-items-center">
                <IoMdTime text-light/> 
                {movie.runtime} min
                </span>
              <span className="badge badge-bag text-dark">⭐ {movie.vote_average?.toFixed(1)} / 10</span>
            </div>

            <div className="mb-4">
              {movie.genres?.map(genre => (
                <span key={genre.id} className="badge bg-secondary me-2">{genre.name}</span>
              ))}
            </div>

            {movie.tagline && <h5 className="fst-italic text-info mb-3">"{movie.tagline}"</h5>}

            <h4 className="fw-bold mt-4">Overview</h4>
            <p className="fs-5" style={{ lineHeight: '1.6' }}>{movie.overview}</p>
          </div>

          {/* 3. RIGHT COLUMN: Action Bar (Takes up 3/12 spaces) */}
          {/* Moved from the left to the right! */}
          <div className="col-lg-3 col-md-12">
            <div className="card p-3 shadow-sm border-0" style={{ backgroundColor: 'var(--bg-card)' }}>
              
              {/* 1. Status Buttons */}
              <div className="d-flex justify-content-between mb-3">
                <button 
                  onClick={() => setStatus('in_progress')}
                  className={`btn btn-sm ${status === 'in_progress' ? 'btn-info text-dark' : 'btn-outline-info'}`}>
                  <BsHourglassSplit text-light/> In Progress
                </button>
                <button 
                  onClick={() => setStatus('saved')}
                  className={`btn btn-sm ${status === 'saved' ? 'btn-info text-dark' : 'btn-outline-info'}`}>
                  <FaBookmark text-light/> Save
                </button>
                <button 
                  onClick={() => setStatus('finished')}
                  className={`btn btn-sm ${status === 'finished' ? 'btn-info text-dark' : 'btn-outline-info'}`}>
                  ✓ Finished
                </button>
              </div>

              <hr className="border-secondary" />

              {/* 2. Rating */}
              <div className="text-center mb-3">
                <span className="d-block mb-1 fw-bold text-light">Rate this:</span>
                <div className="fs-4" style={{ cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      onClick={() => setRating(star)}
                      className={star <= rating ? "text-warning" : "text-secondary"}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <hr className="border-secondary" />

              {/* 3. Review Box */}
              <div>
                <label className="fw-bold mb-1 text-light">Write a Review:</label>
                <textarea 
                  className="form-control mb-3" 
                  rows="4" 
                  placeholder="What did you think?"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                ></textarea>
                <button className="btn btn-info w-100 fw-bold">Post Review</button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MovieDetails;