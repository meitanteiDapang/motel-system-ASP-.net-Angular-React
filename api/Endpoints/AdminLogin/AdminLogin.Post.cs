using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Ecommerce.Api.Endpoints;

public static partial class AdminLoginEndpoints
{
    private static IResult PostAdminLogin(
        string username,
        string password,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        var requestUsername = username;
        var requestPassword = password;

        if (requestUsername != "admin" || requestPassword != "ps^word")
        {
            return Results.Json(
                new { message = "Not correct!" },
                statusCode: StatusCodes.Status401Unauthorized);
        }

        var jwtSecret = configuration["Jwt:Secret"]
            ?? configuration["JWT_SECRET"]
            ?? "abcdefghijklmnopqrstuvwxyzdapangpp";
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var signingCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, requestUsername),
            new Claim(ClaimTypes.Role, "admin"),
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = "ecommerce-api",
            Audience = "ecommerce-admin",
            SigningCredentials = signingCredentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var jwt = tokenHandler.WriteToken(token);

        return Results.Ok(new
        {
            message = "Happy login!",
            token = jwt
        });
    }
}
