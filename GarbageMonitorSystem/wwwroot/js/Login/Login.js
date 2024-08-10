

window.addEventListener('load', function () {
    Init()
})
function Init() {
    login = new Login('login-section');
     
}
    class Login {
        constructor(containerId) {
            this.render();
            this.setupListeners();
        }

        render() {
            // Create and append the form element
            this.form = $('#loginform');
            
            this.usernameInput = $('#username');
            this.passwordInput = $('#password');

            // Create and append the remember me and forgot password section
        
            this.rememberme=$('#remember-me');

           
        }

        setupListeners() {
            this.form.on('submit', (event) => {
                event.preventDefault(); // Prevent default form submission

                // Example: AJAX request to handle login
                // Replace with your actual login handling code
                $.ajax({
                    url: '/api/user/login',
                    method: 'POST',
                    contentType: "application/json",
                    data: JSON.stringify({
                        Username: this.usernameInput.val(),
                        Password: this.passwordInput.val(),
                         
                    }),
                    success: (response) => {
                        localStorage.setItem('JWTToken', response.token);
                        window.location.href = '/dashboard';
                    },
                    error: (xhr, status, error) => {
                        console.error('Login failed:', error);
                        // Display error message or take appropriate action
                    }
                });
            });
        }
    }
 
 
 



 

 

