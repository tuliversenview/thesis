using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GarbageMonitorSystem.Models.Category
{
    [Table("GarbagePoint")]

    public class BeanGarbagePoint
    {
        [Key]
        public int ID { get; set; }
        public string StreetName { get; set; }
        public DateTime Created { get; set; }
        public DateTime Modified { get; set; }
        public int CategoryID { get; set; }
        public double Lat { get; set; }       // Use double for float columns in SQL Server
        public double Lng { get; set; }       // Use double for float columns in SQL Server
        public double CurrentFill { get; set; } // Use double for float columns in SQL Server
        public double BinHeight { get; set; }  // Use double for float columns in SQL Server
        public string PointType { get; set; }  // Use double for float columns in SQL Server
        public int Timmer { get; set; }  // Use double for float columns in SQL Server
    }
}
