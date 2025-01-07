-- Step 1: Drop all tables to reset the database (follow dependency order)
DROP TABLE Candidature CASCADE CONSTRAINTS;
DROP TABLE Offre_Stage CASCADE CONSTRAINTS;
DROP TABLE Tuteur CASCADE CONSTRAINTS;
DROP TABLE Gestionnaire_Entreprise CASCADE CONSTRAINTS;
DROP TABLE Entreprise CASCADE CONSTRAINTS;
DROP TABLE Demande CASCADE CONSTRAINTS;
DROP TABLE Competence CASCADE CONSTRAINTS;
DROP TABLE Responsable_Stage CASCADE CONSTRAINTS;
DROP TABLE Admin_Systeme CASCADE CONSTRAINTS;
DROP TABLE Etudiant CASCADE CONSTRAINTS;
DROP TABLE Filiere CASCADE CONSTRAINTS;
DROP TABLE Professeur CASCADE CONSTRAINTS;
DROP TABLE Gestionnaire_Ecole CASCADE CONSTRAINTS;
DROP TABLE Ecole CASCADE CONSTRAINTS;
COMMIT;
-- Step 2: Recreate tables with auto-incrementing IDs
-- Table: Ecole
CREATE TABLE Ecole (
    id_ecole INT PRIMARY KEY,
    nom VARCHAR2(80),
    mdp_ecole VARCHAR2(15)
);
CREATE SEQUENCE Ecole_seq START WITH 1;
CREATE OR REPLACE TRIGGER Ecole_trg
BEFORE INSERT ON Ecole
FOR EACH ROW
BEGIN
    SELECT Ecole_seq.NEXTVAL INTO :NEW.id_ecole FROM dual;
END;
/

-- Table: Gestionnaire_Ecole
CREATE TABLE Gestionnaire_Ecole (
    id_gest_ecole INT PRIMARY KEY,
    username VARCHAR2(40),
    mdp_gest_ecole VARCHAR2(15),
    id_ecole INT,
    FOREIGN KEY (id_ecole) REFERENCES Ecole(id_ecole)
);
CREATE SEQUENCE Gestionnaire_Ecole_seq START WITH 1;
CREATE OR REPLACE TRIGGER Gestionnaire_Ecole_trg
BEFORE INSERT ON Gestionnaire_Ecole
FOR EACH ROW
BEGIN
    SELECT Gestionnaire_Ecole_seq.NEXTVAL INTO :NEW.id_gest_ecole FROM dual;
END;
/
SELECT * FROM Gestionnaire_Ecole;
-- Table: Professeur
CREATE TABLE Professeur (
    Nom_prof VARCHAR2(20),
    id_ecole INT,
    FOREIGN KEY (id_ecole) REFERENCES Ecole(id_ecole)
);

-- Table: Filiere
CREATE TABLE Filiere (
    id_filiere INT PRIMARY KEY ,
    Nom VARCHAR2(20),
    nb_etudiant INT,
    id_ecole INT,
    id_competence INT,
    FOREIGN KEY (id_ecole) REFERENCES Ecole(id_ecole),
    FOREIGN KEY (id_competence) REFERENCES Competence(id_competence)
);
--trigger 
CREATE SEQUENCE filiere_seq START WITH 1;
CREATE OR REPLACE TRIGGER Etudiant_trg
BEFORE INSERT ON Filiere
FOR EACH ROW
BEGIN
    SELECT filiere_seq.NEXTVAL INTO :NEW.id_filiere FROM dual;
END;


       
-- Table: Etudiant
CREATE TABLE Etudiant (
    id_etudiant INT PRIMARY KEY,
    username VARCHAR2(60) NOT NULL,
    password VARCHAR2(60) NOT NULL,
    id_gest_ecole INT,
    FOREIGN KEY (id_gest_ecole) REFERENCES Gestionnaire_Ecole(id_gest_ecole)
);
SELECT * from Etudiant;
CREATE SEQUENCE Etudiant_seq START WITH 1;
CREATE OR REPLACE TRIGGER Etudiant_trg
BEFORE INSERT ON Etudiant
FOR EACH ROW
BEGIN
    SELECT Etudiant_seq.NEXTVAL INTO :NEW.id_etudiant FROM dual;
END;
/

-- Table: Admin_Systeme
CREATE TABLE Admin_Systeme (
    id_admin INT PRIMARY KEY,
    username VARCHAR2(30),
    mdp_admin VARCHAR2(60)
);
CREATE SEQUENCE Admin_Systeme_seq START WITH 1;
CREATE OR REPLACE TRIGGER Admin_Systeme_trg
BEFORE INSERT ON Admin_Systeme
FOR EACH ROW
BEGIN
    SELECT Admin_Systeme_seq.NEXTVAL INTO :NEW.id_admin FROM dual;
END;
/

-- Table: Responsable_Stage
CREATE TABLE Responsable_Stage (
    id_respo INT PRIMARY KEY,
    username VARCHAR2(30),
    mdp_respo_stage VARCHAR2(30)
);
CREATE SEQUENCE Responsable_Stage_seq START WITH 1;
CREATE OR REPLACE TRIGGER Responsable_Stage_trg
BEFORE INSERT ON Responsable_Stage
FOR EACH ROW
BEGIN
    SELECT Responsable_Stage_seq.NEXTVAL INTO :NEW.id_respo FROM dual;
END;
/

-- Table: Competence
CREATE TABLE Competence (
    id_competence INT PRIMARY KEY,
    description VARCHAR2(50)
);
CREATE SEQUENCE Competence_seq START WITH 1;
CREATE OR REPLACE TRIGGER Competence_trg
BEFORE INSERT ON Competence
FOR EACH ROW
BEGIN
    SELECT Competence_seq.NEXTVAL INTO :NEW.id_competence FROM dual;
END;
/
--table demande modifiée
CREATE TABLE demande(
    id_stage INT,
    id_competence INT,
    PRIMARY KEY (id_stage, id_competence),
    FOREIGN KEY (id_stage) REFERENCES Offre_Stage(id_stage),
    FOREIGN KEY (id_competence) REFERENCES Competence(id_competence)
);

-- Table: Demande
CREATE TABLE Demande (
    id_stage INT,
    id_competence INT,
    id_demande INT PRIMARY KEY,
    FOREIGN KEY (id_competence) REFERENCES Competence(id_competence)
);
CREATE SEQUENCE Demande_seq START WITH 1;
CREATE OR REPLACE TRIGGER Demande_trg
BEFORE INSERT ON Demande
FOR EACH ROW
BEGIN
    SELECT Demande_seq.NEXTVAL INTO :NEW.id_demande FROM dual;
END;
/

-- Table: Entreprise
CREATE TABLE Entreprise (
    id_entreprise INT PRIMARY KEY,
    nom VARCHAR2(80),
    adresse VARCHAR2(300),
    mdp_entreprise VARCHAR2(15)
);
CREATE SEQUENCE Entreprise_seq START WITH 1;
CREATE OR REPLACE TRIGGER Entreprise_trg
BEFORE INSERT ON Entreprise
FOR EACH ROW
BEGIN
    SELECT Entreprise_seq.NEXTVAL INTO :NEW.id_entreprise FROM dual;
END;
/

-- Table: Gestionnaire_Entreprise
CREATE TABLE Gestionnaire_Entreprise (
    id_gest_entreprise INT PRIMARY KEY,
    Nom VARCHAR2(100),
    mdp_gest VARCHAR2(15),
    id_entreprise INT,
    FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise)
);
SELECT * FROM Gestionnaire_Entreprise;
CREATE SEQUENCE Gestionnaire_Entreprise_seq START WITH 1;
CREATE OR REPLACE TRIGGER Gestionnaire_Entreprise_trg
BEFORE INSERT ON Gestionnaire_Entreprise
FOR EACH ROW
BEGIN
    SELECT Gestionnaire_Entreprise_seq.NEXTVAL INTO :NEW.id_gest_entreprise FROM dual;
END;
/
 
-- Table: Tuteur
CREATE TABLE Tuteur (
    id_tuteur INT PRIMARY KEY,
    id_gest_entreprise INT,
    Nom_tuteur VARCHAR2(40),
    FOREIGN KEY (id_gest_entreprise) REFERENCES Gestionnaire_Entreprise(id_gest_entreprise)
); 
--l assoxier a l entreprise aussi 
CREATE SEQUENCE Tuteur_seq START WITH 1;
CREATE OR REPLACE TRIGGER Tuteur_trg
BEFORE INSERT ON Tuteur
FOR EACH ROW
BEGIN
    SELECT Tuteur_seq.NEXTVAL INTO :NEW.id_tuteur FROM dual;
END;
/
 
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
CREATE SEQUENCE Offre_Stage_seq START WITH 1;
CREATE OR REPLACE TRIGGER Offre_Stage_trg
BEFORE INSERT ON Offre_Stage
FOR EACH ROW
BEGIN
    SELECT Offre_Stage_seq.NEXTVAL INTO :NEW.id_stage FROM dual;
END;
/

-- Table: Candidature
CREATE TABLE Candidature (
    id_candidature INT PRIMARY KEY,
    id_stage INT,
    id_etudiant INT,
    date_soumission DATE,
    FOREIGN KEY (id_stage) REFERENCES Offre_Stage(id_stage),
    FOREIGN KEY (id_etudiant) REFERENCES Etudiant(id_etudiant)
);
CREATE SEQUENCE Candidature_seq START WITH 1;
CREATE OR REPLACE TRIGGER Candidature_trg
BEFORE INSERT ON Candidature
FOR EACH ROW
BEGIN
    SELECT Candidature_seq.NEXTVAL INTO :NEW.id_candidature FROM dual;
END;
/
COMMIT;
  --21 --22
ALTER TABLE Gestionnaire_Entreprise MODIFY (mdp_gest VARCHAR2(100));
SELECT ID_GEST_ENTREPRISE FROM Gestionnaire_Entreprise;--, mdp_gest
SELECT * FROM GESTIONNAIRE_ENTREPRISE;
SELECT * FROM OFFRE_STAGE; 

SELECT * FROM Entreprise; 
SELECT * FROM CANDIDATURE;
SELECT * FROM ETUDIANT;
SELECT * FROM CONVOCATION;

SELECT C.ID_CANDIDATURE,date_soumission , username ,email,formation,languages,competences,experiences,date_nes,nom,titre,id_entreprise FROM ETUDIANT E ,CANDIDATURE C, --nom c est de la table ecole lie avec etudiant par id ecole /titre c est de Offre_stage 
INNER JOIN CANDIDATURE C ON C.ID_ETUDIANT = E.ID_ETUDIANT --id etudiant lie candidature et etudiant 
INNER JOIN OFFRE_STAGE O ON O.ID_STAGE = C.ID_STAGE --offre_stage lie par id_stage a candidature 
INNER JOIN ENTREPRISE e ON O.ID_ENTREPRISE = e.ID_ENTREPRISE --entreprise et offre lie via id_entreprise
INNER JOIN Ecole ec ON ec.id_ecole=E.id_ecole-- ecole et etudiant lie via id_ecole
WHERE statut='EN_ATTENTE'AND id_entreprise=:id_entreprise;
-- Offre_stage / etudiant / candidature/    et on tire tt les info etudiant via id_etudiant et le non de l offre via id_stage
--id_entreprise lie la table offre_stage et entreprise 
--id 
 --offre_stage lie par id_stage a candidature 
INSERT INTO Entreprise (id_entreprise, nom, mdp_entreprise, secteur_activite, nom_connexion, type_entreprise, date_creation, adresse) 
VALUES (Entreprise_seq.NEXTVAL, 'TestNom', 'hashedPassword', 'Secteur', 'NomConnexion', 'Type', TO_DATE('2024-01-01', 'YYYY-MM-DD'), 'Adresse');
SELECT * FROM Entreprise WHERE nom = 'TestNom';
