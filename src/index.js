import { app } from './app.js';
import dotenv from 'dotenv';
import { connect } from './db/index.js';


const PORT = 300
;

connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`server is ${PORT}`);
            
        })
    })
    .catch((err) => {
        console.log("connect errror" , err)
    })