import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaSearch, FaBookmark, FaGlobe, FaLock, FaLink } from 'react-icons/fa';

function Lists() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [activeTab, setActiveTab] = useState('popular'); // 'popular', 'my-lists', 'saved', or 'search'
  const [lists, setLists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only fetch default tabs if we are not actively searching
    if (activeTab !== 'search') {
      fetchListsData();
    }
  }, [activeTab]);

  const fetchListsData = async () => {
    setIsLoading(true);
    setSearchQuery(''); // Clear search input when switching standard tabs
    try {
      let endpoint = 'http://localhost:8080/api/lists/popular';
      
      if (activeTab === 'my-lists' && user) {
        endpoint = `http://localhost:8080/api/lists/user/${user.id}`;
      } else if (activeTab === 'saved' && user) {
        endpoint = `http://localhost:8080/api/lists/user/${user.id}/saved`;
      }
      
      const response = await axios.get(endpoint);
      setLists(response.data);
    } catch (error) {
      console.error("Error fetching lists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setActiveTab('popular');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:8080/api/lists/search?q=${searchQuery}`);
      setLists(response.data);
      setActiveTab('search'); // Switch to search mode
    } catch (error) {
      console.error("Error searching lists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVisibilityIcon = (visibility) => {
    if (visibility === 'private') return <FaLock className="text-danger me-2" title="Private" />;
    if (visibility === 'unlisted') return <FaLink className="text-warning me-2" title="Unlisted" />;
    return <FaGlobe className="text-info me-2" title="Public" />;
  };

  return (
    <div className="container pb-5 mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-light fw-bold mb-0">Lists</h2>
        <Link to="/lists/create" className="btn btn-info fw-bold">Create your own list</Link>
      </div>

      {/* Search Bar & Tabs Navigation */}
      <div className="card bg-dark border-secondary p-3 mb-5 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          
          <div className="d-flex flex-wrap gap-2">
            <button 
              className={`btn ${activeTab === 'popular' ? 'btn-info' : 'btn-outline-secondary'} fw-bold`}
              onClick={() => setActiveTab('popular')}
            >
              Popular
            </button>
            {user && (
              <>
                <button 
                  className={`btn ${activeTab === 'my-lists' ? 'btn-info' : 'btn-outline-secondary'} fw-bold`}
                  onClick={() => setActiveTab('my-lists')}
                >
                 My Lists
                </button>
                <button 
                  className={`btn ${activeTab === 'saved' ? 'btn-info' : 'btn-outline-secondary'} fw-bold`}
                  onClick={() => setActiveTab('saved')}
                >
                  <FaBookmark className="mb-1" /> Saved
                </button>
              </>
            )}
          </div>

          <form onSubmit={handleSearch} className="input-group" style={{ maxWidth: '350px' }}>
            <input 
              type="text" 
              className="form-control bg-secondary border-dark text-light placeholder-light" 
              placeholder="Search public lists..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-outline-info"><FaSearch /></button>
          </form>
        </div>
      </div>

      {/* Title indicating what is currently being viewed */}
      <h5 className="text-light mb-4">
        {activeTab === 'popular' && "Most popular public lists"}
        {activeTab === 'my-lists' && "Lists created by you"}
        {activeTab === 'saved' && "Lists you have saved"}
        {activeTab === 'search' && `Search results for "${searchQuery}"`}
      </h5>

      {/* Grid Rendering */}
      {isLoading ? (
        <h5 className="text-center text-muted mt-5">Loading...</h5>
      ) : lists.length === 0 ? (
        <h5 className="text-center text-light mt-5">No lists found in this category.</h5>
      ) : (
        <div className="row g-4">
          {lists.map((list) => (
            <div key={list._id} className="col-lg-4 col-md-6">
              <Link to={`/list/${list._id}`} className="text-decoration-none">
                <div className="card bg-transparent border-0 group">
                  
                  {/* Overlapping Posters Logic */}
                  <div className="d-flex justify-content-start mb-2 overflow-hidden px-2" style={{ paddingTop: '10px' }}>
                    {list.movies.slice(0, 5).map((movie, index) => (
                      <img 
                        key={movie.tmdbId || index}
                        src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`} 
                        alt="poster"
                        className="rounded shadow border border-secondary"
                        style={{ 
                          width: '100px', height: '150px', objectFit: 'cover',
                          marginLeft: index === 0 ? '0' : '-50px', 
                          zIndex: 10 - index, position: 'relative',
                          transition: 'transform 0.2s ease-in-out'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      />
                    ))}
                    
                    {/* Empty placeholder slots if list has fewer than 5 movies */}
                    {Array.from({ length: Math.max(0, 5 - list.movies.length) }).map((_, idx) => (
                       <div 
                         key={`empty-${idx}`}
                         className="rounded border border-secondary border-2 bg-dark"
                         style={{ 
                            width: '100px', height: '150px', 
                            marginLeft: (list.movies.length === 0 && idx === 0) ? '0' : '-50px',
                            zIndex: 5 - idx, position: 'relative',
                            borderStyle: 'dashed !important'
                         }}
                       ></div>
                    ))}
                  </div>

                  <div className="mt-2">
                    <h5 className="text-light fw-bold text-truncate mb-1 d-flex align-items-center">
                      {getVisibilityIcon(list.visibility)} {list.title}
                    </h5>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <img 
                        src={list.creator?.profilePicture || "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"} 
                        alt="avatar" 
                        className="rounded-circle border border-secondary bg-white"
                        style={{ width: '20px', height: '20px', objectFit: 'cover' }}
                      />
                      <small className="text-muted">
                        by <span className="text-info">{list.creator?.username}</span>
                      </small>
                    </div>
                  </div>

                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Lists;