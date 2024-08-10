using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GarbageMonitorSystem.Models.Routing
{
    [Table("RoutingTaskDetail")]
    public class RoutingTaskDetail
    {
        [Key]
        public int ID { get; set; }
        public int RoutingTaskID { get; set; }
        public int WasteDESID { get; set; }
        public int Status { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Modified { get; set; }
    }
}
