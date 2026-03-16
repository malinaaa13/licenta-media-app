import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Collections() {
  const [library, setLibrary] = useState([]);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'finished');
  const [isLoading, setIsLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    // If they aren't logged in, kick them back to login
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchLibrary = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/media/user/${user.id}/library`);
        setLibrary(response.data);
      } catch (error) {
        console.error("Error fetching library:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibrary();
  }, [navigate]);

  useEffect(() => {
    if (location.state?.targetTab) {
      setActiveTab(location.state.targetTab);
    }
  }, [location.state]);

  // Filter the library based on the active tab
  const displayedMedia = library.filter(item => item.status === activeTab);

  if (isLoading) return <h2 className="text-center text-light mt-5">Loading your library...</h2>;

  return (
    <div>

      <div className="container pb-5">
        <h2 className="text-light fw-bold mb-4">My Collections</h2>

        {/* Bootstrap Tabs Navigation */}
        <ul className="nav nav-pills mb-4 gap-2">
            <li className="nav-item">
            <button 
              className={`nav-link fw-bold ${activeTab === 'in progress' ? 'active btn-info text-dark' : 'text-light'}`}
              onClick={() => setActiveTab('in progress')}
            >
               In progress
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold ${activeTab === 'finished' ? 'active btn-info text-dark' : 'text-light'}`}
              onClick={() => setActiveTab('finished')}
            >
               Finished
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold ${activeTab === 'save' ? 'active btn-info text-dark' : 'text-light'}`}
              onClick={() => setActiveTab('save')}
            >
              Saved
            </button>
          </li>
          {/* We will leave "In Progress" for the Home page, but you could add it here too! */}
        </ul>

        {/* The Grid of Posters */}
        {displayedMedia.length === 0 ? (
          <h5 className="text-muted mt-4">You don't have any movies in this collection yet.</h5>
        ) : (
          <div className="d-flex flex-wrap gap-4 justify-content-start">
            {displayedMedia.map((item) => (
              // We access the global media details via item.mediaId because of the 'populate' in the backend
              <div key={item._id} className="card shadow-sm border-0 bg-transparent" style={{ width: '180px' }}>
                <Link to={`/movie/${item.mediaId.externalId}`} className="text-decoration-none">
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${item.mediaId.posterPath}`} 
                    className="card-img-top rounded shadow" 
                    alt={item.mediaId.title} 
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </Link>
                <div className="mt-2 text-center">
                  <h6 className="text-light text-truncate mb-1" title={item.mediaId.title}>
                    {item.mediaId.title}
                  </h6>
                  {/* Show their personal rating if they have one */}
                  {item.rating > 0 && (
                    <span className="badge bg-info text-dark">
                      ⭐ {item.rating} / 5
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Collections;