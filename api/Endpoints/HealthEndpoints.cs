using Microsoft.AspNetCore.Routing;

namespace Ecommerce.Api.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/health", () => Results.Ok(new { status = "ok", service = "ecommerce-api" }));
        return endpoints;
    }
}
