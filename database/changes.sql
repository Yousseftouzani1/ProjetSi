--modification table candidature / etudiant 
ALTER TABLE Candidature
ADD statut VARCHAR2(20) DEFAULT 'EN_ATTENTE';
ALTER TABLE Candidature ADD CONSTRAINT unique_candidature UNIQUE (id_etudiant, id_stage);
ALTER TABLE Etudiant 
ADD email VARCHAR(50)
ADD CONSTRAINT unique_email UNIQUE (email);
--table stage 
CREATE TABLE Stage (
    id_stage INT PRIMARY KEY,
    id_candidature INT UNIQUE,
    date_debut DATE,
    date_fin DATE,
    etat_validation VARCHAR2(20) DEFAULT 'Non validé',
    rapport_stage VARCHAR2(300),
    FOREIGN KEY (id_candidature) REFERENCES Candidature(id_candidature)
);
CREATE SEQUENCE Stage_seq START WITH 1;
CREATE OR REPLACE TRIGGER Stage_trg
BEFORE INSERT ON Stage
FOR EACH ROW
BEGIN
    SELECT Stage_seq.NEXTVAL INTO :NEW.id_stage FROM dual;
END;
/
--table convocation 
drop table convocation ;
CREATE TABLE Convocation (
    id_convocation INT PRIMARY KEY,
    id_stage INT UNIQUE,
    id_etudiant INT UNIQUE,
    date_envoi DATE,
    date_acceptation DATE, 
    status VARCHAR2(20) DEFAULT 'Non acceptée',
        FOREIGN KEY (id_stage) REFERENCES Offre_Stage(id_stage),
    FOREIGN KEY (id_etudiant) REFERENCES Etudiant(id_etudiant)
);
CREATE SEQUENCE Convocation_seq START WITH 1;
CREATE OR REPLACE TRIGGER Convocation_trg
BEFORE INSERT ON Convocation
FOR EACH ROW
BEGIN
    SELECT Convocation_seq.NEXTVAL INTO :NEW.id_convocation FROM dual;
END;
/
--lie le tuteur dirrectement a l entreprise 
ALTER TABLE Tuteur ADD id_entreprise INT;
ALTER TABLE Tuteur ADD FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise);
-- modif etudiant / ecole / entreprise 
ALTER TABLE Etudiant ADD a_stage varchar(20) DEFAULT 'sans stage ';
COMMIT;
ALTER TABLE Ecole ADD nom_connexion VARCHAR(20);
ALTER TABLE Entreprise ADD nom_connexion VARCHAR(20);
--modif stage 
ALTER TABLE Stage ADD status_stage varchar(30) DEFAULT 'en cours';
ALTER TABLE Stage ADD id_entreprise INT ;
ALTER TABLE Stage ADD FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise);
--modif offre_stage 
ALTER TABLE Offre_Stage ADD status_offre varchar(20) DEFAULT 'disponible ';
ALTER TABLE Offre_Stage ADD Date_publication Date ; 
