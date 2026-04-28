const axios = require("axios")
const Media = require("../models/Media");
const UserMedia = require("../models/UserMedia");

const getPopularMovies = async (req, res) => {
    try {
        const apiKey = process.env.TMDB_API_KEY;
        const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=2`);
        res.json(tmdbResponse.data.results);
    }
    catch (error) {
        console.error("Error at TMDB:", error);
        res.status(500).json({ error: "Couldn't get the movies" });
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

const searchMovies = async (req, res) => {
    try {
        const { query } = req.params;
        const apiKey = process.env.TMDB_API_KEY;

        const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=en-US&query=${query}&page=1`);

        res.json(tmdbResponse.data.results);
    } catch (error) {
        console.error("Error searching movies:", error);
        res.status(500).json({ error: "Couldn't search for movies" });
    }
};

const getUserLibrary = async (req, res) => {
    try {
        const { userId } = req.params;

        const library = await UserMedia.find({ userId: userId }).populate('mediaId');

        res.status(200).json(library);
    } catch (error) {
        console.error("Error fetching user library:", error);
        res.status(500).json({ message: "Server error while fetching library." });
    }
};

const removeUserMedia = async (req, res) => {
    try {
        const { recordId } = req.params;
        await UserMedia.findByIdAndDelete(recordId);

        res.status(200).json({ message: "Movie removed from collection. " });
    } catch (error) {
        console.error("Error removing media: ", error);
        res.status(500).json({ message: "Server error while removing movie." });

    }
}

//cauta filmul si toti utilizatorii care au scris o recenzie pentru el
const getMovieReviews = async (req, res) => {
    try {
        const { tmdbId } = req.params;
        const media = await Media.findOne({ externalId: tmdbId });
        if (!media) {
            return res.status(200).json([]);
        }
        const reviews = await UserMedia.find({
            mediaId: media._id,
            reviewText: { $exists: true, $ne: "" }
        }).populate('userId', 'username profilePicture');

        res.status(200).json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Server error fetching reviews. " })
    }
};

const getSimilarMovies = async (req, res) => {
    try {
        const { tmdbId } = req.params;
        const apiKey = process.env.TMDB_API_KEY;

        let response = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}/recommendations?api_key=${apiKey}`);
        if (response.data.results.length === 0) {
            response = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}/similar?api_key=${apiKey}`);
        }

        res.status(200).json(response.data.results);
    } catch (error) {
        console.error("Error fetching similar movies:", error);
        res.status(500).json({ message: "Server error fetching similar movies." });

    }
};


// ─────────────────────────────────────────────────────────────────────────────
// PHYSICAL COLLECTION CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/media/user/:userId/physical
 * Returns every UserMedia record for this user where isPhysical === true,
 * with the associated Media document populated (for title, posterPath, externalId).
 */
const getPhysicalCollection = async (req, res) => {
    try {
        const { userId } = req.params;

        const physicalItems = await UserMedia.find({ userId, isPhysical: true })
            .populate('mediaId')      // pull in title, posterPath, externalId
            .sort({ shelfNumber: 1, createdAt: 1 }); // keep shelves ordered

        res.status(200).json(physicalItems);
    } catch (error) {
        console.error("Error fetching physical collection:", error);
        res.status(500).json({ message: "Server error fetching physical collection." });
    }
};

/**
 * POST /api/media/user/:userId/physical/add
 * Body: { tmdbId, title, posterPath, releaseYear, description, creator,
 *         format, physicalStatus, price, purchaseDate, shelfNumber }
 *
 * 1. Ensures the movie exists in the global Media collection (creates if absent).
 * 2. Upserts a UserMedia entry with isPhysical: true and the supplied physical fields.
 *    Uses the same upsert pattern as updateUserMedia so it's safe even if the user
 *    already has this movie in their regular library.
 */
const addToPhysicalCollection = async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            tmdbId, title, posterPath, releaseYear, description, creator,
            format, physicalStatus, price, purchaseDate, shelfNumber
        } = req.body;

        // Step A – ensure global Media record exists
        let mediaItem = await Media.findOne({ externalId: String(tmdbId) });
        if (!mediaItem) {
            mediaItem = new Media({
                externalId: String(tmdbId),
                type: "movie",
                title,
                creator: creator || "Unknown",
                posterPath,
                releaseYear,
                description
            });
            await mediaItem.save();
        }

        // Step B – upsert the UserMedia entry, marking it as a physical copy
        const entry = await UserMedia.findOneAndUpdate(
            { userId, mediaId: mediaItem._id },
            {
                $set: {
                    isPhysical: true,
                    format: format || "none",
                    physicalStatus: physicalStatus || "available",
                    price: price != null ? Number(price) : null,
                    purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                    shelfNumber: shelfNumber ? Number(shelfNumber) : 1,
                    // Preserve library status if the document already exists
                }
            },
            { upsert: true, new: true }
        );

        // Return the entry populated so the frontend can render it immediately
        const populated = await entry.populate('mediaId');
        res.status(200).json({ message: "Added to physical collection!", item: populated });

    } catch (error) {
        console.error("Error adding to physical collection:", error);
        res.status(500).json({ message: "Server error while adding to physical collection." });
    }
};

/**
 * PUT /api/media/user/:userId/physical/move
 * Body: { recordId, shelfNumber }
 * Called when a spine is dragged from one shelf and dropped onto another.
 * Only updates the shelfNumber field; all other fields are untouched.
 */
const moveShelf = async (req, res) => {
    try {
        const { recordId, shelfNumber } = req.body;

        if (!recordId || shelfNumber == null) {
            return res.status(400).json({ message: "recordId and shelfNumber are required." });
        }

        const updated = await UserMedia.findByIdAndUpdate(
            recordId,
            { $set: { shelfNumber: Number(shelfNumber) } },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "UserMedia record not found." });
        }

        res.status(200).json({ message: "Shelf updated.", shelfNumber: updated.shelfNumber });
    } catch (error) {
        console.error("Error moving shelf:", error);
        res.status(500).json({ message: "Server error while updating shelf." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW INTEGRATION SNIPPET
// ─────────────────────────────────────────────────────────────────────────────
// In your existing review-submit handler (e.g. inside updateUserMedia or a
// dedicated submitReview controller), add the highlighted lines below.
// The frontend sends { ..., isPhysical: true, format: "blu-ray" } when the
// "I own this physically" checkbox is checked:
//
//   const userMediaEntry = await UserMedia.findOneAndUpdate(
//     { userId, mediaId: mediaItem._id },
//     {
//       status:         status        || "save",
//       rating:         rating        || 0,
//       reviewText:     reviewText    || "",
//       // ↓ Physical-ownership fields – only applied when checkbox is checked
//       isPhysical:     isPhysical    || false,   // <-- ADD THIS
//       format:         format        || "none",  // <-- ADD THIS
//       physicalStatus: physicalStatus || "none",
//       // shelfNumber, price, purchaseDate will keep their existing values
//     },
//     { upsert: true, new: true }
//   );
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
    getPopularMovies, getMovieDetails,
    updateUserMedia, getUserMedia, searchMovies, getUserLibrary,
    removeUserMedia, getMovieReviews, getSimilarMovies,
    // Physical collection
    getPhysicalCollection, addToPhysicalCollection, moveShelf
};