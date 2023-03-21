import nodemailer from "nodemailer";

const sendEmail = async (email) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'imlogic20@gmail.com',
            pass: 'obopkvaifdnruhkj'
        }
    })
    const mailOptions = {
        to: email,
        subject: '가입인증메일',
        html:
            `
            아래버튼을 누르시면 가입이 완료됩니다.<br/>
            <form action="#" method="POST">
                <button>
                    가입확인
                </button>
            </form>
            `
    }
    await transporter.sendMail(mailOptions)
}

export default sendEmail