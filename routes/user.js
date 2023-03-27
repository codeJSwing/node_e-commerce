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

export default router