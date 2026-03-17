import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const DEFAULT_AVATAR = "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";

function PublicProfile() {
  const { id } = useParams(); // Prinde ID-ul utilizatorului din URL
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) return <h2 className="text-center text-light mt-5">Loading profile...</h2>;
  if (!profileUser) return <h2 className="text-center text-muted mt-5">User not found.</h2>;

  // Asigurăm un array de 4 sloturi pentru afișare frumoasă
  const displayFavorites = profileUser.favorites?.length ? profileUser.favorites : [];
  while(displayFavorites.length < 4) displayFavorites.push(null);

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

        </div>
      </div>
    </div>
  );
}

export default PublicProfile;