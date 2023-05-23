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
            unique: [true, '이미 존재하는 이메일 주소입니다.'],
            lowercase: true,
            trim: true,
            validate: [validator.isEmail, '사용할 수 없는 이메일 주소 형식입니다.']
        },
        password: {
            type: String,
            required: true,
            minLength: [8, '비밀번호는 최소 8자 이상으로 작성이 가능합니다.'],
            maxLength: [128, '비밀번호는 최대 128자까지 작성이 가능합니다.'],
            validate: {
                validator: function (value) {
                    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]\\|:;'<>,.?/])[a-zA-Z\d!@#$%^&*()_\-+={}[\]\\|:;'<>,.?/]{8,}$/;
                    return regex.test(value)
                },
                message: '비밀번호는 대문자, 소문자, 특수문자, 숫자 각각 최소 1자 이상 작성하셔야 합니다.'
            }
        },
        name: {
            type: String,
            required: [true, '이름을 작성해주세요.']
        },
        username: {
            type: String,
            unique: true,
            length: [2 - 10, '닉네임은 최소 2자, 최대 10자까지 작성이 가능합니다.']
        },
        phoneNumber: {
            type: String,
            unique: [true, '이미 휴대폰 번호로 가입한 이메일 주소가 존재합니다.'],
            length: [11, '하이픈(-)을 제외한 숫자 11자로 입력해주세요.'],
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