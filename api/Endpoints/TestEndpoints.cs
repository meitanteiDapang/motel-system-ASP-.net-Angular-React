using Microsoft.AspNetCore.Routing;

namespace Ecommerce.Api.Endpoints;

public static class TestEndpoints
{
    public static IEndpointRouteBuilder MapTestEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/test", () =>
            Results.Ok(new
            {
                message = "Test endpoint is reachable.",
                timestamp = DateTimeOffset.UtcNow
            }));

        return endpoints;
    }
}
