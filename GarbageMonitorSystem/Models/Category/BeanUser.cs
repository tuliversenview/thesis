using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GarbageMonitorSystem.Models.Category
{
    [Table("User")]
    public class BeanUser
    {
        [Key]
        public int id { get; set; }
        public string username { get; set; }
        public string password { get; set; }
        public string fullname { get; set; }
        public int role { get; set; }
        public DateTime created { get; set; }
        public DateTime modified { get; set; }
        public bool status { get; set; }
        public string imageurl { get; set; }
    }
}
