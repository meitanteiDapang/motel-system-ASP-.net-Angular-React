using System.Globalization;
using Ecommerce.Api.Data;
using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Endpoints;

public static class BookingEndpoints
{
    public static IEndpointRouteBuilder MapBookingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/bookings/availability", GetAvailability);
        endpoints.MapPost("/bookings", CreateBooking);
        return endpoints;
    }

    private static async Task<IResult> GetAvailability(
        int? roomTypeId,
        string? date,
        AppDbContext db,
        CancellationToken cancellationToken = default
    )
    {
        if (roomTypeId is null || roomTypeId <= 0 || string.IsNullOrWhiteSpace(date))
        {
            return Results.BadRequest(new { message = "roomTypeId and date are required." });
        }

        if (!DateOnly.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var bookingDate))
        {
            return Results.BadRequest(new { message = "date must be in yyyy-MM-dd format." });
        }

        var roomType = await db.RoomTypes
            .Where(rt => rt.Id == roomTypeId.Value)
            .Select(rt => new { rt.Id, rt.AvailableRoomsNumber })
            .SingleOrDefaultAsync(cancellationToken);

        if (roomType is null)
        {
            return Results.NotFound(new { message = "Room type not found." });
        }

        var bookedRooms = await db.Bookings
            .CountAsync(b => b.RoomTypeId == roomType.Id && b.BookingDate == bookingDate, cancellationToken);

        var remaining = Math.Max(0, roomType.AvailableRoomsNumber - bookedRooms);

        return Results.Ok(new { available = remaining > 0, remaining });
    }

    private static async Task<IResult> CreateBooking(
        CreateBookingRequest request,
        AppDbContext db,
        CancellationToken cancellationToken = default
    )
    {
        if (request.RoomTypeId <= 0)
        {
            return Results.BadRequest(new { message = "roomTypeId is required." });
        }

        if (string.IsNullOrWhiteSpace(request.BookingDate)
            || string.IsNullOrWhiteSpace(request.GuestName)
            || string.IsNullOrWhiteSpace(request.GuestEmail)
            || string.IsNullOrWhiteSpace(request.GuestPhone))
        {
            return Results.BadRequest(new { message = "bookingDate, guestName, guestEmail, and guestPhone are required." });
        }

        if (!DateOnly.TryParseExact(request.BookingDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var bookingDate))
        {
            return Results.BadRequest(new { message = "bookingDate must be in yyyy-MM-dd format." });
        }

        var roomType = await db.RoomTypes
            .Where(rt => rt.Id == request.RoomTypeId)
            .Select(rt => new { rt.Id, rt.AvailableRoomsNumber })
            .SingleOrDefaultAsync(cancellationToken);

        if (roomType is null)
        {
            return Results.NotFound(new { message = "Room type not found." });
        }

        var bookedRooms = await db.Bookings
            .CountAsync(b => b.RoomTypeId == roomType.Id && b.BookingDate == bookingDate, cancellationToken);

        if (bookedRooms >= roomType.AvailableRoomsNumber)
        {
            return Results.Conflict(new { message = "This room type is sold out for the selected date." });
        }

        var booking = new Booking
        {
            RoomTypeId = roomType.Id,
            BookingDate = bookingDate,
            GuestName = request.GuestName.Trim(),
            GuestEmail = request.GuestEmail.Trim(),
            GuestPhone = request.GuestPhone.Trim()
        };

        db.Bookings.Add(booking);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new { id = booking.Id });
    }

    private sealed record CreateBookingRequest(
        int RoomTypeId,
        string BookingDate,
        string GuestName,
        string GuestEmail,
        string GuestPhone
    );
}
