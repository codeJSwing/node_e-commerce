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
            minLength: 2,
            maxLength: 10
        },
        birth: {
            type: Date,
            required: false,
            length: 6
        },
        profileImg: {
            type: String
        },
        phoneNumber: {
            type: Number
        },
        role: {
            type: String,
            default: "user" // level : user / admin / superUser
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
    // if (user.isModified('password') || user.isNew) {
    try {
        // 프로필 이미지 자동 생성
        const avatar = await gravatar.url(
            this.email,
            {s: "200", r: "pg", d: "mm"},
            {protocol: "https"}
        )
        this.profileImg = avatar
        // password 암호화
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(this.password, salt)
        this.password = hash
        next()
    } catch (e) {
        return next(e)
    }
    // } else {
    //     return next()
    // }
})

// password 검증
// userSchema.methods.matchPassword = async function (password) {
//     // return await bcrypt.compare(password, this.password)
// }

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

const userModel = mongoose.model("User", userSchema)
export default userModel