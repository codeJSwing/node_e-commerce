import mongoose, {mongo} from "mongoose"

const schema = mongoose.Schema

const orderSchema = schema({
    id: schema.ObjectId,
    product: {
        type: schema.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    }
})

const orderModel = mongoose.model("Order", orderSchema)
export default orderModel
