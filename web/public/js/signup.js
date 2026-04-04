// Validate form input, client-side
document.getElementById("signup-form").addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById("signup-username");
    const password = document.getElementById("signup-password");

    const errorElem = document.getElementById("signup-error");

    if (password.value.length < 8) {
        errorElem.innerText = 'Please enter a password with at least 8 characters.';
        return;
    }
    
    // if all is good, submit
    e.target.submit()
})
