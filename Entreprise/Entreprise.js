const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const axios = require('axios');
const dbConfig = require('../database/dbConfig');
//const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // Middleware for cookies
const app = express();
const port = 4001;
app.use(express.json());
app.use(cookieParser());
app.use(cors());
require('dotenv').config()
// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
  });


//route de test 
// Test route to fetch data
async function fetchData(req, res) {
  try {
      const response = await axios.get('http://localhost:4000/data');
 
      res.json(response.data);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Internal Server Error');
  }
}
app.get('/getdata', fetchData);
// creer gestionnaire entreprise 
// superviser et visualiser tt les gestionnaires et acceder a tt leur données 



