import jwt from "jsonwebtoken";

const checkAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.LOGIN_ACCESS_KEY)
        req.user = decoded;
        next()
    } catch (e) {
        return res.status(409).json({
            msg: "auth failed",
            detail: e.message
        })
    }
}

export default checkAuth