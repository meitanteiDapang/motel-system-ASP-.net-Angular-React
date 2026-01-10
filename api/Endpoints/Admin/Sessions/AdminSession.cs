using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Routing;

namespace Ecommerce.Api.Endpoints.Admin;

public static partial class AdminSessionEndpoints
{
    public static IEndpointRouteBuilder MapAdminSessionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/admin/session", PostAdminSession);
        endpoints.MapGet("/admin/session", GetAdminSession)
            .RequireAuthorization(new AuthorizeAttribute { Roles = "admin" });
        return endpoints;
    }
}
