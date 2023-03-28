import express from "express";
// import checkAuth from "../middleware/check-auth.js";
import {
    createLogin,
    createSignup,
    emailConfirm,
    findPassword,
    getProfile,
    resetPassword,
    updatePassword
} from "../controller/user.js";

import jwt from "jsonwebtoken"
import passport from "passport";

const checkAuth = passport.authenticate('jwt', {session: false})

const router = express.Router()

// profile 정보 가져오기
router.get("/", checkAuth, getProfile)

// sign up
router.post("/signup", createSignup)

// login
router.post("/login", createLogin)

// find password
router.post("/find/password", findPassword)

// emailConfirm(isEmailConfirmed false -> true)
router.put("/email/confirm", emailConfirm)

// 패스워드 변경 (로그인 후)
router.put("/update/password", checkAuth, updatePassword)

// 패스워드 변경 (로그인 전)
router.put("/password/reset", resetPassword)

export default router