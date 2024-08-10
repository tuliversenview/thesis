namespace GarbageMonitorSystem.Interface
{
    public interface IRoute
    {
        //List<int> : ID sau khi được sắp xếp
        //double : quảng đường tổng cộng
        public bool IsbackToSrc { get; set; }
        public (List<int>, double) SortingDistance();
    }
}
