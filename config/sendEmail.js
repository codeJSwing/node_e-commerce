import nodemailer from "nodemailer";

const signupTemplete = (token) =>
    `
            아래버튼을 누르시면 가입이 완료됩니다.<br/>
            http://localhost:3000/email/confirm?token=${token}
     `

const findPasswordTemplete = (token) =>
    `
            아래버튼을 누르시면 비밀번호를 변경합니다.<br/>
            http://localhost:3000/change/password?token=${token}
            `

const sendEmail = async (email, title, body) => {
    const transporter = nodemailer.createTransport({
        service: process.env.MAIL_SERVICE,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_SECRET_KEY
        }
    })
    const mailOptions = {
        to: email,
        subject: title,
        html: body
    }
    await transporter.sendMail(mailOptions)
}

export {
    sendEmail,
    signupTemplete,
    findPasswordTemplete
}