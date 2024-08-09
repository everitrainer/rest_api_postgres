import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import Studio from './studio.js';
import Game from './game.js';

const Movie = sequelize.define('Movie', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    release_date: {
        type: DataTypes.DATE,
    },
    genre: {
        type: DataTypes.STRING,
    },
    poster_url: {
        type: DataTypes.TEXT,
    },
}, {
    tableName: 'movies',
    timestamps: true, // Automatically adds createdAt and updatedAt
});

const Actor = sequelize.define('Actor', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    age: {
        type: DataTypes.INTEGER,
    },
    gender: {
        type: DataTypes.STRING,
    },
}, {
    tableName: 'actors',
    timestamps: true, // Automatically adds createdAt and updatedAt
});

const MovieActor = sequelize.define('MovieActor', {}, {
    tableName: 'movie_actors',
    timestamps: false,
});

// Define associations
Movie.belongsToMany(Actor, { through: MovieActor, foreignKey: 'movie_id' });
Actor.belongsToMany(Movie, { through: MovieActor, foreignKey: 'actor_id' });


// Define User model
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
}, {
    tableName: 'users',
    timestamps: true, // Automatically adds createdAt and updatedAt
});

// Define Movie model
// const Movie = sequelize.define('Movie', {
//     rating: {
//         type: DataTypes.INTEGER,
//     },
//     title: {
//         type: DataTypes.STRING(255),
//         allowNull: false,
//     },
//     description: {
//         type: DataTypes.TEXT,
//     },
//     release_date: {
//         type: DataTypes.DATE,
//     },
//     genre: {
//         type: DataTypes.STRING(100),
//     },
//     poster_url: {
//         type: DataTypes.TEXT,
//     },
// }, {
//     tableName: 'movies',
//     timestamps: true, // Automatically adds createdAt and updatedAt
// });

// Define MovieRating model
const MovieRating = sequelize.define('MovieRating', {
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'movie_ratings',
    timestamps: true, // Automatically adds createdAt
});

// Set up associations
Movie.belongsTo(User, {
    foreignKey: 'created_by',
    onDelete: 'SET NULL', // When a user is deleted, set this field to NULL
});

User.hasMany(Movie, {
    foreignKey: 'created_by',
});

MovieRating.belongsTo(Movie, {
    foreignKey: 'movie_id',
    onDelete: 'CASCADE', // When a movie is deleted, delete related movie ratings
});

MovieRating.belongsTo(User, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE', // When a user is deleted, delete related movie ratings
});

Movie.hasMany(MovieRating, {
    foreignKey: 'movie_id',
});

User.hasMany(MovieRating, {
    foreignKey: 'user_id',
});
const syncDatabase = async () => {
    await sequelize.sync();
};

export { sequelize, syncDatabase, Studio, Game, Movie, Actor, MovieActor, User, MovieRating };
