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

// todo: 약관동의 (필수 / 선택)
// todo: 아이디, 비밀번호, 비밀번호 재확인, 이름, 생년월일, 성별(남, 여, 선택x), 본인확인 이메일(선택), 휴대전화(인증 필요)
// sign up
router.post("/signup", createSignup)

// todo: 1. 일반 / 2. 일회용 번호 / 3. QR 코드
// todo: 로그인 상태 유지
// todo: 간편 로그인(다른 플랫폼)
// login
router.post("/login", createLogin)

// todo: 현재 비밀번호, 새 비밀번호, 새 비밀번호 확인, 자동입력 방지문자
// find password
router.post("/find/password", findPassword)

// emailConfirm(isEmailConfirmed false -> true)
router.put("/confirm/email", emailConfirm)

// 패스워드 변경 (로그인 후)
router.put("/password", checkAuth, updatePassword)

// 패스워드 변경 (로그인 전)
router.put("/reset/password", resetPassword)

// find email

export default router