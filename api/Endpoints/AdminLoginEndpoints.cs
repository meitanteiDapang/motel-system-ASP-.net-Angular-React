using Microsoft.AspNetCore.Routing;

using Ecommerce.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.Http;


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
                requestPassword != "admin")
        {
            return Results.Json(
                new { 
                        message = "Not correct!" 
                    },
                    statusCode: StatusCodes.Status401Unauthorized);
        }

        return Results.Ok(new
        {
            message = "Happy login!"
        });
    }

}
