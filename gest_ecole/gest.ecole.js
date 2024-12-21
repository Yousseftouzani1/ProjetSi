const express = require('express');
const router=express.Router();



router.get('/get',(req,res)=>{
   /* connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT * FROM Etudiant `,
            
        );*/
        res.json({ message: "hello routing work !"  });
        
});
module.exports=router