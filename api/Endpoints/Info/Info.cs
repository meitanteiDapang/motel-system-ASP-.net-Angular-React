using Microsoft.AspNetCore.Routing;

namespace Ecommerce.Api.Endpoints;

public static partial class InfoEndpoints
{
    public static IEndpointRouteBuilder MapInfoEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/info", GetInfo);
        return endpoints;
    }
}
