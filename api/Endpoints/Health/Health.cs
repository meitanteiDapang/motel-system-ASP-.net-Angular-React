using Microsoft.AspNetCore.Routing;

namespace Ecommerce.Api.Endpoints;

public static partial class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/health", GetHealth);
        return endpoints;
    }
}
