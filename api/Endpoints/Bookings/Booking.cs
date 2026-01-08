using System.Net.Mail;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Routing;

namespace Ecommerce.Api.Endpoints;

public static partial class BookingEndpoints
{
    public static IEndpointRouteBuilder MapBookingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/room-types/{roomTypeId:int}/availability", GetAvailability);
        endpoints.MapPost("/bookings", CreateBooking);
        return endpoints;
    }

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

    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    private static bool IsValidPhone(string phone)
    {
        // Accept an optional leading + and 7-15 digits
        return Regex.IsMatch(phone, @"^\+?[0-9]{7,15}$");
    }
}
