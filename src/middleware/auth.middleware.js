import jwt from 'jsonwebtoken'
import { User } from '../models/users.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import  apiError  from '../utils/apiError.js'

export const verifyJWT = asyncHandler( async (req , _ , next ) => {

    const token = req.cookies.accessToken || req.header('Authorization')?.replace('Bearer ', '')

    if(!token){
        throw new apiError('Unauthorized')
    }

    try {
        const decodedToken  = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select('-password -refreshToken')

        if(!user){
            throw new apiError('Unauthorized')
        }

        req.user = user

        next()
    } catch (error) {
        throw new apiError(401, 'Invalid or expired token')
    }

})