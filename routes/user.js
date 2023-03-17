import express from "express";
import checkAuth from "../middleware/check-auth.js";
import {
    createLogin,
    createSignup,
    getProfile
} from "../controller/user.js";
const router = express.Router()

// sign up
router.post("/signup", createSignup)

// login
router.post("/login", createLogin)

// profile 정보 가져오기
router.get("/", checkAuth, getProfile)

export default router