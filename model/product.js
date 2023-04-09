import mongoose from "mongoose";

const productSchema = mongoose.Schema({
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

const productModel = mongoose.model("Product", productSchema)
export default productModel