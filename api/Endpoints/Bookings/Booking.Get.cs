using System.Globalization;
using Ecommerce.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Endpoints;

public static partial class BookingEndpoints
{
    private static async Task<IResult> GetBookings(
        AppDbContext db,
        string? fromCheckOutDate,
        int? page,
        int? pageSize,
        CancellationToken cancellationToken = default
    )
    {
        var query = db.Bookings.AsNoTracking();

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

        var total = await query.CountAsync(cancellationToken);

        var pageNumber = page.GetValueOrDefault(1);
        var pageSizeValue = pageSize.GetValueOrDefault(20);
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSizeValue = pageSizeValue < 1 ? 20 : pageSizeValue;

        var bookings = await query
            .OrderBy(booking => booking.CheckOutDate)
            .ThenBy(booking => booking.Id)
            .Skip((pageNumber - 1) * pageSizeValue)
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
