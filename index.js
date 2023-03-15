import express from "express"
import dotenv from "dotenv"
import morgan from "morgan"
import bodyParser from "body-parser";

const app = express()

import productRouter from "./routes/product.js"
import orderRouter from "./routes/order.js"
import userRouter from "./routes/user.js"
import mongoose from "mongoose";

dotenv.config()

const dbAddress = process.env.DB_URL
mongoose
    .connect(dbAddress)
    .then(() => console.log("Mongo DB Connected"))
    .catch(err => console.log(err.message))

// setting
app.use(morgan("dev"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use("/product", productRouter)
app.use("/order", orderRouter)
app.use("/user", userRouter)





const port = process.env.PORT || 5555
app.listen(port, console.log("Server started"))