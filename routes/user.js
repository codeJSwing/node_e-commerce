import express from "express";
import checkAuth from "../middleware/check-auth.js";
import {
    createLogin,
    createSignup,
    findPassword,
    getProfile,
    updatePassword
} from "../controller/user.js";

import jwt from "jsonwebtoken"
import userModel from "../models/user.js";
import user from "../models/user.js";
import bcrypt from "bcrypt"

const router = express.Router()

// sign up
router.post("/signup", createSignup)

// emailConfirm(isEmailConfirmed false -> true)
router.put("/email/confirm", async (req, res) => {
    const {token} = req.body
    try {
        // 토큰 payload 추출 (이메일)
        const {email} = await jwt.verify(token, process.env.EMAIL_CONFIRM_ACCESS_KEY)
        console.log(email)
        // // 이메일에 해당되는 유저를 찾는다.
        const user = await userModel.findOne({email})
        if (user.isEmailConfirm === true) {
            return res.status(410).json({
                msg: `already isEmailConfirmed true`
            })
        }
        // 유저의 이메일 유저 confirm : false -> true로 변경
        await userModel.findOneAndUpdate(email, {isEmailConfirm: true})
        res.json({
            msg: `successful updated email confirm`
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })

    }

})

// login
router.post("/login", createLogin)

// profile 정보 가져오기
router.get("/", checkAuth, getProfile)

// 패스워드 변경 (로그인 후)
router.put("/update/password", checkAuth, updatePassword)

// find password
router.post("/find/password", findPassword)

// 패스워드 변경 (로그인 전)
router.put("/password/reset", async (req, res) => {
    const {password1, password2, token} = req.body
    try {
        // 1. 토큰을 풀어서 아이디를 찾고
        const {id} = await jwt.verify(token, process.env.FIND_PASSWORD_ACCESS_KEY)
        console.log("+++++++++++++++", id)
        if (password1 !== password2) {
            return res.status(404).json({
                msg: `please check password and confirm password`
            })
        }
        const hashedPassword = await bcrypt.hash(password1, 10)

        // 2. 아이디에 해당되는 패스워드 변경
        await userModel.findByIdAndUpdate(id, {password: hashedPassword})
        return res.json({
            msg: `successful update password`
        })

    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
})

export default router