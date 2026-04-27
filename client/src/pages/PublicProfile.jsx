import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FaEye, FaClock, FaListUl, FaBookmark, FaUsers } from 'react-icons/fa';

const DEFAULT_AVATAR = "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";

function PublicProfile() {
  const { id } = useParams(); // Prinde ID-ul utilizatorului din URL
  const loggedInUser = JSON.parse(localStorage.getItem('user'));

  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none'); // 'none', 'pending', 'accepted'
  const [friendshipId, setFriendshipId] = useState(null);
  const [isRequester, setIsRequester] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/users/${id}`);
        setProfileUser(response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  useEffect(() => {
    const fetchFriendStatus = async () => {
      // Only fetch if a user is logged in AND they aren't looking at their own public link
      if (loggedInUser && loggedInUser.id !== id) {
        try {
          const res = await axios.get(`http://localhost:8080/api/friends/status/${loggedInUser.id}/${id}`);
          if (res.data.status !== 'none') {
            setFriendStatus(res.data.status);
            setFriendshipId(res.data.friendshipId);
            setIsRequester(res.data.requesterId === loggedInUser.id);
          } else {
            setFriendStatus('none');
          }
        } catch (error) {
          console.error("Error fetching friendship status", error);
        }
      }
    };

    fetchFriendStatus();
  }, [id, loggedInUser?.id]);

  useEffect(() => {
    const fetchStats = async () => {
      if (friendStatus !== 'accepted') {
        setStats(null);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:8080/api/users/${id}/stats`);
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching public profile stats:", error);
      }
    };

    fetchStats();
  }, [friendStatus, id]);

  const handleFriendAction = async () => {
    try {
      if (friendStatus === 'none') {
        // Send Request
        await axios.post('http://localhost:8080/api/friends/request', {
          requesterId: loggedInUser.id,
          recipientId: id
        });
        setFriendStatus('pending');
        setIsRequester(true);
      } 
      else if (friendStatus === 'pending' && isRequester) {
        // Cancel sent request
        await axios.delete(`http://localhost:8080/api/friends/request/${friendshipId}`);
        setFriendStatus('none');
        setFriendshipId(null);
      }
      else if (friendStatus === 'pending' && !isRequester) {
        // Accept received request
        const res = await axios.put(`http://localhost:8080/api/friends/request/${friendshipId}/accept`);
        setFriendStatus('accepted');
      }
      else if (friendStatus === 'accepted') {
        // Unfriend
        if (window.confirm(`Are you sure you want to remove @${profileUser.username} from your friends list?`)) {
          await axios.delete(`http://localhost:8080/api/friends/request/${friendshipId}`);
          setFriendStatus('none');
          setFriendshipId(null);
        }
      }
    } catch (error) {
      console.error("Error updating friend status", error);
    }
  };

  if (isLoading) return <h2 className="text-center text-light mt-5">Loading profile...</h2>;
  if (!profileUser) return <h2 className="text-center text-muted mt-5">User not found.</h2>;

  // Asigurăm un array de 4 sloturi pentru afișare frumoasă
  const displayFavorites = profileUser.favorites?.length ? profileUser.favorites : [];
  while(displayFavorites.length < 4) displayFavorites.push(null);

  const statCards = [
    { key: 'totalWatched', label: 'Watched', value: stats?.totalWatched ?? 0, icon: FaEye },
    { key: 'totalInProgress', label: 'In Progress', value: stats?.totalInProgress ?? 0, icon: FaClock },
    { key: 'totalListsCreated', label: 'Lists Created', value: stats?.totalListsCreated ?? 0, icon: FaListUl },
    { key: 'totalSavedLists', label: 'Saved Lists', value: stats?.totalSavedLists ?? 0, icon: FaBookmark },
    { key: 'totalFriends', label: 'Friends', value: stats?.totalFriends ?? 0, icon: FaUsers },
  ];

  return (
    <div className="container mt-5 pb-5">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10">
          
          {/* HEADER PROFIL */}
          <div className="card bg-dark border-secondary shadow-lg text-light p-4 mb-5">
            <div className="d-flex flex-column flex-md-row align-items-center gap-4">
              <img 
                src={profileUser.profilePicture || DEFAULT_AVATAR} 
                alt={`${profileUser.username}'s Avatar`} 
                className="rounded-circle border border-3 border-info shadow bg-white"
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
              <div className="flex-grow-1 w-100 text-center text-md-start">
                <h2 className="fw-bold text-info mb-1">@{profileUser.username}</h2>
                <p className="text-muted small mb-3">Cinephile</p>
                <p className="fs-5" style={{ whiteSpace: 'pre-wrap' }}>{profileUser.bio || "I love movies!"}</p>

                {loggedInUser && loggedInUser.id !== id && (
                  <button 
                    onClick={handleFriendAction} 
                    className={`btn mt-2 fw-bold ${
                      friendStatus === 'none' ? 'btn-info' : 
                      friendStatus === 'pending' ? 'btn-warning text-dark' : 
                      'btn-outline-success'
                    }`}
                    style={{ transition: 'all 0.3s' }}
                  >
                    {friendStatus === 'none' && 'Send request'}
                    {friendStatus === 'pending' && isRequester && 'Pending'}
                    {friendStatus === 'pending' && !isRequester && 'Accept Request'}
                    {friendStatus === 'accepted' && 'Friends '}
                  </button>
                )}

              </div>
            </div>
          </div>

          {/* TOP 4 FAVORITES */}
          <h3 className="text-light fw-bold mb-4 border-bottom border-secondary pb-2">Top 4 Favorites</h3>
          <div className="d-flex justify-content-between gap-3 mb-5">
            {displayFavorites.map((favMovie, index) => (
              <div key={index} className="position-relative" style={{ width: '23%', aspectRatio: '2/3' }}>
                {favMovie ? (
                  <Link to={`/movie/${favMovie.tmdbId}`}>
                    <img 
                      src={`https://image.tmdb.org/t/p/w500${favMovie.posterPath}`} 
                      alt={favMovie.title} 
                      className="rounded shadow w-100 h-100"
                      style={{ objectFit: 'cover', transition: 'transform 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  </Link>
                ) : (
                  <div 
                    className="h-100 w-100 rounded border border-2 border-secondary d-flex justify-content-center align-items-center bg-transparent"
                    style={{ borderStyle: 'dashed !important' }}
                  >
                    <span className="text-secondary small">Empty</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {friendStatus === 'accepted' && (
            <>
              <h3 className="text-light fw-bold mb-4 border-bottom border-secondary pb-2">User Statistics</h3>
              <div className="row row-cols-2 row-cols-md-5 g-3 mb-5">
                {statCards.map(({ key, label, value, icon: Icon }) => (
                  <div className="col" key={key}>
                    <div className="card bg-dark border-secondary shadow-sm text-center p-3 h-100">
                      <div className="text-info mb-2 fs-4"><Icon /></div>
                      <div className="fs-3 fw-bold text-info">{value}</div>
                      <div className="text-light small text-uppercase opacity-75">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default PublicProfile;