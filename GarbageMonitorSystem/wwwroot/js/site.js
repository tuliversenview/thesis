// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
class ProfileAlert {
    constructor(containerId, profileData) {
        this.containerId = containerId;
        this.profileData = profileData;
    }

    createDropdown() {
        // Create the main dropdown div
        var dropdownDiv = $('<div>', { class: 'dropdown', css: { 'min-width': '150px'} });

        // Create the anchor tag
        var anchorTag = $('<a>', {
            href: '#',
            class: 'd-flex align-items-center link-light text-decoration-none dropdown-toggle',
            id: 'dropdownUser2',
            'data-bs-toggle': 'dropdown',
            'aria-expanded': 'false'
        });

        // Create the image tag
        var imgTag = $('<img>', {
            src: this.profileData.imageSrc,
            alt: '',
            width: '40',
            height: '40',
            class: 'rounded-circle me-2'
        });

        // Create the strong tag
        var strongTag = $('<strong>').text(this.profileData.username);

        // Append image and strong tag to the anchor tag
        anchorTag.append(imgTag);
        anchorTag.append(strongTag);

        // Create the dropdown menu
        var dropdownMenu = $('<ul>', {
            class: 'dropdown-menu text-small shadow',
            'aria-labelledby': 'dropdownUser2'
        });

        // Create dropdown menu items
        var menuItems = this.profileData.menuItems;

        // Append each menu item to the dropdown menu
        menuItems.forEach(function (item) {
            var li = $('<li>');
            var a = $('<a>', {
                class: 'dropdown-item',
                href: item.href
            }).text(item.text);
            li.append(a);
            dropdownMenu.append(li);
            // Check if clickFunc is defined and is a function
            if (item.clickFunc && typeof item.clickFunc === 'function') {
                a.on('click', function (event) {
                    event.preventDefault();
                    item.clickFunc(item); // Call the provided click function with the item
                });
            } else {
                // If clickFunc is not defined or not a function, prevent default action
                a.on('click', function (event) {
                    event.preventDefault();
                });
            }
        });

        // Add divider before the last item
        $('<li><hr class="dropdown-divider"></li>').insertBefore(dropdownMenu.find('a:contains("Sign out")').parent());

        // Append anchor tag and dropdown menu to the main div
        dropdownDiv.append(anchorTag);
        dropdownDiv.append(dropdownMenu);
        anchorTag.on('click', function (event) {
            event.preventDefault();
            dropdownMenu.toggle();
        });

        // Hide dropdown menu initially
        dropdownMenu.hide();
        // Append the dropdown div to the container
        $(this.containerId).append(dropdownDiv);
    }
}
function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

function appendOverlay() {
    const overlay = `
        <div id="overlay" class="overlay">
            <div class="spinner-border m-5" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
    `;
   return $(overlay);
}


window.addEventListener('load', function () {
    var token = localStorage.getItem('JWTToken');
    if (token) {
        debugger
        var parse = parseJwt(token)
        let timestamp = parse.exp;
        let jsTime = new Date(timestamp * 1000);
        if (jsTime < new Date()) {
            window.location.href = '/login';
        }
        var profileData = {
            imageSrc: 'https://github.com/mdo.png',
            username: parse.unique_name,
            menuItems: [
                { text: 'New project...', href: '#' },
                { text: 'Settings', href: '#' },
                { text: 'Profile', href: '#' },
                {
                    text: 'Sign out', href: '#', clickFunc: function (item) {
                        debugger
                        localStorage.removeItem('JWTToken');
                        window.location.href = '/login';
                    }
                }
            ]
        };
        debugger
        var profileAlert = new ProfileAlert('#user-profile', profileData);
        profileAlert.createDropdown();
    }
    
})
 