import express from "express"
import checkAuth from "../middleware/check-auth.js";
import {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteAllProducts,
    deleteProduct
} from "../controller/product.js"

const router = express.Router()

router.get("/", getAllProducts)

router.get("/:id", checkAuth, getProduct)

router.post("/", createProduct)

router.put("/:id", updateProduct)

router.delete("/", checkAuth, deleteAllProducts)

router.delete("/:id", deleteProduct)

export default router