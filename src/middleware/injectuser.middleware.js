import jwt from "jsonwebtoken";
import { User } from "../models/users.model.js";

export const injectUser = async (req, res, next) => {
    const token = req.cookies.accessToken || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.locals.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded?._id).select("-password -refreshToken");
        res.locals.user = user || null;
    } catch (err) {
        res.locals.user = null;
    }

    next();
};
