using Microsoft.AspNetCore.Routing;

namespace Ecommerce.Api.Endpoints;

public static partial class RoomTypeEndpoints
{
    public static IEndpointRouteBuilder MapRoomTypeEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/room-types", GetRoomTypes);
        return endpoints;
    }
}
