import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { FaUserFriends, FaUserPlus, FaCheck, FaTimes } from 'react-icons/fa';

function Friends() {
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'search'
  
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const latestSearchIdRef = useRef(0);

  const addFriendshipStatus = async (users) => {
    const enrichedUsers = await Promise.all(users.map(async (u) => {
      try {
        const statusRes = await axios.get(`http://localhost:8080/api/friends/status/${user.id}/${u._id}`);
        return {
          ...u,
          friendshipStatus: statusRes.data?.status || 'none',
          friendshipId: statusRes.data?.friendshipId || null,
          requesterId: statusRes.data?.requesterId || null
        };
      } catch (error) {
        return {
          ...u,
          friendshipStatus: 'none',
          friendshipId: null,
          requesterId: null
        };
      }
    }));

    return enrichedUsers;
  };

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam === 'friends' || tabParam === 'requests' || tabParam === 'search') {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'friends') fetchFriends();
      if (activeTab === 'requests') fetchRequests();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!user) return;

    const query = searchQuery.trim();
    if (query.length < 2) {
      setIsSearchLoading(false);
      if (activeTab === 'search') setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      const searchId = Date.now();
      latestSearchIdRef.current = searchId;
      setIsSearchLoading(true);
      try {
        const res = await axios.get(`http://localhost:8080/api/friends/search?q=${query}`);
        if (latestSearchIdRef.current !== searchId) return;

        const filteredUsers = res.data.filter(u => u._id !== user.id);
        const enrichedUsers = await addFriendshipStatus(filteredUsers);
        if (latestSearchIdRef.current !== searchId) return;

        setSearchResults(enrichedUsers);
        setActiveTab('search');
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        if (latestSearchIdRef.current === searchId) {
          setIsSearchLoading(false);
        }
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, user]);

  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`http://localhost:8080/api/friends/user/${user.id}`);
      setFriends(res.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`http://localhost:8080/api/friends/user/${user.id}/pending`);
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (recipientId) => {
    try {
      await axios.post('http://localhost:8080/api/friends/request', {
        requesterId: user.id,
        recipientId: recipientId
      });

      const statusRes = await axios.get(`http://localhost:8080/api/friends/status/${user.id}/${recipientId}`);
      setSearchResults(prev => prev.map(result => result._id === recipientId ? {
        ...result,
        friendshipStatus: statusRes.data?.status || 'pending',
        friendshipId: statusRes.data?.friendshipId || null,
        requesterId: statusRes.data?.requesterId || user.id
      } : result));
    } catch (error) {
      alert(error.response?.data?.message || "Error sending request");
    }
  };

  const handleCancelRequest = async (recipientId, friendshipId) => {
    if (!friendshipId) return;

    try {
      await axios.delete(`http://localhost:8080/api/friends/request/${friendshipId}`);
      setSearchResults(prev => prev.map(result => result._id === recipientId ? {
        ...result,
        friendshipStatus: 'none',
        friendshipId: null,
        requesterId: null
      } : result));
    } catch (error) {
      console.error("Error cancelling request:", error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.put(`http://localhost:8080/api/friends/request/${requestId}/accept`);
      setRequests(requests.filter(req => req._id !== requestId)); // Remove from UI
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await axios.delete(`http://localhost:8080/api/friends/request/${requestId}`);
      setRequests(requests.filter(req => req._id !== requestId)); // Remove from UI
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  // Helper to format usernames per your rules
  const formatUsername = (name) => name?.toLowerCase().replace(/\s/g, '');

  if (!user) return <h2 className="text-center mt-5 text-light">Please log in to view friends.</h2>;

  return (
    <div className="container pb-5 mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-light fw-bold mb-0">Social Hub</h2>
      </div>

      {/* Tabs and Search Bar */}
      <div className="card bg-dark border-secondary p-3 mb-5 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="d-flex flex-wrap gap-2">
            <button 
              className={`btn ${activeTab === 'friends' ? 'btn-info' : 'btn-outline-secondary'} fw-bold`}
              onClick={() => setActiveTab('friends')}
            >
              <FaUserFriends className="mb-1 me-1" /> My Friends
            </button>
            <button 
              className={`btn ${activeTab === 'requests' ? 'btn-info' : 'btn-outline-secondary'} fw-bold position-relative`}
              onClick={() => setActiveTab('requests')}
            >
              <FaUserPlus className="mb-1 me-1" /> Requests
            </button>
          </div>

          <div className="input-group" style={{ maxWidth: '350px' }}>
            <input 
              type="text" 
              className="form-control bg-secondary border-dark text-light" 
              placeholder="Search users (min. 2 letters)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <h5 className="text-center text-muted mt-5">Loading...</h5>
      ) : (
        <div className="row g-4">
          
          {/* TAB: MY FRIENDS */}
          {activeTab === 'friends' && friends.length === 0 && <h5 className="text-muted text-center w-100 mt-5">You haven't added any friends yet.</h5>}
          {activeTab === 'friends' && friends.map((friend) => (
            <div key={friend._id} className="col-md-6 col-lg-4">
              <div className="card bg-dark border-secondary d-flex flex-row align-items-center p-3">
                <img src={friend.profilePicture || "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"} alt="avatar" className="rounded-circle border border-secondary" style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                <div className="ms-3">
                  <Link to={`/user/${friend._id}`} className="text-info fw-bold text-decoration-none fs-5">@{formatUsername(friend.username)}</Link>
                </div>
              </div>
            </div>
          ))}

          {/* TAB: PENDING REQUESTS */}
          {activeTab === 'requests' && requests.length === 0 && <h5 className="text-muted text-center w-100 mt-5">No pending friend requests.</h5>}
          {activeTab === 'requests' && requests.map((req) => (
            <div key={req._id} className="col-md-6 col-lg-4">
              <div className="card bg-dark border-secondary d-flex flex-row align-items-center justify-content-between p-3">
                <div className="d-flex align-items-center">
                  <img src={req.requester.profilePicture || "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"} alt="avatar" className="rounded-circle border border-secondary" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                  <Link to={`/user/${req.requester._id}`} className="text-info fw-bold text-decoration-none ms-2">@{formatUsername(req.requester.username)}</Link>
                </div>
                <div className="d-flex gap-2">
                  <button onClick={() => handleAcceptRequest(req._id)} className="btn btn-sm btn-success rounded-circle p-2"><FaCheck /></button>
                  <button onClick={() => handleRejectRequest(req._id)} className="btn btn-sm btn-danger rounded-circle p-2"><FaTimes /></button>
                </div>
              </div>
            </div>
          ))}

          {/* TAB: SEARCH RESULTS */}
          {activeTab === 'search' && !isSearchLoading && searchResults.length === 0 && <h5 className="text-muted text-center w-100 mt-5">No users found.</h5>}
          {activeTab === 'search' && searchResults.map((result) => (
            <div key={result._id} className="col-md-6 col-lg-4">
              <div className="card bg-dark border-secondary d-flex flex-row align-items-center justify-content-between p-3">
                <div className="d-flex align-items-center">
                  <img src={result.profilePicture || "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"} alt="avatar" className="rounded-circle border border-secondary" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                  <Link to={`/user/${result._id}`} className="text-info fw-bold text-decoration-none ms-2">@{formatUsername(result.username)}</Link>
                </div>
                {result.friendshipStatus === 'none' && (
                  <button onClick={() => handleSendRequest(result._id)} className="btn btn-sm btn-outline-info d-flex align-items-center gap-1">
                    <FaUserPlus /> Add
                  </button>
                )}
                {result.friendshipStatus === 'pending' && result.requesterId?.toString() === user.id && (
                  <button onClick={() => handleCancelRequest(result._id, result.friendshipId)} className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1">
                    <FaTimes /> Cancel
                  </button>
                )}
                {result.friendshipStatus === 'pending' && result.requesterId?.toString() !== user.id && (
                  <button className="btn btn-sm btn-secondary" disabled>
                    Pending
                  </button>
                )}
                {result.friendshipStatus === 'accepted' && (
                  <button className="btn btn-sm btn-success" disabled>
                    Friends
                  </button>
                )}
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}

export default Friends;