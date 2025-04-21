module.exports = {
    apps: [
      {
        name: "auth-server",
        script: ".authentification/auth.js",
        watch: true,
        env: {
          PORT: 3000,
        },
      },
      {
        name: "gest-entreprise-server",
        script: ".gest_entreprise/gest_entreprise.js",
        watch: true,
        env: {
          PORT: 3001,
        },
      },
    ],
  };