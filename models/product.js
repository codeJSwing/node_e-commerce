import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    name: {
      type: String,
      required: true
    },
    price: { // todo: 3자리마다 , 가 출력되도록
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