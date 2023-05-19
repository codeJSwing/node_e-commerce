import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import gravatar from "gravatar"

const userSchema = mongoose.Schema(
    {
        id: mongoose.Schema.Types.ObjectId,
        email: {
            type: String,
            required: true,
            unique: [true, 'Email is already registered'],
            lowercase: true,
            trim: true,
            validate: [validator.isEmail, 'Please provide a valid email address']
        },
        password: {
            type: String,
            required: true,
            minLength: [8, 'Password must be at least 8 characters long'],
            maxLength: [128, 'Password must be less than 128 characters long'],
            validate: {
                validator: function (value) {
                    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]\\|:;'<>,.?/])[a-zA-Z\d!@#$%^&*()_\-+={}[\]\\|:;'<>,.?/]{8,}$/;
                    return regex.test(value)
                },
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one special character and one number'
            }
        },
        username: {
            type: String,
            unique: true,
            minLength: [2, 'username is at least 2 characters long'],
            maxLength: [10, 'username is less than 10 characters long']
            // todo: model에서 default로 처리하는 방법 생각해보자
            // todo: 자동으로 겹치지 않게 생성해주는 방법
        },
        phoneNumber: {
            type: String,
            unique: [true, 'already have an email subscribed to your phoneNumber'],
            length: [11, 'Please enter your phoneNumber in 11 digits without a hyphen'],
            required: true
        },
        birth: {
            type: Date,
            length: [8, 'ex) 19930201']
        },
        profileImg: {
            type: String
        },
        role: {
            type: String,
            default: 'user' // level : user / admin / superUser
        },
        isEmailConfirm: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

// password 암호화
userSchema.pre('save', async function (next) {
    try {
        const avatar = await gravatar.url(
            this.email,
            {s: '200', r: 'pg', d: 'mm'},
            {protocol: 'https'}
        )
        this.profileImg = avatar
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(this.password, salt)
        this.password = hash
        next()
    } catch (e) {
        next(e)
    }
})

userSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

const UserModel = mongoose.model('User', userSchema)
export default UserModel