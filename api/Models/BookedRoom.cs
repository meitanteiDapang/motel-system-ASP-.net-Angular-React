namespace Ecommerce.Api.Models;

public class BookedRoom
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public int RoomTypeId { get; set; }
    public int RoomNumber { get; set; }
    public DateOnly CheckInDate { get; set; }
    public DateOnly CheckOutDate { get; set; }

    public Booking? Booking { get; set; }
    public RoomType? RoomType { get; set; }
}
