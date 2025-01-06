const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const dbConfig = require('../database/dbConfig');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // Middleware for cookies
const app = express();
const port = 4002;
const candidater = require('./Candidater');
const conv=require('./Convocation');
const stage = require('./stage');

app.use(express.json());
app.use(cookieParser());
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
app.use(candidater);
app.use(conv);
app.use(stage );
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
// visualiser les stages courant 
app.get('/stagesEnCours', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id_stage, date_debut, date_fin
             FROM Stage 
             WHERE status_stage = 'en cours'`,
            {},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json(result.rows.map(row => ({
            id_stage: row.ID_STAGE,
            titre: row.TITRE,
            description: row.DESCRIPTION,
            date_debut: row.DATE_DEBUT,
            date_fin: row.DATE_FIN
        })));
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Internal server error' });
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

//visualiser les stages deja effectué
app.get('/stagesTermines', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT ID_STAGE, date_debut, date_fin 
             FROM Stage 
             WHERE status_stage = 'Terminé'`,
            {},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json(result.rows.map(row => ({
            id_stage: row.ID_STAGE,
            titre: row.TITRE,
            description: row.DESCRIPTION,
            date_debut: row.DATE_DEBUT,
            date_fin: row.DATE_FIN
        })));
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Internal server error' });
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

// visualiser les les offres de stage 
app.get('/offresDisponibles', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT ID_OFFRE, titre, description, Date_publication 
             FROM Offre_Stage 
             WHERE status_offre = 'disponible'`,
            {},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json(result.rows.map(row => ({
            id_offre: row.ID_OFFRE,
            titre: row.TITRE,
            description: row.DESCRIPTION,
            date_publication: row.DATE_PUBLICATION
        })));
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Internal server error' });
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

app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
  });