import Game from '../models/game.js';

export const createGame = async (data) => {
    return Game.create(data);
};

export const getAllGames = async () => {
    return Game.findAll();
};

export const getGameById = async (id) => {
    return Game.findByPk(id);
};

export const updateGame = async (id, data) => {
    const game = await getGameById(id);
    if (game) {
        return game.update(data);
    }
    return null;
};

export const deleteGame = async (id) => {
    const game = await getGameById(id);
    if (game) {
        await game.destroy();
        return true;
    }
    return false;
};
