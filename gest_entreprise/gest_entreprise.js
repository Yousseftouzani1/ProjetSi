const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const oracledb = require('oracledb');
const path = require('path');
const cookieParser = require('cookie-parser');
// Importer les routes
const gestionaire=require('../gestionaire_stage/routerCreation');
const ecole =require('../Ecole/Ecole')
const offreRoutes = require('./offre');
const candidature =require('./Candidature');
const tuteur =require('./tuteur');
const Stage =require ('./Stage');
const convocation=require('../Etudiant/Convocation');
const gest_ecole=require('../gest_ecole/gest.ecole')
const candidater =require('../Etudiant/Candidater')
const entreprise =require('../Entreprise/Entreprise');
const stage=require('../Etudiant/stage');
// Configuration de la base de données Oracle
const dbConfig = require('../database/dbConfig');
const jwt = require('jsonwebtoken');
// Configuration de l'application Express
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cookieParser());

// Middleware

//app.use(cors());
const allowedOrigins = ['http://localhost:3001', 'http://localhost:3000']; // Add all potential origins
app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'] // Specify the HTTP methods you support
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(entreprise);
app.use(Stage);
app.use(stage);
app.use(ecole);
app.use(gest_ecole);
app.use(convocation);
app.use(gestionaire);
app.use(offreRoutes);
app.use(candidater);
app.use(candidature);
app.use(tuteur);
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
app.use('../Entreprise', express.static(__dirname + '/Entreprise'));
app.use('../gest_entreprise', express.static(__dirname + '/gest_entreprise'));
app.use('../Etudiant', express.static(__dirname + '/Etudiant'));

app.get('/Entreprise/Creer_gestionaire.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../Entreprise/Creer_gestionaire.html'));
});
app.get('/gest_entreprise/Creer_Offre.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../gest_entreprise/Creer_Offre.html'));
});
app.get('/ab', (req, res) => {
  res.sendFile(path.join(__dirname, '../Entreprise/dashboard_entreprise.html'));
});
app.get('/a', (req, res) => {
  res.sendFile(path.join(__dirname, '../gestionaire_stage/visualiser_ecole.html'));
});
app.get('/b', (req, res) => {
  res.sendFile(path.join(__dirname, '../gestionaire_stage/visualiserEntreprise.html'));
});
app.get('/aa', (req, res) => {
  res.sendFile(path.join(__dirname, '../gestionaire_stage/Creation_ecole.html'));
});
app.get('/bb', (req, res) => {
  res.sendFile(path.join(__dirname, '../gestionaire_stage/Creation_Entreprise.html'));
});
app.get('/bbb', (req, res) => {
  res.sendFile(path.join(__dirname, '../Etudiant/CV.html'));
});
app.get('/bbbb', (req, res) => {
  res.sendFile(path.join(__dirname, '../gest_entreprise/Postulation.html'));
});
app.get('/bbbbb', (req, res) => {
  res.sendFile(path.join(__dirname, '../gest_entreprise/Consulter_Offres.html'));
});
app.get('/conv', (req, res) => {
  res.sendFile(path.join(__dirname, '../Etudiant/Convocation.html'));
});
app.get('/stage', (req, res) => {
  res.sendFile(path.join(__dirname, '../gest_entreprise/Stage.html'));
});
app.get('/sta', (req, res) => {
  res.sendFile(path.join(__dirname, '../Etudiant/STAGE.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/ht.html'));
});




/*
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Creer_Offre.html'));
});*/
app.get('/ecoleC', (req, res) => {
  res.sendFile(path.join(__dirname, '../gestionaire_stage/Creation_ecole.html'));
});
app.get('/ecoleV', (req, res) => {
  res.sendFile(path.join(__dirname, '../gestionaire_stage/visualiser_ecole.html'));
});
app.get('/entrepriseC', (req, res) => {
  res.sendFile(path.join(__dirname, '../gestionaire_stage/Creation_Entreprise.html'));
});
app.get('/entrepriseV', (req, res) => {
  res.sendFile(path.join(__dirname, '../gestionaire_stage/visualiserEntreprise.html'));
});
// Utilisation des routes
app.get('/g', (req, res) => {
    res.sendFile(path.join(__dirname, '../Etudiant/visualiser_Offre.html'));
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
   