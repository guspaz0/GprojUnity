const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
sequelize.define('Projects', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL(11,2),
        allowNull: false,
    },
    visibility: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    shortDescription: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    image: { 
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    views: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    }
    },
    {
        timestamps: true,
        freezeTableName: true
    }
    );

};