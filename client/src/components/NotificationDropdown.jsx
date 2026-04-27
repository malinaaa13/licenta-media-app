import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaUserFriends, FaCheck } from 'react-icons/fa';

function NotificationDropdown() {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) fetchNotifications();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/notifications/user/${user.id}`);
      setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    
    // Mark as read in the database
    if (!notif.isRead) {
      try {
        await axios.put(`http://localhost:8080/api/notifications/${notif._id}/read`);
        // Update local state so the red dot disappears
        setNotifications(notifications.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (error) {
        console.error("Error marking read:", error);
      }
    }
    
    // Navigate to the relevant link (e.g., the friend's profile or the requests page)
    if (notif.type === 'friend_request') {
      navigate('/friends?tab=requests');
    } else if (notif.link) {
      navigate(notif.link);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('http://localhost:8080/api/notifications/read-all', { userId: user.id });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* The Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="btn btn-dark border-0 position-relative p-2 text-light"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* The Dropdown Menu */}
      {isOpen && (
        <div className="position-absolute end-0 mt-2 bg-dark border border-secondary rounded shadow-lg" style={{ width: '320px', zIndex: 1050 }}>
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
            <h6 className="mb-0 text-light fw-bold">Notifications</h6>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="btn btn-sm btn-link text-info text-decoration-none p-0" style={{ fontSize: '0.8rem' }}>Mark all read</button>
            )}
          </div>

          <div className="overflow-auto" style={{ maxHeight: '400px' }}>
            {notifications.length === 0 ? (
              <p className="text-muted text-center p-4 mb-0 small">No new notifications.</p>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif._id} 
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 border-bottom border-secondary d-flex align-items-start gap-3 cursor-pointer ${notif.isRead ? 'opacity-75' : 'bg-secondary bg-opacity-25'}`}
                  style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.classList.add('bg-secondary')}
                  onMouseOut={(e) => e.currentTarget.classList.remove('bg-secondary')}
                >
                  <div className="mt-1 text-info">
                    {notif.type === 'friend_request' ? <FaUserFriends size={18} /> : <FaCheck size={18} />}
                  </div>
                  <div>
                    <p className="mb-1 text-light small">
                      {notif.type === 'friend_request' && <span><strong>@{notif.sender?.username?.toLowerCase().replace(/\s/g, '')}</strong> sent you a friend request.</span>}
                      {notif.type === 'request_accepted' && <span><strong>@{notif.sender?.username?.toLowerCase().replace(/\s/g, '')}</strong> accepted your friend request!</span>}
                    </p>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;