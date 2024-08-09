import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Studio = sequelize.define('Studio', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default Studio;
