import UserModel from "../model/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import redisClient from "../config/redis.js";
import path from "path";
import {fileURLToPath} from "url";
import lodash from "lodash"
import {sendEmail, signupTemplete} from "../config/sendEmail.js";

// ES 모듈에서 파일의 경로에 접근하기 위한 함수
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const signupPage = async (req, res) => {
    try {
        const filePath = path.join(__dirname, "../public/components/signup.html");
        res.sendFile(filePath);
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

const loginPage = async (req, res) => {
    try {
        const filePath = path.join(__dirname, "../public/components/login.html")
        res.sendFile(filePath)
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

const emailRecoveryPage = async (req, res) => {
    try {
        const filePath = path.join(__dirname, "../public/components/email-recovery.html")
        res.sendFile(filePath)
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

const passwordRecoveryPage = async (req, res) => {
    try {
        const filePath = path.join(__dirname, "../public/components/password-recovery.html")
        res.sendFile(filePath)
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

const myProfilePage = async (req, res) => {
    try {
        const filePath = path.join(__dirname, "../public/components/myProfile.html")
        res.sendFile(filePath)
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

const updatePasswordPage = async (req, res) => {
    try {
        const filePath = path.join(__dirname, "../public/components/password-modification.html")
        res.sendFile(filePath)
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

/*
* todo
*  1. 중복에 대한 처리를 스키마에서 - O
*   email, 전화번호, username
*  2. 비밀번호 1개 -> 2개 - O
*  3. 스키마에서 걸리는 것을 프런트에 나타낼 수 있도록 - O
*  4. 스키마에서 username을 자동으로 생성할 수 있을까?
* */
const signupHandler = async (req, res) => {
    const {email, name, username, password, password2, phoneNumber, role} = req.body
    try {
        const newUser = new UserModel({
            email,
            password,
            name,
            username: username ? username : email.split('@')[0],
            phoneNumber,
            role
        })

        if (password !== password2) {
            return res.status(400).json({
                message: `비밀번호가 일치하지 않습니다.`
            })
        }

        const createUser = await newUser.save()

        console.log('----------------------', createUser)

        const confirmToken = await jwt.sign(
            {email: createUser.email},
            process.env.EMAIL_CONFIRM_ACCESS_KEY,
            {expiresIn: '10m'}
        )

        await sendEmail(createUser.email, '가입확인메일', signupTemplete(confirmToken))
        res.json({
            message: `회원가입이 완료되었습니다.`
        })
    } catch (err) {
        if (err.name === 'MongoServerError') {
            const duplicateKey = Object.keys(err.keyPattern)[0]
            const duplicateValue = err.keyValue[duplicateKey]

            res.status(400).json({
                message: `이미 존재하는 ${duplicateKey} (${duplicateValue})입니다.`
            })
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
        if (lodash.isEmpty(user)) {
            return res.status(404).json({
                message: `입력하신 이메일이 존재하지 않습니다.`
            })
        }

        const isMatching = await user.matchPassword(password)
        if (!isMatching) {
            return res.status(400).json({
                message: `비밀번호가 일치하지 않습니다.`
            })
        }
        const token = await jwt.sign(
            {userId: user._id},
            process.env.LOGIN_ACCESS_KEY,
            {expiresIn: '1h'}
        )

        res.json({
            message: `로그인이 완료되었습니다.`,
            token
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
}

const getProfile = async (req, res) => {
    const {_id} = req.user
    try {
        const userFromRedis = await redisClient.get(`users/${_id}`)

        if (!lodash.isEmpty(userFromRedis)) {
            return res.json({
                message: `successfully get user information`,
                user: JSON.parse(userFromRedis)
            })
        }

        const userFromDB = await UserModel.findById(_id)
        const mapUser = {
            _id: userFromDB._id,
            email: userFromDB.email,
            name: userFromDB.name,
            username: userFromDB.username,
            role: userFromDB.role,
            createAt: userFromDB.createAt,
            profileImg: userFromDB.profileImg
        }

        if (lodash.isEmpty(userFromDB)) {
            res.status(404).json({
                message: `존재하지 않는 계정입니다.`
            })
        } else {
            await redisClient.set(`users/${_id}`, JSON.stringify(mapUser))
            await redisClient.expire(`users/${_id}`, 3600)
        }

        res.json({
            message: `successfully get user information`,
            user: mapUser
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
                message: `${email}은 등록되지 않은 계정입니다.`
            })
        }
        const findPasswordToken = await jwt.sign(
            {id: user._id},
            process.env.FIND_PASSWORD_ACCESS_KEY,
            {expiresIn: '10m'}
        )
        await sendEmail(email, '비밀번호 변경', findPasswordTemplete(findPasswordToken))
        res.json({
            message: `이메일을 확인해주세요.`
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

const findEmail = async (req, res) => {
    const {name, phoneNumber} = req.body
    try {
        const user = await UserModel.findOne({phoneNumber})
        if (!user) {
            return res.status(404).json({
                message: `[${phoneNumber}]으로 등록된 계정이 없습니다.`
            })
        }

        if (name === user.name && phoneNumber === user.phoneNumber) {
            res.json({
                message: `이메일 주소는 [${user.email}]입니다.`
            })
        }
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
    loginPage,
    emailRecoveryPage,
    passwordRecoveryPage,
    myProfilePage,
    updatePasswordPage,
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