using AntColony_namespace;
using Azure;
using Azure.Core;
using Grpc.Net.Client;
using Microsoft.Data.SqlClient;
using namespace_DynamicProgram;
using namespace_Genetic;
using namespace_Nearestneighbor;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.Text.Json.Serialization;
using TSPservice.Common;
using TSPservice.models;
 
namespace TSPservice
{
    internal class Program
    {
        static void Main(string[] args)
        {

            Stack<RoutingTask> values = new Stack<RoutingTask>();

            
            while (true) {
                (List<TSPService> listmodel, int count) = DBCommon.Selects<TSPService>(0, 50);
                Thread.Sleep(2000);
                List<SqlParameter> sqlParameters = new List<SqlParameter>();
                (DataTable t, int k) = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(sqlParameters, "GetRoutingTask");
                RoutingTask rt=JsonConvert.DeserializeObject<List<RoutingTask>>(JsonConvert.SerializeObject(t)).FirstOrDefault();
                if (rt!=null)
                {
                    Thread threadh = new Thread(() => {
                        Console.WriteLine(JsonConvert.SerializeObject(rt));
                        int  numpoint = rt.WastePointsID.Split(',').Length;
                        List<GarbageDistance> result = GetListGarBage(rt.WastePointsID);
                        double[,] matrix_distance = Distance.GetDistanceMatrixSQL(rt.WastePointsID, result);
                        switch (rt?.TspModelId.Value)
                        {
                            case 0:
                                {
                                    if  (numpoint <= 25)
                                    {
                                        goto case 4;
                                    }
                                    if (numpoint > 25)
                                    {
                                        goto case 2;
                                    }
                                    break;
                                }
                            case 1://Genetic
                                {
                                    TSPService service = GetService();
                                    Console.WriteLine($"service {service.ID} is free");
                                    Task<(int[], float)> reponse = RequestGenetic(service.Port, matrix_distance, rt);
                                    reponse.Wait();
                                    int[] idssorted = reponse.Result.Item1;
                                    float totaldistance = reponse.Result.Item2;
                                    rt.WastePointsIDResult = string.Join(",", idssorted);
                                    rt.RoutingDistanceResult = totaldistance;
                                    rt.StatusID = 2;
                                    List<String> list = new List<String>() { "WastePointsIDResult", "RoutingDistanceResult", "StatusID" };
                                    DBCommon.Update<RoutingTask>(rt, list);
                                    service.Status = 0;

                                    var param = new List<SqlParameter>
                                    {
                                        new SqlParameter("@RoutingTaskID", SqlDbType.Int) { Value = rt.ID }, // Default value
                                    };
                                    (DataTable, int) rs = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(param, "InsertTaskDetail", 1);
                                    break;
                                }
                            case 2://Ant colony
                                {

                                    int num = 4;
                                    var listask = new List<Task<(int[], float)>>();
                                     while (num != 0)
                                    {
                                        TSPService service = GetService();
                                        Console.WriteLine($"service {service.ID} is free");
                                        Task<(int[], float)> reponse = RequestAntColony(service.Port, matrix_distance, service, rt);
                                        listask.Add(reponse);
                                        num -= 1;

                                    }
                                    Task.WaitAll(listask.ToArray());
                                    var allResponses = new List<(int[], float)>();
                                    for (int i = 0; i < listask.Count; i++)
                                    {
                                       
                                        (int[], float) response = listask[i].Result;
                                        allResponses.Add(response);
                                    }
                                    (int[], float) minResponse = allResponses.MinBy(r => r.Item2);
                                    rt.WastePointsIDResult = string.Join(",", minResponse.Item1);
                                    rt.RoutingDistanceResult = minResponse.Item2;
                                    rt.StatusID = 2;
                                    DBCommon.Update<RoutingTask>(rt, new List<String>() { "WastePointsIDResult", "RoutingDistanceResult", "StatusID" });

                                    var param = new List<SqlParameter>
                                    {
                                        new SqlParameter("@RoutingTaskID", SqlDbType.Int) { Value = rt.ID }, // Default value
                                    };
                                    (DataTable, int) rs = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(param, "InsertTaskDetail", 1);


                                    break;
                                }
                            case 3://Nearest Neighbor 
                                {
                                    TSPService service = GetService();
                                    Task<(int[], float)> reponse = RequestNearestNeigbor(service.Port, matrix_distance, rt);
                                    reponse.Wait();
                                    int[] idssorted = reponse.Result.Item1;
                                    float totaldistance = reponse.Result.Item2;
                                    rt.WastePointsIDResult = string.Join(",", idssorted);
                                    rt.RoutingDistanceResult = totaldistance;
                                    rt.StatusID = 2;
                                    List<String> list = new List<String>() { "WastePointsIDResult", "RoutingDistanceResult", "StatusID" };
                                    DBCommon.Update<RoutingTask>(rt, list);
                                    service.Status = 0;

                                    var param = new List<SqlParameter>
                                    {
                                        new SqlParameter("@RoutingTaskID", SqlDbType.Int) { Value = rt.ID }, // Default value
                                    };
                                    (DataTable, int) rs = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(param, "InsertTaskDetail", 1);
                                    break;
                                }
                            case 4://Dynamic Programming
                                {
                                    TSPService? service = listmodel?.Where(e => e.Status == 0)?.FirstOrDefault();
                                    service.Status = 1;
                                    Task<(int[], float)> reponse = RequestDynamicProgram(service.Port, matrix_distance,rt);
                                    reponse.Wait();
                                    int[] idssorted = reponse.Result.Item1;
                                    float totaldistance = reponse.Result.Item2;
                                    rt.WastePointsIDResult = string.Join(",", idssorted);
                                    rt.RoutingDistanceResult = totaldistance;
                                    rt.StatusID = 2;
                                    List<String> list = new List<String>() { "WastePointsIDResult", "RoutingDistanceResult", "StatusID" };
                                    DBCommon.Update<RoutingTask>(rt, list);
                                    service.Status = 0;

                                    var param = new List<SqlParameter>
                                    {
                                        new SqlParameter("@RoutingTaskID", SqlDbType.Int) { Value = rt.ID }, // Default value
                                    };
                                    (DataTable, int) rs = DBCommon.ExecuteStoredProcedure_GetList_TotalRecord(param, "InsertTaskDetail", 1);
                                    break;
                                }
                        }
                    });
                    threadh.Start();
                   
                }
                else
                {
                    Console.WriteLine("No Item");
                }
               
            }
        }

        #region all
        public static TSPService GetService()
        {
            TSPService service = null;
            while (service == null)
            {
                (List<TSPService> listmodel, int count) = DBCommon.Selects<TSPService>(0, 50);
                service =listmodel?.Where(e => e.Status == 0).ToList().FirstOrDefault();
               
            }
            ChangeStatusSerevice(1, service);
            return service;
        }
        public static int ChangeStatusSerevice(int status, TSPService service)
        {
            service.Status = status;
            return DBCommon.Update<TSPService>(service, new List<string>() { "Status" });

        }
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

        #region Genetic
        private static async Task<(int[], float)> RequestGenetic(int port, double[,] matrix_distance,RoutingTask rt)
        {
            //using var channel = GrpcChannel.ForAddress("https://localhost:7255");

            using var channel = GrpcChannel.ForAddress("http://localhost:" + port);
            var client = new Genetic.GeneticClient(channel);
            int popolation = (int)Math.Pow(rt.WastePointsID.Split(",").Length, 4);
            namespace_Genetic.RouteRequest rq = new namespace_Genetic.RouteRequest()
            {
                Ids = rt.WastePointsID,
                Desid =rt.WasteDESID.Value,
                Matrixdistance = JsonConvert.SerializeObject(matrix_distance),
                Srcid = rt.WasteSRCID.Value,
                Initpopulation = int.Min(10000000, popolation),
                Temperture = int.Min(10000, popolation)
            };
            namespace_Genetic.RouteReponse reply = await client.TSPRouteAsync(rq);

            int[] sortIDs = reply.Sortids.Id.ToArray();
            float distanceTotal = reply.Totaldistance;

            return (sortIDs, distanceTotal);
        }
        #endregion


        #region NearestNeigbor
        private static async Task<(int[], float)> RequestNearestNeigbor(int port, double[,] matrix_distance, RoutingTask rt)
        {

            using var channel = GrpcChannel.ForAddress("http://localhost:" + port);
            var client = new NearestNeighbor.NearestNeighborClient(channel);
            namespace_Nearestneighbor.RouteRequest rq = new namespace_Nearestneighbor.RouteRequest()
            {

                Ids = rt.WastePointsID,
                Matrixdistance = JsonConvert.SerializeObject(matrix_distance),
                Srcid = rt.WasteSRCID.Value,
                Desid = rt.WasteDESID.Value,

            };
            namespace_Nearestneighbor.RouteReponse reply = await client.TSPRouteAsync(rq);

            int[] sortIDs = reply.Sortids.Id.ToArray();
            float distanceTotal = reply.Totaldistance;

            return (sortIDs, distanceTotal);
        }
        #endregion


        #region antcolony program
        private static async Task<(int[], float)> RequestAntColony(int port, double[,] matrix_distance, TSPService service, RoutingTask rt)
        {
            //using var channel = GrpcChannel.ForAddress("https://localhost:7255");

            using var channel = GrpcChannel.ForAddress("http://localhost:" + port);
            var client = new AntColony.AntColonyClient(channel);
            double[,] heuristicmatrix = HeuristicmatrixCalculator(matrix_distance);
            Random ran = new Random();
            /*   AntColony_namespace.RouteRequest rq = new AntColony_namespace.RouteRequest()
               {
                   Q = ran.Next(1,10),
                   NumAnts = ran.Next(array.Count()*2, (int)Math.Pow(array.Count(), 2)),
                   Matrixdistance = JsonConvert.SerializeObject(matrix_distance),
                   Alpha = ran.Next(1, 10),
                   Beta = ran.Next(1, 10),
                   Episode = array.Count(),
                   Evaporationrate = 0.2f,
                   Heuristicmatrix = JsonConvert.SerializeObject(heuristicmatrix), 
                   InitPhemon = 0.2f,
                   Ids = string.Join(',', array),
                   Optimizereturntostart=true

               };*/
            AntColony_namespace.RouteRequest rq = new AntColony_namespace.RouteRequest()
            {
                Q = ran.Next(1, 10),
                NumAnts = rt.WastePointsID.Split(",").Length*3,
                Matrixdistance = JsonConvert.SerializeObject(matrix_distance),
                Alpha = ran.Next(1, 4),
                Beta = ran.Next(1, 4),
                Episode = (int)(200 / rt.WastePointsID.Split(",").Length),
                Evaporationrate = 0.2f,
                Heuristicmatrix = JsonConvert.SerializeObject(heuristicmatrix),
                InitPhemon = 0.2f,
                Ids = rt.WastePointsID,
                Srcid= rt.WasteSRCID.Value,
                Desid= rt.WasteDESID.Value

            };
            Console.WriteLine($"size {matrix_distance.GetLength(0)} Q: {rq.Q} NumAnts {rq.NumAnts} Alpha {rq.Alpha} Beta {rq.Beta} Evapora {rq.Evaporationrate} Episode {rq.Episode}");
            AntColony_namespace.RouteReponse reply = await client.TSPRouteAsync(rq);

            int[] sortIDs = reply.Sortids.Id.ToArray();
            float distanceTotal = reply.Totaldistance;
            ChangeStatusSerevice(0, service);
            return (sortIDs, distanceTotal);
        }
        private static double[,] HeuristicmatrixCalculator(double[,] matrixdistance)
        {
            var length = matrixdistance.GetLength(0);

            double[,] heuristicmatrix = new double[length, length];
            for (int i = 0; i < length; i++)
            {
                for (int j = 0; j < length; j++)
                {
                    if (i == j)
                    {
                        heuristicmatrix[i, j] = 0;
                    }
                    else
                    {
                        heuristicmatrix[i, j] = 1.0f / matrixdistance[i, j];

                    }

                }
            }
            return heuristicmatrix;
        }
        #endregion


        #region dynamic program
        private static async Task<(int[], float)> RequestDynamicProgram(int port, double[,] matrix_distance, RoutingTask rt)
        {
            //using var channel = GrpcChannel.ForAddress("https://localhost:7255");

            using var channel = GrpcChannel.ForAddress("http://localhost:" + port);
            var client = new DynamicProgram.DynamicProgramClient(channel);

            namespace_DynamicProgram.RouteRequest rq = new namespace_DynamicProgram.RouteRequest()
            {

                Ids = rt.WastePointsID,
                Matrixdistance = JsonConvert.SerializeObject(matrix_distance),
                Srcid = rt.WasteSRCID.Value,
                Desid=rt.WasteDESID.Value

            };
            namespace_DynamicProgram.RouteReponse reply = await client.TSPRouteAsync(rq);

            int[] sortIDs = reply.Sortids.Id.ToArray();
            float distanceTotal = reply.Totaldistance;

            return (sortIDs, distanceTotal);
        }
        #endregion
    }
}
