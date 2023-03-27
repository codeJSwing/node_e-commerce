import nodemailer from "nodemailer";
import {token} from "morgan";

const signupTemplete = (token) =>
    `
            아래버튼을 누르시면 가입이 완료됩니다.<br/>
            http://localhost:3000/email/confirm?token=${token}
     `

const findPasswordTemplete =
    `
            아래버튼을 누르시면 비밀번호를 변경합니다.<br/>
            <form action="#" method="POST">
                <button>
                    비밀번호변경
                </button>
            </form>
            `

const sendEmail = async (email, title, body) => {
    const transporter = nodemailer.createTransport({
        service: process.env.MAIL_SERVICE,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_SECRETKEY
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