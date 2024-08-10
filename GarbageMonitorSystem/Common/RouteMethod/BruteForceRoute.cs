using GarbageMonitorSystem.Interface;

namespace GarbageMonitorSystem.Common.RouteMethod
{
    public class BruteForceRoute : IRoute
    {
         private Dictionary<string, int> count = new Dictionary<string, int>();
         private int _depth;
        private List<int> _indexList;
        private int _parentIndex;
        private double[,] _matrixdistance;
        private string _ids;
        private bool _isbacktosrc;
        public BruteForceRoute(int depth, int parentIndex, double[,] matrixdistance, string ids)
        {
            this._indexList = Enumerable.Range(1, ids.Split(',').Select(int.Parse).ToArray().GetLength(0) - 1).ToList(); // Assuming the first node is excluded
            this._depth = depth;
            this._parentIndex = parentIndex;
            this._matrixdistance = matrixdistance;
            this._ids = ids;
        }

        public bool IsbackToSrc
        {
            get => _isbacktosrc;
            set => _isbacktosrc = value;
        }

        public (List<int>, double) SortingDistance()
        {
            int[] index = Enumerable.Range(0, this._ids.Split(',').Length).ToArray();
            int[] id = this._ids.Split(',').Select(int.Parse).ToArray();
            Dictionary<int, int> indextoarray = Distance.CreateMap(index, id);
            //result is index sorting and best distance
            (string, double) rs = RoutingOptimize(this._depth, this._indexList, this._parentIndex, this._matrixdistance);
            //mapping sort index to sort ids
            string[] indexs_sort = rs.Item1.Split(',');
            List<int> sort = new List<int>();
            foreach (string ele in indexs_sort)
            {
                sort.Add(indextoarray[Int32.Parse(ele)]);
            }
            return (sort, rs.Item2/1000);
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
                    distanceList.Add(costParentToMe);
                }
                else
                {
                    string permutation = string.Join(",", nodeIndex, "{" + string.Join(",", indexListTemp) + "}");
                    double cost = 0;
                    (string, double) rs = RoutingOptimize(depth + 1, new List<int>(indexListTemp), nodeIndex, matrixdistance);
                    rsofChild.Add(rs.Item1);
                    cost = rs.Item2;
                    if (indexListTemp.Count > 1)
                    {
                        count[permutation] = 0;
                    }
                    distanceList.Add(costParentToMe + cost);
                }
            }

            double cost_min = distanceList.Min();
            int minIndex = distanceList.IndexOf(cost_min);

            return (parentIndex + "," + (rsofChild.Count() > minIndex ? rsofChild[minIndex] : indexList[minIndex]), cost_min);
        }
    }
}
