namespace Ecommerce.Api.Endpoints;

public static partial class InfoEndpoints
{
    private static IResult GetInfo()
    {
        return Results.Ok(new
        {
            service = "ecommerce-api",
            version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "unknown"
        });
    }
}
