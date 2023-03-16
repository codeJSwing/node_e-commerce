import express from "express"
import checkAuth from "../middleware/check-auth.js";
import {
    getAllOrders,
    getOrder,
    createOrder,
    updateOrder,
    deleteAllOrders,
    deleteOrder
} from "../controller/order.js";

const router = express.Router()

router.get("/", checkAuth, getAllOrders)

router.get("/:id", checkAuth, getOrder)

router.post("/", checkAuth, createOrder)

router.put("/:id", updateOrder)

router.delete("/", deleteAllOrders)

router.delete("/:id", deleteOrder)

export default router