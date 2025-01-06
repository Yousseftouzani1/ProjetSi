const dbConfig = require('../database/dbConfig');
const express = require('express');
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();
//enregistrer  un eleve 
router.post('/register', async (req, res) => {
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
            `INSERT INTO Etudiant (id_etudiant, username, password) VALUES (Etudiant_seq.NEXTVAL, :username, :password)`,
            { id: Etudiant_seq.NEXTVAL, username, password: hashedPassword },
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
// enregister un gestionaire entreprise 
router.post("/ajouter-gestionnaire", async (req, res) => {
    const { nom, mdp_gest } = req.body;
  
    try {
      const connection = await oracledb.getConnection(dbConfig);
  
      const sql = `
        INSERT INTO Gestionnaire_Entreprise (Nom, mdp_gest)
        VALUES (:nom, :mdp_gest)
      `;
  
      await connection.execute(sql, [nom, mdp_gest], { autoCommit: true });
      await connection.close();
  
      res.send("Gestionnaire ajouté avec succès !");
    } catch (err) {
      console.error("Erreur:", err);
      res.status(500).send("Erreur lors de l'ajout du gestionnaire.");
    }
});

// Route: Connexion d un Gestionaire d entreprise //
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id_gest_entreprise,mdp_gest,id_entreprise FROM Gestionnaire_Entreprise WHERE Nom = :username`,
            { username },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: ' hello Invalid username or password.' });
        }

        const hashedPassword = result.rows[0].MDP_GEST;

        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ error: ' hi Invalid username or password.' });
        }

        // Générer un token JWT
        const user = { 
            username ,
            gestid: result.rows[0].ID_GEST_ENTREPRISE,
            entrepriseIdg:result.rows[0].ID_ENTREPRISE,
            role:'gestionnaire_entreprise'
                };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: '2h' });

        // Envoyer le token dans un cookie HTTP-only
        res.cookie('access_token', accessToken, {
            httpOnly: false,
            secure: false,//process.env.NODE_ENV === 'production',
           sameSite: 'lax',
        });

        res.json({ message: 'Login successful!',redirectUrl: '../gest_entreprise/Consulter_Offres.html' });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error.' });
    } finally {
        if (connection) await connection.close();
    }
});
 
//route connextion d un Etudiant  //
router.post('/loginE', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id_etudiant,password FROM Etudiant WHERE username = :username`,
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
        const user = { 
            username,
            studentId: result.rows[0].ID_ETUDIANT,
            role: 'etudiant'
         };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: '2h' });

        // Envoyer le token dans un cookie HTTP-only
        res.cookie('access_token', accessToken, {
            httpOnly: false,
            secure: true,//process.env.NODE_ENV === 'production',
           sameSite: 'lax',
           path: '/',  
        });
        
        res.json({ message: 'Login successful!', redirectUrl: '../Etudiant/visualiser_Offre.html' });    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error.' });
    } finally {
        if (connection) await connection.close();
    }
}); 

// Connexion d’un compte école  //
router.post('/loginEcole', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id_ecole,mdp_ecole FROM Ecole WHERE nom_connexion = :username`,
            { username },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const hashedPassword = result.rows[0].MDP_ECOLE;

        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Générer un token JWT
        const user = { 
            username,
            ecoleid:result.rows[0].ID_ECOLE ,
            role: 'ecole'
         };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1h' });

        // Envoyer le token dans un cookie HTTP-only
        res.cookie('access_token', accessToken, {
            httpOnly: false,
            secure: false, // Passez à `true` en production
            sameSite: 'lax',
        });

        res.json({ message: 'Login successful!', redirectUrl: '../Ecole/Ecole.html' });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error.' });
    } finally {
        if (connection) await connection.close();
    }
});

// Connexion d’un gestionnaire d’école //
router.post('/loginGestionnaireEcole', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id_gest_ecole,mdp_gest_ecole,id_ecole FROM Gestionnaire_Ecole WHERE username = :username`,
            { username },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const hashedPassword = result.rows[0].MDP_GEST_ECOLE;

        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const user = { 
            username,
            gestecoleid:result.rows[0].ID_GEST_ECOLE,
            ecoleid:result.rows[0].ID_ECOLE,
            role: 'gestionnaire_ecole'
         };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: '2h' });

        res.cookie('access_token', accessToken, {
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
        });

        res.json({ message: 'Login successful!' , redirectUrl: '../gest_ecole/gest_ecole.html' });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error.' });
    } finally {
        if (connection) await connection.close();
    }
});

// Connexion d’un compte entreprise  
/*
router.post('/loginEntreprise', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id_entreprise,mdp_entreprise FROM Entreprise WHERE nom_connexion = :username`,
            { username },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const hashedPassword = result.rows[0].MDP_ENTREPRISE;

        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const user = { 
            username,
            entrepriseid:result.rows[0].ID_ENTREPRISE,
            role:'entreprise',

         };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1h' });

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        });
        res.json({
            message: 'Login successful!',
            redirectUrl: '../Entreprise/dashboard_entreprise.html',
            access_token: accessToken, // Send token in response
        });
        res.json({ message: 'Login successful!',redirectUrl: '../Entreprise/dashboard_entreprise.html' });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error.' });
    } finally {
        if (connection) await connection.close();
    }
});*/
router.post('/loginEntreprise', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id_entreprise,mdp_entreprise FROM Entreprise WHERE nom_connexion = :username`,
            { username },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const hashedPassword = result.rows[0].MDP_ENTREPRISE;

        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const user = { 
            username,
            entrepriseid: result.rows[0].ID_ENTREPRISE,
            role: 'entreprise',
        };

        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1h' });

        // Set the token in the cookie
        res.cookie('access_token', accessToken, {
            httpOnly: false,
            secure: false, // Change to true if using HTTPS
            sameSite: 'lax',
        });

        // Send the response only once
        return res.json({
            message: 'Login successful!',
            redirectUrl: '../Entreprise/dashboard_entreprise.html',
            access_token: accessToken, // Sending the token in the response body
        });

    } catch (err) {
        console.error('Error during login:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    } finally {
        if (connection) await connection.close();
    }
});

// Connexion compte gestionnaire de stage //
router.post('/loginGestionnaireStage', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id_respo,mdp_respo_stage FROM Responsable_Stage WHERE username = :username`,
            { username },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const hashedPassword = result.rows[0].MDP_RESPO_STAGE;

        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const user = { 
            username,
            gestid:result.rows[0].ID_RESPO,
            role:'responsable de stage ',
         };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: '2h' });

        res.cookie('access_token', accessToken, {
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
        });

        res.json({ message: 'Login successful!' ,redirectUrl: '../gestionaire_stage/visualiser_ecole.html'});
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error.' });
    } finally {
        if (connection) await connection.close();
    }
});

// Connexion Admin_Systeme //
router.post('/loginAdmin', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id_admin, mdp_admin FROM Admin_Systeme WHERE username = :username`,
            { username },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const hashedPassword = result.rows[0].MDP_ADMIN;

        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const user = { 
            username,
            adminid:result.rows[0].ID_ADMIN,
            role:'admin',
         };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: '2h' });

        res.cookie('access_token', accessToken, {
            httpOnly: false,
            secure: false,
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
module.exports = router;


