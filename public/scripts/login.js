const form = document.getElementById('login-form')

form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    const response = await fetch('/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email, password
        })
    })

    const data = await response.json()

    if (response.ok) {
        alert(data.message)
    } else {
        alert(data.message)
    }
})