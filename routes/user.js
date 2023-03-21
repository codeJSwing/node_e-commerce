import express from "express";
import checkAuth from "../middleware/check-auth.js";
import {
    createLogin,
    createSignup,
    getProfile,
    updatePassword
} from "../controller/user.js";
import userModel from "../models/user.js";
import {
    sendEmail,
    findPasswordTemplete
} from "../config/sendEmail.js";

const router = express.Router()

// sign up
router.post("/signup", createSignup)

// login
router.post("/login", createLogin)

// profile 정보 가져오기
router.get("/", checkAuth, getProfile)

// 패스워드 변경 (로그인 후)
router.put("/update/password", checkAuth, updatePassword)

// find password
router.post("/find/password", async (req, res) => {
    const {email} = req.body
    console.log(email)
    try {
        // 1. 이메일 찾기
        const user = await userModel.findOne({email})
        console.log(user)
        if (!user) {
            res.status(408).json({
                msg: `no email`
            })
        }
        console.log(user.email)
        //
        // // 2. 메일 전송
        await sendEmail(email, "비밀번호 변경", findPasswordTemplete)
        res.json({
            msg: `Please check your email`
        })

    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
})

export default router