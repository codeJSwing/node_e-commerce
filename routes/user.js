import express from "express";
import checkAuth from "../middleware/check-auth.js";
import {
    createLogin,
    createSignup,
    getProfile, updatePassword
} from "../controller/user.js";
import userModel from "../models/user.js";
import user from "../models/user.js";
import bcrypt from "bcrypt";

const router = express.Router()

// sign up
router.post("/signup", createSignup)

// login
router.post("/login", createLogin)

// profile 정보 가져오기
router.get("/", checkAuth, getProfile)

// 패스워드 변경 (로그인 후)
router.put("/update/password", checkAuth, updatePassword)

export default router