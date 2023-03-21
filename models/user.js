import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const userSchema = mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
        required: true,
        unique: true,
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
            msg: 'Password must contain at least one uppercase letter, one lowercase letter, one special character and one number'
        }
    },
    username: {
        type: String,
        minLength: 2
        // todo: 최소, 최대 글자 설정
    },
    birth: {
        type: Number, // todo: date로 변경
        required: false,
        length: 6
    }
})

// password 암호화
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password') || user.isNew) {
        console.log("enter")
        try {
            const salt = await bcrypt.genSalt(10)
            const hash = await bcrypt.hash(user.password, salt)
            user.password = hash
            console.log("exit")
            next()
        } catch (e) {
            return next(e)
        }

    } else {
        return next()
    }
})

// password 검증
userSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

const userModel = mongoose.model("User", userSchema)
export default userModel