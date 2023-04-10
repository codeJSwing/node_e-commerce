const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        res.status(401).json({
            msg: 'Not authorized as an admin'
        })
    }
    next()
}

export default isAdmin