const form = document.getElementById('email-recovery-form')

form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const phoneNumber = document.getElementById('phoneNumber').value
    const name = document.getElementById('name').value

    const response = await fetch('/users/email-recovery', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            phoneNumber, name
        })
    })

    const data = await response.json()

    if (response.ok) {
        alert(data.message)
    } else {
        alert(data.message)
    }
})