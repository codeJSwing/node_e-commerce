import mongoose from "mongoose";

const likeSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
})

const LikeModel = mongoose.model('Like', likeSchema)
export default LikeModel