using System.Text;
using Ecommerce.Api.My;

namespace Ecommerce.Api.Endpoints;

public static partial class TestEndpoints
{
    private sealed record InputPayload(int input);

    private static async Task<IResult> GetPublishEvent(HttpRequest req)
    {
        var sb = new StringBuilder();

        var payload = await req.ReadFromJsonAsync<InputPayload>();
        var inputValue = payload?.input ?? 0;

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
        sb.Append(" + ");
        sb.Append((inputValue + 5).ToString());

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
