import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Welcome from "./pages/Welcome";
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import SearchResults from './pages/SearchResults';
import Collections from './pages/Collections';
import Navbar from './components/Navbar';
import PopularMovies from './pages/PopularMovies';

function App() {
  return (
    <BrowserRouter>
    <Navbar />
      <Routes>
        <Route path="/" element={<Welcome/>}></Route>

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />}/>
        
        <Route path="/home" element={<Home/>}></Route>
        <Route path="/search/:query" element={<SearchResults />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/popular" element={<PopularMovies />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;