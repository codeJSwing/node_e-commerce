import express from "express"
import {
    getAllOrders,
    getOrder,
    createOrder,
    updateOrder,
    deleteAllOrders,
    deleteOrder
} from "../controller/order.js";
import passport from "passport";

const checkAuth = passport.authenticate('jwt', {session: false})

const router = express.Router()

router.get("/", checkAuth, getAllOrders)

router.get("/:id", checkAuth, getOrder)

router.post("/", checkAuth, createOrder)

router.put("/:id", updateOrder)

router.delete("/", deleteAllOrders)

router.delete("/:id", deleteOrder)

export default router