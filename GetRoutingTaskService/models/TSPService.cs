using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace TSPservice.models
{
    [Table("TSPService")]
    public class TSPService
    {
        [Key]
        public int ID { get; set; }
        public string Host { get; set; }
        public int Port { get; set; }
        public int Status { get; set; }
        public DateTime Created { get; set; }
        public DateTime Modified { get; set; }
    }
}
