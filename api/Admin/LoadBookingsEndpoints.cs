using Ecommerce.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Admin;

public static class LoadBookingsEndpoints
{
    public static IEndpointRouteBuilder MapLoadBookingsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/admin/loadBookings", GetLoadBookings)
            .RequireAuthorization(new AuthorizeAttribute { Roles = "admin" });
        return endpoints;
    }

    private static async Task<IResult> GetLoadBookings(
        AppDbContext db,
        CancellationToken cancellationToken = default
    )
    {
        var bookings = await db.Bookings
            .AsNoTracking()
            .OrderByDescending(booking => booking.CheckInDate)
            .ThenByDescending(booking => booking.Id)
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

        return Results.Ok(new { bookings });
    }
}
