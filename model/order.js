import mongoose from "mongoose"

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
    },
    user: {
        type: schema.ObjectId,
        ref: 'User',
        required: false
    }
})

orderSchema.pre('save', async function (next) {
    const Product = mongoose.model('Product')
    const product = await Product.findById(this.product)

    if (!product) {
        throw new Error('This product does not exist')
    }

    next()
})

const OrderModel = mongoose.model('Order', orderSchema)
export default OrderModel
