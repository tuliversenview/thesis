using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace GarbageMonitorSystem.Models
{
    [Table("GarbageDistance")]
    public class GarbageDistance
    {
        [Key]
        public int ID { get; set; }
        public int FromGarbagePointID { get; set; }
        public int ToGarbagePointID { get; set; }
        public float Distance { get; set; }
        //public float EuclideanDistance { get; set; }
        public long TimeEstimates { get; set; }
        public DateTime Created { get; set; }
        public DateTime Modified { get; set; }
    }
}
