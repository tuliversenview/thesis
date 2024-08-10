using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GarbageMonitorSystem.Models.Category
{
    [Table("UserRole")]
    public class BeanUserRole
    {
        [Key]
        public int id { get; set; }
        public string rolename { get; set; }
        public bool status { get; set; }
        public string description { get; set; }
        public DateTime created { get; set; }
        public DateTime modified { get; set; }
    }
}
