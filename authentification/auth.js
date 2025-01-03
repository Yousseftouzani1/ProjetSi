const express = require('express');
const oracledb = require('oracledb');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
// Configuration Oracle DB
const dbConfig = require('../database/dbConfig');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const testroute=require('../gest_ecole/gest.ecole');
app.use('/getdata',testroute);
// Middleware
app.use(express.json());
app.use(cookieParser());
// Serve static files from the 'authentification' folder
app.use(express.static(path.join(__dirname, 'authentification')));
// Serve the root page (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'loginpage.html'));
});
app.get('/test.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});
app.get('/ajouterEtudiant', (req, res) => {
    res.sendFile(path.join(__dirname, '../Ecole/create_etud.html'));
});
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
    methods: ['GET', 'POST', 'PUT', 'DELETE'] // Specify the HTTP methods you support
}));

const { authenticateToken } = require('./authMid');

const authRouter = require('./routerAuth');
app.use(authRouter)
/*
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
            secure: false,//process.env.NODE_ENV === 'production',
           sameSite: 'lax',
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

/*app.get('/get',async(req,res)=>{
    connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT password FROM Etudiant `,
            
        );
        res.json({ message: result  });
        
})*/
// Lancer le serveur */
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