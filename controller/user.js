import userModel from "../models/user.js";
import jwt from "jsonwebtoken";
import user from "../models/user.js";
import {
    findPasswordTemplete,
    sendEmail,
    signupTemplete
} from "../config/sendEmail.js";

const createSignup = async (req, res) => {
    const {email, username, password, birth} = req.body
    try {
        const user = await userModel.findOne({email})
        if (user) {
            return res.status(404).json({
                msg: `exists user`
            })
        }
        const newUser = new userModel({
            email,
            password,
            username: username ? username : email.split('@')[0],
            birth
        })
        const createUser = await newUser.save()
        // token 생성
        const confirmToken = await jwt.sign(
            {email: createUser.email},
            process.env.EMAIL_CONFIRM_ACCESS_KEY,
            {expiresIn: "10m"}
        )
        await sendEmail(createUser.email, "가입확인메일", signupTemplete(confirmToken))
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
    const {email, password} = req.body
    try {
        const user = await userModel.findOne({email})
        if (!user) {
            return res.status(400).json({
                msg: `no user`
            })
        }
        const isMatch = await user.matchPassword(password)
        if (!isMatch) {
            return res.status(408).json({
                msg: `password do not match`
            })
        }

        // 3. generate jwt
        const token = await jwt.sign(
            {userId: user._id}, // 내용
            process.env.LOGIN_ACCESS_KEY, // 민감정보이기 때문에 환경변수화
            {expiresIn: "1h"} // 만료 기한
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
    try {
        const user = await userModel.findById(userId)
        res.json({
            msg: `get profile info`,
            user
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const updatePassword = async (req, res) => {
    // 로직은 id 찾기, id에 해당되는 유저의 패스워드 변경
    const {userId} = req.user
    const {password} = req.body
    try {
        const passwordField = {}
        // todo: 굳이 if문 안에 넣은 이유는?
        // password 암호화
        if (password) {
            // const hashedPassword = await bcrypt.hash(password, 10)
            passwordField.password = password
        }
        // user를 찾고 해당되는 user의 패스워드 변경
        await userModel.findByIdAndUpdate(userId, {$set: {password: passwordField.password}})
        return res.json({
            msg: `updated password`,
            user
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const findPassword = async (req, res) => {
    const {email} = req.body
    try {
        // 1. 이메일 찾기
        const user = await userModel.findOne({email})
        console.log(user)
        if (!user) {
            res.status(408).json({
                msg: `no email`
            })
        }
        const findPasswordToken = await jwt.sign(
            {id: user._id},
            process.env.FIND_PASSWORD_ACCESS_KEY,
            {expiresIn: "10m"}
        )

        // 2. 메일 전송
        await sendEmail(email, "비밀번호 변경", findPasswordTemplete(findPasswordToken))
        res.json({
            msg: `Please check your email`
        })

    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

export {
    createSignup,
    createLogin,
    getProfile,
    updatePassword,
    findPassword
}