import express from "express"
import dotenv from "dotenv"
import morgan from "morgan"
import bodyParser from "body-parser";

const app = express()

dotenv.config()

// setting
app.use(morgan("dev"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))





const port = process.env.PORT || 5555
app.listen(port, console.log("Server started"))