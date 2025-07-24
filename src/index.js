import { app } from './app.js';
import dotenv from 'dotenv';
import { connect } from './db/index.js';


const PORT = process.env.PORT || 3000;


connect()
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
          });
    })
    .catch((err) => {
        console.log("connect errror" , err)
    })