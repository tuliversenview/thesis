using GarbageMonitorSystem.Common;
using GarbageMonitorSystem.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using StackExchange.Redis;
using System.Collections.Generic;
using System.Data;

namespace GarbageMonitorSystem.Api.Hubs
{
    public class DashBoardHub : Hub
    {
        private readonly IHubContext<DashBoardHub> _hubContext;

        public DashBoardHub(IHubContext<DashBoardHub> hubContext)
        {
            _hubContext = hubContext;

         
        }
        public async Task SendMessage(string key, string data)
        {
            switch (key)
            {
                case "routingtask": {

                        RoutingTask rt=DBCommon.Select<RoutingTask>(Int32.Parse(data));
                        if (rt.StatusID == 2)
                        {
                            var returndata = new
                            {
                                WastePointsIDResult = rt.WastePointsIDResult,
                                TotalDistance = rt.RoutingDistanceResult,
                            };
                            await Clients.Caller.SendAsync("ReceiveMessage", JsonConvert.SerializeObject(returndata));
                        }
                        break;
                    };
                case "garbagepoint":
                    {
                        List<SqlParameter> param = new List<SqlParameter>
                            {
                                new SqlParameter("@TotalRecord", SqlDbType.Int) { Direction = ParameterDirection.Output },
                                new SqlParameter("@Offset", SqlDbType.Int) { Value = 0 }, // Default value
                                new SqlParameter("@Limit", SqlDbType.Int) { Value = 150 } , // Default value
                             };
                        (DataTable, int) rs = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(param, "GetPointMarker", 1);
                        var json = JsonConvert.SerializeObject(rs.Item1);
                        TimeSpan expiration = TimeSpan.FromHours(5);
                        var returndata = new
                        {
                            totalRecord = rs.Item2,
                            data = rs.Item1,
                        };

                        await Clients.Caller.SendAsync("ReceiveMessage", key, JsonConvert.SerializeObject(returndata));
                        Thread.Sleep(2000);
                        break;
                    };
                case "pointstatus":
                    {
                        await Clients.All.SendAsync("ReceiveMessage", data);
                         break;
                    };
            }

            
        }
    }
}
