using GarbageMonitorSystem.Common;
using GarbageMonitorSystem.Models;
using Grpc.Net.Client;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Data;


// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace GarbageMonitorSystem.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClusterController : ControllerBase
    {
        // GET: api/<ClusterController>
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET api/<ClusterController>/5
        [HttpGet("getClusterByDate/{datetime}")]
        public IActionResult Get(DateTime datetime, int category = 2)
        {
            datetime=datetime.ToLocalTime();
            List<SqlParameter> sqlParameters = new List<SqlParameter>
            {
                new SqlParameter("@TotalRecord", SqlDbType.Int) { Direction = ParameterDirection.Output },
                new SqlParameter("@InputDate", SqlDbType.Date) { Value=datetime.Date },
                new SqlParameter("@Category", SqlDbType.Int) { Value =category } , // Default value
             };
            (DataTable t, int k) = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(sqlParameters, "GetRoutingTaskByDate");
            BeanReturn b = new BeanReturn();
            b.TotalRecord = k;
            b.Data = JsonConvert.DeserializeObject<List<RoutingTask>>(JsonConvert.SerializeObject(t));
            b.Success = true;
            return Ok(b);
        }

       // Lấy Cluster cho các marker
        [HttpPost]
        public IActionResult Post([FromBody] ClusterRequest clusterRequest)
        {
 
            using var channel = GrpcChannel.ForAddress("http://localhost:" + 50051);
            var client = new PointClustering.PointClusteringClient(channel);
            GarbageMonitorSystem.MarkersData markersData = new GarbageMonitorSystem.MarkersData();
            for (int i=0;i< clusterRequest.markerData.Count; i++)
            {
                GarbageMonitorSystem.MarkerData m = new GarbageMonitorSystem.MarkerData();
                m.Lat= clusterRequest.markerData[i].Lat;
                m.Lng= clusterRequest.markerData[i].Lng;
                markersData.Markers.Add(m);
            }
            markersData.NumCluster = clusterRequest.numCluster;
             var reply = client.Clustering(markersData);
            return Ok(reply);
        }

        // PUT api/<ClusterController>/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }

        // DELETE api/<ClusterController>/5
        [HttpDelete("delete/{id}")]
        public IActionResult Delete(int id)
        {
            RoutingTask task = DBCommon.Select<RoutingTask>(id);
            if (task != null)
            {
                 task.StatusID = -1;
                 DBCommon.Update<RoutingTask>(task, new List<string>() { "StatusID" });
                return Ok();
            }
            return BadRequest();
        }
    }

    #region post data
    public class ClusterRequest
    {
        public int numCluster { get; set; }
        public List<MarkerData> markerData { get; set; }
    }

    public class MarkerData
    {
        public int ID { get; set; }
        public double Lat { get; set; }
        public double Lng { get; set; }
    }
    #endregion




}
