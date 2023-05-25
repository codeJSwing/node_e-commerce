const forms = [
    {
        form: document.getElementById('myProfile-form'),
        url: '/users/profile/me'
    }
]

forms.forEach((formItem) => {
    formItem.form?.addEventListener('get', async (event) => {
        event.preventDefault()

        const formDataId = formItem.form.id

        let formData

        // 이름, 닉네임, 핸드폰번호, 프로필이미지, 생성일자, 권한
        switch (formDataId) {
            case 'myProfile-form':
                formData = {
                    name: document.getElementById('name').value,
                    phoneNumber: document.getElementById('phoneNumber').value,
                    username: document.getElementById('username').value,
                    createdAt: document.getElementById('createdAt').value,
                    profileImg: document.getElementById('profileImg').value,
                    role: document.getElementById('role').value
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
        method: 'GET',
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