using Ecommerce.Api.Endpoints;
using Ecommerce.Api.Admin;
using Ecommerce.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:8080");


// db
var connectionString =
    builder.Configuration.GetConnectionString("Postgres")
    ?? builder.Configuration["POSTGRES_CONNECTION"]
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? "Host=localhost;Port=5432;Username=app;Password=app_pw;Database=appdb";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));






// cors
var configuredOrigins = (builder.Configuration["AllowedOrigins"]
        ?? builder.Configuration["ALLOWED_ORIGINS"])
    ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? Array.Empty<string>();

var defaultOrigins = new[]
{
    "https://dapang.live",
    "https://www.dapang.live",
    "http://localhost:5173",
};

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            // Allow configured origins or any dapang.live subdomain to avoid CORS drift between www/api hosts.
            .SetIsOriginAllowed(origin =>
            {
                if (configuredOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
                {
                    return true;
                }

                if (defaultOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
                {
                    return true;
                }

                return Uri.TryCreate(origin, UriKind.Absolute, out var uri)
                    && uri.Host.EndsWith(".dapang.live", StringComparison.OrdinalIgnoreCase);
            })
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});


// jwt

var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "abcdefghijklmnopqrstuvwxyzdapangpp";
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

builder.Services
  .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(options =>
  {
      options.TokenValidationParameters = new TokenValidationParameters
      {
          ValidateIssuer = true,
          ValidateAudience = true,
          ValidateLifetime = true,
          ValidateIssuerSigningKey = true,
          ValidIssuer = "ecommerce-api",
          ValidAudience = "ecommerce-admin",
          IssuerSigningKey = key,
          ClockSkew = TimeSpan.FromMinutes(1)
      };
  });

builder.Services.AddAuthorization();





var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();


app.MapAdminLoginEndpoints();
app.MapLoadBookingsEndpoints();
app.MapHealthEndpoints();
app.MapInfoEndpoints();
app.MapRoomTypeEndpoints();
app.MapBookingEndpoints();
app.MapTestEndpoints();

app.MapGet("/", () => Results.Redirect("/health"));

app.Run();
