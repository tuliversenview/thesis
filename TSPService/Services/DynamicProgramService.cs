using Google.Protobuf;
using Grpc.Core;
using System.Collections;
using System.Text;
using Google.Protobuf;
using ProtoBuf;
using System.Text.Json.Serialization;
using Newtonsoft.Json;
using NumSharp;
using System.Diagnostics;
using System;
using static System.Runtime.InteropServices.JavaScript.JSType;
using namespace_DynamicProgram;
using NumSharp.Generic;
namespace TSP_service.Services
{
    public class DynamicProgramService : DynamicProgram.DynamicProgramBase
    {
        private readonly ILogger<DynamicProgramService> _logger;
        private Dictionary<string, double> memo = new Dictionary<string, double>();
        private Dictionary<string, int> count = new Dictionary<string, int>();
        private Dictionary<string, string> memopath = new Dictionary<string, string>();
        private int _depth;
        private List<int> _indexList;
        private List<int> _idList;
        private List<int> _indexlistrouting;
        private int _parentIndex;
        private double[,] _matrixdistance;
        private bool _isbacktosrc;
        private int _srcid;
        private int _desid;
        private bool _optimizereturntostart = false;
        private Dictionary<int, int> _indextoid;
        private Dictionary<int, int> _idtoindex;
        public DynamicProgramService(ILogger<DynamicProgramService> logger)
        {
            _logger = logger;
        }

        public override Task<RouteReponse> TSPRoute(RouteRequest request, ServerCallContext context)
        {
            this._srcid = request.Srcid;
            this._desid = request.Desid;
 
            this._matrixdistance = JsonConvert.DeserializeObject<double[,]>(request.Matrixdistance);

            //danh sách ID raw
            this._idList = (this._srcid + "," + request.Ids + "," + this._desid)
                            .Split(',')
                            .Select(int.Parse)
                            .Distinct() 
                            .ToList();
            //danh sách index theo list id from 0 to n
            this._indexList = Enumerable.Range(0, request.Ids.Split(',').Select(int.Parse).ToArray().GetLength(0)).ToList(); // Assuming the first node is excluded

            //bản ảnh xạ index và id
            this._indextoid = CreateMap(this._indexList.ToArray(), _idList.ToArray());
            this._idtoindex = CreateMap(_idList.ToArray(), this._indexList.ToArray());

            // Init các giá trị cho quá trình Routing
            this._indexlistrouting = new List<int>(_indexList);
            this._indexlistrouting.RemoveAt(_idtoindex[_srcid]);
            this._depth = 1;
            this._parentIndex = _idtoindex[_srcid];


            (string sortindex,double totalDistance)=RoutingOptimize(_depth, _indexlistrouting, _parentIndex, _matrixdistance);
          
            SortIDs sortIDs = new SortIDs();

            sortIDs.Id.AddRange(sortindex.Split(',')
                                  .Select(int.Parse)
                                  .ToArray());
            RouteReponse r = new RouteReponse() { Sortids=sortIDs,Totaldistance=(float)totalDistance};
            return Task.FromResult(r);
        }




        private (string, double) RoutingOptimize(int depth, List<int> indexList, int parentIndex, double[,] matrixdistance)
        {
            List<double> distanceList = new List<double>();
            List<string> rsofChild = new List<string>();

            double minCost = double.MaxValue;
            int minIndex = -1;

            for (int i = 0; i < indexList.Count; i++)
            {
                int nodeIndex = indexList[i];
                List<int> indexListTemp = new List<int>(indexList);
                indexListTemp.Remove(nodeIndex);

                double costParentToMe = matrixdistance[parentIndex, nodeIndex];
                double totalCost;

                if (indexListTemp.Count == 0)
                {
                    double costFromMeToSrc = matrixdistance[nodeIndex, this._idtoindex[_desid]];
                    totalCost = costParentToMe + costFromMeToSrc;
                }
                else
                {
                    string permutation = string.Join(",", nodeIndex, "{" + string.Join(",", indexListTemp) + "}");
                    if (memo.ContainsKey(permutation))
                    {
                        totalCost = memo[permutation];
                        count[permutation]++;
                        rsofChild.Add(memopath[permutation]);
                    }
                    else
                    {
                        (string, double) rs = RoutingOptimize(depth + 1, new List<int>(indexListTemp), nodeIndex, matrixdistance);
                        totalCost = rs.Item2;
                        rsofChild.Add(rs.Item1);

                        if (indexListTemp.Count > 1)
                        {
                            memo[permutation] = totalCost;
                            count[permutation] = 0;
                            memopath[permutation] = rs.Item1;
                        }
                    }
                    totalCost += costParentToMe;
                }

                distanceList.Add(totalCost);

                if (totalCost < minCost)
                {
                    minCost = totalCost;
                    minIndex = i;
                }
            }

            var childPath = "";
            if (rsofChild.Count > minIndex)
            {
                childPath += rsofChild[minIndex];
            }
            else
            {
                childPath += _indextoid[indexList[minIndex]] + "," + _desid;
            }

            return (_indextoid[parentIndex] + "," + childPath, minCost);
        }





        public static Dictionary<TKey, TValue> CreateMap<TKey, TValue>(TKey[] keys, TValue[] values)
        {
            if (keys.Length != values.Length)
            {
                throw new ArgumentException("Arrays must be of equal length.");
            }

            Dictionary<TKey, TValue> dict = new Dictionary<TKey, TValue>();

            for (int i = 0; i < keys.Length; i++)
            {
                dict[keys[i]] = values[i];
            }

            return dict;
        }
        private double[,] GeneratePhemonMatrix(double[,] matrixdistance, double initphemon = 0.02f)
        {
            var length = matrixdistance.GetLength(0);
            double[,] phemon = new double[length, length];
            for (int i = 0; i < length; i++)
            {
                for (int j = 0; j < length; j++)
                {
                    phemon[i, j] = initphemon;
                }
            }
            return phemon;
        }
        static byte[] SerializeObject<T>(T obj)
        {
            using (MemoryStream memoryStream = new MemoryStream())
            {
                Serializer.Serialize(memoryStream, obj);
                return memoryStream.ToArray();
            }
        }
        private double[] GetRow(double[,] array, int rowIndex)
        {
            NDArray npArray = np.array(array);
            NDArray row = npArray[rowIndex, ":"];
            return row.ToArray<double>();
        }
        private (int item, int index) GetRandomNodeByProbaDistribution(int[] items, double[] probabilities)
        {
            Random random = new Random();
            double randomNumber = random.NextDouble();

            double cumulativeProbability = 0.0;

            for (int i = 0; i < items.Length; i++)
            {
                cumulativeProbability += probabilities[i];
                if (randomNumber < cumulativeProbability)
                {
                    return (items[i], i); 
                }
            }

            return (-1, -1); 
        }
        private double[] getProbaDistributionOfRow(double[] rowsHeuristicmatrix, double[] phemon, List<int> memo, int alpha, int beta)
        {
            List<double> result = new List<double>();
            double sumeven = 0;
            bool validValuesExist = false;

         
            for (int i = 0; i < rowsHeuristicmatrix.Length; i++)
            {
                if (!memo.Contains(i))
                {
                    double value = Math.Pow(rowsHeuristicmatrix[i], alpha) * Math.Pow(phemon[i], beta);
                    if (!double.IsNaN(value))
                    {
                        sumeven += value;
                        validValuesExist = true;
                    }
                }
            }

         
            if (!validValuesExist)
            {
                return Enumerable.Repeat(0.0, rowsHeuristicmatrix.Length).ToArray();
            }

          
            for (int i = 0; i < rowsHeuristicmatrix.Length; i++)
            {
                if (!memo.Contains(i))
                {
                    double P = (Math.Pow(rowsHeuristicmatrix[i], alpha) * Math.Pow(phemon[i], beta)) / sumeven;
                    if (double.IsNaN(P))
                    {
                        result.Add(1);
                    }
                    else
                    {
                        result.Add(P);
                    }
                }
                else
                {
                    result.Add(0);
                }
            }

            return result.ToArray();
        }
        private int GetIndexHightestPhemonByRow(int rowindex, int[] memoryindex, double[,] phemom)
        {
            double[] row = GetRow(phemom, rowindex);
            for (int i = 0; i < row.Length; i++)
            {
                if (memoryindex.Contains(i))
                {
                    row[i] = Double.MinValue;
                }

            }
            double maxPhemon = row.Max();

            // Get the indices where the item is maximum and not in memoryIndex
            var index = row.Select((item, index) => new { Item = item, Index = index })
                             .Where(pair => pair.Item == maxPhemon)
                             .Select(pair => pair.Index).FirstOrDefault();
            return index;
        }
    }
}
