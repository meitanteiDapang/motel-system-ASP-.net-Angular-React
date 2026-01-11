using Ecommerce.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Endpoints;

public static partial class BookingEndpoints
{
    private static async Task<IResult> DeleteBookings(
        AppDbContext db,
        int[]? bookingIds,
        CancellationToken cancellationToken = default
        )
    {
        if (bookingIds is null || bookingIds.Length == 0)
        {
            return Results.BadRequest(new { message = "bookingIds are required." });
        }

        var ids = bookingIds
            .Where(id => id > 0)
            .Distinct()
            .ToArray();

        if (ids.Length == 0)
        {
            return Results.BadRequest(new { message = "bookingIds are required." });
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var intended = ids.Length;

        var deletedBookedRooms = await db.BookedRooms
            .Where(bookedRoom => ids.Contains(bookedRoom.BookingId))
            .ExecuteDeleteAsync(cancellationToken);

        var deletedBookings = await db.Bookings
            .Where(booking => ids.Contains(booking.Id))
            .ExecuteDeleteAsync(cancellationToken);

        if (deletedBookings == 0)
        {
            return Results.NotFound(new { message = "Booking not found." });
        }

        if (deletedBookings != intended || deletedBookedRooms != deletedBookings)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Results.Conflict(new
            {
                message = "Part of bookings are not found",
                intended,
                deletedBookings,
                deletedBookedRooms
            });
        }

        await transaction.CommitAsync(cancellationToken);
        return Results.NoContent();
    }
}
