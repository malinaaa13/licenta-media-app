import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  const [isPhysical, setIsPhysical] = useState(false);
  const [physicalFormat, setPhysicalFormat] = useState('none');
  const [physicalCondition, setPhysicalCondition] = useState('none');
  const [publicReviews, setPublicReviews] = useState([]);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(3);
  const [similarMovies, setSimilarMovies ] = useState([]);

  const user = JSON.parse(localStorage.getItem('user'));

const fetchPublicReviews = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/media/movies/${id}/reviews`);
      setPublicReviews(response.data);
    } catch (error) {
      console.error("Error fetching public reviews: ", error);
    }
  };

const fetchSimilarMovies = async () => {
  try {
    const response = await axios.get(`http://localhost:8080/api/media/movies/${id}/similar`);
    setSimilarMovies(response.data.slice(0,8));
  } catch(error) {
    console.error("Error fetching similar movies: ", error);
  }
}

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setStatus('');
        setRating(0);
        setReview('');
        setIsPhysical(false);
        setPhysicalFormat('none');
        setPhysicalCondition('none');

        // Fetch the general movie details from TMDB
        const response = await axios.get(`http://localhost:8080/api/media/movies/${id}`);
        setMovie(response.data);

        // 2. NEW: If the user is logged in, check if they already saved this movie
        if (user) {
          const userMediaResponse = await axios.get(`http://localhost:8080/api/media/user/${user.id}/movie/${id}`);
          
          // If the database found a record, update the buttons, stars, and text box!
          if (userMediaResponse.data) {
            setStatus(userMediaResponse.data.status || '');
            setRating(userMediaResponse.data.rating || 0);
            //setReview(userMediaResponse.data.reviewText || '');
            setIsPhysical(userMediaResponse.data.isPhysical || false);
            setPhysicalFormat(userMediaResponse.data.format || 'none');
            setPhysicalCondition(userMediaResponse.data.physicalStatus || 'none');
          }
        }
      } catch (error) {
        console.error("Error fetching details:", error);
      }
    };
    
    fetchDetails();
    fetchPublicReviews();
    fetchSimilarMovies();
    setVisibleReviewsCount(3);
  }, [id, user?.id]); // Note: We only trigger this when the movie ID changes


const handleSaveInteraction = async () => {
    if (!user) {
      alert("Please log in to save your review!");
      return;
    }

    setStatus('finished');

    try {
      const response = await axios.post("http://localhost:8080/api/media/update", {
        userId: user.id,
        externalId: movie.id.toString(),
        title: movie.title,
        posterPath: movie.poster_path,
        releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
        description: movie.overview,
        creator: movie.director, // We send the director we found earlier!
        status: "finished",
        rating: rating, 
        reviewText: review, // Matches your schema field name
        isPhysical: isPhysical,
        format: physicalFormat,
        physicalStatus: physicalCondition
      });
      
      alert("Review posted and movie marked as Finished"); 
      setReview('');
      fetchPublicReviews();
    } catch (error) {
      console.error("Error saving data:", error);
      alert("There was an error saving your data.");
    }
  };

  // NEW: This function runs instantly when a status button is clicked
  const handleStatusUpdate = async (newStatus) => {
    if (!user) {
      alert("Please log in to save to your lists!");
      return;
    }

    // Instantly update the UI so it feels fast
    setStatus(newStatus);

    try {
      await axios.post("http://localhost:8080/api/media/update", {
        userId: user.id,
        externalId: movie.id.toString(),
        title: movie.title,
        posterPath: movie.poster_path,
        releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
        description: movie.overview,
        creator: movie.director,
        status: newStatus, // We send the specific button they just clicked
        // We also send the current rating/review so they don't get accidentally erased
        rating: rating, 
        reviewText: review 
      });
      
      // Optional: You can remove this alert if you want it to be a silent, seamless save
      // alert(`Movie moved to ${newStatus}`); 
    } catch (error) {
      console.error("Error updating status:", error);
      alert("There was an error saving your status.");
    }
  };

  const handleRatingUpdate = async (newStarValue) => {
    if (!user) {
      alert("Please log in to rate this movie!");
      return;
    }

    // 1. Instantly update the UI for BOTH the stars and the status button
    setRating(newStarValue);
    setStatus("finished"); 

    try {
      await axios.post("http://localhost:8080/api/media/update", {
        userId: user.id,
        externalId: movie.id.toString(),
        title: movie.title,
        posterPath: movie.poster_path,
        releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
        description: movie.overview,
        creator: movie.director,
        status: "finished", 
        rating: newStarValue, 
        reviewText: review,
        isPhysical: isPhysical,
        format: physicalFormat,
        physicalStatus: physicalCondition
      });
    } catch (error) {
      console.error("Error saving rating:", error);
    }
  };

  // Instantly saves physical media changes to the database
  const handlePhysicalUpdate = async (field, value) => {
    if (!user) {
      alert("Please log in to manage your physical inventory!");
      return;
    }

    // Instantly update the UI state
    if (field === 'isPhysical') setIsPhysical(value);
    if (field === 'format') setPhysicalFormat(value);
    if (field === 'physicalStatus') setPhysicalCondition(value);

    try {
      await axios.post("http://localhost:8080/api/media/update", {
        userId: user.id,
        externalId: movie.id.toString(),
        title: movie.title,
        posterPath: movie.poster_path,
        releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
        description: movie.overview,
        creator: movie.director,
        status: status || "save", 
        rating: rating, 
        reviewText: review,
        
        // Send the current states, but overwrite the specific field that was just changed!
        isPhysical: field === 'isPhysical' ? value : isPhysical,
        format: field === 'format' ? value : physicalFormat,
        physicalStatus: field === 'physicalStatus' ? value : physicalCondition
      });
    } catch (error) {
      console.error("Error updating physical inventory:", error);
    }
  };


  if (!movie) return <h2 className="text-center text-white mt-5">Loading...</h2>;

  return (
    <div>
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
                <IoMdTime className='text-light'/> 
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
              <div className="d-flex justify-content-between mb-3 gap-2"> {/* Added gap-2 for better spacing */}
                <button 
                  onClick={() => handleStatusUpdate('in progress')}
                  className={`btn btn-sm w-100 ${status === 'in progress' ? 'btn-info text-dark fw-bold' : 'btn-outline-info'}`}>
                  <BsHourglassSplit className="me-1" /> In Progress
                </button>
                
                <button 
                  onClick={() => handleStatusUpdate('save')}
                  className={`btn btn-sm w-100 ${status === 'save' ? 'btn-info text-dark fw-bold' : 'btn-outline-info'}`}>
                  <FaBookmark className="me-1" /> Save
                </button>
                
                <button 
                  onClick={() => handleStatusUpdate('finished')}
                  className={`btn btn-sm w-100 ${status === 'finished' ? 'btn-info text-dark fw-bold' : 'btn-outline-info'}`}>
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
                      onClick={() => handleRatingUpdate(star)}
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
                <button 
                onClick={handleSaveInteraction} 
                className="btn btn-info w-100 fw-bold">
                Post Review
                </button>
              </div>

              {/* The simple toggle switch */}
  <div className="form-check form-switch">
    <input
      className="form-check-input"
      type="checkbox"
      id="physicalSwitch"
      checked={isPhysical}
      onChange={(e) => handlePhysicalUpdate('isPhysical', e.target.checked)}
      style={{ cursor: 'pointer' }}
    />
    <label className="form-check-label text-light fw-bold ms-2" htmlFor="physicalSwitch" style={{ cursor: 'pointer' }}>
      💿 Own Physical Copy
    </label>
  </div>

  {/* The Progressive Disclosure: Only shows if the switch is ON */}
  {isPhysical && (
    <div className="mt-3 p-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
      
      <label className="text-light small mb-1">Format</label>
      <select 
        className="form-select form-select-sm mb-2" 
        value={physicalFormat}
        onChange={(e) => handlePhysicalUpdate('format', e.target.value)}
      >
        <option value="none">Select Format...</option>
        <option value="blu-ray">Blu-ray</option>
        <option value="4k">4K UHD</option>
        <option value="dvd">DVD</option>
        <option value="vhs">VHS</option>
      </select>

      <label className="text-light small mb-1">Status</label>
      <select 
        className="form-select form-select-sm mb-2"
        value={physicalCondition}
        onChange={(e) => handlePhysicalUpdate('physicalStatus', e.target.value)}
      >
        <option value="none">Select Status...</option>
        <option value="available">On my shelf</option>
        <option value="loaned">Loaned to a friend</option>
        <option value="lost">Lost / Misplaced</option>
      </select>
      
    </div>
  )}

            </div>
          </div>

        </div>
      </div>
      {/* --- SECȚIUNEA DE RECENZII PUBLICE --- */}
      {/* ✨ MODIFICAT: Am adăugat 'row justify-content-center' pentru a centra conținutul */}
      <div className="mt-5 pt-4 border-top border-secondary row justify-content-center">
        {/* ✨ MODIFICAT: 'col-lg-8 col-md-10' face caseta de recenzii mult mai îngustă! */}
        <div className="col-lg-8 col-md-10">
          <h3 className="text-light fw-bold mb-4 text-left">Public Reviews</h3>
          
          {publicReviews.length === 0 ? (
            <p className="text-muted text-center">No reviews yet. Be the first to review this movie!</p>
          ) : (
            <div>
              <div className="d-flex flex-column gap-3">
                {publicReviews.slice(0, visibleReviewsCount).map((reviewData) => (
                  <div key={reviewData._id} className="card bg-dark border-secondary text-light shadow-sm" style={{ fontSize: '0.9rem' }}>
                    <div className="card-header border-secondary d-flex justify-content-between align-items-center py-2">
                      {/* ✨ NOU: Imaginea și numele sunt acum un Link către profil */}
                    {/* Dacă e recenzia ta, te duce la /profile, altfel te duce la /user/ID-ul-lui */}
                    <Link 
                      to={reviewData.userId?.username === user?.username ? "/profile" : `/user/${reviewData.userId?._id}`} 
                      className="text-decoration-none d-flex align-items-center gap-2"
                      style={{ transition: 'opacity 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <img 
                        src={reviewData.userId?.profilePicture || "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"} 
                        alt="avatar" 
                        className="rounded-circle border border-secondary bg-white"
                        style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                      />
                      <span className="fw-bold text-info" style={{ fontSize: '0.85rem' }}>
                        {reviewData.userId?.username === user?.username ? "You" : reviewData.userId?.username}
                      </span>
                    </Link>
                      
                      {/* ✨ NOU: Grupăm butonul de Edit și Stelele */}
                      <div className="d-flex align-items-center gap-2">
                        {/* Dacă recenzia este a utilizatorului logat, arătăm butonul de Edit */}
                        {reviewData.userId?.username === user?.username && (
                          <button 
                            className="btn btn-sm btn-outline-info py-0 px-2"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => {
                              // Când apasă Edit, punem textul înapoi în casetă și dăm scroll sus
                              setReview(reviewData.reviewText);
                              setRating(reviewData.rating);
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                          >
                            ✎ Edit
                          </button>
                        )}
                        
                        {reviewData.rating > 0 && (
                          <span className="badge bg-info text-dark" style={{ fontSize: '0.75rem' }}>
                            ⭐ {reviewData.rating} / 5
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="card-body py-2">
                      <p className="card-text mb-1" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                        {reviewData.reviewText}
                      </p>
                      {reviewData.isPhysical && reviewData.format !== 'none' && (
                        <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                          💿 Owns on {reviewData.format.toUpperCase()}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {visibleReviewsCount < publicReviews.length && (
                <button 
                  onClick={() => setVisibleReviewsCount(prev => prev + 3)} 
                  className="btn btn-outline-secondary btn-sm mt-3 w-100 fw-bold"
                >
                  Load More Reviews ({publicReviews.length - visibleReviewsCount} left) ↓
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- SECȚIUNEA SIMILAR MOVIES --- */}
      {similarMovies.length > 0 && (
        <div className="mt-5 pt-4 border-top border-secondary">
          <h3 className="text-light fw-bold mb-4 p-4 text-left ">Similar Movies</h3>
          {/* ✨ MODIFICAT: 'flex-wrap' și 'justify-content-center' le așează pe mijloc, nu pe stânga */}
          <div className="d-flex flex-wrap justify-content-center gap-4 pb-3">
            {similarMovies.map((movie) => (
              movie.poster_path && (
                <div key={movie.id} className="card shadow-sm border-0 bg-transparent flex-shrink-0" style={{ width: '150px' }}>
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
                    <h6 className="text-light text-truncate mb-0" style={{ fontSize: '0.85rem' }} title={movie.title}>{movie.title}</h6>
                    <span className="badge badge-bag text-dark mt-1" style={{ fontSize: '0.75rem' }}>⭐ {movie.vote_average?.toFixed(1)}</span>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

    </div>
  );
}


export default MovieDetails;