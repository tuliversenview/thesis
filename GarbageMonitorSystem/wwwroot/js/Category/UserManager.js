window.addEventListener('load', function () {
    Init()
})
function Init() {
    const grid = new UserManager();
}
class UserManager {
    constructor() {
        debugger
        this.SearchInput = $('#input_grid_search');
        debugger
        this.Init();
       /* this.IntiSearchGrid();
        this.ViewUserInitEvent();*/
    }
    async Init() {
        this.userRoles = await this.GetRole();
        this.InitGrid();

        $('.close').click(function () {
            this.closeModal();
        }.bind(this));

        

        // Event listener for the edit button
        $(document).on('click', '.edit-btn', function (event) {
            const userId = $(event.currentTarget).parent().data('userid');
            this.openModal(userId);
        }.bind(this));

        $('#editUserForm').submit(function (event) {
            event.preventDefault();
            self.submitForm();
        });


    }

    IntiSearchGrid() {
        this.SearchInput.on('keyup', () => {
            this.gridinit.forceRender();
        });
    }

    ViewUserInitEvent() {
        $(document).on('click', '.edit', (event) => {
            const itemid = $(event.currentTarget).data('itemid');
            this.GetUserInfoByID(itemid, (e) => {
                const myModal = new bootstrap.Modal(document.getElementById('userinfo-modal'), {
                    keyboard: false
                });
                // $(myModal._dialog).find("#modal_username").val(e.data.username);
                $(myModal._dialog).find("#modal_phone").val(e.data.phone);
                $(myModal._dialog).find("#modal_password").val(e.data.password);
                $(myModal._dialog).find("#modal_country").val(e.data.country);
                $(myModal._dialog).find("#modal_useragent").val(e.data.userAgent);
                $(myModal._dialog).find("#modal_cookie").val(e.data.cookie);
                $(myModal._dialog).find("#modal_userid").val(e.data.userID);
                $(myModal._dialog).find("#myLargeModalLabel").html(e.data.username);
                myModal.show();
            });
        });
    }

    async getUserById(id) {
        try {
            const response = await fetch(`/api/Category/getitem?table=user&id=${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('JWTToken')
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    }

    async GetRole() {
        var url = `/api/category/getlist?table=userrole&limit=0&offset=0`
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('JWTToken')}`
            }
        });
        var dataobj = await response.json();
        return dataobj.data;
    }

    InitGrid() {
        this.gridinit = new gridjs.Grid({
            height: '60vh',
            columns: [
                {
                    name: 'datarow',
                    hidden: true,
                },
                {
                    name: 'ID',
                    width: '80px',
                    formatter: (cell, row) => {
                        return gridjs.html(`<span>${row.cells[0].data.id}</span>`);
                    }
                },
                {
                    name: 'Username',
                    width: '150px',  
                    formatter: (cell, row) => {
                        const data = {
                            username: row.cells[0].data.username,
                            imageurl: row.cells[0].data.imageurl,
                        };
                        return gridjs.html($('#userTemplate').tmpl(data).html());
                    }
                },
                {
                    name: 'FullName',
                    width: '150px',
                    formatter: (cell, row) => {
                        return gridjs.html(`<span>${row.cells[0].data.fullname}</span>`);
                    }
                },
                {
                    name: 'Role',
                    width: '70px',
                    formatter: (cell, row) => {
                        return gridjs.html(`<span>${this.userRoles.filter(e => e.id == row.cells[0].data.role)[0].rolename}</span>`);
                    }
                },
                {
                    name: 'Is Driver',
                    width: '70px',
                    formatter: (cell, row) => {
                        const isChecked = row.cells[0].data.isdriver;
                        const checkboxHtml = `<input type="checkbox" disabled ${isChecked ? 'checked' : ''}>`;
                        return gridjs.html(checkboxHtml);
                    }
                }, 
                {
                    name: 'Status',
                    formatter: (cell, row) => {
                        if (row.cells[0].data.status === true) {
                            return gridjs.html(`<span class='badge text-bg-dark'>Is Block</span>`);
                        }
                        if (row.cells[0].data.status === true) {
                            return gridjs.html(`<span class='badge text-bg-danger'>Is Restricted</span>`);
                        }
                        return gridjs.html(`<span class='badge text-bg-success'>Live</span>`);
                    }
                },
                {
                    name: '',
                    formatter: (cell, row) => {
                        const data = {
                            userid: row.cells[0].data.id,
                        };
                        return gridjs.html($('#commandTemplate').tmpl(data).html());
                    }
                }
            ],
            pagination: {
                limit: 10,
                server: {
                    url: (prev, page, limit) => `/api/Category/getlist?table=user&limit=${limit}&offset=${page * limit}&keyword=${this.SearchInput.val()}`,
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('JWTToken') // Include the JWT token in the headers
                    }
                }
            },
            server: {
                url: '/api/Category/getlist?table=user',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('JWTToken') // Include the JWT token in the headers
                },
                then: data => data.data.map(user => [
                    user
                ]),
                total: data => data.totalRecord
            },
            className: {
                table: ''
            }
        }).render(document.getElementById("grid"));
    }

    async openModal(userId) {
        const user =await this.getUserById(userId); // Function to fetch user data by ID

        // Populate the modal with the user's data
        $('#editUserId').val(user.id);
        $('#editUsername').val(user.username);
        $('#editFullname').val(user.fullname);
        $('#editRole').val(user.role);

        // Open the modal
        $('#editUserModal').show();
    }

    closeModal() {
        $('#editUserModal').hide();
    }

    submitForm() {
        const userId = $('#editUserId').val();
        const updatedData = {
            username: $('#editUsername').val(),
            fullname: $('#editFullname').val(),
            role: $('#editRole').val()
        };

        // Update the user data on your server
        this.updateUser(userId, updatedData);
        this.closeModal();
    }

    getUserById(id) {
        // Fetch the user data from your server or data source
        // This is a placeholder example
        return {
            id: id,
            username: "exampleUser",
            fullname: "Example User",
            role: "Admin"
        };
    }

    updateUser(id, data) {
        // Send the updated data to your server
        console.log('Updating user', id, data);
    }




}

