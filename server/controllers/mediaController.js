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
        const { id } = req.params; 
        const apiKey = process.env.TMDB_API_KEY;
        
        // 1. Add &append_to_response=credits to the API URL
        const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US&append_to_response=credits`);
        
        // 2. Safely search the crew array for the Director
        let directorName = "Unknown Director";
        if (tmdbResponse.data.credits && tmdbResponse.data.credits.crew) {
            const directorData = tmdbResponse.data.credits.crew.find(person => person.job === "Director");
            if (directorData) {
                directorName = directorData.name;
            }
        }

        // 3. Attach the director's name to the data we send to the frontend
        const movieData = {
            ...tmdbResponse.data,
            director: directorName
        };
        
        res.json(movieData);
    } catch (error) {
        console.error("Error fetching movie details:", error);
        res.status(500).json({ error: "Couldn't get the movie details" });
    }
};

const updateUserMedia = async (req, res) => {
    try {
        // We extract exactly what your Media and UserMedia schemas need
        const { 
            userId, externalId, title, posterPath, releaseYear, description, creator, 
            status, rating, reviewText, isPhysical, format, physicalStatus 
        } = req.body;

        // Step A: Check if the movie exists in the global Media collection. If not, add it.
        let mediaItem = await Media.findOne({ externalId: externalId });
        if (!mediaItem) {
            mediaItem = new Media({
                externalId: externalId,
                type: "movie",
                title: title,
                creator: creator, // This is where we save the Director
                posterPath: posterPath,
                releaseYear: releaseYear,
                description: description
            });
            await mediaItem.save();
        }

        // Step B: Update or Create the User's personal connection to this movie
        const userMediaEntry = await UserMedia.findOneAndUpdate(
            { userId: userId, mediaId: mediaItem._id },
            { 
                status: status || "save", // Matches your default
                rating: rating || 0, 
                reviewText: reviewText || "", // Matches your schema
                isPhysical: isPhysical || false,
                format: format || "none",
                physicalStatus: physicalStatus || "none"
            },
            { upsert: true, new: true } // upsert: true means "create it if it doesn't exist yet"
        );

        res.status(200).json({ message: "Saved successfully to your library!" });

    } catch (error) {
        console.error("Error saving user media:", error);
        res.status(500).json({ message: "Server error while saving." });
    }
};

const getUserMedia = async (req, res) => {
    try {
        const { userId, externalId } = req.params;

        // 1. First, find if the movie exists in our database
        const mediaItem = await Media.findOne({ externalId: externalId });
        if (!mediaItem) {
            return res.status(200).json(null); // Movie isn't in our DB yet, so the user hasn't saved it
        }

        // 2. If the movie exists, look for the user's specific connection to it
        const userMediaEntry = await UserMedia.findOne({ userId: userId, mediaId: mediaItem._id });
        
        // 3. Send the data back to the frontend (or null if they haven't rated it yet)
        res.status(200).json(userMediaEntry);

    } catch (error) {
        console.error("Error fetching user media:", error);
        res.status(500).json({ message: "Server error while fetching data." });
    }
};

module.exports = { getPopularMovies, getMovieDetails, updateUserMedia, getUserMedia};