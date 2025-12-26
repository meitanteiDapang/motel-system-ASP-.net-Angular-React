using Microsoft.AspNetCore.Routing;

using Ecommerce.Api.Data;
using Microsoft.EntityFrameworkCore;


namespace Ecommerce.Api.Endpoints;

public static class RoomTypeEndpoints
{
    public static IEndpointRouteBuilder MapRoomTypeEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/room-types", GetRoomTypes);
        return endpoints;
    }

    private static async Task<IResult> GetRoomTypes(
    AppDbContext db,
    int test_number = 3,
    CancellationToken cancellationToken = default)
    {
        var roomTypes = await db.RoomTypes
            .OrderBy(rt => rt.Id)
            .Take(4)
            .Select(rt => new
            {
                rt.Id,
                Price = rt.Price + test_number,
                rt.BedNumber,
                rt.ImageUrl, // 你的测试逻辑
                rt.TypeName,
                rt.AvailableRoomsNumber
            })
            .ToListAsync(cancellationToken);

        return Results.Ok(roomTypes);
    }

}
