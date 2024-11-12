const express = require('express');
const oracledb = require('oracledb');
const dbConfig = require('./dbConfig');  // Assurez-vous que ce fichier est bien configuré

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

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
app.get('/data', async (req, res) => {
    let connection;
    try {
      connection = await oracledb.getConnection(dbConfig);
  
      const result = await connection.execute(`SELECT * FROM your_table_name`);  // Remplace 'your_table_name' par le nom de ta table
      res.json(result.rows);
  
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
  