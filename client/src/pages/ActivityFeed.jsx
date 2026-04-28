import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ActivityFeed() {
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchFullFeed = async () => {
      if (!user) return;
      try {
        const res = await axios.get(`http://localhost:8080/api/friends/user/${user.id}/feed`);
        setFeed(res.data);
      } catch (error) {
        console.error("Error fetching full feed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFullFeed();
  }, [user?.id]);

  if (isLoading) return <h2 className="text-center text-light mt-5">Loading full activity feed...</h2>;

  return (
    <div className="container mt-4 pb-5">
      <h2 className="text-light fw-bold mb-4">All Friend Activity</h2>
      
      <div className="d-flex flex-column gap-3">
        {feed.length === 0 ? (
          <p className="text-muted text-center mt-5">No activity found.</p>
        ) : (
          feed.map((activity) => (
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
                      <Link to={`/movie/${activity.tmdbId}`} className="fw-bold text-light text-decoration-none">
                        {activity.mediaTitle}
                      </Link>
                    )}
                    {(activity.type === 'list' || activity.type === 'saved_list') && (
                      <Link to={`/list/${activity.listId}`} className="fw-bold text-light text-decoration-none">
                        &quot;{activity.listTitle}&quot;
                      </Link>
                    )}
                  </p>
                  
                  <small className="text-muted">{new Date(activity.date).toLocaleString()}</small>

                  {activity.type === 'review' && (
                    <div className="mt-3 p-3 bg-secondary bg-opacity-25 rounded border border-secondary d-flex gap-3">
                      <img 
                        src={`https://image.tmdb.org/t/p/w92${activity.posterPath}`} 
                        alt="poster" 
                        style={{ width: '60px', height: '90px', objectFit: 'cover' }}
                      />
                      <div>
                        {activity.rating && <div className="text-warning fw-bold mb-1">&#11088; {activity.rating}/5</div>}
                        {activity.text && <p className="text-light small fst-italic mb-0">&quot;{activity.text}&quot;</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;