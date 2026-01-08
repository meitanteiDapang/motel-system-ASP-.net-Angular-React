using Ecommerce.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Endpoints;

public static partial class RoomTypeEndpoints
{
    private static async Task<IResult> GetRoomTypes(
        AppDbContext db,
        int test_number = 0,
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
                rt.ImageUrl,
                rt.TypeName,
                rt.AvailableRoomsNumber
            })
            .ToListAsync(cancellationToken);

        return Results.Ok(roomTypes);
    }
}
