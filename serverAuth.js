const express = require('express');
const oracledb = require('oracledb');
const dbConfig = require('./dbConfig');
const jwt = require('jsonwebtoken');
const app = express();
const port = 4000;
require('dotenv').config()
// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
  });
app.use(express.json());
app.post('/login1',(req,res)=>{
    const { username, password } = req.body;
    if (username === 'user' && password === 'pass') {
        const user = { username: username };
        const access_token = jwt.sign(user, process.env.ACCESS_TOKEN_KEY);
        res.json({ access_token: access_token });
    } else {
        res.sendStatus(403); // Forbidden if credentials are invalid
    }
})
app.get('/login', (req, res) => {
    res.send("Please use POST to log in.");
});
//get data from the database 
app.get('/data', async (req, res) => {
    let connection;
    try {
      connection = await oracledb.getConnection(dbConfig);
  
      // Exécutez une requête pour récupérer les données
      const result = await connection.execute(`SELECT username,password FROM User_table`);
      
      // Affichez le résultat dans la console pour le débogage
      console.log('Résultat brut:', result);
      
      if (result.rows.length === 0) {
        res.status(404).json({ message: 'Aucune donnée trouvée dans la table Etudiant' });
      } else {
        res.json(result.rows); // Retourne les données
      }
  
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      res.status(500).json({ error: 'Erreur lors de la récupération des données' });
  
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error('Erreur lors de la fermeture de la connexion:', err);
        }
      }
    }
  });
////////////////////////////////////////////////////
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let connection;
  try {
      // Connect to the Oracle database
      connection = await oracledb.getConnection(dbConfig);

      // Execute query to verify user existence
      const result = await connection.execute(
          `
          SELECT COUNT(*) AS count
          FROM User_table 
          WHERE username = :username AND password = :password
          `,
          { username: username, password: password }, // Named binding
          { outFormat: oracledb.OUT_FORMAT_OBJECT } // Format output as objects
      );

      // Check if user exists
      if (result.rows[0].COUNT > 0) { // Adjust based on actual column names
          console.log('Utilisateur trouvé');
          const user = { username: username };
          const access_token = jwt.sign(user, process.env.ACCESS_TOKEN_KEY);
          res.json({ access_token: access_token });
      } else {
          res.status(401).send('Utilisateur ou mot de passe incorrect');
      }
  } catch (err) {
      console.error('Erreur lors de la connexion ou de l’exécution de la requête:', err);
      res.status(500).send('Erreur du serveur');
  } finally {
      if (connection) {
          try {
              await connection.close();
          } catch (closeErr) {
              console.error('Erreur lors de la fermeture de la connexion:', closeErr);
          }
      }
  }
});
