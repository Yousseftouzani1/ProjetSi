const express = require('express');
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
//const cors = require('cors');
//app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Adjust the origin as needed
const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:3000']; // Add all potential origins
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
// Configuration Oracle DB
const dbConfig = require('../database/dbConfig');

// Route: Enregistrement d'un utilisateur
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `INSERT INTO Etudiant (id_etudiant, username, password) VALUES (:id, :username, :password)`,
            { id: Math.floor(Math.random() * 1000), username, password: hashedPassword },
            { autoCommit: true }
        );

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error('Error during user registration:', err);
        res.status(500).json({ error: 'Internal server error.' });
    } finally {
        if (connection) await connection.close();
    }
});

// Route: Connexion de l'utilisateur
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT password FROM Etudiant WHERE username = :username`,
            { username },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const hashedPassword = result.rows[0].PASSWORD;

        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Générer un token JWT
        const user = { username };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1h' });

        // Envoyer le token dans un cookie HTTP-only
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
        });

        res.json({ message: 'Login successful!' });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error.' });
    } finally {
        if (connection) await connection.close();
    }
});

// Middleware: Vérification du token
function authenticateToken(req, res, next) {
    const token = req.cookies.access_token;

    if (!token) {
        return res.status(403).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }

        req.user = user;
        next();
    });
}

// Route protégée
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: `Welcome, ${req.user.username}!` });
});
app.get('/get',async(req,res)=>{
    connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT password FROM Etudiant `,
            
        );
        res.json({ message: result  });
        
})
// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
