import {ExtractJwt, Strategy} from "passport-jwt";
import UserModel from "../model/user.js";

const opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
opts.secretOrKey = process.env.LOGIN_ACCESS_KEY || 'choseongik'

const passportConfig = passport => {
    passport.use(
        new Strategy(opts, (payload, done) => {
            UserModel
                .findById(payload.userId)
                .then(user => {
                    if (user) {
                        return done(null, user)
                    }
                    return done(null, false)
                })
                .catch(err => {
                    return done(err, false)
                })
        })
    )
}

export default passportConfig