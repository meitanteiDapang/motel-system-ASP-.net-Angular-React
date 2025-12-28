

namespace Ecommerce.Api.My;


public sealed class EnjoiedHappyArgs : EventArgs
{
    public int happy_times { get; }

    public EnjoiedHappyArgs(int input_times)
    {
        happy_times = input_times;
    }
}


public class HappySubscriber
{
    public static int happy_count = 0;

// TODO: what should i do if i want return value in the list
    public List<int> iteratorList = [7, 8, 9];

    public IEnumerator<int> getList()
    {
        foreach(var i in iteratorList)
        {
            yield return i;
        }
        yield return 100;
    }

    public HappyDelegate happyDelegate;

    public delegate int HappyDelegate(string s);
    
    public HappySubscriber()  {
        happyDelegate = fakeHappyFunc;
    }

    private int realHappyFunc(string s)
    {
        if (s.Equals("Dapang"))
        {
            return 1;
        } else
        {
            return 2;
        }
    }
    private int fakeHappyFunc(string s)
    {
        if (s.Equals("Dapang"))
        {
            return 3;
        } else
        {
            return 4;
        }
    }

    public void setDelegate()
    {
        happyDelegate = realHappyFunc;
    }

    // 1) 订阅：把 handler 挂到 publisher 的事件上
    public void Subscribe(HappyPublisher publisher)
    {
        publisher.happys += OnHappys;
    }

    // 2) 取消订阅：避免内存泄漏（尤其 publisher 活得更久的时候）
    public void Unsubscribe(HappyPublisher publisher)
    {
        publisher.happys -= OnHappys;
    }

    // 3) handler：签名必须匹配 EventHandler<EnjoiedHappyArgs>
    public void OnHappys(object? sender, EnjoiedHappyArgs e)
    {
        happy_count += e.happy_times;
    }
}



public delegate void HappyEnjoiedHandler(
    object sender,
    EnjoiedHappyArgs e
);
public class HappyPublisher {
    // EventHandler is a template of delegate with above signature
    // To use event, we need define a delegate with keyword event.
    // public event EventHandler<EnjoiedHappyArgs>? happys;

    public event HappyEnjoiedHandler? happys;


    protected virtual void onHappyEnjoied(int happy_enjoy_time)
    {
        happys?.Invoke(this, new EnjoiedHappyArgs(happy_enjoy_time));
    }

    public void enjoy(int happy_enjoy_time)
    {
        onHappyEnjoied(happy_enjoy_time);
    }
}