using Azure;
using GarbageMonitorSystem.Models.GoogleMapApi;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using RestSharp;
using System.Collections.Generic;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace GarbageMonitorSystem.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class GoogleMapController : ControllerBase
    {
        private readonly IDistributedCache _cache;

        public GoogleMapController(IDistributedCache cacheservice)
        {
            _cache = cacheservice;
        }

        //origin=10.797805,106.7815&destination=10.798411,106.78013
        // GET: api/<GoogleMapController>
        [HttpGet("Direction")]
        public Directions Get(string origin,string destination,string mode= "driving")
        {
            string cache = _cache.GetString($"GoogleMap_GET_{origin}_{destination}_{mode}");
            Directions directions = new Directions();
            if (cache == null) { 
                   
                string apikey = "AIzaSyDbTJzSBg81iX6cSVMzw6cgfMxrBJ1LMFQ";
                string url = $"https://maps.googleapis.com/maps/api/directions/json?origin={origin}&destination={destination}&key={apikey}&language=vi";
                var options = new RestClientOptions(url);
                var client = new RestClient(options);
                var request = new RestRequest(url, Method.Get);
                RestResponse response = client.Execute(request);
                if (response.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    TimeSpan expiration = TimeSpan.FromHours(5);
                    _cache.SetString($"GoogleMap_GET_{origin}_{destination}_{mode}", response.Content,new DistributedCacheEntryOptions() { AbsoluteExpirationRelativeToNow=expiration});
                    directions =JsonConvert.DeserializeObject<Directions>(response.Content);
                    return directions;
                }
                else
                {
                    return null;
                }
            }
            else
            {
                 directions = JsonConvert.DeserializeObject<Directions>(cache);
                return directions;
            }

        }

        // GET api/<GoogleMapController>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/<GoogleMapController>
        [HttpPost]
        public void Post([FromBody] string value)
        {
        }

        // PUT api/<GoogleMapController>/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }

        // DELETE api/<GoogleMapController>/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
