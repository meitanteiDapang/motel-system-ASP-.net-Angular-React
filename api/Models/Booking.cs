namespace Ecommerce.Api.Models;

public class Booking
{
    public int Id { get; set; }
    public int RoomTypeId { get; set; }
    public DateOnly BookingDate { get; set; }
    public string GuestName { get; set; } = "";
    public string GuestEmail { get; set; } = "";
    public string GuestPhone { get; set; } = "";

    public RoomType? RoomType { get; set; }
}
