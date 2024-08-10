using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GarbageMonitorSystem.Models
{
    [Table("User")]
    public class User
    {
        [Key]
        public int ID { get; set; }
        public string Username { get; set; }
        public string Fullname { get; set; }
        public int Role { get; set; }
        public DateTime Created { get; set; }
        public DateTime Modified { get; set; }
        public bool Status { get; set; }
    }

}
