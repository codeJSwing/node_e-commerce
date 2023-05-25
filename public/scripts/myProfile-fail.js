window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token')

    fetch('/users/profile/me', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.user) {
                displayUserProfile(data.user)
            } else {
                displayErrorMessage(data.msg || data.message)
            }
        })
        .catch(err => {
            displayErrorMessage(err.message)
        })
    function displayUserProfile(user) {
        const profileContainer = document.getElementById('myProfile-form')

        const nameElement = document.createElement('hi')
        nameElement.textContent = `이름: ${user.name}`

        const emailElement = document.createElement('p')
        emailElement.textContent = `이메일: ${user.email}`

        profileContainer.appendChild(nameElement)
        profileContainer.appendChild(emailElement)
    }

    function displayErrorMessage(message) {
        const profileContainer = document.getElementById('myProfile-form')

        const errorElement = document.createElement('p')
        errorElement.style.color = 'red'
        errorElement.textContent = `오류: ${message}`

        profileContainer.appendChild(errorElement)
    }
})


