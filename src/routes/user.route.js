import { Router } from "express";
import { loginUser, logOutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register")
    .get((req, res) => {
        res.render("signUpForm")
    })
    .post(upload.single("profileImage"), registerUser)


//secure 
router.route("/logout").post(verifyJWT , logOutUser)
router.route("/login").get((req , res) => {res.render("login")}).post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router
