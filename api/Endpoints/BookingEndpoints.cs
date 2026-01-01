using System.Collections.Generic;
using System.Globalization;
using Ecommerce.Api.Data;
using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Endpoints;

public static class BookingEndpoints
{
    private static DateOnly GetNewZealandToday()
    {
        try
        {
            var timeZone = TimeZoneInfo.FindSystemTimeZoneById("Pacific/Auckland");
            var localTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
            return DateOnly.FromDateTime(localTime);
        }
        catch (TimeZoneNotFoundException)
        {
        }
        catch (InvalidTimeZoneException)
        {
        }

        try
        {
            var timeZone = TimeZoneInfo.FindSystemTimeZoneById("New Zealand Standard Time");
            var localTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
            return DateOnly.FromDateTime(localTime);
        }
        catch (TimeZoneNotFoundException)
        {
        }
        catch (InvalidTimeZoneException)
        {
        }

        return DateOnly.FromDateTime(DateTime.UtcNow);
    }

    public static IEndpointRouteBuilder MapBookingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/room-types/{roomTypeId:int}/availability", GetAvailability);
        endpoints.MapPost("/bookings", CreateBooking);
        return endpoints;
    }

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

        if (string.IsNullOrWhiteSpace(request.CheckInDate)
            || string.IsNullOrWhiteSpace(request.CheckOutDate)
            || string.IsNullOrWhiteSpace(request.GuestName)
            || string.IsNullOrWhiteSpace(request.GuestEmail)
            || string.IsNullOrWhiteSpace(request.GuestPhone))
        {
            return Results.BadRequest(new { message = "checkInDate, checkOutDate, guestName, guestEmail, and guestPhone are required." });
        }

        if (!DateOnly.TryParseExact(request.CheckInDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var checkInDate))
        {
            return Results.BadRequest(new { message = "checkInDate must be in yyyy-MM-dd format." });
        }

        if (!DateOnly.TryParseExact(request.CheckOutDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var checkOutDate))
        {
            return Results.BadRequest(new { message = "checkOutDate must be in yyyy-MM-dd format." });
        }

        if (checkOutDate <= checkInDate)
        {
            return Results.BadRequest(new { message = "checkOutDate must be after checkInDate." });
        }

        if (checkInDate < GetNewZealandToday())
        {
            return Results.BadRequest(new { message = "checkInDate cannot be before today's date (NZ time)." });
        }

        var roomType = await db.RoomTypes
            .Where(rt => rt.Id == request.RoomTypeId)
            .Select(rt => new { rt.Id, rt.AvailableRoomsNumber })
            .SingleOrDefaultAsync(cancellationToken);

        if (roomType is null)
        {
            return Results.NotFound(new { message = "Room type not found." });
        }

        var overlappingRoomNumbers = await db.BookedRooms
            .Where(br => br.RoomTypeId == roomType.Id
                         && br.CheckInDate < checkOutDate
                         && br.CheckOutDate > checkInDate)
            .Select(br => br.RoomNumber)
            .ToListAsync(cancellationToken);

        var takenRoomNumbers = new HashSet<int>(overlappingRoomNumbers);
        var roomNumber = Enumerable.Range(1, roomType.AvailableRoomsNumber).FirstOrDefault(number => !takenRoomNumbers.Contains(number));

        if (roomNumber == 0)
        {
            return Results.Conflict(new { message = "This room type is sold out for the selected dates." });
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        var booking = new Booking
        {
            RoomTypeId = roomType.Id,
            CheckInDate = checkInDate,
            CheckOutDate = checkOutDate,
            GuestName = request.GuestName.Trim(),
            GuestEmail = request.GuestEmail.Trim(),
            GuestPhone = request.GuestPhone.Trim()
        };

        db.Bookings.Add(booking);
        await db.SaveChangesAsync(cancellationToken);

        var bookedRoom = new BookedRoom
        {
            BookingId = booking.Id,
            RoomTypeId = roomType.Id,
            RoomNumber = roomNumber,
            CheckInDate = checkInDate,
            CheckOutDate = checkOutDate
        };

        db.BookedRooms.Add(bookedRoom);
        await db.SaveChangesAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return Results.Created($"/bookings/{booking.Id}", new { id = booking.Id, roomNumber });
    }

    private sealed record CreateBookingRequest(
        int RoomTypeId,
        string CheckInDate,
        string CheckOutDate,
        string GuestName,
        string GuestEmail,
        string GuestPhone
    );
}
