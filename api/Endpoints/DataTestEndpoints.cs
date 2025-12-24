using Microsoft.AspNetCore.Routing;
using Npgsql;

namespace Ecommerce.Api.Endpoints;

public static class DataTestEndpoints
{
    public static IEndpointRouteBuilder MapDataTestEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/datatest", GetUsers);
        return endpoints;
    }

    private static async Task<IResult> GetUsers(NpgsqlDataSource dataSource, CancellationToken cancellationToken)
    {
        await using var conn = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var cmd = new NpgsqlCommand("SELECT id, name, email FROM users ORDER BY id;", conn);
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

        var users = new List<UserRow>();
        while (await reader.ReadAsync(cancellationToken))
        {
            users.Add(new UserRow(
                reader.GetInt32(0),
                reader.GetString(1),
                reader.GetString(2)
            ));
        }

        return Results.Ok(users);
    }

    private sealed record UserRow(int Id, string Name, string Email);
}
