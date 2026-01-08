namespace Ecommerce.Api.Endpoints;

public static partial class HealthEndpoints
{
    private static IResult GetHealth()
    {
        return Results.Ok(new { status = "ok", service = "ecommerce-api" });
    }
}
