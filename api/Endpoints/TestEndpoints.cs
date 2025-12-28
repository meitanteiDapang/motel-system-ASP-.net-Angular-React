using System.IO.Pipelines;
using System.Text;
using Ecommerce.Api.My;
using Microsoft.AspNetCore.Routing;
using Microsoft.VisualBasic;


namespace Ecommerce.Api.Endpoints;

public static class TestEndpoints
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
        endpoints.MapGet("/test", GetPublishEvent);
        return endpoints;
    }



    private static IResult GetPublishEvent()
    {
        var sb = new StringBuilder();

        // publish, event
        happySubscriber.Subscribe(happyPublisher);
        sb.Append("Dog: ");
        happyPublisher.enjoy(1);
        sb.Append(HappySubscriber.happy_count.ToString());
        happySubscriber.Unsubscribe(happyPublisher);

        // Delegate
        sb.Append(" + ");
        sb.Append(happySubscriber.happyDelegate("Dapang"));
        happySubscriber.setDelegate();
        sb.Append(" + ");
        sb.Append(happySubscriber.happyDelegate("dapang"));

        // 
        sb.Append(" + ");
        int out1 = 101;
        if (happyDefferedList.MoveNext())
        {
            out1 = happyDefferedList.Current;
        }
        sb.Append(out1.ToString());

        return Results.Ok(new
        {
            message = sb.ToString(),
            timestamp = DateTimeOffset.UtcNow
        });
    }

    private static IResult GetTest(int test_id = 5)
    {
        var helper = new StructClass(test_id);
        return Results.Ok(new
        {
            message = helper.GetMessage(),
            timestamp = DateTimeOffset.UtcNow
        });
    }
}
