import nodemailer from "nodemailer";

const signupTemplete =
            `
            아래버튼을 누르시면 가입이 완료됩니다.<br/>
            <form action="#" method="POST">
                <button>
                    가입확인
                </button>
            </form>
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