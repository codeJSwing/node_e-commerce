// 필요한 모듈과 패키지를 가져온다.
import express from "express"
import dotenv from "dotenv"
import morgan from "morgan"
import passport from "passport"
import passportConfig from "./config/passport.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from "./config/database.js";
import { errorHandler, notFound } from "./middleware/globalErrorHandler.js";
import redisClient from "./config/redis.js";

// Swagger
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import * as path from "path";

// Express application 생성
const app = express()

// Swagger 문서 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swaggerSpec = YAML.load(path.join(__dirname, './build/swagger.yaml'));

// Swagger UI 미들웨어 등록
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 환경 변수 설정
dotenv.config()

// DB 연결
connectDB()
redisClient.connect().then()

// 로그 기록
app.use(morgan("dev"))

// 요청과 응답의 바디를 파싱
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// passport 초기화 및 구성
app.use(passport.initialize())
passportConfig(passport)

app.use(express.static("public"))

// router 설정
import productRouter from "./routes/product.js"
import orderRouter from "./routes/order.js"
import userRouter from "./routes/user.js"

app.use("/products", productRouter)
app.use("/orders", orderRouter)
app.use("/users", userRouter)

// 루트 경로 접속시, 메시지 반환 (테스트 용)
app.get("/", (req, res) => {
    res.send('api is running')
})

app.get("/home", async (req, res) => {
    try {
        const filePath = path.join(__dirname, "./public/components/home.html")
        res.sendFile(filePath)
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
})

// 오류 처리를 위한 미들웨어
app.use(notFound)
app.use(errorHandler)

// 서버 실행 및 포트 연결
const port = process.env.PORT || process.env.SUB_PORT
app.listen(port, () => {
    console.log(`Server started at ${process.env.PORT}`)
})