import express from "express";
import {
    loginHandler,
    createSignup,
    emailConfirm,
    findPassword,
    getProfile,
    resetPassword,
    updatePassword, findEmail
} from "../controller/user.js";

import jwt from "jsonwebtoken"
import passport from "passport";
import userModel from "../models/user.js";
import isAdmin from "../middleware/check-admin.js";

const checkAuth = passport.authenticate('jwt', {session: false})

const router = express.Router()

// profile 정보 가져오기
router.get("/", checkAuth, getProfile)

// 유저 전체 프로필 조회
router.get("/all", checkAuth, isAdmin, async (req, res) => {
    try {
        const users = await userModel.find()
        res.json({
            msg: `successful get all users`,
            users
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
})

// todo: 약관동의 (필수 / 선택)
// todo: 아이디, 비밀번호, 비밀번호 재확인, 이름, 생년월일, 성별(남, 여, 선택x), 본인확인 이메일(선택), 휴대전화(인증 필요)
// sign up
router.post("/signup", createSignup)

// todo: 1. 일반 / 2. 일회용 번호 / 3. QR 코드
// todo: 로그인 상태 유지
// todo: 간편 로그인(다른 플랫폼)
// login
router.post("/login", loginHandler)

// 자동입력 방지문자는 프런트의 영역
// todo: 현재 비밀번호, 새 비밀번호, 새 비밀번호 확인, 자동입력 방지문자
// find password
router.post("/find/password", findPassword)

// emailConfirm(isEmailConfirmed false -> true)
router.put("/confirm/email", emailConfirm)

// todo: checkAuth 없이
// 패스워드 변경 (로그인 후)
router.put("/password", checkAuth, updatePassword)

// 패스워드 변경 (로그인 전)
router.put("/reset/password", resetPassword)

// 이메일 찾기
router.post("/find/email", findEmail)

export default router