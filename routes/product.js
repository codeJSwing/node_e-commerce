import express from "express"
import checkAuth from "../middleware/check-auth.js";
import {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProducts,
    deleteProduct
} from "../controller/product.js"

const router = express.Router()

router.get("/", getAllProducts)

router.get("/:id", checkAuth, getProduct)

router.post("/", createProduct)

router.put("/:id", updateProduct)

router.delete("/", checkAuth, deleteProducts)

router.delete("/:id", deleteProduct)

export default router