namespace GarbageMonitorSystem.Models.Category
{
    public class BeanVehicle
    {
        public int? Id { get; set; }
        public string PlateNumber { get; set; }
        public int? DriverID { get; set; }
        public DateTime Created { get; set; }
        public DateTime Modified { get; set; }
        public bool? Status { get; set; }
    }
}
