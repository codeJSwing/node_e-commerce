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
            // todo: model에서 default로 처리하는 방법 생각해보자
        },
        birth: {
            type: Date,
            length: [6, "YY-MM-DD"]
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
    try {
        const avatar = await gravatar.url(
            this.email,
            {s: "200", r: "pg", d: "mm"},
            {protocol: "https"}
        )
        this.profileImg = avatar
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(this.password, salt)
        this.password = hash
        next()
    } catch (e) {
        return next(e)
    }
})

userSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

const userModel = mongoose.model("User", userSchema)
export default userModel