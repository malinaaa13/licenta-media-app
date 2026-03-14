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

module.exports = {getPopularMovies};