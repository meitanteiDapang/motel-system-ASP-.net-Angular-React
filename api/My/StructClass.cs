using System.Xml;

namespace Ecommerce.Api.My;

public class StructClass
{
    private readonly int? _id;

    public StructClass(int id)
    {
        _id = id;
    }

    public string GetMessage()
    {
        var output = _id;
        if (_id.HasValue)
        {
            output = output + 1;
        }
        return $"Hello, this is a message. {output}";
    }
}
