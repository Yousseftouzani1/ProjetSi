const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const dbConfig = require('./dbConfig');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // Middleware for cookies
const app = express();
const port = 4000;
require('dotenv').config()
// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
  });
//   middlewares for the server  
app.use(express.json());
app.use(cookieParser());
app.use(cors()); // pour permettre les  cross-origin requests
app.post('/login1',(req,res)=>{
    const { username, password } = req.body;
    if (username === 'user' && password === 'pass') {
        const user = { username: username };
        const access_token = jwt.sign(user, process.env.ACCESS_TOKEN_KEY,{expiresIn: '1h'});
  
      //define http HTTP-only cookie
      res.cookie('access_token', accessToken, {
          httpOnly: true,
          secure: false, // Set to true in production (requires HTTPS)
          maxAge: 3600000 // 1 heure 
                  });
      
                  res.json({ message: 'Login successful!' });
    } else {
        res.sendStatus(403); // wrong data 
    }
})
/*
app.get('/login', (req, res) => {
    res.send("Please use POST to log in.");
});
*/
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
////////////////////////////////////////////////////    login etudiant 
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let connection;
  try {
      connection = await oracledb.getConnection(dbConfig);
      // Execute query to verify user existence and passsword // can be changed depending on  the user 
      const result = await connection.execute(
          `SELECT COUNT(*) AS count FROM Etudiant WHERE username = :username AND password = :password`,
          { username, password },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (result.rows[0].COUNT > 0) {
          // Generate JWT token
          const user = { username:username , password:password };
          const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1h' });

          // Set token in an HTTP-only cookie
          res.cookie('access_token', accessToken, {
              httpOnly: true,
              secure: false, // Set to true in production (requires HTTPS)
              maxAge: 3600000 // 1 hour
          });

          res.json({ message: 'Login successful!' });
      } else {
          res.status(401).send('Invalid username or password');
      }
  } catch (err) {
      console.error('Error during login:', err);
      res.status(500).send('Server error');
  } finally {
      if (connection) {
          try {
              await connection.close();
          } catch (closeErr) {
              console.error('Error closing connection:', closeErr);
          }
      }
  }
});
// Protected route example
app.get('/protected', (req, res) => {
  const token = req.cookies.access_token;
  if (!token) {
      return res.status(401).send('Access denied');
  }
  try {
      const verified = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
      res.json({ message: 'Access granted!', user: verified });
  } catch (err) {
      res.status(403).send('Invalid token');
  }
});
////////////////////////////////////////////////////    login entreprise 
app.post('/loginEntreprise', async (req, res) => {
  const { nom, mdp_entreprise } = req.body; // Utiliser les noms de colonnes existants
  let connection;

  try {
      connection = await oracledb.getConnection(dbConfig);

      // Requête pour vérifier l'existence de l'utilisateur
      const result = await connection.execute(
          `SELECT COUNT(*) AS count 
           FROM Entreprise 
           WHERE nom = :nom AND mdp_entreprise = :mdp_entreprise`,
          { nom, mdp_entreprise }, // Lier les variables
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (result.rows[0].COUNT > 0) {
          // Générer un token JWT
          const user = { nom:nom,mdp_entreprise:mdp_entreprise }; // Inclure uniquement des données non sensibles
          const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1h' });

          // Envoyer le token dans un cookie HTTP-only
          res.cookie('access_token', accessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production', // Activer en production
              maxAge: 3600000 // 1 heure
          });

          res.json({ message: 'Connexion réussie !', token: accessToken });
      } else {
          res.status(401).send('Nom ou mot de passe invalide');
      }
  } catch (err) {
      console.error('Erreur lors de la connexion :', err);
      res.status(500).send('Erreur interne du serveur');
  } finally {
      if (connection) {
          try {
              await connection.close();
          } catch (closeErr) {
              console.error('Erreur lors de la fermeture de la connexion :', closeErr);
          }
      }
  }
});
