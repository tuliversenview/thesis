using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSPservice.models
{
    [Table("RoutingTask")]
    public class RoutingTask
    {
        [Key]
        public int ID { get; set; }
        public string? PolygonCoordinates { get; set; }
        public string? WastePointsID { get; set; }
        public string? WastePointsIDResult { get; set; }
        public float? RoutingDistanceResult { get; set; }
        public int? WasteSRCID { get; set; }
        public int? WasteDESID { get; set; }
        public int? TspModelId { get; set; }
        public int? DriverID { get; set; }
        public int? VehicleID { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string? Note { get; set; }
        public int? StatusID { get; set; }
        public DateTime? Created { get; set; }
        public DateTime? Modified { get; set; }
    }

}
