using Microsoft.AspNetCore.Routing;

namespace Ecommerce.Api.Endpoints;

public static class InfoEndpoints
{
    public static IEndpointRouteBuilder MapInfoEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/info", () =>
            Results.Ok(new
            {
                service = "ecommerce-api",
                version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "unknown"
            }));

        return endpoints;
    }
}
