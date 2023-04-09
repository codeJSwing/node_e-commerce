// 좋아요
// 어떤 제품에 누가 했는지, 메모
// 등록, 삭제
import mongoose from "mongoose";

const replySchema = mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        memo: {
            type: String,
            minLength: 20,
            maxLength: 200
        }
    },
    {
        timestamps: true
    }
)

const replyModel = mongoose.model("Reply", replySchema)
export default replyModel