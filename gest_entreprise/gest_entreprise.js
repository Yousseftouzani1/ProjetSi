const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const oracledb = require('oracledb');
const path = require('path');

// Importer les routes
const offreRoutes = require('./offre');
const candidature =require('./Candidature');
const tuteur =require('./tuteur');
const stage =require ('./Stage');
// Configuration de la base de données Oracle
const dbConfig = require('../database/dbConfig');

// Configuration de l'application Express
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(stage);
app.use(offreRoutes);
app.use(candidature);
app.use(tuteur);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'gest_entreprise')));
// Vérifier la connexion à la base de données Oracle
async function testOracleConnection() {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    console.log('Connected to OracleDB successfully.');
    await connection.close();
  } catch (error) {
    console.error('Failed to connect to OracleDB:', error);
    process.exit(1); // Arrête le serveur si la connexion échoue
  }
}
// Utilisation des routes
app.get('/gest.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'gest_entreprise.html'));
});
// Gestion des erreurs pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Démarrage du serveur
testOracleConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
