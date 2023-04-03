import userModel from "../models/user.js";
import jwt from "jsonwebtoken";
import {
    findPasswordTemplete,
    sendEmail,
    signupTemplete
} from "../config/sendEmail.js";
import bcrypt from "bcrypt";

const createSignup = async (req, res) => {
    const {email, username, password, birth, phoneNumber} = req.body
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
            birth,
            phoneNumber
        })
        const createUser = await newUser.save()
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

const loginHandler = async (req, res) => {
    const {email, password} = req.body
    try {
        const user = await userModel.findOne({email})
        if (!user) {
            return res.status(400).json({
                msg: `no user`
            })
        }
        const isMatching = await user.matchPassword(password)
        // console.log(isMatching)
        if (!isMatching) {
            return res.status(408).json({
                msg: `password does not match`
            })
        }
        const token = await jwt.sign(
            {userId: user._id},
            process.env.LOGIN_ACCESS_KEY,
            {expiresIn: "1h"}
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
    res.json({
        msg: `successful get userInfo`,
        user: req.user
    })
}

const updatePassword = async (req, res) => {
    const {userId} = req.user
    const {password} = req.body
    try {
        const passwordField = {}
        const hashedPassword = await bcrypt.hash(password, 10)
        if (hashedPassword) {
            passwordField.password = hashedPassword
        }
        await userModel.findByIdAndUpdate(userId, {$set: {password: passwordField.password}})
        res.json({
            msg: `successfully updated password`
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
        const user = await userModel.findOne({email})
        if (!user) {
            return res.status(408).json({
                msg: `no email`
            })
        }
        const findPasswordToken = await jwt.sign(
            {id: user._id},
            process.env.FIND_PASSWORD_ACCESS_KEY,
            {expiresIn: "10m"}
        )
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

const resetPassword = async (req, res) => {
    const {password1, password2, token} = req.body
    try {
        const {userId} = await jwt.verify(token, process.env.LOGIN_ACCESS_KEY)
        if (password1 !== password2) {
            return res.status(404).json({
                msg: `please check password and confirm password`
            })
        }
        const hashedPassword = await bcrypt.hash(password1, 10)
        await userModel.findByIdAndUpdate(userId, {password: hashedPassword})
        res.json({
            msg: `successful update password`
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const emailConfirm = async (req, res) => {
    const {token, email} = req.body
    try {
        await jwt.verify(token, process.env.LOGIN_ACCESS_KEY)
        const user = await userModel.findOne({email})
        if (user.isEmailConfirm === true) {
            return res.status(410).json({
                msg: `already isEmailConfirmed true`
            })
        }
        await userModel.findOneAndUpdate(email, {isEmailConfirm: true})
        res.json({
            msg: `successful updated email confirm`
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const findEmail = async (req, res) => {
    const {phoneNumber} = req.body
    try {
        const user = await userModel.findOne({phoneNumber})
        if (!user) {
            return res.status(400).json({
                msg: `This phoneNumber does not exists`
            })
        }
        console.log(user)
        const {email} = user
        res.json({
            msg: `successfully find email`,
            email
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

export {
    createSignup,
    loginHandler,
    getProfile,
    updatePassword,
    findPassword,
    resetPassword,
    emailConfirm,
    findEmail
}