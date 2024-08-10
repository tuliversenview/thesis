using GarbageMonitorSystem.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using System.Data;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace GarbageMonitorSystem.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class StartPointController : ControllerBase
    {
        private readonly IDistributedCache _cache;

        public StartPointController(IDistributedCache cacheservice)
        {
            _cache = cacheservice;
            
        }


        // GET: api/<GetGarbagePointMarkerController>
        [HttpGet]
        public IActionResult Get(int offset, int limit = 20,int category=1)
        {
            List<SqlParameter> param = new List<SqlParameter>
            {
                new SqlParameter("@TotalRecord", SqlDbType.Int) { Direction = ParameterDirection.Output },
                new SqlParameter("@Offset", SqlDbType.Int) { Value = offset }, // Default value
                new SqlParameter("@Limit", SqlDbType.Int) { Value = limit } , // Default value
                new SqlParameter("@Type", SqlDbType.NVarChar) { Value = "StartPoint" } , // Default value
                new SqlParameter("@Category", SqlDbType.Int) { Value =category } , // Default value
             };
            (DataTable, int) rs = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(param, "GetPointMarker", 1);
            var json = JsonConvert.SerializeObject(rs.Item1);
            TimeSpan expiration = TimeSpan.FromHours(5);
            var returndata = new
            {
                totalRecord = rs.Item2,
                data = rs.Item1,
            };
            _cache.SetString($"StartPoint_GET_{offset}_{limit}", JsonConvert.SerializeObject(returndata), new DistributedCacheEntryOptions() { AbsoluteExpirationRelativeToNow = expiration });

            return Ok(JsonConvert.SerializeObject(returndata));

        }

        // GET api/<GetGarbagePointMarkerController>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/<GetGarbagePointMarkerController>
        [HttpPost]
        public void Post([FromBody] string value)
        {
        }

        // PUT api/<GetGarbagePointMarkerController>/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }

        // DELETE api/<GetGarbagePointMarkerController>/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
