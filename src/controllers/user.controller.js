import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from '../utils/apiError.js'
import { User } from "../models/users.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.accessToken = accessToken

        await user.save({validateBeforeSave : false})

        return {accessToken , refreshToken}

    } catch (error) {
        console.log('error in generating token ' , error)
    }
}


const registerUser =  asyncHandler( async (req , res) => {
    const {
        fullName,
        email,
        password,
        phone,
        address,
        role
    } = req.body

    //validation
    if([fullName , email , password , phone , address , role].some((field) => field?.trim() === '')){
        throw new apiError(400 , "app fields are required")
    }

    //find if user already exits
    const existingUser = await User.findOne({email})
    if(existingUser){
        throw new apiError(401 , "user with email already exits")
    }

    const profilePath = req.file?.path

    if(!profilePath){
        throw new apiError(400 , "profile missing")
    }

    const profile = await uploadOnCloudinary(profilePath)

    const user = await User.create({
        fullName,
        email,
        password,
        phone,
        address,
        role,
        profileImage: profile.url
    })

    const createdUser = await User.findById(user._id).select("-password ")

    if(!createdUser){
        throw new apiError(400 , "something went wrong user not created")
    }
    
    // return res
    //         .status(200)
    //         .json(new apiResponse(201 , createdUser, "regestration succesful"))

    console.log(createdUser)
    return res.redirect("/api/v1/user/login")
   
})

const loginUser = asyncHandler( async (req ,res ) => {
    const {email , password} = req.body

    //validation
    if([email , password].some((field) => field.trim() === '')){
        throw new apiError(400 , "all fiels are required")
    }

    const existingUser = await User.findOne({email})

    if(!existingUser){
        throw new apiError(400 , "no user with this email")
    }

    //validate password
    const isPasswordValid = await existingUser.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new apiError(400 , "invalid credentials")
    }

    const{accessToken , refreshToken} = await generateAccessAndRefreshToken(existingUser._id)

    const loggedInUser = await User.findById(existingUser._id)

    const option = {
        httpOnly: true, //cookies cannot be modified by user
        secure: process.env.NODE_ENV === "production"
    }

    return res
            .status(200)
            .cookie("accessToken" , accessToken , option)
            .cookie("refreshToken" , refreshToken , option)
            // .json(new apiResponse(200 , {user: loggedInUser , accessToken , refreshToken} , "successful login"))
            .redirect("/")
})

const logOutUser = asyncHandler( async ( req , res ) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {new : true}
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
            .status(200)
            .clearCookie("accessToken" , options)
            .clearCookie("refreshToken" , options)
            .redirect("/")
})
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(404, "Refresh Token Required")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refrsh Token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "accress token refreshed successfully"
            ))

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access token")
    }
})

export {
    registerUser,
    loginUser,
    logOutUser,
    generateAccessAndRefreshToken,
    refreshAccessToken
}