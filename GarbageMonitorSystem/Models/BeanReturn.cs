namespace GarbageMonitorSystem.Models
{
    public class BeanReturn
    {
        public bool Success { get; set; }
        public dynamic Data { get; set; }
        public int TotalRecord { get; set; }
        public DateTime DateTime { get; set; }
    }
}
