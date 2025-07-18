import mongoose from "mongoose";
//import { DB_NAME } from "../constants.js";

export const connect = async () => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGO_URI}`)
        if(connection){
            console.log("connection successful")
        }
    } catch (error) {
        console.log("error in connecting to db", error)
    }
}