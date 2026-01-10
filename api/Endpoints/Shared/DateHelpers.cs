namespace Ecommerce.Api.Endpoints;

internal static class DateHelpers
{
    internal static DateOnly GetNewZealandToday()
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
}
