const form = document.getElementById('signup-form')

form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const email = document.getElementById('email').value
    const username = document.getElementById('username').value
    const password = document.getElementById('password').value
    const password2 = document.getElementById('password2').value
    const phoneNumber = document.getElementById('phoneNumber').value
    const role = document.getElementById('role').value

    const response = await fetch('/users/registration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email, username, password, password2, phoneNumber, role
        })
    })

    const data = await response.json()

    if (response.ok) {
        alert(data.message)
        window.location.href = '/users/login'
    } else {
        alert(data.message)
    }
})