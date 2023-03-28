import {ExtractJwt, Strategy} from "passport-jwt";
import userModel from "../models/user.js";
import passport from "passport";

const opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
opts.secretOrKey = process.env.LOGIN_ACCESS_KEY || "choseongik"

// const passportConfig = (passport) => {
//     passport.use(
//          new Strategy(opts, (jwt_payload, done) => {
//             try {
//                 const user = userModel.findById(jwt_payload.userId)
//                 console.log("---------", user)
//                 if (user) {
//                     return done(null, user) // req.user  생략
//                 }
//                 done(null, false)
//             } catch (e) {
//                 done(null, false)
//             }
//         })
//     )
// }
//
// export default passportConfig

const passportConfig = passport => {
    passport.use(
        new Strategy(opts, (payload, done) => {
            userModel.findById(payload.userId)
                .then(user => {
                    if (user) {
                        return done(null, user)
                    }
                    return done(null, false)
                })
                .catch(err => console.log(err))
        })
    )
}

export default passportConfig