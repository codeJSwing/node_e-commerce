import express from "express";
import {
    loginHandler,
    signupHandler,
    emailConfirm,
    findPassword,
    getProfile,
    resetPassword,
    updatePassword, findEmail, getAllUsers
} from "../controller/user.js";

import jwt from "jsonwebtoken"
import passport from "passport";
import isAdmin from "../middleware/check-admin.js";

const checkAuth = passport.authenticate('jwt', {session: false})

const router = express.Router()

// profile 정보 가져오기
router.get("/", checkAuth, getProfile)

// 유저 전체 프로필 조회
router.get("/all", checkAuth, isAdmin, getAllUsers)

// 회원가입
router.post("/signup", signupHandler)

// 로그인
router.post("/login", loginHandler)

// 비밀번호 찾기(로그인 전)
router.post("/find/password", findPassword)

// emailConfirm(isEmailConfirmed false -> true)
router.put("/confirm/email", emailConfirm)

// 패스워드 변경 (로그인 후)
router.put("/password", checkAuth, updatePassword)

// 패스워드 변경 (로그인 전)
router.put("/reset/password", resetPassword)

// 이메일 찾기
router.post("/find/email", findEmail)

export default router