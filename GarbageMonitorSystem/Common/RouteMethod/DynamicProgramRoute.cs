using GarbageMonitorSystem.Interface;
using GarbageMonitorSystem.Models;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using System;
using System.Data;

namespace GarbageMonitorSystem.Common.RouteMethod
{
    public class DynamicProgramRoute : IRoute
    {
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
        private bool _isloopback=false;
        private Dictionary<int, int> _indextoid;
        private Dictionary<int, int> _idtoindex;
        public DynamicProgramRoute(int depth, int parentIndex, string ids,int src,int des)
        {
            this._srcid = src;
            this._desid = des;
            this._isloopback = src == des;

            string listindex_string = src == des ? $"{src},{ids}" : $"{src},{ids},{des}";

            List<GarbageDistance> result = GetListGarBage(listindex_string);
            this._matrixdistance = Distance.GetDistanceMatrixSQL(listindex_string, result);

            //danh sách ID raw
            this._idList = listindex_string
                    .Split(',')
                    .Select(int.Parse)
                    .ToList();

            //danh sách index theo list id from 0 to n
            this._indexList = Enumerable.Range(0, listindex_string.Split(',').Select(int.Parse).ToArray().GetLength(0)).ToList(); // Assuming the first node is excluded

            //bản ảnh xạ index và id
            this._indextoid = Distance.CreateMap(this._indexList.ToArray(), _idList.ToArray());
            this._idtoindex = Distance.CreateMap(_idList.ToArray(),this._indexList.ToArray());

            // Init các giá trị cho quá trình Routing
            this._indexlistrouting= new List<int>(_indexList);
            this._indexlistrouting.RemoveAt(_idtoindex[src]);
            this._depth = 1;
            this._parentIndex = _idtoindex[src];

        }

        public bool IsbackToSrc
        {
            get => _isbacktosrc;
            set => _isbacktosrc = value;
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
        public (List<int>, double) SortingDistance()
        {

            //result is index sorting and best distance
            (string, double) rs = RoutingOptimize(this._depth, this._indexlistrouting, this._parentIndex, this._matrixdistance);
            //mapping sort index to sort ids
            string[] indexs_sort = rs.Item1.Split(',');
            List<int> sort = new List<int>();
           /* foreach (string ele in indexs_sort)
            {
                sort.Add(indextoarray[Int32.Parse(ele)]);
            }*/
            return (rs.Item1.Split(',').Select(int.Parse).ToList(), rs.Item2/1000);
        }
        private (string, double) RoutingOptimize(int depth, List<int> indexList, int parentIndex, double[,] matrixdistance)
        {
            List<double> distanceList = new List<double>();
            List<string> rsofChild = new List<string>();

            foreach (int nodeIndex in indexList)
            {
                List<int> indexListTemp = new List<int>(indexList);
                indexListTemp.Remove(nodeIndex);

                double costParentToMe = matrixdistance[parentIndex, nodeIndex];

                if (indexListTemp.Count == 0)
                {
                    if (_isloopback)
                    {
                        double costfrommetosrc = matrixdistance[nodeIndex, this._idtoindex[_srcid]];
                        distanceList.Add(costParentToMe+ costfrommetosrc);
                    }
                    else
                    {
                        distanceList.Add(costParentToMe);
                    }
                   
                }
                else
                {
                    string permutation = string.Join(",", nodeIndex, "{" + string.Join(",", indexListTemp) + "}");
                    double cost = 0;
                    if (memo.ContainsKey(permutation))
                    {
                        cost = memo[permutation];
                        count[permutation]++;
                        string pathmemo = memopath[permutation];
                        rsofChild.Add(pathmemo);
                    }
                    else
                    {
                        (string, double) rs = RoutingOptimize(depth + 1, new List<int>(indexListTemp), nodeIndex, matrixdistance);
                        rsofChild.Add(rs.Item1);
                        cost = rs.Item2;
                        if (indexListTemp.Count > 1)
                        {
                            memo[permutation] = cost;
                            count[permutation] = 0;
                            memopath[permutation] = rs.Item1;
                        }
                    }
                    distanceList.Add(costParentToMe + cost);
                }
            }

            double cost_min = distanceList.Min();
            int minIndex = distanceList.IndexOf(cost_min);

            var childpath = "";
            if(rsofChild.Count() > minIndex)
            {
                childpath += rsofChild[minIndex];
            }
            else
            {
                if (_isloopback)
                {
                   /* childpath += _indextoid[indexList[minIndex]]+","+_srcid;*/
                    childpath += _indextoid[indexList[minIndex]];
                }
                else
                {
                    childpath += _indextoid[indexList[minIndex]];
                }

            }
            return (_indextoid[parentIndex] + "," + childpath, cost_min);
        }
    }
}
