using GarbageMonitorSystem.Common;
using GarbageMonitorSystem.Models.Category;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR.Client;
using Newtonsoft.Json;
using StackExchange.Redis;
 


namespace GarbageMonitorSystem.Api.IOT
{
    [Route("api/iot/[controller]")]
    [ApiController]
    public class TransmitSensorDataController : ControllerBase
    {
        private readonly IMySignalRService _signalRService;

        public TransmitSensorDataController(IMySignalRService signalRService)
        {
            _signalRService = signalRService;
        }
        [HttpGet]
        public IActionResult Get(int id, double lat, double lng, int percent)
        {
            if (id == 0)
            {
                BeanGarbagePoint newpoint = new BeanGarbagePoint();
                newpoint.PointType = "Bin";
                id =DBCommon.Insert<BeanGarbagePoint>(newpoint);
            }

            Console.WriteLine($"{DateTime.Now.ToLocalTime()} id {id} lat : {lat} lng : {lng} percent: {percent}");
            BeanGarbagePoint b = new BeanGarbagePoint();
            BeanGarbagePoint item = DBCommon.Select<BeanGarbagePoint>(id);

            item.CurrentFill = percent;
            if (lat != 0 && lng != 0)
            {
                item.Lat = lat;
                item.Lng = lng;
                DBCommon.Update<BeanGarbagePoint>(item, new List<string>() { "CurrentFill", "Lat", "Lng" });
            }
            else
            {
                DBCommon.Update<BeanGarbagePoint>(item, new List<string>() { "CurrentFill" });
            }


            var garbagepoint = new
            {
                CurrentFill = item.CurrentFill,
                Id = item.ID,
            };

            _signalRService.SendMessageToHubAsync("pointstatus", JsonConvert.SerializeObject(garbagepoint));
            return Ok(item);
        }
        public double CalculatePercentage(int inputHeight, double maxHeight)
        {
            // Calculate the percentage
            double percentage = ((double)inputHeight / maxHeight) * 100;

            // Return the percentage
            return percentage;
        }

    }
}
