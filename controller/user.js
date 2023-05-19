import {
    findPasswordTemplete,
    sendEmail,
    signupTemplete
} from "../config/sendEmail.js";
import UserModel from "../model/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import redisClient from "../config/redis.js";
import path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const signupPage = async (req, res) => {
    try {
        console.log('enter')
        const filePath = path.join(__dirname, "../signup.html");
        res.sendFile(filePath);
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

/*
* todo
*  1. 이미 등록된 전화번호가 있으면 회원가입이 되지 않도록
*  2. 스키마에서 걸리는 것을 프런트에 나타낼 수 있도록
*  3. username이 중복되지 않도록 - 스키마에서 처리
* */
const signupHandler = async (req, res) => {
    const {email, username, password, phoneNumber, role} = req.body
    try {
        // const user = await UserModel.findOne({email})
        // if (user) {
        //     return res.status(401).json({
        //         msg: 'exists user'
        //     })
        // }

        const newUser = new UserModel({
            email,
            password,
            username: username ? username : email.split('@')[0],
            phoneNumber,
            role
        })

        const createUser = await newUser.save()

        console.log('createUser------------', createUser)

        const confirmToken = await jwt.sign(
            {email: createUser.email},
            process.env.EMAIL_CONFIRM_ACCESS_KEY,
            {expiresIn: '10m'}
        )

        await sendEmail(createUser.email, '가입확인메일', signupTemplete(confirmToken))
        res.json({
            message: `successful new User`,
            user: createUser
        })
    } catch (err) {
        if (err.name === 'MongoServerError') {
            const duplicateKey = Object.keys(err.keyPattern)[0]
            const duplicateValue = err.keyValue[duplicateKey]

            res.status(400).json({
                message: `Duplicate Key Error`,
                error: `${duplicateKey}: ${duplicateValue} already exists`,
            })
            console.log(`${duplicateKey}: ${duplicateValue} already exists`)
        } else {
            res.status(500).json({
                message: `Internal server error`,
            })
        }
    }
}

const loginHandler = async (req, res) => {
    const {email, password} = req.body
    try {
        const user = await UserModel.findOne({email})
        if (!user) {
            return res.status(401).json({
                msg: `This email does not exists`
            })
        }
        const isMatching = await user.matchPassword(password)
        if (!isMatching) {
            return res.status(401).json({
                message: `This password does not match, check your password`
            })
        }
        const token = await jwt.sign(
            {userId: user._id},
            process.env.LOGIN_ACCESS_KEY,
            {expiresIn: '1h'}
        )
        res.json({
            message: 'successful login',
            token
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
        // res.status(500)
        // throw new Error(err.message)
    }
}

const getProfile = async (req, res) => {
    const {_id} = req.user
    try {
        const user = await UserModel.findById(_id)
        if (!user) {
            return res.status(400).json({
                msg: 'There is no user to get'
            })
        }
        const usersFromRedis = await redisClient.get('users')
        if (usersFromRedis !== null) {
            const parsedRedis = JSON.parse(usersFromRedis)
            const userFromRedis = parsedRedis.find(user => user._id === _id.toString());
            console.log('redis')
            return res.json({
                user: userFromRedis
            })
        }
        console.log('mongo')
        res.json({
            message: `successfully get userInfo`,
            user: req.user
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

const getAllUsers = async (req, res) => {
    try {
        const usersFromDB = await UserModel.find()
        const usersFromRedis = await redisClient.get('users')
        await redisClient.set('users', JSON.stringify(usersFromDB))
        if (usersFromRedis !== null) {
            console.log('redis')
            return res.json({
                users: JSON.parse(usersFromRedis)
            })
        }
        res.json({
            message: `successful get all users from DB`,
            users: usersFromDB
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

const findPassword = async (req, res) => {
    const {email} = req.body
    try {
        const user = await UserModel.findOne({email})
        if (!user) {
            return res.status(404).json({
                message: `${email} does not exist`
            })
        }
        const findPasswordToken = await jwt.sign(
            {id: user._id},
            process.env.FIND_PASSWORD_ACCESS_KEY,
            {expiresIn: '10m'}
        )
        await sendEmail(email, '비밀번호 변경', findPasswordTemplete(findPasswordToken))
        res.json({
            message: `Please check your email`
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

const findEmail = async (req, res) => {
    const {phoneNumber} = req.body
    try {
        const {email} = await UserModel.findOne({phoneNumber})
        if (!email) {
            return res.status(404).json({
                message: `${phoneNumber} does not exists`
            })
        }
        res.json({
            message: `Your email address is [${email}]`
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

// todo: 사용자는 패스워드만 입력해야 되는데 token을 어떻게 처리할까?
const resetPassword = async (req, res) => {
    const {password1, password2, token} = req.body
    try {
        const {userId} = await jwt.verify(token, process.env.LOGIN_ACCESS_KEY)
        if (password1 !== password2) {
            return res.status(400).json({
                message: `please check password and confirm password`
            })
        }
        const hashedPassword = await bcrypt.hash(password1, 10)
        await UserModel.findByIdAndUpdate(userId, {password: hashedPassword})
        res.json({
            message: `successfully updated password`
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

/*
* todo
*  1. 비밀번호 일치 여부 확인 - O
*  2. 패스워드 암호화 - O
*  3. DB에 저장된 패스워드 변경 - O
* */
const updatePassword = async (req, res) => {
    const {_id} = req.user
    const {password, password2} = req.body
    try {
        if (password !== password2) {
            return res.status(400).json({
                message: `Password does not match`
            })
        }

        const passwordField = {}
        const hashedPassword = await bcrypt.hash(password, 10)
        if (hashedPassword) {
            passwordField.password = hashedPassword
        }

        await UserModel.findByIdAndUpdate(_id, {$set: {password: passwordField.password}})
        res.json({
            msg: 'successfully updated password'
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

/*
* todo
*  1. api 의 역할이 모호해.
*  2. 이메일이 존재하지 않을 때 - O
*  3. 권한이 이미 true 일 때 - O
*  4. token을 body로 직접 전달하는 것은 좋지 않다고 생각해
* */
const emailConfirm = async (req, res) => {
    const {token, email} = req.body
    try {
        await jwt.verify(token, process.env.LOGIN_ACCESS_KEY)
        const user = await UserModel.findOne({email})

        if (!user) {
            res.status(400).json({
                message: `${email} does not exist, check your email address`
            })
        }

        if (user.isEmailConfirm === true) {
            return res.status(204).json({
                message: 'already isEmailConfirmed true'
            })
        }

        await UserModel.findOneAndUpdate({email}, {isEmailConfirm: true})
        res.json({
            message: `successful updated email confirm`
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

export {
    signupPage,
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