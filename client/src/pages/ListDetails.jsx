import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaBookmark, FaRegBookmark, FaShare, FaTrash, FaEdit, FaCheckCircle } from 'react-icons/fa';

function ListDetails() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [list, setList] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [watchedCount, setWatchedCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch list details
        const listRes = await axios.get(`http://localhost:8080/api/lists/${listId}`);
        setList(listRes.data);
        setSaveCount(listRes.data.savedBy?.length || 0);
        if (user && listRes.data.savedBy) {
        const alreadySaved = listRes.data.savedBy.some(id => id.toString() === user.id.toString());
        setIsSaved(alreadySaved);
        }

        // 2. Fetch user's library to calculate watched progress
        if (user) {
          const libraryRes = await axios.get(`http://localhost:8080/api/media/user/${user.id}/library`);
          const watchedInLibrary = libraryRes.data.map(item => item.mediaId.externalId.toString());
          
          const finishedMediaIds = libraryRes.data
          .filter(item => item.status === 'finished')
          .map(item => item.mediaId.externalId.toString());

          const count = listRes.data.movies.filter(movie => 
            finishedMediaIds.includes(movie.tmdbId.toString())
          ).length;
          
          setWatchedCount(count);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [listId, user]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this list? This action cannot be undone.")) {
      try {
        await axios.delete(`http://localhost:8080/api/lists/${listId}`);
        navigate('/lists');
      } catch (error) {
        alert("Error deleting list");
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleToggleSave = async () => {
    if (!user) {
    navigate('/login');
    return;
  }

  try {
    const response = await axios.post(`http://localhost:8080/api/lists/${listId}/save`, {
      userId: user.id
    });

    // Luăm lista actualizată direct din răspunsul serverului
    const updatedList = response.data.list;

    // Actualizăm numărul de salvări folosind lungimea exactă a array-ului din DB
    setSaveCount(updatedList.savedBy.length);

    // Verificăm dacă ID-ul tău se mai află în lista de salvări a serverului
    const isNowSaved = updatedList.savedBy.some(id => id.toString() === user.id.toString());
    
    // Această linie va schimba textul din "Saved" în "Save" instantaneu
    setIsSaved(isNowSaved);

  } catch (error) {
    console.error("Error toggling save status:", error);
  }
  };

  if (isLoading) return <h2 className="text-center text-light mt-5">Loading list details...</h2>;
  if (!list) return <h2 className="text-center text-muted mt-5">List not found.</h2>;

  const isCreator = user && list.creator?._id === user.id;

  return (
    <div className="container mt-5 pb-5">
      {/* List Header Section */}
      <div className="row justify-content-center mb-5">
        <div className="col-lg-10">
          <div className="card bg-dark border-secondary shadow p-4 text-light">
            <div className="d-flex justify-content-between align-items-start">
              
              {/* Title, Creator, and Watched Progress */}
              <div>
                <h1 className="fw-bold text-info mb-2">{list.title}</h1>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Link to={`/user/${list.creator?._id}`} className="text-decoration-none d-flex align-items-center gap-2">
                    <img 
                      src={list.creator?.profilePicture || "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"} 
                      alt="creator avatar" 
                      className="rounded-circle border border-secondary bg-white"
                      style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                    />
                    <small className="text-muted hover-info" style={{ transition: '0.2s' }}>
                      Created by <span className="text-info fw-bold">{list.creator?.username}</span>
                    </small>
                  </Link>
                </div>
                
                {/* Watched Progress Indicator */}
                <div className="d-flex align-items-center gap-2 mb-3 bg-secondary bg-opacity-25 p-2 rounded" style={{ width: 'fit-content' }}>
                  <FaCheckCircle className="text-success" />
                  <span className="fw-bold">You've watched {watchedCount} of {list.movies.length} films ({Math.round((watchedCount/list.movies.length)*100) || 0}%)</span>
                </div>
              </div>

              {/* Buttons Area */}
              <div className="d-flex gap-2">
                <button 
                  onClick={handleCopyLink}
                  className="btn btn-outline-light d-flex align-items-center gap-2 fw-bold"
                  style={{ transition: 'all 0.2s' }}
                >
                  <FaShare />
                  {isCopied ? 'Copied!' : 'Share'}
                </button>

                {/* Show Edit/Delete if creator, show Save if not creator */}
                {isCreator ? (
                  <>
                    <Link to={`/lists/edit/${list._id}`} className="btn btn-outline-warning d-flex align-items-center gap-2 fw-bold">
                      <FaEdit /> Edit
                    </Link>
                    <button onClick={handleDelete} className="btn btn-outline-danger d-flex align-items-center gap-2 fw-bold">
                      <FaTrash /> Delete
                    </button>
                  </>
                ) : (
                  user && (
                    <button 
                      onClick={handleToggleSave}
                      className={`btn ${isSaved ? 'btn-info' : 'btn-outline-info'} d-flex align-items-center gap-2 fw-bold`}
                    >
                      {isSaved ? <FaBookmark /> : <FaRegBookmark />}
                      {isSaved ? 'Saved' : 'Save'}
                      <span className="badge bg-dark text-light ms-1">{saveCount}</span>
                    </button>
                  )
                )}
              </div>

            </div>

            {/* Description */}
            {list.description && (
              <p className="fs-6 mt-3 mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {list.description}
              </p>
            )}
            
            <hr className="border-secondary mt-4 mb-3" />
            <div className="text-muted small fw-bold text-uppercase tracking-wide">
              {list.movies?.length || 0} Films
            </div>
          </div>
        </div>
      </div>

      {/* Movies Grid Section (Restored) */}
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="row row-cols-2 row-cols-md-4 row-cols-lg-5 g-4">
            {list.movies.map((movie) => (
              <div key={movie.tmdbId} className="col">
                <Link to={`/movie/${movie.tmdbId}`} className="text-decoration-none">
                  <div className="card shadow-sm border-0 bg-transparent h-100">
                    <img 
                      src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`} 
                      className="card-img-top rounded shadow border border-secondary" 
                      alt={movie.title} 
                      style={{ transition: 'transform 0.2s ease', aspectRatio: '2/3', objectFit: 'cover' }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    <div className="mt-2 text-center">
                      <h6 className="text-light text-truncate mb-0" style={{ fontSize: '0.85rem' }} title={movie.title}>
                        {movie.title}
                      </h6>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default ListDetails;