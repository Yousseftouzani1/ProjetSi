
-- Insérer des données dans la table
INSERT INTO Etudiant (nom,id) VALUES ('Dupont', 80);
INSERT INTO Etudiant (nom,id) VALUES ('Dup',  24);
INSERT INTO Etudiant (nom,id) VALUES ('alan',  29);
COMMIT;

create table User_table(
    id INT,
    username VARCHAR(100),
    password VARCHAR(40)
);
insert into User_table(username,password) values ('youssef','1010');
COMMIT;
SELECT COUNT(*) AS COUNT FROM User_table WHERE username = 'youssef' AND password = '1010';
drop table User_table;
-- Table: Ecole
CREATE TABLE Ecole (
    id_ecole INT PRIMARY KEY,
    nom VARCHAR2(80),
    mdp_ecole VARCHAR2(15)
);

-- Table: Gestionnaire_Ecole
CREATE TABLE Gestionnaire_Ecole (
    id_gest_ecole INT PRIMARY KEY,
    username VARCHAR2(40),
    mdp_gest_ecole VARCHAR2(15),
    id_ecole INT,
    FOREIGN KEY (id_ecole) REFERENCES Ecole(id_ecole)
);

-- Table: Professeur
CREATE TABLE Professeur (
    Nom_prof VARCHAR2(20),
    id_ecole INT,
    FOREIGN KEY (id_ecole) REFERENCES Ecole(id_ecole)
);

-- Table: Filiere
CREATE TABLE Filiere (
    Nom VARCHAR2(20),
    nb_etudiant INT,
    id_ecole INT,
    id_competence INT,
    FOREIGN KEY (id_ecole) REFERENCES Ecole(id_ecole),
    FOREIGN KEY (id_competence) REFERENCES Competence(id_competence)
);

-- Table: Etudiant
CREATE TABLE Etudiant (
    id_etudiant INT PRIMARY KEY,
    Nom VARCHAR2(60),
    mdp_etudiant VARCHAR2(60),
    id_gest_ecole INT,
    FOREIGN KEY (id_gest_ecole) REFERENCES Gestionnaire_Ecole(id_gest_ecole)
);
drop table  Etudiant
-- Table: Admin_Systeme
CREATE TABLE Admin_Systeme (
    id_admin INT PRIMARY KEY,
    username VARCHAR2(30),
    mdp_admin VARCHAR2(60)
);

-- Table: Responsable_Stage
CREATE TABLE Responsable_Stage (
    id_respo INT PRIMARY KEY,
    username VARCHAR2(30),
    mdp_respo_stage VARCHAR2(30)
);

-- Table: Competence
CREATE TABLE Competence (
    id_competence INT PRIMARY KEY,
    description VARCHAR2(50)
);

-- Table: Demande
CREATE TABLE Demande (
    id_stage INT,
    id_competence INT,
    id_demande INT PRIMARY KEY,
    FOREIGN KEY (id_competence) REFERENCES Competence(id_competence)
);

-- Table: Entreprise
CREATE TABLE Entreprise (
    id_entreprise INT PRIMARY KEY,
    nom VARCHAR2(80),
    adresse VARCHAR2(300),
    mdp_entreprise VARCHAR2(15)
);

-- Table: Gestionnaire_Entreprise
CREATE TABLE Gestionnaire_Entreprise (
    id_gest_entreprise INT PRIMARY KEY,
    Nom VARCHAR2(100),
    mdp_gest VARCHAR2(15),
    id_entreprise INT,
    FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise)
);

-- Table: Tuteur
CREATE TABLE Tuteur (
    id_tuteur INT PRIMARY KEY,
    id_gest_entreprise INT,
    Nom_tuteur VARCHAR2(40),
    FOREIGN KEY (id_gest_entreprise) REFERENCES Gestionnaire_Entreprise(id_gest_entreprise)
);

-- Table: Offre_Stage
CREATE TABLE Offre_Stage (
    id_stage INT PRIMARY KEY,
    titre VARCHAR2(80),
    description VARCHAR2(1900),
    id_gest_entreprise INT,
    id_demande INT,
    id_tuteur INT,
    FOREIGN KEY (id_gest_entreprise) REFERENCES Gestionnaire_Entreprise(id_gest_entreprise),
    FOREIGN KEY (id_demande) REFERENCES Demande(id_demande),
    FOREIGN KEY (id_tuteur) REFERENCES Tuteur(id_tuteur)
);

-- Table: Candidature
CREATE TABLE Candidature (
    id_candidature INT PRIMARY KEY,
    id_stage INT,
    id_etudiant INT,
    date_soumission DATE,
    FOREIGN KEY (id_stage) REFERENCES Offre_Stage(id_stage),
    FOREIGN KEY (id_etudiant) REFERENCES Etudiant(id_etudiant)
);
--///////////////////////////////////////////////////////////////////////
-- Step 1: Add the new columns `username` and `password`
ALTER TABLE Etudiant ADD (
    username VARCHAR2(60),
    password VARCHAR2(60)
);

-- Step 2: Copy data from old columns to new columns
UPDATE Etudiant
SET username = nom,
    password = mdp_etudiant;

-- Step 3: Drop the old columns `nom` and `mdp_etudiant`
ALTER TABLE Etudiant DROP COLUMN nom;
ALTER TABLE Etudiant DROP COLUMN mdp_etudiant;

-- Optional: Ensure constraints and naming consistency
ALTER TABLE Etudiant MODIFY username NOT NULL;
ALTER TABLE Etudiant MODIFY password NOT NULL;
-- ////////////////////
SELECT * FROM Etudiant ;

INSERT INTO Etudiant (id_etudiant,username, password)
VALUES (1,'johndoe', 'securepassword123');
COMMIT;
INSERT INTO Entreprise (id_entreprise,nom, mdp_entreprise)
VALUES (1,'ensias', 'password1234');
COMMIT;
