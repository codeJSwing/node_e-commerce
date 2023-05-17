import express from "express";

import {
    loginHandler,
    signupHandler,
    emailConfirm,
    findPassword,
    getProfile,
    resetPassword,
    updatePassword,
    findEmail,
    getAllUsers
} from "../controller/user.js";

import jwt from "jsonwebtoken"
import passport from "passport";
import isAdmin from "../middleware/check-admin.js";

const checkAuth = passport.authenticate('jwt', {session: false})

const router = express.Router()

// 회원가입 - O
router.post("/registration", signupHandler)

// 로그인 - O
router.post("/login", loginHandler)

// 내 profile 정보 가져오기
router.get("/me", checkAuth, getProfile)

// 모든 유저 프로필 조회
router.get("/", checkAuth, isAdmin, getAllUsers)

// 비밀번호 찾기(로그인 전)
router.post("/password-recovery", findPassword)

// 이메일 찾기
router.post("/email-recovery", findEmail)

// 패스워드 변경 (로그인 전)
router.put("/password-reset", resetPassword)

// 패스워드 변경 (로그인 후) - O
router.put("/password", checkAuth, updatePassword)

// 이메일 확인 (isEmailConfirmed false -> true)
router.put("/email-confirmation", emailConfirm)

export default router