const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const dbConfig = require('../database/dbConfig');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // Middleware for cookies
const app = express();
const port = 4001;
require('dotenv').config()
// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
  });


//route de test 
