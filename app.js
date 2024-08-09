import express from 'express';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { syncDatabase } from './models/index.js';
import config from './config/config.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { Movie, Actor, MovieActor, User, MovieRating } from './models/index.js';
import { Sequelize } from 'sequelize';

const app = express();
app.use(express.json());
// Middleware
app.use(cors());

app.use('/api/v1/', routes);

// Helper functions
const hashPassword = async (password) => {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
};

const comparePasswords = async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
        }
        req.userId = decoded.userId;
        next();
    });
};

// Routes
app.get('/api/public/movies', async (req, res) => {
    try {
        const movies = await Movie.findAll({
            include: {
                model: MovieRating,
                attributes: []
            },
            attributes: {
                include: [[Sequelize.fn('AVG', Sequelize.col('MovieRatings.rating')), 'rating']]
            },
            group: ['Movie.id']
        });
        res.status(200).json({ success: true, movies });
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.get('/api/public/movies/:movieId', async (req, res) => {
    try {
        const movie = await Movie.findByPk(req.params.movieId, {
            include: {
                model: MovieRating,
                attributes: []
            },
            attributes: {
                include: [[Sequelize.fn('AVG', Sequelize.col('MovieRatings.rating')), 'rating']]
            },
            group: ['Movie.id']
        });

        if (!movie) {
            return res.status(404).json({ success: false, error: 'Movie not found' });
        }

        res.status(200).json({ success: true, movie });
    } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.get('/api/user/:userId/ratings/:movieId', async (req, res) => {
    try {
        const rating = await MovieRating.findOne({
            where: {
                userId: req.params.userId,
                movieId: req.params.movieId
            }
        });

        if (!rating) {
            return res.status(404).json({ success: false, error: 'Rating not found' });
        }

        res.status(200).json({ success: true, rating: rating.rating });
    } catch (error) {
        console.error('Error fetching user rating:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({
            where: {
                [Sequelize.Op.or]: [{ username }, { email }]
            }
        });

        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Username or email already exists' });
        }

        const hashedPassword = await hashPassword(password);
        const newUser = await User.create({ username, email, password: hashedPassword });

        const token = generateToken(newUser.id);
        res.status(201).json({ success: true, user: newUser, token });
    } catch (error) {
        console.error('Error signing up:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        const user = await User.findOne({
            where: {
                [Sequelize.Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
            }
        });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid username or email or password' });
        }

        const passwordMatch = await comparePasswords(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, error: 'Invalid username or email or password' });
        }

        const token = generateToken(user.id);
        res.status(200).json({ success: true, user, token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.post('/api/movies/:movieId/rating', verifyToken, async (req, res) => {
    try {
        const { movieId } = req.params;
        const { rating } = req.body;
        const userId = req.userId;

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: 'Invalid rating. Rating must be an integer between 1 and 5.' });
        }

        const [ratingRecord, created] = await MovieRating.upsert({
            movieId,
            userId,
            rating
        });

        if (!created) {
            return res.status(200).json({ success: true, rating: ratingRecord });
        }

        res.status(201).json({ success: true, rating: ratingRecord });
    } catch (error) {
        console.error('Error adding or updating rating:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.get('/api/user/:userId/ratings', verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        const ratings = await MovieRating.findAll({
            where: { userId },
            attributes: ['movieId', 'rating']
        });

        const userRatings = {};
        ratings.forEach((rating) => {
            userRatings[rating.movieId] = rating.rating;
        });

        res.status(200).json({ success: true, ratings: userRatings });
    } catch (error) {
        console.error('Error fetching user ratings:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// POST endpoint to store movie details
app.post('/api/movies', async (req, res) => {
    try {
        const { title, description, release_date, genre, poster_url } = req.body;
        const newMovie = await Movie.create({
            title,
            description,
            release_date,
            genre,
            poster_url
        });
        res.status(201).json({ success: true, movie: newMovie });
    } catch (error) {
        console.error('Error storing movie details:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// GET endpoint to fetch all movies
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await Movie.findAll();
        res.status(200).json({ success: true, movies });
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// GET endpoint to fetch a movie by ID
app.get('/api/movies/:id', async (req, res) => {
    const movieId = req.params.id;
    try {
        const movie = await Movie.findByPk(movieId);
        if (!movie) {
            return res.status(404).json({ success: false, error: 'Movie not found' });
        }
        res.status(200).json({ success: true, movie });
    } catch (error) {
        console.error('Error fetching movie by ID:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// PUT endpoint to update a movie by ID
app.put('/api/movies/:id', async (req, res) => {
    const movieId = req.params.id;
    const { title, description, release_date, genre, poster_url } = req.body;
    try {
        const movie = await Movie.findByPk(movieId);
        if (!movie) {
            return res.status(404).json({ success: false, error: 'Movie not found' });
        }
        await movie.update({
            title,
            description,
            release_date,
            genre,
            poster_url,
            updated_at: new Date()
        });
        res.status(200).json({ success: true, message: 'Movie updated successfully' });
    } catch (error) {
        console.error('Error updating movie by ID:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// DELETE endpoint to delete a movie by ID
app.delete('/api/movies/:id', async (req, res) => {
    const movieId = req.params.id;
    try {
        const movie = await Movie.findByPk(movieId);
        if (!movie) {
            return res.status(404).json({ success: false, error: 'Movie not found' });
        }
        await movie.destroy();
        res.status(200).json({ success: true, message: 'Movie deleted successfully' });
    } catch (error) {
        console.error('Error deleting movie by ID:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// POST endpoint to add a new actor
app.post('/api/actors', async (req, res) => {
    try {
        const { name, age, gender } = req.body;
        const newActor = await Actor.create({ name, age, gender });
        res.status(201).json({ success: true, actor: newActor });
    } catch (error) {
        console.error('Error storing actor details:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// GET endpoint to fetch all actors
app.get('/api/actors', async (req, res) => {
    try {
        const actors = await Actor.findAll();
        res.status(200).json({ success: true, actors });
    } catch (error) {
        console.error('Error fetching actors:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// GET endpoint to fetch an actor by ID
app.get('/api/actors/:id', async (req, res) => {
    const actorId = req.params.id;
    try {
        const actor = await Actor.findByPk(actorId);
        if (!actor) {
            return res.status(404).json({ success: false, error: 'Actor not found' });
        }
        res.status(200).json({ success: true, actor });
    } catch (error) {
        console.error('Error fetching actor by ID:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// PUT endpoint to update an actor by ID
app.put('/api/actors/:id', async (req, res) => {
    const actorId = req.params.id;
    const { name, age, gender } = req.body;
    try {
        const actor = await Actor.findByPk(actorId);
        if (!actor) {
            return res.status(404).json({ success: false, error: 'Actor not found' });
        }
        await actor.update({ name, age, gender, updated_at: new Date() });
        res.status(200).json({ success: true, message: 'Actor updated successfully' });
    } catch (error) {
        console.error('Error updating actor by ID:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// DELETE endpoint to delete an actor by ID
app.delete('/api/actors/:id', async (req, res) => {
    const actorId = req.params.id;
    try {
        const actor = await Actor.findByPk(actorId);
        if (!actor) {
            return res.status(404).json({ success: false, error: 'Actor not found' });
        }
        await actor.destroy();
        res.status(200).json({ success: true, message: 'Actor deleted successfully' });
    } catch (error) {
        console.error('Error deleting actor by ID:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// POST endpoint to associate multiple actors with a movie
app.post('/api/movies/:movieId/actors', async (req, res) => {
    const movieId = req.params.movieId;
    const { actorIds } = req.body;
    try {
        const movie = await Movie.findByPk(movieId);
        if (!movie) {
            return res.status(404).json({ success: false, error: 'Movie not found' });
        }
        const actors = await Actor.findAll({ where: { id: actorIds } });
        if (actors.length !== actorIds.length) {
            return res.status(404).json({ success: false, error: 'One or more actors not found' });
        }
        const existingAssociations = await MovieActor.findAll({
            where: { movie_id: movieId, actor_id: actorIds }
        });
        const existingActorIds = existingAssociations.map(association => association.actor_id);
        const newActorIds = actorIds.filter(actorId => !existingActorIds.includes(actorId));
        const associations = newActorIds.map(actorId => ({ movie_id: movieId, actor_id: actorId }));
        await MovieActor.bulkCreate(associations);
        res.status(201).json({ success: true, message: 'Actors associated with movie successfully' });
    } catch (error) {
        console.error('Error associating actors with movie:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// PUT endpoint to update associations between actors and a movie
app.put('/api/movies/:movieId/actors', async (req, res) => {
    const movieId = req.params.movieId;
    const { addActorIds, removeActorIds } = req.body;
    try {
        const movie = await Movie.findByPk(movieId);
        if (!movie) {
            return res.status(404).json({ success: false, error: 'Movie not found' });
        }
        if (addActorIds && addActorIds.length > 0) {
            const actors = await Actor.findAll({ where: { id: addActorIds } });
            if (actors.length !== addActorIds.length) {
                return res.status(404).json({ success: false, error: 'One or more actors not found' });
            }
            const existingAssociations = await MovieActor.findAll({
                where: { movie_id: movieId, actor_id: addActorIds }
            });
            const existingActorIds = existingAssociations.map(association => association.actor_id);
            const newActorIds = addActorIds.filter(actorId => !existingActorIds.includes(actorId));
            const associations = newActorIds.map(actorId => ({ movie_id: movieId, actor_id: actorId }));
            await MovieActor.bulkCreate(associations);
        }
        if (removeActorIds && removeActorIds.length > 0) {
            await MovieActor.destroy({
                where: { movie_id: movieId, actor_id: removeActorIds }
            });
        }
        res.status(200).json({ success: true, message: 'Associations updated successfully' });
    } catch (error) {
        console.error('Error updating associations between actors and movie:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// GET endpoint to get association details of actors with movies
app.get('/api/actors-movies', async (req, res) => {
    try {
        const result = await MovieActor.findAll({
            include: [{ model: Movie }, { model: Actor }]
        });
        const moviesWithActors = {};
        result.forEach(({ movie, actor }) => {
            const movieId = movie.id;
            const actorDetails = {
                id: actor.id,
                name: actor.name,
                age: actor.age,
                gender: actor.gender
            };
            if (!moviesWithActors[movieId]) {
                moviesWithActors[movieId] = {
                    id: movieId,
                    title: movie.title,
                    description: movie.description,
                    release_date: movie.release_date,
                    genre: movie.genre,
                    poster_url: movie.poster_url,
                    actors: [actorDetails]
                };
            } else {
                moviesWithActors[movieId].actors.push(actorDetails);
            }
        });
        const moviesWithActorsArray = Object.values(moviesWithActors);
        res.status(200).json({ success: true, moviesWithActors: moviesWithActorsArray });
    } catch (error) {
        console.error('Error fetching association details of actors with movies:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.use(notFoundHandler);
app.use(errorHandler);

syncDatabase().then(() => {
    app.listen(config.port, () => {
        console.log(`Server is running on http://localhost:${config.port}`);
    });
}).catch((err) => {
    console.error('Unable to connect to the database:', err);
});
