using System.Collections.Generic;
using Ecommerce.Api.My;
using Microsoft.AspNetCore.Routing;

namespace Ecommerce.Api.Endpoints;

public static partial class TestEndpoints
{
    public static HappyPublisher happyPublisher;
    public static HappySubscriber happySubscriber = new HappySubscriber();

    private static IEnumerator<int> happyDefferedList = happySubscriber.getList();

    static TestEndpoints()
    {
        happyPublisher = new HappyPublisher();
    }

    public static IEndpointRouteBuilder MapTestEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/test", GetPublishEvent);
        return endpoints;
    }
}
