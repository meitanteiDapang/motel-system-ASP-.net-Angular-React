using Ecommerce.Api.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Endpoints;

public static partial class BookingEndpoints
{
    private static async Task<IResult> GetBookings(
        AppDbContext db,
        string? scope,
        int? page,
        int? pageSize,
        CancellationToken cancellationToken = default
    )
    {
        TimeZoneInfo nzTimeZone;
        try
        {
            nzTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Pacific/Auckland");
        }
        catch (TimeZoneNotFoundException)
        {
            nzTimeZone = TimeZoneInfo.FindSystemTimeZoneById("New Zealand Standard Time");
        }

        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, nzTimeZone));
        var query = db.Bookings.AsNoTracking();
        if (string.Equals(scope, "future", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(booking => booking.CheckInDate >= today);
        }

        var total = await query.CountAsync(cancellationToken);

        var pageNumber = page.GetValueOrDefault(1);
        var pageSizeValue = pageSize.GetValueOrDefault(20);
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSizeValue = pageSizeValue < 1 ? 20 : pageSizeValue;

        var bookings = await query
            .OrderBy(booking => booking.CheckInDate)
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
