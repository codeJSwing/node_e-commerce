import mongoose from "mongoose";

// DB 연결하는 모듈 분리
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL)
        console.log('Connected database')
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

export default connectDB