import express from "express";
import userModel from "../models/user.js";
const router = express.Router()

// sign up
router.post("/signup", async (req, res) => {
    const {email, password, username, birth} = req.body
    try {

    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
})

// login
router.post("/login", async (req, res) => {
    const {email, password} = req.body
    try {

    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
})

export default router