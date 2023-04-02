import express from "express"
import {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteAllProducts,
    deleteProduct
} from "../controller/product.js"
import passport from "passport";

const checkAuth = passport.authenticate('jwt', {session: false})

const router = express.Router()

router.get("/", getAllProducts)

router.get("/:id", checkAuth, getProduct)

router.post("/", createProduct)

router.put("/:id", updateProduct)

router.delete("/", checkAuth, deleteAllProducts)

router.delete("/:id", deleteProduct)

export default router