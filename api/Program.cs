var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

object HealthPayload() => new { status = "ok", service = "ecommerce-api" };
object InfoPayload() => new
{
    service = "ecommerce-api",
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "unknown"
};

// Support both /api/* and root /health|/info for ingress rewrite convenience
app.MapGet("/health", () => Results.Ok(HealthPayload()));
app.MapGet("/api/health", () => Results.Ok(HealthPayload()));

app.MapGet("/info", () => Results.Ok(InfoPayload()));
app.MapGet("/api/info", () => Results.Ok(InfoPayload()));

app.MapGet("/", () => Results.Redirect("/health"));

app.Run();
