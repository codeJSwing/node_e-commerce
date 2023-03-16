// 1.
import mongoose from "mongoose";


// 2.
const productSchema = mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    name: {
      type: String,
      required: true
    },
    price: {
        type: Number,
        required: true,
        default: 1000
    },
    desc: {
        type: String,
        minLength: 10,
        maxLength: 1000
    }
})

// 3.
// module.exports = mongoose.model("Product", productSchema)
const productModel = mongoose.model("Product", productSchema)
export default productModel