using GarbageMonitorSystem.Common;
using GarbageMonitorSystem.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using System.Data;
using GarbageMonitorSystem.Models.Routing;
using GarbageMonitorSystem.Models.Category;
using Microsoft.AspNetCore.Http.HttpResults;
namespace GarbageMonitorSystem.Api.Mobile
{
    [Route("api/Mobile/[controller]")]
    [ApiController]
    public class RoutingTaskController : ControllerBase
    {
        [HttpGet("GetRoutingTaskDrivers")]
        public IActionResult Get(string date, int taskID, int driverID)
        {

            List<SqlParameter> param = new List<SqlParameter>
            {
                new SqlParameter("@Date", SqlDbType.Date) { Value=date},
                new SqlParameter("@TaskID", SqlDbType.Int) { Value = taskID }, // Default value
                new SqlParameter( "@DriverID", SqlDbType.Int) { Value = driverID } , // Default value

             };
            (DataTable, int) rs = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(param, "GetRoutingTaskDrivers", 1);
            var json = JsonConvert.SerializeObject(rs.Item1);
            TimeSpan expiration = TimeSpan.FromHours(5);
            var returndata = new
            {
                data = JsonConvert.DeserializeObject<List<GetRoutingTaskDrivers>>(json),
            };
            return Ok(returndata);
        }
        [HttpGet("GetRoutingCluterDrivers")]
        public IActionResult Get(string date,int driverID)
        {

            List<SqlParameter> param = new List<SqlParameter>
            {
                new SqlParameter("@Date", SqlDbType.Date) { Value=date},
                new SqlParameter( "@DriverID", SqlDbType.Int) { Value = driverID } , // Default value

             };
            (DataTable, int) rs = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(param, "GetRoutingCluterDrivers", 1);
            var json = JsonConvert.SerializeObject(rs.Item1);
            TimeSpan expiration = TimeSpan.FromHours(5);
            var returndata = new
            {
                data = JsonConvert.DeserializeObject<List<GetRoutingCluterDrivers>>(json),
            };
            return Ok(returndata);
        }

        [HttpPost("CompleteTask")]
        public IActionResult Post([FromBody] FinishTask model)
        {

            RoutingTaskDetail t;
            
            t = DBCommon.Select<RoutingTaskDetail>(model.DetailTaskID);
            if (t != null)
            {
                t.Status = 2;
                int result = DBCommon.Update<RoutingTaskDetail>(t, new List<string>() { "Status", "Modified" });
                return Ok(result);
            }
            else
            {
                return BadRequest();
            }
         
        }



    }
     public class FinishTask
    {
        public int DetailTaskID { get; set; }
    }
    public class GetRoutingTaskDrivers
    {
        public int ID { get; set; }
        public int RoutingTaskID { get; set; }
        public int Status { get; set; }
        public int WasteDESID { get; set; }
        public float Lat { get; set; }
        public float Lng { get; set; }
        public string StreetName { get; set; }
        public float CurrentFill { get; set; }
        public DateTime? Modified { get; set; }
    }
    public class GetRoutingCluterDrivers
    {
        public int ID { get; set; }
        public DateTime StartTime { get; set; }
        public int StatusID { get; set; }
        public int ItemCount { get; set; }
    }
}



