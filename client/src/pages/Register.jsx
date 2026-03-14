import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false); 
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:8080/api/register', {
        username: username,
        email: email,
        password: password
      });

      setMessage(response.data.message);
      setIsError(false); // Success (green)
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      setIsError(true); // Error (red)
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("An error occurred while connecting to the server.");
      }
    }
  };

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center vh-100 ">
      
      {/* Card container for the form */}
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '400px', borderRadius: '15px' }}>
        
        <h2 className="text-center mb-4">Create Account</h2>
        
        <form onSubmit={handleRegister}>
          
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. john_doe" 
              value={username}
              onChange={(e) => setUsername(e.target.value)} 
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Minimum 6 characters" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn btn-info w-100 fw-bold">
            Register
          </button>
        </form>

        {/* Error or Success Message */}
        {message && (
          <div className={`alert mt-3 ${isError ? 'alert-danger' : 'alert-success'}`} role="alert">
            {message}
          </div>
        )}

        {/* Link to Login Page */}
        <div className="text-center mt-3">
          <p className="mb-0">Already have an account? <Link to="/login" className="text-decoration-none theme-link">Log in here</Link></p>
        </div>

      </div>
    </div>
  );
}

export default Register;