namespace Ecommerce.Api.Models;

public class RoomType
{
    public int Id { get; set; }
    public decimal Price { get; set; }
    public int BedNumber { get; set; }
    public string ImageUrl { get; set; } = "";
    public string TypeName { get; set; } = "";
    public int AvailableRoomsNumber { get; set; }
}
