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
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Lists from './pages/Lists';
import CreateList from './pages/CreateList';
import ListDetails from './pages/ListDetails';
import EditList from './pages/EditList';
import Friends from './pages/Friends';
import ActivityFeed from './pages/ActivityFeed';
import PhysicalCollection from './pages/PhysicalCollection';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Welcome />}></Route>

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route path="/home" element={<Home />}></Route>
        <Route path="/search/:query" element={<SearchResults />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/popular" element={<PopularMovies />} />
        <Route path='/profile' element={<Profile />}></Route>
        <Route path="/user/:id" element={<PublicProfile />} />
        <Route path="/lists" element={<Lists />} />
        <Route path="/lists/create" element={<CreateList />} />
        <Route path="/list/:listId" element={<ListDetails />} />
        <Route path="/lists/edit/:listId" element={<EditList />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/activity" element={<ActivityFeed />} />
        <Route path="/shelf" element={<PhysicalCollection />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;