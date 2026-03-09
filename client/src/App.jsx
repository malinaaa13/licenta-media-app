import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Welcome from "./pages/Welcome";
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome/>}></Route>

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />}/>
        
        <Route path="/home" element={<Home/>}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;