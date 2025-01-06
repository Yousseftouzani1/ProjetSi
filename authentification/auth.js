const express = require('express');
const oracledb = require('oracledb');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet'); // Optionnel mais utile
const cookieParser = require('cookie-parser');
require('dotenv').config();
const dbConfig = require('../database/dbConfig');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
// Serve static files from the 'authentification' folder
app.use(express.static(path.join(__dirname, 'authentification')));
// Serve the root page (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Etudiant/visualiser_Offre.html'));
});
// Routes pour les étudiants

app.get('/test.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});
app.get('/ajouterEtudiant', (req, res) => {
    res.sendFile(path.join(__dirname, '../Ecole/create_etud.html'));
});
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
// Désactive certaines protections pour éviter les conflits (optionnel)
// Middleware pour définir Content-Security-Policy permissive
app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; img-src * data:;"
    );
    next();
  });
const { authenticateToken } = require('./authMid');
const { checkRole } =require('./checkMID');
const authRouter = require('./routerAuth');
app.use(authRouter)

app.get('/Etudiant/visualiser_Offre.html', authenticateToken, checkRole('etudiant'), (req, res) => {
    // Accès à l'ID de l'étudiant via req.user.studentId
    res.sendFile(path.join(__dirname, '../Etudiant/visualiser_Offre.html'));
    
});
// Routes pour les responsables de stage
app.get('/gestionaire_stage/visualiser_ecole.html', authenticateToken, (req, res) => {
    // Accès à l'ID du responsable via req.user.gestid
    res.sendFile(path.join(__dirname, '../gestionaire_stage/visualiser_ecole.html'));
});
// Routes pour les entreprises
app.get('/Entreprise/dashboard_entreprise.html', authenticateToken, checkRole('entreprise'), (req, res) => {
    res.sendFile(path.join(__dirname, '../Entreprise/dashboard_entreprise.html'));

});
// Routes pour les gestionaires entreprises
app.get('/gest_entreprise/Consulter_Offres.html', authenticateToken, checkRole('gestionnaire_entreprise'), (req, res) => {
    res.sendFile(path.join(__dirname, '../gest_entreprise/Consulter_Offres.html'));

});
// Routes pour les gestionaires d'ecoles
app.get('/gest_ecole/gest_ecole.html', authenticateToken, checkRole('gestionnaire_ecole'), (req, res) => {
    res.sendFile(path.join(__dirname, '../gest_ecole/gest_ecole.html'));

});
//routes pour les comptes ecoles 
app.get('/Ecole/Ecole.html', authenticateToken, checkRole('ecole'), (req, res) => {
    res.sendFile(path.join(__dirname, '../Ecole/Ecole.html'));

});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// Route protégée
app.get('/protected', authenticateToken, (req, res) => {
    res.status(200).json({ 
        message: `Welcome to the protected page, ${req.user.username}!`,
        username: req.user.username
    });
});
// Routes pour les gestionnaires d'entreprise
app.get('/enterprise-manager-dashboard', authenticateToken, checkRole('gestionnaire_entreprise'), (req, res) => {
    // Accès à l'ID du gestionnaire via req.user.gestid
    res.json({ message: 'Welcome to enterprise manager dashboard' });
});

// Routes pour les écoles
app.get('/school-dashboard', authenticateToken, checkRole('ecole'), (req, res) => {
    // Accès à l'ID de l'école via req.user.ecoleid
    res.json({ message: 'Welcome to school dashboard' });
});

// Routes pour les gestionnaires d'école
app.get('/school-manager-dashboard', authenticateToken, checkRole('gestionnaire_ecole'), (req, res) => {
    // Accès à l'ID du gestionnaire via req.user.gestecoleid
    res.json({ message: 'Welcome to school manager dashboard' });
});

// Routes pour les entreprises
app.get('/enterprise-dashboard', authenticateToken, checkRole('entreprise'), (req, res) => {
    // Accès à l'ID de l'entreprise via req.user.entrepriseid
    res.json({ message: 'Welcome to enterprise dashboard' });
});



// Routes pour les admins
app.get('/admin-dashboard', authenticateToken, checkRole('admin'), (req, res) => {
    // Accès à l'ID de l'admin via req.user.adminid
    res.json({ message: 'Welcome to admin dashboard' });
});