import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    birth: {
        type: Number,
        required: false,
        length: 6
    }
})

const userModel = mongoose.model("User", userSchema)
export default userModel