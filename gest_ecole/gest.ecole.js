const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig'); // Make sure to include your DB config file
const multer = require('multer');
require('dotenv').config({path:'../authentification/.env'});
const xlsx = require('xlsx');
const upload = multer({ dest: 'uploads/' }); // For handling file uploads
const jwt = require('jsonwebtoken'); // Assurez-vous d'avoir jwt installé
//  creer un prof 
router.post('/create-prof', async (req, res) => {
    const { nom_prof, id_ecole } = req.body;

    if (!nom_prof || !id_ecole) {
        return res.status(400).json({ error: 'Nom and ID Ecole are required.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `INSERT INTO Professeur (Nom_prof, id_ecole) VALUES (:nom_prof, :id_ecole)`,
            { nom_prof, id_ecole },
            { autoCommit: true }
        );
        res.status(201).json({ message: 'Professor created successfully!' });
    } catch (err) {
        console.error('Error creating professor:', err);
        res.status(500).json({ error: 'Internal server error.' });
    } finally {
        if (connection) await connection.close();
    }
});
// Route to insert professors via an Excel file
router.post('/upload-prof-excel', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;

    let connection;
    try {
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        connection = await oracledb.getConnection(dbConfig);
        const insertProf = `INSERT INTO Professeur (Nom_prof, id_ecole) VALUES (:Nom_prof, :id_ecole)`;

        for (let row of data) {
            await connection.execute(insertProf, { Nom_prof: row.Nom_prof, id_ecole: row.id_ecole }, { autoCommit: false });
        }
        await connection.commit();
        res.status(201).json({ message: 'Professors inserted successfully!' });
    } catch (err) {
        console.error('Error inserting professors:', err);
        res.status(500).json({ error: 'Internal server error.' });
    } finally {
        if (connection) await connection.close();
    }
});
//  creer des filieres
router.post('/create-filiere', async (req, res) => {
    const { nom, nb_etudiant, id_ecole, id_competence } = req.body;

    if (!nom || !nb_etudiant || !id_ecole || !id_competence) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `INSERT INTO Filiere (Nom, nb_etudiant, id_ecole, id_competence) VALUES (:nom, :nb_etudiant, :id_ecole, :id_competence)`,
            { nom, nb_etudiant, id_ecole, id_competence },
            { autoCommit: true }
        );
        res.status(201).json({ message: 'Filiere created successfully!' });
    } catch (err) {
        console.error('Error creating filiere:', err);
        res.status(500).json({ error: 'Internal server error.' });
    } finally {
        if (connection) await connection.close();
    }
}); 
//  creer des etudiants chaqu un a sa filiere 
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
//creation des eleves par formulaire 
router.post('/students', async (req, res) => {
    const token = req.cookies.access_token;
    if (!token) {
        return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        const id_ecole = decodedToken.ecoleid;
    const { username, email, telephone, password, date_nes,age,annee,filiere } = req.body;
 
    if (!username || !email || !telephone || !password || !date_nes) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }
 
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    let connection;
    try {
        //filiere age annne
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `INSERT INTO Etudiant (id_etudiant, username, email, telephone, password, date_nes,id_ecole,age,annee,filiere) 
             VALUES (Etudiant_seq.NEXTVAL, :username, :email, :telephone, :password, TO_DATE(:date_nes, 'YYYY-MM-DD'),:id_ecole,:age,:annee,:filiere)`,
            { username, email, telephone, password: hashedPassword, date_nes,id_ecole,age,annee,filiere },
            { autoCommit: true }
        );

        res.status(201).json({ message: 'Étudiant enregistré avec succès !' });
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement de l\'étudiant :', err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    } finally {
        if (connection) await connection.close();
    }
});
//fichier exel
router.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'Un fichier Excel est requis.' });
    }

    let connection;

    try {
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        connection = await oracledb.getConnection(dbConfig);

        for (const row of data) {
            const { username, email, telephone, password, date_naissance } = row;

            if (!username || !email || !telephone || !password || !date_naissance) {
                return res.status(400).json({ error: 'Tous les champs sont requis dans le fichier Excel.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await connection.execute(
                `INSERT INTO Etudiant (id_etudiant, username, email, telephone, password, date_naissance)
                 VALUES (Etudiant_seq.NEXTVAL, :username, :email, :telephone, :password, TO_DATE(:date_naissance, 'YYYY-MM-DD'))`,
                { username, email, telephone, password: hashedPassword, date_naissance }
            );
        }

        await connection.commit();
        res.status(200).json({ message: 'Fichier importé et étudiants ajoutés avec succès !' });
    } catch (err) {
        console.error('Erreur lors de l\'importation du fichier Excel :', err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    } finally {
        if (connection) await connection.close();
    }
});
//avoir les données des eleves de l ecole 
router.get('/api/students', async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        if (!decodedToken || !decodedToken.ecoleid) {
            return res.status(400).json({ error: 'Jeton invalide ou ID d’école manquant.' });
        }

        const id_ecole = decodedToken.ecoleid;
        const connection = await oracledb.getConnection(dbConfig);

        const query = `
            SELECT ID_ETUDIANT, FILIERE, USERNAME, EMAIL, TELEPHONE, DATE_NES, AGE, ANNEE, A_STAGE
            FROM ETUDIANT
            WHERE ID_ECOLE = :id_ecole
        `;

        const result = await connection.execute(query, [id_ecole]); // Paramètre lié pour éviter les injections SQL

        const students = result.rows.map((row) => ({
            id: row[0],
            filiere: row[1],
            username: row[2],
            email: row[3],
            telephone: row[4],
            dateNaissance: row[5],
            age: row[6],
            annee: row[7],
            hasInternship: row[8],
        }));

        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des étudiants.' });
    } finally {
        try {
            console.log("bien");
        } catch (closeError) {
            console.error('Erreur lors de la fermeture de la connexion à la base de données:', closeError);
        }
    }
});
//modifier les donnees etudiant
/* 
router.put('/api/students/:id', async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        if (!decodedToken || !decodedToken.ecoleid) {
            return res.status(400).json({ error: 'Jeton invalide ou ID d’école manquant.' });
        }

        const id_ecole = decodedToken.ecoleid; // Récupère l'ID de l'école depuis le jeton
        const id_etudiant = req.params.id; // Récupère l'ID de l'étudiant depuis les paramètres de la route
        const {
            filiere,
            username,
            email,
            telephone,
            dateNaissance,
            age,
            annee,
            hasInternship
        } = req.body; // Données envoyées dans la requête

        const connection = await oracledb.getConnection(dbConfig);

        const query = `
            UPDATE ETUDIANT
            SET FILIERE = :filiere,
                USERNAME = :username,
                EMAIL = :email,
                TELEPHONE = :telephone,
                DATE_NES = :dateNaissance,
                AGE = :age,
                ANNEE = :annee,
                A_STAGE = :hasInternship
            WHERE ID_ETUDIANT = :id_etudiant AND ID_ECOLE = :id_ecole
        `;

        const result = await connection.execute(query, {
            filiere ,
            username,
            email,
            telephone,
            dateNaissance,
            age,
            annee,
            hasInternship,
            id_etudiant,
            id_ecole
        }, { autoCommit: true });

        console.log("bien");

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Aucun étudiant trouvé ou aucune modification effectuée.' });
        }

        res.json({ message: 'Les données de l’étudiant ont été mises à jour avec succès.' });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour des données de l’étudiant.' });
    }
});*/
///
router.put('/api/students/:id', async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        if (!decodedToken  || !decodedToken.ecoleid) {
            return res.status(400).json({ error: 'Jeton invalide ou ID d’école manquant.' });
        }

        const id_ecole = decodedToken.ecoleid; // ID de l'école depuis le token
        const id_etudiant = req.params.id; // ID de l'étudiant
        const {
            filiere,
            username,
            email,
            telephone,
            dateNaissance,
            age,
            annee
        } = req.body; // Champs envoyés par la requête

        const connection = await oracledb.getConnection(dbConfig);

        // Récupérer les données actuelles de l'étudiant
        const selectQuery = `
            SELECT FILIERE, USERNAME, EMAIL, TELEPHONE, DATE_NES, AGE, ANNEE, A_STAGE
            FROM ETUDIANT
            WHERE ID_ETUDIANT = :id_etudiant AND ID_ECOLE = :id_ecole
        `;

        const result = await connection.execute(selectQuery, { id_etudiant, id_ecole });

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Étudiant non trouvé.' });
        }

        const currentData = result.rows[0]; // Données actuelles de l'étudiant

        // Construire les nouvelles données avec les champs modifiés ou conserver les valeurs existantes
        const updatedData = {
            filiere: filiere !== undefined ? filiere : currentData[0],
            username: username !== undefined ? username : currentData[1],
            email: email !== undefined ? email : currentData[2],
            telephone: telephone !== undefined ? telephone : currentData[3],
            dateNaissance: dateNaissance !== undefined ? dateNaissance : currentData[4],
            age: age !== undefined ? age : currentData[5],
            annee: annee !== undefined ? annee : currentData[6],
        };

        // Mettre à jour les données de l'étudiant
        const updateQuery = `
            UPDATE ETUDIANT
            SET FILIERE = :filiere,
                USERNAME = :username,
                EMAIL = :email,
                TELEPHONE = :telephone,
                DATE_NES = :dateNaissance,
                AGE = :age,
                ANNEE = :annee
            WHERE ID_ETUDIANT = :id_etudiant AND ID_ECOLE = :id_ecole
        `;

        const updateResult = await connection.execute(updateQuery, {
            ...updatedData,
            id_etudiant,
            id_ecole
        }, { autoCommit: true });

        if (updateResult.rowsAffected === 0) {
            return res.status(404).json({ error: 'Aucune modification effectuée ou étudiant introuvable.' });
        }

        res.json({ message: 'Les données de l’étudiant ont été mises à jour avec succès.' });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour des données de l’étudiant.' });
    }
});

// tirer les filiere de l ecole 
router.get('/filiereget',async(req,res)=>{
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        if (!decodedToken || !decodedToken.ecoleid) {
            return res.status(400).json({ error: 'Jeton invalide ou ID d’école manquant.' });
        }

        const id_ecole = decodedToken.ecoleid;
        const connection = await oracledb.getConnection(dbConfig);

        const query = `
            SELECT DISTINCT FILIERE
            FROM ETUDIANT
            WHERE ID_ECOLE = :id_ecole
        `;

        const result = await connection.execute(query, [id_ecole]); // Paramètre lié pour éviter les injections SQL

        const students = result.rows.map((row) => ({
            filiere: row[0],
          
        }));

        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des étudiants.' });
    } finally {
        try { 
            console.log("bien");
        } catch (closeError) {
            console.error('Erreur lors de la fermeture de la connexion à la base de données:', closeError);
        }
    }
});
// tirer les etudiants par filiere et ecole //avoir les données des eleves de l ecole 
router.get('/api/stud', async (req, res) => {
    try {
        // Vérification de l'existence du token dans les cookies
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
        }

        // Décodage et vérification du token JWT
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        if (!decodedToken  ||  !decodedToken.ecoleid) {
            return res.status(400).json({ error: 'Jeton invalide ou ID d’école manquant.' });
        }

        const id_ecole = decodedToken.ecoleid;

        // Récupération des paramètres de requête (filière)
        const filiere = req.query.filiere;
        if (!filiere) {
            return res.status(400).json({ error: 'La filière est obligatoire.' });
        }

        // Connexion à la base de données Oracle
        const connection = await oracledb.getConnection(dbConfig);

        // Requête SQL avec les paramètres liés
        const query = `
            SELECT ID_ETUDIANT, FILIERE, USERNAME, EMAIL, TELEPHONE, DATE_NES, AGE, ANNEE, A_STAGE
            FROM ETUDIANT
            WHERE ID_ECOLE = :id_ecole AND FILIERE = :filiere
        `;
        const result = await connection.execute(query, { id_ecole, filiere }); // Utilisation d'objets pour les paramètres

        // Transformation des résultats en un format JSON lisible
        const students = result.rows.map((row) => ({
            id: row[0],
            filiere: row[1],
            username: row[2],
            email: row[3],
            telephone: row[4],
            dateNaissance: row[5],
            age: row[6],
            annee: row[7],
            hasInternship: row[8] , // Conversion en boolean
        }));

        res.json(students);
    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des étudiants.' });
    };
});

module.exports=router