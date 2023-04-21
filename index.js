import express from "express"
import dotenv from "dotenv"
import morgan from "morgan"

import bodyParser from "body-parser";
import passport from "passport"
import passportConfig from "./config/passport.js";

const app = express()

import productRouter from "./routes/product.js"
import orderRouter from "./routes/order.js"
import userRouter from "./routes/user.js"

import connectDB from "./config/database.js";
import {errorHandler, notFound} from "./middleware/globalErrorHandler.js";

dotenv.config()

connectDB()

// setting
app.use(morgan("dev"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(passport.initialize())

// passport config
passportConfig(passport)

app.use("/product", productRouter)
app.use("/order", orderRouter)
app.use("/user", userRouter)

// todo: test 하는 방법
app.get("/", (req, res) => {
    res.send('api is running')
})

// error handling
app.use(notFound)
app.use(errorHandler)

const port = process.env.PORT || process.env.SUB_PORT
app.listen(port, () => {
    console.log(`Server started at ${process.env.PORT}`)
})