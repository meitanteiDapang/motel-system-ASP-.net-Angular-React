using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ecommerce.Api.Admin;

public static class LoadBookingsEndpoints
{
    public static IEndpointRouteBuilder MapLoadBookingsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/admin/loadBookings", GetLoadBookings)
            .RequireAuthorization(new AuthorizeAttribute { Roles = "admin" });
        return endpoints;
    }

    private static IResult GetLoadBookings()
    {
        return Results.Ok(new
        {
            message = "happy"
        });
    }
}
