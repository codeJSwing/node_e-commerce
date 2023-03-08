// 1.
import mongoose from "mongoose";


// 2.
const productSchema = mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    desc: String
})

// 3.
// module.exports = mongoose.model("Product", productSchema)
const productModel = mongoose.model("Product", productSchema)
export default productModel