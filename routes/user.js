import express from "express";
import bcrypt from "bcrypt"
import userModel from "../models/user.js";
const router = express.Router()

// sign up
router.post("/signup", async (req, res) => {
    const {email, password, username, birth} = req.body
    // 1. email 유무 체크
    // 2. password 암호화 (인코딩)
    try {
        const user = await userModel.findOne({email})
        // 1. email 유무 체크
        if (user){
            return res.status(404).json({
                msg: `exists user`
            })
        }
        // 2. password 암호화
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = new userModel({
            email,
            password: hashedPassword,
            username,
            birth
        })
        const createUser = await newUser.save()
        res.json({
            msg: `successful new User`,
            user: createUser
        })

    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
})

// login
router.post("/login", async (req, res) => {
    // 1. email 유무 체크
    // 2. password 복호화(디코딩)
    // 3. jsonwebtoken으로 리턴

    const {email, password} = req.body

    try {
        // 1. email 유무 체크
        const user = await userModel.findOne({email})
        if (!user){
           return res.status(400).json({
               msg: `no user`
           })
        }
        // 2. password 매칭
        const isMatching = await bcrypt.compare(password, user.password)
        if (!isMatching) {
            return res.status(408).json({
                msg: `password is not matched`
            })
        }
        res.json({
            msg: `successful login`,
            user
        })
    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
})

export default router