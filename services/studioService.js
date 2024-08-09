import Studio from '../models/studio.js';

export const createStudio = async (data) => {
    return Studio.create(data);
};

export const getAllStudios = async () => {
    return Studio.findAll();
};

export const getStudioById = async (id) => {
    return Studio.findByPk(id);
};

export const updateStudio = async (id, data) => {
    const studio = await getStudioById(id);
    if (studio) {
        return studio.update(data);
    }
    return null;
};

export const deleteStudio = async (id) => {
    const studio = await getStudioById(id);
    if (studio) {
        await studio.destroy();
        return true;
    }
    return false;
};
