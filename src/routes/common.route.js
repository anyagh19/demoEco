import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("")
    .get((req, res) => {
        res.render("home")
    })
    .post(verifyJWT)

export default router