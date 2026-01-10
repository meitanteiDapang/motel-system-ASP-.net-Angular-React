using System.Net.Mail;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;

namespace Ecommerce.Api.Endpoints;

public static partial class BookingEndpoints
{
    public static IEndpointRouteBuilder MapBookingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/bookings", GetBookings)
            .RequireAuthorization(new AuthorizeAttribute { Roles = "admin" });
        endpoints.MapPost("/bookings", CreateBooking);
        return endpoints;
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
