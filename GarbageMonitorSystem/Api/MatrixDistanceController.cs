using GarbageMonitorSystem.Common;
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
    public class MatrixDistanceController : ControllerBase
    {
        // GET: api/<MatrixDistanceController>
        [HttpGet]
        public IActionResult Get(string ids)
        {
            List<SqlParameter> param = new List<SqlParameter>
            {
                new SqlParameter("@FromGarbagePointIDs", SqlDbType.NVarChar) { Value = ids }, // Default value
            };
            (DataTable, int) rs = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(param, "GetGarbageDistancesByFromGarbagePointIDs", 1);
            var json = JsonConvert.SerializeObject(rs.Item1);
            return Ok(json);
        }

        // GET api/<MatrixDistanceController>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/<MatrixDistanceController>
        [HttpPost]
        public void Post([FromBody] string value)
        {
        }

        // PUT api/<MatrixDistanceController>/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }

        // DELETE api/<MatrixDistanceController>/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
