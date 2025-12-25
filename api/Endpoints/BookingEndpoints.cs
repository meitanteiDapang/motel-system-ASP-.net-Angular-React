using System.Globalization;
using Microsoft.AspNetCore.Routing;
using Npgsql;

namespace Ecommerce.Api.Endpoints;

public static class BookingEndpoints
{
    public static IEndpointRouteBuilder MapBookingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/bookings/availability", GetAvailability);
        endpoints.MapPost("/api/bookings", CreateBooking);
        return endpoints;
    }

    private static async Task<IResult> GetAvailability(
        int? roomTypeId,
        string? date,
        NpgsqlDataSource dataSource,
        CancellationToken cancellationToken
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

        await using var conn = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var cmd = new NpgsqlCommand(
            """
            SELECT rt.available_rooms_number, COUNT(b.id)
            FROM room_types rt
            LEFT JOIN bookings b
              ON b.room_type_id = rt.id
             AND b.booking_date = @date
            WHERE rt.id = @roomTypeId
            GROUP BY rt.available_rooms_number;
            """,
            conn
        );
        cmd.Parameters.AddWithValue("date", bookingDate);
        cmd.Parameters.AddWithValue("roomTypeId", roomTypeId.Value);

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return Results.NotFound(new { message = "Room type not found." });
        }

        var availableRooms = reader.GetInt32(0);
        var bookedRooms = reader.GetInt64(1);
        var remaining = Math.Max(0, availableRooms - (int)bookedRooms);

        return Results.Ok(new { available = remaining > 0, remaining });
    }

    private static async Task<IResult> CreateBooking(
        CreateBookingRequest request,
        NpgsqlDataSource dataSource,
        CancellationToken cancellationToken
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

        await using var conn = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var cmd = new NpgsqlCommand(
            """
            WITH room AS (
              SELECT available_rooms_number
              FROM room_types
              WHERE id = @roomTypeId
            ),
            booked AS (
              SELECT COUNT(*) AS total
              FROM bookings
              WHERE room_type_id = @roomTypeId
                AND booking_date = @date
            ),
            ins AS (
              INSERT INTO bookings (room_type_id, booking_date, guest_name, guest_email, guest_phone)
              SELECT @roomTypeId, @date, @guestName, @guestEmail, @guestPhone
              FROM room, booked
              WHERE booked.total < room.available_rooms_number
              RETURNING id
            )
            SELECT
              (SELECT available_rooms_number FROM room) AS available_rooms_number,
              (SELECT total FROM booked) AS booked_total,
              (SELECT id FROM ins) AS booking_id;
            """,
            conn
        );
        cmd.Parameters.AddWithValue("roomTypeId", request.RoomTypeId);
        cmd.Parameters.AddWithValue("date", bookingDate);
        cmd.Parameters.AddWithValue("guestName", request.GuestName.Trim());
        cmd.Parameters.AddWithValue("guestEmail", request.GuestEmail.Trim());
        cmd.Parameters.AddWithValue("guestPhone", request.GuestPhone.Trim());

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return Results.StatusCode(StatusCodes.Status500InternalServerError);
        }

        if (reader.IsDBNull(0))
        {
            return Results.NotFound(new { message = "Room type not found." });
        }

        var bookingId = reader.IsDBNull(2) ? (int?)null : reader.GetInt32(2);
        if (bookingId is null)
        {
            return Results.Conflict(new { message = "This room type is sold out for the selected date." });
        }

        return Results.Ok(new { id = bookingId.Value });
    }

    private sealed record CreateBookingRequest(
        int RoomTypeId,
        string BookingDate,
        string GuestName,
        string GuestEmail,
        string GuestPhone
    );
}
