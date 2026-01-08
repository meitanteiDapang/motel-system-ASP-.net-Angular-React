using System.Globalization;
using Ecommerce.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Endpoints;

public static partial class BookingEndpoints
{
    private static async Task<IResult> GetAvailability(
        int roomTypeId,
        string? checkInDate,
        string? checkOutDate,
        AppDbContext db,
        CancellationToken cancellationToken = default
    )
    {
        if (roomTypeId <= 0 || string.IsNullOrWhiteSpace(checkInDate) || string.IsNullOrWhiteSpace(checkOutDate))
        {
            return Results.BadRequest(new { message = "roomTypeId, checkInDate, and checkOutDate are required." });
        }

        if (!DateOnly.TryParseExact(checkInDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedCheckIn))
        {
            return Results.BadRequest(new { message = "checkInDate must be in yyyy-MM-dd format." });
        }

        if (!DateOnly.TryParseExact(checkOutDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedCheckOut))
        {
            return Results.BadRequest(new { message = "checkOutDate must be in yyyy-MM-dd format." });
        }

        if (parsedCheckOut <= parsedCheckIn)
        {
            return Results.BadRequest(new { message = "checkOutDate must be after checkInDate." });
        }

        if (parsedCheckIn < GetNewZealandToday())
        {
            return Results.BadRequest(new { message = "checkInDate cannot be before today's date (NZ time)." });
        }

        var roomType = await db.RoomTypes
            .Where(rt => rt.Id == roomTypeId)
            .Select(rt => new { rt.Id, rt.AvailableRoomsNumber })
            .SingleOrDefaultAsync(cancellationToken);

        if (roomType is null)
        {
            return Results.NotFound(new { message = "Room type not found." });
        }

        var overlappingRoomNumbers = await db.BookedRooms
            .Where(br => br.RoomTypeId == roomType.Id
                         && br.CheckInDate < parsedCheckOut
                         && br.CheckOutDate > parsedCheckIn)
            .Select(br => br.RoomNumber)
            .Distinct()
            .ToListAsync(cancellationToken);

        var remaining = Math.Max(0, roomType.AvailableRoomsNumber - overlappingRoomNumbers.Count);

        return Results.Ok(new { available = remaining > 0, remaining });
    }
}
