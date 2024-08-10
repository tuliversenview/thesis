using GarbageMonitorSystem.Common;
using GarbageMonitorSystem.Models;
using GarbageMonitorSystem.Models.Category;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using System.Data;
using System.Text.Json.Serialization;

namespace GarbageMonitorSystem.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {

        [HttpGet("GetList")]
        public IActionResult GetList([FromQuery] string table, [FromQuery] int offset, [FromQuery] int limit, [FromQuery] string? keyword = "")
        {
            BeanReturn br = new BeanReturn();
            switch (table)
            {
                case "user":
                    {
                        List<SqlParameter> sqlParameters = new List<SqlParameter>();
                        SqlParameter param1 = new SqlParameter("@Limit", limit);
                        SqlParameter param2 = new SqlParameter("@Offset", offset);
                        if (!string.IsNullOrEmpty(keyword))
                        {
                            SqlParameter param3 = new SqlParameter("@KeyWord", keyword);
                            sqlParameters.Add(param3);

                        }
                        SqlParameter totalCountParameter = new SqlParameter("@TotalRecord", SqlDbType.Int);
                        totalCountParameter.Direction = ParameterDirection.Output;
                        sqlParameters.Add(param1);
                        sqlParameters.Add(param2);
                        sqlParameters.Add(totalCountParameter);
                        (DataTable t, int k) = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(sqlParameters, "User_getList");
                        br.Data = JsonConvert.DeserializeObject<List<BeanUser>>(JsonConvert.SerializeObject(t));
                        br.TotalRecord = k;
                        br.Success = true;
                        br.DateTime = DateTime.Now;
                        break;
                    }
                case "userrole":
                    {
                        List<SqlParameter> sqlParameters = new List<SqlParameter>();
                        SqlParameter param1 = new SqlParameter("@Limit", limit);
                        SqlParameter param2 = new SqlParameter("@Offset", offset);
                        if (!string.IsNullOrEmpty(keyword))
                        {
                            SqlParameter param3 = new SqlParameter("@KeyWord", keyword);
                            sqlParameters.Add(param3);

                        }
                        SqlParameter totalCountParameter = new SqlParameter("@TotalRecord", SqlDbType.Int);
                        totalCountParameter.Direction = ParameterDirection.Output;
                        sqlParameters.Add(param1);
                        sqlParameters.Add(param2);
                        sqlParameters.Add(totalCountParameter);
                        (DataTable t, int k) = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(sqlParameters, "UserRole_getList");
                        br.Data = JsonConvert.DeserializeObject<List<BeanUserRole>>(JsonConvert.SerializeObject(t));
                        br.TotalRecord = k;
                        br.Success = true;
                        br.DateTime = DateTime.Now;
                        break;
                    }
                case "tspmodels":
                    {
                        List<SqlParameter> sqlParameters = new List<SqlParameter>();
                        SqlParameter param1 = new SqlParameter("@Limit", limit);
                        SqlParameter param2 = new SqlParameter("@Offset", offset);
                        if (!string.IsNullOrEmpty(keyword))
                        {
                            SqlParameter param3 = new SqlParameter("@KeyWord", keyword);
                            sqlParameters.Add(param3);

                        }
                        SqlParameter totalCountParameter = new SqlParameter("@TotalRecord", SqlDbType.Int);
                        totalCountParameter.Direction = ParameterDirection.Output;
                        sqlParameters.Add(param1);
                        sqlParameters.Add(param2);
                        sqlParameters.Add(totalCountParameter);
                        (DataTable t, int k) = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(sqlParameters, "Routing_GetList");
                        br.Data = JsonConvert.DeserializeObject<List<TSPModels>>(JsonConvert.SerializeObject(t));
                        br.TotalRecord = k;
                        br.Success = true;
                        br.DateTime = DateTime.Now;
                        break;
                    }
                case "vehicle":
                    {
                        List<SqlParameter> sqlParameters = new List<SqlParameter>();
                        SqlParameter param1 = new SqlParameter("@Limit", limit);
                        SqlParameter param2 = new SqlParameter("@Offset", offset);
                        if (!string.IsNullOrEmpty(keyword))
                        {
                            SqlParameter param3 = new SqlParameter("@KeyWord", keyword);
                            sqlParameters.Add(param3);

                        }
                        SqlParameter totalCountParameter = new SqlParameter("@TotalRecord", SqlDbType.Int);
                        totalCountParameter.Direction = ParameterDirection.Output;
                        sqlParameters.Add(param1);
                        sqlParameters.Add(param2);
                        sqlParameters.Add(totalCountParameter);
                        (DataTable t, int k) = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(sqlParameters, "Vehicle_GetList");
                        string test = JsonConvert.SerializeObject(t);
                        br.Data = JsonConvert.DeserializeObject<List<BeanVehicle>>(JsonConvert.SerializeObject(t));
                        br.TotalRecord = k;
                        br.Success = true;
                        br.DateTime = DateTime.Now;
                        break;
                    }
                case "driver":
                    {
                        List<SqlParameter> sqlParameters = new List<SqlParameter>();
                        SqlParameter param1 = new SqlParameter("@Limit", limit);
                        SqlParameter param2 = new SqlParameter("@Offset", offset);
                        if (!string.IsNullOrEmpty(keyword))
                        {
                            SqlParameter param3 = new SqlParameter("@KeyWord", keyword);
                            sqlParameters.Add(param3);

                        }
                        SqlParameter totalCountParameter = new SqlParameter("@TotalRecord", SqlDbType.Int);
                        totalCountParameter.Direction = ParameterDirection.Output;
                        sqlParameters.Add(param1);
                        sqlParameters.Add(param2);
                        sqlParameters.Add(totalCountParameter);
                        (DataTable t, int k) = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(sqlParameters, "Driver_GetList");
                        string test = JsonConvert.SerializeObject(t);
                        br.Data = JsonConvert.DeserializeObject<List<BeanDriver>>(JsonConvert.SerializeObject(t));
                        br.TotalRecord = k;
                        br.Success = true;
                        br.DateTime = DateTime.Now;
                        break;
                    }
                case "category":
                    {
                        List<SqlParameter> sqlParameters = new List<SqlParameter>
                        {
                            new SqlParameter("@Limit", limit)
                            
                        };

                        if (limit != 0)
                        {
                            SqlParameter param1 = new SqlParameter("@Offset", offset);
                            sqlParameters.Add(param1);

                        }
                        if (!string.IsNullOrEmpty(keyword))
                        {
                            SqlParameter param3 = new SqlParameter("@KeyWord", keyword);
                            sqlParameters.Add(param3);

                        }
                        SqlParameter totalCountParameter = new SqlParameter("@TotalRecord", SqlDbType.Int);
                        totalCountParameter.Direction = ParameterDirection.Output;
                        sqlParameters.Add(totalCountParameter);
                        (DataTable t, int k) = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(sqlParameters, "Cluster_GetCategory");
                        string test = JsonConvert.SerializeObject(t);
                        br.Data = JsonConvert.DeserializeObject<List<BeanCategory>>(JsonConvert.SerializeObject(t));
                        br.TotalRecord = k;
                        br.Success = true;
                        br.DateTime = DateTime.Now;
                        break;
                    }

            }
            return Ok(br);

        }

        [HttpGet("GetItem")]
        public IActionResult GetItem([FromQuery] string table, [FromQuery] int id)
        {
            BeanReturn br = new BeanReturn();

            switch (table)
            {
                case "user":
                    {
                        List<SqlParameter> sqlParameters = new List<SqlParameter>();
                        SqlParameter param1 = new SqlParameter("@UserID", id);
                        sqlParameters.Add(param1);
                        (DataTable t, int k) = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(sqlParameters, "User_getList");
                        br.Data = JsonConvert.DeserializeObject<List<BeanUser>>(JsonConvert.SerializeObject(t)).FirstOrDefault();
                        br.Success = true;
                        br.DateTime = DateTime.Now;
                        break;
                    }
                case "":
                    {
                        break;
                    }
            }

            return Ok(br);

        }

    }
}
