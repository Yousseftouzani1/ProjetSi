const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig'); // Make sure to include your DB config file
const multer = require('multer');
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



module.exports=router