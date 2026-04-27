import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Home() {
  const [popularMovies, setPopularMovies] = useState([]);
  const [inProgressMovies, setInProgressMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [friendFeed, setFriendFeed] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));

  const formattedUsername = user?.username ? user.username.toLowerCase().replace(/\s+/g, '') : 'guest';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const popularRes = await axios.get("http://localhost:8080/api/media/movies/popular");
        setPopularMovies(popularRes.data);

        if (user) {
          const libraryRes = await axios.get(`http://localhost:8080/api/media/user/${user.id}/library`);
          const inProgress = libraryRes.data.filter(item => item.status === 'in progress');
          setInProgressMovies(inProgress);

          const fetchFeed = async () => {
            setIsLoadingFeed(true);
            try {
              const res = await axios.get(`http://localhost:8080/api/friends/user/${user.id}/feed`);
              setFriendFeed(res.data);
            } catch (error) {
              console.error("Error fetching feed:", error);
            } finally {
              setIsLoadingFeed(false);
            }
          };
          fetchFeed();
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  if (isLoading) {
    return <h2 className="text-center text-light mt-5">Loading your dashboard...</h2>;
  }

  return (
    <div className="container pb-5 mt-4">
      
      <h2 className="text-light fw-bold mb-5">
        Welcome back, <span className="text-info">{formattedUsername}</span>
      </h2>

      {user && (
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-end mb-3">
            <h4 className="text-light fw-bold mb-0">In Progress</h4>
            <Link to="/collections" state={{ targetTab: 'in progress' }} className="text-info text-decoration-none small fw-bold">
              See More &rarr;
            </Link>
          </div>
          
          {inProgressMovies.length === 0 ? (
            <p className="text-muted">You have no movies currently in progress.</p>
          ) : (
            <div className="d-flex overflow-hidden gap-4 pb-3">
              {inProgressMovies.map((item) => {
                return (
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
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 mb-5">
        <h3 className="text-light fw-bold mb-4 border-bottom border-secondary pb-2">Friend Activity</h3>
        
        {isLoadingFeed ? (
          <div className="card bg-dark border-secondary p-4 text-center">
            <div className="spinner-border text-info mb-3 mt-2" role="status"></div>
            <p className="text-muted mb-0">Loading friend updates...</p>
          </div>
        ) : friendFeed.length === 0 ? (
          <div className="card bg-dark border-secondary p-4 text-center">
            <p className="text-muted mb-0">No recent activity from your friends. Go add some more!</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {friendFeed.map((activity) => {
              return (
                <div key={activity.id} className="card bg-dark border-secondary p-3 shadow-sm">
                  <div className="d-flex align-items-start gap-3">
                    
                    <Link to={`/user/${activity.user._id}`}>
                      <img 
                        src={activity.user.profilePicture || "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"} 
                        alt="avatar" 
                        className="rounded-circle border border-secondary"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                    </Link>

                    <div className="flex-grow-1">
                      <p className="mb-1 text-light">
                        <Link to={`/user/${activity.user._id}`} className="text-info fw-bold text-decoration-none">
                          @{activity.user.username?.toLowerCase().replace(/\s/g, '')}
                        </Link> 
                        <span className="text-muted mx-1">{activity.action}</span> 
                        
                        {(activity.type === 'userMedia' || activity.type === 'review') && (
                          <Link to={`/movie/${activity.tmdbId}`} className="fw-bold text-light text-decoration-none hover-info">
                            {activity.mediaTitle}
                          </Link>
                        )}
                        {(activity.type === 'list' || activity.type === 'saved_list') && (
                          <Link to={`/list/${activity.listId}`} className="fw-bold text-light text-decoration-none hover-info">
                            &quot;{activity.listTitle}&quot;
                          </Link>
                        )}
                      </p>
                      
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(activity.date).toLocaleString()}
                      </small>

                      {activity.type === 'review' && (
                        <div className="mt-3 p-3 bg-secondary bg-opacity-25 rounded border border-secondary d-flex gap-3">
                          <img 
                            src={`https://image.tmdb.org/t/p/w92${activity.posterPath}`} 
                            alt="poster" 
                            className="rounded shadow-sm"
                            style={{ width: '60px', height: '90px', objectFit: 'cover' }}
                          />
                          <div>
                            {activity.rating && (
                              <div className="text-warning fw-bold mb-1">&#11088; {activity.rating}/5</div>
                            )}
                            {activity.text && activity.text.trim() !== '' && (
                              <p className="text-light small fst-italic mb-0">
                                &quot;{activity.text}&quot;
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {activity.type === 'list' && activity.moviesPreview?.length > 0 && (
                        <div className="d-flex gap-2 mt-3 p-2 bg-secondary bg-opacity-25 rounded border border-secondary" style={{ width: 'fit-content' }}>
                          {activity.moviesPreview.map(movie => {
                            return (
                              <img 
                                key={movie.tmdbId} 
                                src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`} 
                                alt="poster" 
                                className="rounded shadow-sm"
                                style={{ width: '40px', height: '60px', objectFit: 'cover' }}
                              />
                            );
                          })}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="d-flex justify-content-between align-items-end mb-3">
          <h4 className="text-light fw-bold mb-0">Popular Movies</h4>
          <Link to="/popular" className="text-info text-decoration-none small fw-bold">
            See More &rarr;
          </Link>
        </div>

        <div className="d-flex overflow-hidden gap-4 pb-3">
          {popularMovies.map((movie) => {
            if (!movie.poster_path) return null;
            return (
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
                  <span className="badge badge-bag text-dark mt-1">&#11088; {movie.vote_average?.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default Home;