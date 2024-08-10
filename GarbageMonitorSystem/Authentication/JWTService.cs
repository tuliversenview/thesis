using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace GarbageMonitorSystem.Authentication
{
    public class JwtService
    {
        private readonly string _secretKey;
        private readonly string _issuer;
        private readonly string _audience;

        public JwtService(string secretKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE3MTM2ODk1MTQsImV4cCI6MTcxNDI5NDMxNCwiaWF0IjoxNzEzNjg5NTE0fQ.EbnpdeDF_O-TlLLJvYnAos6DTJ1Cx1NlNK38a77INeQ", string issuer = "1", string audience = "2")
        {
            _secretKey = secretKey;
            _issuer = issuer;
            _audience = audience;
        }

        public string GenerateToken(string username, string role,int id)
        {
            var claims = new[]
            {
            new Claim(JwtRegisteredClaimNames.UniqueName, username),
            new Claim(JwtRegisteredClaimNames.NameId, id.ToString()),
            new Claim(ClaimTypes.Role, role), // Adding the role claim
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            /*new Claim(ClaimTypes.NameIdentifier,"123")*/
        };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                _issuer,
                _audience,
                claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
