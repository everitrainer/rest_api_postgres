import * as studioService from '../services/studioService.js';

export const createStudio = async (req, res, next) => {
    try {
        const studio = await studioService.createStudio(req.body);
        res.status(201).json(studio);
    } catch (error) {
        next(error);
    }
};

export const getStudios = async (req, res, next) => {
    try {
        const studios = await studioService.getAllStudios();
        res.json(studios);
    } catch (error) {
        next(error);
    }
};

export const getStudioById = async (req, res, next) => {
    try {
        const studio = await studioService.getStudioById(req.params.id);
        if (studio) {
            res.json(studio);
        } else {
            res.status(404).json({ message: 'Studio not found' });
        }
    } catch (error) {
        next(error);
    }
};

export const updateStudio = async (req, res, next) => {
    try {
        const updatedStudio = await studioService.updateStudio(req.params.id, req.body);
        if (updatedStudio) {
            res.json(updatedStudio);
        } else {
            res.status(404).json({ message: 'Studio not found' });
        }
    } catch (error) {
        next(error);
    }
};

export const deleteStudio = async (req, res, next) => {
    try {
        const deleted = await studioService.deleteStudio(req.params.id);
        if (deleted) {
            res.status(204).end();
        } else {
            res.status(404).json({ message: 'Studio not found' });
        }
    } catch (error) {
        next(error);
    }
};
