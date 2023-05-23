const form = document.getElementById('password-recovery-form')

form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const email = document.getElementById('email').value

    const response = await fetch('/users/password-recovery', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email
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