using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GarbageMonitorSystem.Models.Category
{
    [Table("Category")]
    public class BeanCategory
    {
        [Key]
        public int ID { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime Created { get; set; }
        public DateTime Modified { get; set; }
    }
}
