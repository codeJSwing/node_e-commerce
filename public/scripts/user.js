async function getRequestHandler (url, headers) {
    const response = await fetch(url, {
        method: 'GET',
        headers: headers
    })

    if (response.ok) {
        const responseData = await response.json()
        return responseData
    } else {
        return response
    }
}

async function displayUserProfile() {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    try {
        const responseData = await getRequestHandler('/users/profile/me', headers);

        if (responseData.user) {
            const userDetails = [
                { key: 'email', label: '이메일' },
                { key: 'name', label: '이름' },
                { key: 'phoneNumber', label: '휴대폰 번호' },
                { key: 'username', label: '닉네임' },
                { key: 'role', label: '권한' },
                { key: 'createdAt', label: '생성일자' }
            ];

            const profileContainer = document.getElementById('profile-container');
            userDetails.forEach(detail => {
                const element = document.createElement('p');
                element.textContent = `${detail.label}: ${responseData.user[detail.key]}`;
                profileContainer.appendChild(element);
            });
        } else {
            displayErrorMessage(responseData.msg || responseData.message);
        }
    } catch (err) {
        displayErrorMessage(err.message);
    }
}

function displayErrorMessage(message) {
    const profileContainer = document.getElementById('profile-container');
    const errorElement = document.createElement('p');
    errorElement.style.color = 'red';
    errorElement.textContent = `오류: ${message}`;
    profileContainer.appendChild(errorElement);
}

document.addEventListener('DOMContentLoaded', displayUserProfile);

async function postRequestHandler (url, headers, formData) {
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formData)
    })

    if (response.ok) {
        const responseData  = await response.json()
        return responseData
    } else {
        throw new Error(`An error occurred during the POST request`)
    }
}

async function putRequestHandler (url, headers, formData) {
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formData)
    })

    if (response.ok) {
        const responseData  = await response.json()
        return responseData
    } else {
        throw new Error(`An error occurred during the POST request`)
    }
}

function responseHandler(responseData, url) {
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
}

function getFormData(formId) {
    let formData

    switch (formId) {
        case 'registration-form':
            formData = {
                email: document.getElementById('email').value,
                name: document.getElementById('name').value,
                password: document.getElementById('password').value,
                password2: document.getElementById('password2').value,
                phoneNumber: document.getElementById('phoneNumber').value,
                role: document.getElementById('role').value
            }
            break

        case 'login-form':
            formData = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            }
            break

        case 'email-recovery-form':
            formData = {
                phoneNumber: document.getElementById('phoneNumber').value,
                name: document.getElementById('name').value
            }
            break

        case 'password-recovery-form':
            formData = {
                email: document.getElementById('email').value
            }
            break

        case 'password-modification-form':
            formData = {
                password: document.getElementById('password').value,
                password2: document.getElementById('password2').value
            }
            break
    }

    return formData;
}

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
    },
    {
        form: document.getElementById('password-modification-form'),
        url: '/users/password'
    },
    {
        form: document.getElementById('profile-container'),
        url: '/users/profile'
    }
]

forms.forEach((formItem) => {
    formItem.form?.addEventListener('submit', async (event) => {
        event.preventDefault()

        const formDataId = formItem.form.id
        let formData = getFormData(formDataId)

        try {
            const token = localStorage.getItem('token')
            const headers = {
                'Content-Type': 'application/json'
            }

            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            let responseData

            if (formItem.url === '/users/login') {
                responseData = await postRequestHandler(formItem.url, headers, formData)
            } else {
                responseData = await putRequestHandler(formItem.url, headers, formData)
            }

            responseHandler(responseData, formItem.url)
        } catch (err) {
            console.error(err)
            alert(`An error occurred during the request.`)
        }
    })
})