import sequelize from '../config/database.js';
import Studio from './studio.js';
import Game from './game.js';

const syncDatabase = async () => {
    await sequelize.sync();
};

export { sequelize, syncDatabase, Studio, Game };
