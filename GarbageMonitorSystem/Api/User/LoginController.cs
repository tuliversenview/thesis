using GarbageMonitorSystem.Authentication;
using GarbageMonitorSystem.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace GarbageMonitorSystem.Api.User
{
    [Route("api/User/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        // POST api/login
        [HttpPost]
        public IActionResult Post([FromBody] LoginRequestModel model)
        {
            (Models.User, bool) rs = DBCommon.ValidateUserCredentials(model.Username, model.Password);
             
            // Simulate authentication logic
            if (rs.Item2)
            {
                JwtService jwt = new JwtService();
                string token = jwt.GenerateToken(rs.Item1.Username, rs.Item1.Role.ToString(), rs.Item1.ID);

                // Return token or any response as needed
                return Ok(new { token });
            }
            else
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }
        }


       
    }


}

public class LoginRequestModel
{
    public string Username { get; set; }
    public string Password { get; set; }
}
