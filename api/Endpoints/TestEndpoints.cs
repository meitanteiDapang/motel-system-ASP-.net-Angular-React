using Ecommerce.Api.My;
using Microsoft.AspNetCore.Routing;

namespace Ecommerce.Api.Endpoints;

public static class TestEndpoints
{
    public static IEndpointRouteBuilder MapTestEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/test", GetTest);
        return endpoints;
    }

    private static IResult GetTest(int test_id = 5)
    {
        var helper = new StructClass(test_id);
        return Results.Ok(new
        {
            message = helper.GetMessage(),
            timestamp = DateTimeOffset.UtcNow
        });
    }
}
