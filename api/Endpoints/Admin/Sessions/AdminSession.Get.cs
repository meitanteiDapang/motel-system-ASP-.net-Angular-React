using Microsoft.AspNetCore.Http;

namespace Ecommerce.Api.Endpoints.Admin;

public static partial class AdminSessionEndpoints
{
    private static IResult GetAdminSession()
    {
        return Results.Ok(new
        {
            message = "happy"
        });
    }
}
