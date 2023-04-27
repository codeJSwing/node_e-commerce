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
            required: true,
            minLength: [10, 'desc must be at least 10 characters long'],
            maxLength: [2000, 'desc must be less than 2000 characters']
        }
    },
    {
        timestamps: true
    }
)

const ProductModel = mongoose.model('Product', productSchema)
export default ProductModel