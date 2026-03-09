import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:8080/api/login', {
        email: email,
        password: password
      });

      // Handle successful login
      setMessage(response.data.message);
      setIsError(false);

      // Store the token in localStorage to keep the user logged in
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        navigate('/home'); // Instant
      }

      // // Redirect to home or dashboard after a short delay
      // setTimeout(() => {
      //   navigate('/home');
      // }, 1500);

    } catch (error) {
      setIsError(true);
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("An error occurred while connecting to the server.");
      }
    }
  };

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '400px', borderRadius: '15px' }}>

        <h2 className="text-center mb-4 text-primary">Welcome Back</h2>

        <form onSubmit={handleLogin}>
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 fw-bold">
            Log In
          </button>
        </form>

        {message && (
          <div className={`alert mt-3 ${isError ? 'alert-danger' : 'alert-success'}`} role="alert">
            {message}
          </div>
        )}

        <div className="text-center mt-3">
          <p className="mb-0">Don't have an account? <Link to="/register" className="text-decoration-none">Register here</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;