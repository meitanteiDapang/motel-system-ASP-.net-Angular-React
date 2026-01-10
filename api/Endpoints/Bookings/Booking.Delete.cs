using Ecommerce.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Endpoints;

public static partial class BookingEndpoints
{
    private static async void DeleteBookings(
        AppDbContext db,
        int? id,
        CancellationToken cancellationToken = default
        )
    {
        return ;
    }
}
