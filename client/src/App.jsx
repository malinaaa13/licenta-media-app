import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Welcome from "./pages/Welcome";
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome/>}></Route>

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />}/>
        
        <Route path="/home" element={<Home/>}></Route>
        <Route path="/movie/:id" element={<MovieDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;