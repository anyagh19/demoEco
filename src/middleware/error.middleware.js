import mongoose from 'mongoose'

import { apiError } from '../utils/apiError'

const errorHandler = (err ,req , res , next) => {
    let error = err
    if(!(error instanceof apiError)){
        const statusCode = error.statusCode || (error instanceof mongoose.Error ? 400 : 500);


        const message = error.message || "Internal Server Error"
        error = new apiError(statusCode, message, error?.errors || [] , error?.stack || "")
    }

    const response = {
        ...error,
        message : error.message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    }

    console.log("Error occurred at:", req?.originalUrl || "unknown route");

    return res.status(error.statusCode || 500).json(response)

}

export {errorHandler}