import userModel from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import checkAuth from "../middleware/check-auth.js";
import user from "../models/user.js";

const createSignup = async (req, res) => {
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
}

const createLogin = async (req, res) => {
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
        // 3. generate jwt
        const token = await jwt.sign(
            { userId: user._id }, // 내용
            process.env.SECRET_KEY, // 민감정보이기 때문에 환경변수화
            { expiresIn: "1h"} // 만료 기한
        )
        res.json({
            msg: `successful login`,
            token
        })
    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const getProfile = async (req, res) => {
    const {userId} = req.user
    const user = await userModel.findById(userId)
    res.json({
        msg: `get profile info`,
        user
    })
}

const updatePassword = async (req, res) => {
    // 로직은 id 찾기, id에 해당되는 유저의 패스워드 변경
    const {userId} = req.user
    const {password} = req.body
    try {
        const passwordField = {}

        // password 암호화
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10)
            passwordField.password = hashedPassword
        }
        // user를 찾고 해당되는 user의 패스워드 변경
        await userModel.findByIdAndUpdate(userId, {password: passwordField.password})
        return res.json({
            msg: `updated password`,
            user
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
})

export {
    createSignup,
    createLogin,
    getProfile,
    updatePassword
}