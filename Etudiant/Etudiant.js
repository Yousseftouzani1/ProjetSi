const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const dbConfig = require('../database/dbConfig');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // Middleware for cookies
const app = express();
const port = 4002;
app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
  });
app.use(express.json());
app.use(cookieParser());

// Specify the frontend's origin and allow credentials
/*app.use(cors({
    origin: 'http://127.0.0.1:5500', // Replace with your frontend's URL
    credentials: true               // Allow sending cookies
}));*/
const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:5500']; // Add all potential origins
app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify the HTTP methods you support
}));
//const path = require('path');

const authentificate_token =(req,res,next)=>{
    /*const token = req.cookies.ACCESS_TOKEN_KEY;*/  
    const token = req.cookies.access_token; // Corrected line
    if (!token) return res.status(401).send('Access denied');
    try {
        const verified = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        req.user = verified;
        next();
    } catch (err) {
        return res.status(403).send('Invalid token');
    }
};
app.get('/displayCandidature', authentificate_token, async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute('SELECT * FROM Etudiant ', {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json({ message: 'Access granted!', user: req.user, data: result.rows });
    } catch (err) {
        res.status(500).send('Internal server error');
    } finally {
        if (connection) await connection.close();
    }
});
app.get('/getdata', (req,res)=>{
    res.send("hello");
});
app.get('/offre', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig); // Utilisez getConnection
        const result = await connection.execute(
            'SELECT TITRE, DESCRIPTION FROM Offre_Stage',
            {}, // Aucun paramètre
            { outFormat: oracledb.OUT_FORMAT_OBJECT } // Format objet
        );

        // Map des résultats pour extraire les titres et descriptions
        res.json(result.rows.map(row => ({
            titre: row.TITRE,
            description: row.DESCRIPTION,
        })));
    } catch (err) {
        console.error('Database error:', err); // Log l'erreur dans le terminal
        res.status(500).json({ error: 'Internal server error' }); // Réponse JSON en cas d'erreur
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
});
