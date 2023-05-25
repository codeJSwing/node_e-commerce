const forms = [
    {
        form: document.getElementById('registration-form'),
        url: '/users/registration'
    },
    {
        form: document.getElementById('login-form'),
        url: '/users/login'
    },
    {
        form: document.getElementById('email-recovery-form'),
        url: '/users/email-recovery'
    },
    {
        form: document.getElementById('password-recovery-form'),
        url: '/users/password-recovery'
    }
]

forms.forEach((formItem) => {
    formItem.form?.addEventListener('submit', async (event) => {
        event.preventDefault()

        const formDataId = formItem.form.id

        let formData

        switch (formDataId) {
            case 'registration-form' :
                formData = {
                    email: document.getElementById('email').value,
                    name: document.getElementById('name').value,
                    password: document.getElementById('password').value,
                    password2: document.getElementById('password2').value,
                    phoneNumber: document.getElementById('phoneNumber').value,
                    role: document.getElementById('role').value
                }
                break

            case 'login-form' :
                formData = {
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value
                }
                break

            case 'email-recovery-form' :
                formData = {
                    phoneNumber: document.getElementById('phoneNumber').value,
                    name: document.getElementById('name').value
                }
                break

            case 'password-recovery-form' :
                formData = {
                    email: document.getElementById('email').value
                }
                break
        }

        await responseHandler(formItem.url, formData)
    })
})


async function responseHandler(url, formData) {
    const token = localStorage.getItem('token')

    const headers = {
        'Content-Type': 'application/json'
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formData)
    })

    const responseData = await response.json()

    if (response.ok) {
        const newToken = responseData.token

        if (newToken) {
            localStorage.setItem('token', newToken)
        }

        switch (url) {
            case '/users/login':
                window.location.href = '/home'
                break

            default:
                window.location.href = '/users/login'
                break
        }
        alert(responseData.message)
    } else {
        alert(responseData.message)
    }
}