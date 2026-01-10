using System.Globalization;
using Ecommerce.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Endpoints;

public static partial class BookingEndpoints
{
    private static async Task<IResult> GetBookings(
        AppDbContext db,
        string? fromCheckOutDate,
        int? pageSize,
        CancellationToken cancellationToken = default
    )
    {
        var query = db.Bookings.AsNoTracking();

        var total = await query.CountAsync(cancellationToken);

        var pageSizeValue = pageSize.GetValueOrDefault(20);
        pageSizeValue = pageSizeValue < 1 ? 20 : pageSizeValue;

        DateOnly fromDate = DateOnly.MinValue;
        if (!string.IsNullOrWhiteSpace(fromCheckOutDate))
        {
            if (!DateOnly.TryParseExact(fromCheckOutDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            {
                return Results.BadRequest(new { message = "fromCheckOutDate must be in yyyy-MM-dd format." });
            }
            fromDate = parsed;
        }

        if (fromDate > DateOnly.MinValue)
        {
            query = query.Where(booking => booking.CheckOutDate >= fromDate);
        }

        var bookings = await query
            .OrderBy(booking => booking.CheckOutDate)
            .ThenBy(booking => booking.Id)
            .Take(pageSizeValue)
            .Select(booking => new
            {
                booking.Id,
                booking.RoomTypeId,
                CheckInDate = booking.CheckInDate.ToString("yyyy-MM-dd"),
                CheckOutDate = booking.CheckOutDate.ToString("yyyy-MM-dd"),
                RoomNumber = db.BookedRooms
                    .Where(room => room.BookingId == booking.Id)
                    .Select(room => (int?)room.RoomNumber)
                    .FirstOrDefault(),
                booking.GuestName,
                booking.GuestEmail,
                booking.GuestPhone
            })
            .ToListAsync(cancellationToken);

        return Results.Ok(new { bookings, total });
    }
}
