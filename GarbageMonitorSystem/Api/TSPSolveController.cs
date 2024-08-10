using Azure;
using Azure.Core;
using GarbageMonitorSystem.Common;
using GarbageMonitorSystem.Common.RouteMethod;
using GarbageMonitorSystem.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data;

namespace GarbageMonitorSystem.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class TSPSolveController : ControllerBase
    {
        private readonly IDistributedCache _cache;

        public TSPSolveController(IDistributedCache cacheservice)
        {
            _cache = cacheservice;
        }


        [HttpPost]
        public IActionResult Get([FromBody] TSPSolveRequest request)
        {
            if (request.Oldid != null)
            {
                RoutingTask t= DBCommon.Select<RoutingTask>(request.Oldid.Value);
                t.StatusID = -1;
                DBCommon.Update(t, new List<string>() { "StatusID" });
            }
            
            bool backtosource=false;
            (List<TSPModels>,int) tspmodel= DBCommon.Selects<TSPModels>(0, 100);
            string cache = _cache.GetString($"TSPSolve_GET_{request.WastePointsID}_{request.SrcId}_{request.UseBackSourceOptimize}_{request.TspModelId}");
            RoutingTask w = new RoutingTask();
            w.StartTime = request.StartTime.AddHours(7);
            w.DriverID = request.DriverId;
            w.VehicleID = request.VehicleId;
            w.PolygonCoordinates = request.PolygonCoordinates;
            w.TspModelId= request.TspModelId;
            w.WastePointsID = string.Join(",", (request.SrcId + "," + request.WastePointsID + "," + request.DesId).Split(',').Distinct().ToArray());
            w.WasteSRCID = request.SrcId;
            w.WasteDESID = request.DesId;
            w.CategoryID = request.CategoryId;
            List<string> listprop = new List<string>();
            listprop.Add("PolygonCoordinates");
            listprop.Add("TspModelId");
            listprop.Add("DriverID");
            listprop.Add("VehicleID");
            listprop.Add("StartTime");
            listprop.Add("StartTime");
            listprop.Add("WastePointsID");
            listprop.Add("WasteSRCID");
            listprop.Add("WasteDESID");
            listprop.Add("CategoryID");
            int id=Common.DBCommon.Insert(w, listprop);
            w=DBCommon.Select<RoutingTask>(id);
            /* if (cache == null)
             {
                 List<GarbageDistance> result = GetListGarBage(request.Ids);

                 int[] array = request.Ids.Split(',').Select(int.Parse).ToArray();
                 Distance d=null;
                 switch (tspmodel.Item1.Where(e => e.ID == request.TspModelId)?.FirstOrDefault().Name)
                 {
                     case "Brucefore":
                         {
                             double[,] array2D_matrixDistance = Distance.GetDistanceMatrixSQL(request.Ids, result);
                             d = new Distance(new BruteForceRoute(1, 0, array2D_matrixDistance, request.Ids));
                             break;
                         }
                     case "Ant colony":
                         {
                             double[,] array2D_matrixDistance = Distance.GetDistanceMatrixSQL(request.SrcId + "," + request.Ids, result);
                             d = new Distance(new AntColonyRoute(array2D_matrixDistance, request.SrcId + "," + request.Ids));
                             break;
                         }
                     case "Nearest Neighbor":
                         {
                             double[,] array2D_matrixDistance = Distance.GetDistanceMatrixSQL(request.Ids, result);
                             d = new Distance(new NearestNeighborRoute(array2D_matrixDistance, request.Ids));
                             break;
                         }
                     case "Dynamic Programming":
                         {
                             double[,] array2D_matrixDistance = Distance.GetDistanceMatrixSQL(request.Ids, result);
                             d = new Distance(new DynamicProgramRoute(1, 0, request.Ids, request.SrcId, request.DesId));
                             break;
                         }
                     default:
                         {
                             break;
                         }
                 }


                 (List<int>, double) mindistance = d.Routemethod.SortingDistance();
                 TimeSpan expiration = TimeSpan.FromHours(5);
                 _cache.SetString($"TSPSolve_GET_{request.Ids}_{request.SrcId}_{request.UseBackSourceOptimize}_{request.TspModelId}", JsonConvert.SerializeObject(mindistance),new DistributedCacheEntryOptions() { AbsoluteExpirationRelativeToNow=expiration});
                 var rs = new
                 {
                     sorted_id = mindistance.Item1, // Example distance value
                     distance_km = mindistance.Item2 // Example sorting list
                 };
                 return Ok(rs);
             }
             else
             {

                 (List<int>, double) mindistance = JsonConvert.DeserializeObject<(List<int>, double)>(cache);
                 var rs = new
                 {
                     sorted_id = mindistance.Item1, // Example distance value
                     distance_km = mindistance.Item2 // Example sorting list
                 };
                 return Ok(rs);
             }*/


            var rs = new
            {
                task = w
            };
            return Ok(rs);

        }


        #region private function
        private static List<GarbageDistance> GetListGarBage(string ids)
        {
            var param = new List<SqlParameter>
            {
                new SqlParameter("@FromGarbagePointIDs", SqlDbType.NVarChar) { Value = ids }, // Default value
            };
            (DataTable, int) rs = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(param, "GetGarbageDistancesByFromGarbagePointIDs", 1);
            string json = JsonConvert.SerializeObject(rs.Item1);
            List<GarbageDistance> result = JsonConvert.DeserializeObject<List<GarbageDistance>>(json);
            return result;
        }
        #endregion

    }
    [Table("TSPModels")]
    public class TSPModels
    {
        [Key]
        public int ID { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime Created { get; set; }
        public DateTime Modified { get; set; }
    }

    // Request model
    public class TSPSolveRequest
    {
        public int? Oldid { get; set; }
        public int SrcId { get; set; }
        public int DesId { get; set; }
        public int DriverId { get; set; }
        public string PolygonCoordinates { get; set; }
        public string WastePointsID { get; set; }
        public int VehicleId { get; set; }
        public bool UseBackSourceOptimize { get; set; }
        public int TspModelId { get; set; }
        public DateTime StartTime { get; set; }
        public int CategoryId { get; set; }
    }

}
