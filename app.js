const express = require('express');
const oracledb = require('oracledb');
const dbConfig = require('./database/dbConfig');  // Assurez-vous que ce fichier est bien configuré


const app = express();
const port = 3000;

// Route de test pour vérifier la connexion à la base de données
app.get('/test-db', async (req, res) => {
  let connection;
  try {
    // Établit la connexion avec la base de données Oracle
    connection = await oracledb.getConnection(dbConfig);

    // Exécute une requête de test
    const result = await connection.execute(`SELECT 'Connexion réussie!' AS status FROM dual`);
    res.json({ message: result.rows[0][0] });  // Retourne le résultat

  } catch (err) {
    console.error('Erreur de connexion à la base de données:', err);
    res.status(500).json({ error: 'Erreur de connexion à la base de données' });

  } finally {
    // Fermer la connexion
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Erreur lors de la fermeture de la connexion:', err);
      }
    }
  }
});

// Route pour récupérer les données de la table Etudiant
app.get('/data', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Exécutez une requête pour récupérer les données
    const result = await connection.execute(`SELECT nom FROM Etudiant`);
    
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

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
