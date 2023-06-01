/* todo
*   1. 사용자 입력 폼에 대한 정보 (id, password) - O
*   2. 버튼(submit)을 눌렀을 때 로그인 - O
*   3. 로그인 성공 시,
*       1) 홈으로 redirect - O
*       2) 백엔드에서 저장한 토큰 저장 (로컬) - O
*   4. 로그인 실패 시,
*       1) DB model 에 작성한 메세지 출력 - O
* */

const form = document.getElementById('login-form')

form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const response = await fetch('/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        })
    })

    const data = await response.json()

    if (response.ok) {
        localStorage.setItem('token', data.token)

        alert(data.message)
        window.location.href = '/home'
    } else {
        alert(data.message)
    }
})