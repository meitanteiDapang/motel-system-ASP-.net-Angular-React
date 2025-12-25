using Ecommerce.Api.Endpoints;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:8080");

var connectionString =
    builder.Configuration.GetConnectionString("Postgres")
    ?? builder.Configuration["POSTGRES_CONNECTION"]
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? "Host=localhost;Port=5432;Username=app;Password=app_pw;Database=appdb";

builder.Services.AddSingleton<NpgsqlDataSource>(_ => new NpgsqlDataSourceBuilder(connectionString).Build());

var app = builder.Build();

app.MapHealthEndpoints();
app.MapInfoEndpoints();
app.MapRoomTypeEndpoints();
app.MapBookingEndpoints();
app.MapTestEndpoints();

app.MapGet("/", () => Results.Redirect("/api/health"));

app.Run();
