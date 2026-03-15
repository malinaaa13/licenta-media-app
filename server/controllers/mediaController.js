const axios = require("axios")
const Media = require("../models/Media");
const UserMedia = require("../models/UserMedia");

const getPopularMovies = async (req, res) => {
    try{
            const apiKey = process.env.TMDB_API_KEY;
            const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=2`);
            res.json(tmdbResponse.data.results);
        }
        catch(error) {
            console.error("Error at TMDB:", error);
            res.status(500).json({ error: "Couldn't get the movies"});
        }
}


const getMovieDetails = async (req, res) => {
    try {
        const { id } = req.params; // Extragem ID-ul din link (ex: /api/media/movies/12345)
        const apiKey = process.env.TMDB_API_KEY;
        
        const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`);
        
        res.json(tmdbResponse.data);
    } catch (error) {
        console.error("Error fetching movie details:", error);
        res.status(500).json({ error: "Couldn't get the movie details" });
    }
};

module.exports = { getPopularMovies, getMovieDetails };