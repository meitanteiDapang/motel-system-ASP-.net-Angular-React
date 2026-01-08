using Microsoft.AspNetCore.Routing;

namespace Ecommerce.Api.Endpoints;

public static partial class AdminLoginEndpoints
{
    public static IEndpointRouteBuilder MapAdminLoginEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/adminLogin", PostAdminLogin);
        return endpoints;
    }
}
