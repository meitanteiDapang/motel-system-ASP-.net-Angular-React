using Ecommerce.Api.Endpoints;
using Ecommerce.Api.Endpoints.Admin;
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
var configuredOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? Array.Empty<string>();

if (configuredOrigins.Length == 0)
{
    throw new InvalidOperationException("AllowedOrigins must contain at least one entry.");
}

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(configuredOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});


// jwt
var jwtSecret = builder.Configuration["Jwt:Secret"]??
        "abcdefghijklmnopqrstuvwxyzdapangpp";
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

app.MapAdminSessionEndpoints();
app.MapHealthEndpoints();
app.MapInfoEndpoints();
app.MapRoomTypeEndpoints();
app.MapBookingEndpoints();
app.MapTestEndpoints();

app.MapGet("/", () => Results.Redirect("/health"));

app.Run();
