import * as gameService from '../services/gameService.js';

export const createGame = async (req, res, next) => {
    try {
        const game = await gameService.createGame(req.body);
        res.status(201).json(game);
    } catch (error) {
        next(error);
    }
};

export const getGames = async (req, res, next) => {
    try {
        const games = await gameService.getAllGames();
        res.json(games);
    } catch (error) {
        next(error);
    }
};

export const getGameById = async (req, res, next) => {
    try {
        const game = await gameService.getGameById(req.params.id);
        if (game) {
            res.json(game);
        } else {
            res.status(404).json({ message: 'Game not found' });
        }
    } catch (error) {
        next(error);
    }
};

export const updateGame = async (req, res, next) => {
    try {
        const updatedGame = await gameService.updateGame(req.params.id, req.body);
        if (updatedGame) {
            res.json(updatedGame);
        } else {
            res.status(404).json({ message: 'Game not found' });
        }
    } catch (error) {
        next(error);
    }
};

export const deleteGame = async (req, res, next) => {
    try {
        const deleted = await gameService.deleteGame(req.params.id);
        if (deleted) {
            res.status(204).end();
        } else {
            res.status(404).json({ message: 'Game not found' });
        }
    } catch (error) {
        next(error);
    }
};
