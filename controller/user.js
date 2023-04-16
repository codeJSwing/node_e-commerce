import userModel from "../model/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import {
    findPasswordTemplete,
    sendEmail,
    signupTemplete
} from "../config/sendEmail.js";
import redisCli from "../config/redis.js";

const signupHandler = async (req, res) => {
    const {email, username, password, birth, phoneNumber, role} = req.body
    try {
        const user = await userModel.findOne({email})
        if (user) {
            return res.status(401).json({
                msg: 'exists user'
            })
        }
        const newUser = new userModel({
            email,
            password,
            username: username ? username : email.split('@')[0],
            birth,
            phoneNumber,
            role
        })
        const createUser = await newUser.save()
        const confirmToken = await jwt.sign(
            {email: createUser.email},
            process.env.EMAIL_CONFIRM_ACCESS_KEY,
            {expiresIn: '10m'}
        )
        await sendEmail(createUser.email, '가입확인메일', signupTemplete(confirmToken))
        res.json({
            msg: 'successful new User',
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
            return res.status(401).json({
                msg: `This email does not exists`
            })
            // res.status(401)
            // throw new Error(`This email does not exists`)
        }
        const isMatching = await user.matchPassword(password)
        if (!isMatching) {
            return res.status(401).json({
                msg: `This password does not match, check your password`
            })
        }
        const token = await jwt.sign(
            {userId: user._id},
            process.env.LOGIN_ACCESS_KEY,
            {expiresIn: '1h'}
        )
        res.json({
            msg: 'successful login',
            token
        })
    } catch (err) {
        // res.status(500).json({
        //     msg: err.message
        // })
        res.status(500)
        throw new Error(err.message)
    }
}

// a라는 사람이 레디스에 이미 저장했을 때 , b라는 사람이 레디스에 있는 정보를 불러올 수 있어
const getProfile = async (req, res) => {
    const {_id} = req.user
    // console.log(_id)
    try {
        const user = await userModel.findById(_id)
        const userFromRedis = await redisCli.get(_id.toString())
        console.log('userFromRedis-----', userFromRedis)
        if (userFromRedis !== null) {
            const parsedRedis = JSON.parse(userFromRedis)
            console.log('redis')
            return res.json({
                msg: `successfully get redis data`,
                product: parsedRedis
            })
        }
        console.log('mongo')

        await redisCli.set(_id.toString(), JSON.stringify(user))
        res.json({
            msg: `successfully get userInfo`,
            user: req.user
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const updatePassword = async (req, res) => {
    const {_id} = req.user
    const {password} = req.body
    try {
        const passwordField = {}
        const hashedPassword = await bcrypt.hash(password, 10)
        if (hashedPassword) {
            passwordField.password = hashedPassword
        }
        await userModel.findByIdAndUpdate(_id, {$set: {password: passwordField.password}})
        res.json({
            msg: 'successfully updated password'
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
                msg: 'no email'
            })
        }
        const findPasswordToken = await jwt.sign(
            {id: user._id},
            process.env.FIND_PASSWORD_ACCESS_KEY,
            {expiresIn: '10m'}
        )
        await sendEmail(email, '비밀번호 변경', findPasswordTemplete(findPasswordToken))
        res.json({
            msg: 'Please check your email'
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

// todo: 사용자는 패스워드만 입력해야 되는데 token을 어떻게 처리할까?
const resetPassword = async (req, res) => {
    const {password1, password2, token} = req.body
    try {
        const {userId} = await jwt.verify(token, process.env.LOGIN_ACCESS_KEY)
        if (password1 !== password2) {
            return res.status(401).json({
                msg: `please check password and confirm password`
            })
        }
        const hashedPassword = await bcrypt.hash(password1, 10)
        await userModel.findByIdAndUpdate(userId, {password: hashedPassword})
        res.json({
            msg: 'successful update password'
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
                msg: 'already isEmailConfirmed true'
            })
        }
        await userModel.findOneAndUpdate(email, {isEmailConfirm: true})
        res.json({
            msg: 'successful updated email confirm'
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
        const {email} = await userModel.findOne({phoneNumber})
        if (!email) {
            return res.status(404).json({
                msg: 'This phoneNumber does not exists'
            })
        }
        res.json({
            msg: 'successfully find email',
            email
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find()
        res.json({
            msg: 'successful get all users',
            users
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

export {
    signupHandler,
    loginHandler,
    getProfile,
    updatePassword,
    findPassword,
    resetPassword,
    emailConfirm,
    findEmail,
    getAllUsers
}