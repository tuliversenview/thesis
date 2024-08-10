namespace GarbageMonitorSystem.Models.Category
{
    public class BeanDriver
    {
        public int ID { get; set; }
        public int? UserID { get; set; }  // Nullable int
        public string LicenseNumber { get; set; }
        public string? Fullname { get; set; }
        
        public DateTime? DateOfBirth { get; set; }  // Nullable DateTime
        public string Address { get; set; }
        public DateTime? Created { get; set; }  // Nullable DateTime
        public DateTime? Modified { get; set; }  // Nullable DateTime
        public bool? Status { get; set; }  // Nullable bool
    }
}
