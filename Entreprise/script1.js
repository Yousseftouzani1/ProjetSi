    // Fonction pour ajouter un gestionnaire
    import jwt_decode from 'jwt-decode';

    async function ajouterGestionnaire(username, password) {
        try {
        // Récupération du token à partir de sessionStorage
        console.log('Tous les cookies disponibles :', document.cookie);
    const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('access_token='))
        ?.split('=')[1];
    console.log('Token extrait des cookies :', token);
        console.log('Token récupéré depuis sessionStorage:', token);

        if (!token) {
            console.error('Token non trouvé.');
            alert('Vous devez être connecté pour effectuer cette action.');
            return;
        }

        // Décoder le token pour récupérer l'ID de l'entreprise
        const decodedToken = jwt_decode(token); // Utiliser jwt-decode pour décoder le token JWT
        console.log('ID Entreprise:', decodedToken.entrepriseid); // Affiche l'ID de l'entreprise extrait du token

        const entrepriseId = decodedToken.entrepriseid; // // ID de l'entreprise stockée dans le token

            // Envoi de la requête POST au backend
            const response = await fetch('http://localhost:3001/ajouter-gestionnaire', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Inclure les cookies dans la requête
                body: JSON.stringify({
                    nom: username, 
                    mdp_gest: password,
                    entreprise_id: entrepriseId // Inclure l'ID de l'entreprise dans le corps de la requête
                }),
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message); // Message de succès renvoyé par le backend
            } else {
                const error = await response.json();
                console.error('Erreur lors de l’ajout du gestionnaire :', error.error);
                alert(`Erreur : ${error.error}`);
            }
        } catch (err) {
            console.error('Erreur lors de l’ajout du gestionnaire :', err);
            alert('Une erreur est survenue. Veuillez réessayer plus tard.');
        }
    }

    // Soumission du formulaire
    async function submitForm(event) {
        event.preventDefault(); // Empêcher le comportement par défaut du formulaire

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Validation des champs
        if (!username || !password) {
            alert("Les champs 'Nom d'utilisateur' et 'Mot de passe' sont obligatoires.");
            return;
        }

        // Appel de la fonction ajouterGestionnaire
        await ajouterGestionnaire(username, password);
    }
    window.submitForm = submitForm;

    // Fonction pour générer un mot de passe aléatoire
    function generatePassword() {
        const characters = 'ABCDEF1235fg789@#$!';
        const passwordLength = 12;
        let password = '';
        for (let i = 0; i < passwordLength; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            password += characters[randomIndex];
        }
        document.getElementById('password').value = password;
    }
    window.generatePassword = generatePassword;
    console.log("Script chargé !");
    console.log("generatePassword est définie :", typeof window.generatePassword === "function");
    