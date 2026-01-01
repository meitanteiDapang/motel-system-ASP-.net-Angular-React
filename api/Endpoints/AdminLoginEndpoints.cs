using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;


namespace Ecommerce.Api.Endpoints;

public static class AdminLoginEndpoints
{
    public static IEndpointRouteBuilder MapAdminLoginEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/adminLogin", PostAdminLogin);
        return endpoints;
    }

    private static IResult PostAdminLogin(
    string username,
    string password,
    CancellationToken cancellationToken = default)
    {
        var requestUsername = username;
        var requestPassword = password;

        if (requestUsername != "admin" ||
                requestPassword != "ps^word")
        {
            return Results.Json(
                new { 
                        message = "Not correct!" 
                    },
                    statusCode: StatusCodes.Status401Unauthorized);
        }


        var secret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "abcdefghijklmnopqrstuvwxyzdapangpp";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "ecommerce-api",
            audience: "ecommerce-admin",
            claims: new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, requestUsername),
                new Claim(ClaimTypes.Role, "admin")
            },
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddHours(100),
            signingCredentials: credentials);

        var jwt = new JwtSecurityTokenHandler().WriteToken(token);

        return Results.Ok(new
        {
            message = "Happy login!",
            token = jwt
        });
    }

}
