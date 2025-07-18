import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken'


//for typeScript to type safty of schema
// export interface User extends Document {
//     username: string;
//     email: string;
//     password: string;
//     phone: number;
//     address: string;
//     profileImage: string;
//     isAdmin: false;
//     forgetPasswordToken: string;
//     forgetPasswordTokenExpiry: Date;
//     verifyToken: string;
//     verifyTokenExpiry: Date;
//     accessToken: String;
//     accessTokenExpriy: Date;
//     refreshToken: String;
//     refreshTokenExpriy: Date;
// }

const userSchema = new Schema({
    fullName: {
        type: String,
        required: [true, "Name is required"],
        minLength: [3, "name must be at leat 3 characters"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        minLength: [10, "Email must be at least 10 characters"],
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "password is required"],
        minLength: [8, "password must be at least 8 characters"],
    },
    phone: {
        type: Number,
        required: [true, "phone must be required"],
        minLength: 10,
        maxLength: 10,
        unique: true,
        trim: true
    },
    address: {
        type: String,
        required: [true, "address is required"],
        trim: true,
        minLength: [10, "address must be at least 10 characters"]
    },
    profileImage: {
        type: String,
        required: [true, "profile image is required"],
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        required: [true, "role is required"],
    },
    accessToken: {
        type: String
    },
    accessTokenExpiry: Date,
    refreshToken: String,
    refreshTokenExpiry: Date,
    verifyToken: String,
    verifyTokenExpiry: Date,
},{
    timestamps: true
})

userSchema.pre("save", async function (next) {

    if (!this.isModified("password")) {
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10)

    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    //short lived accessed token
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    
    return jwt.sign(
        {
            _id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateVerifyToken = async function () {
    return jwt.sign(

        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.VERIFY_TOKEN_SECRET,
        {
            expiresIn: process.env.VERIFY_TOKEN_EXPIRY
        }

    )
}


export const User = mongoose.model("User", userSchema)