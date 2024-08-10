using Grpc.Core;
using namespace_Nearestneighbor;
using Newtonsoft.Json;
using System.Diagnostics;
namespace TSP_service.Services
{
    public class NearestNeigbor : namespace_Nearestneighbor.NearestNeighbor.NearestNeighborBase
    {
        private readonly ILogger<NearestNeigbor> _logger;
        private double[,] _matrixdistance;
        private string _ids;
        private int[] _idList;
        private int _srcid;
        private int _desid;
        private int[] _masks;
        Dictionary<int, int> _indextoarray;
        Dictionary<int, int> _arraytoindex;
        public NearestNeigbor(ILogger<NearestNeigbor> logger)
        {
            _logger = logger;
        }
        static long GetMemoryUsage()
        {
            Process currentProcess = Process.GetCurrentProcess();
            return currentProcess.PrivateMemorySize64 / (1024 * 1024); // Chuyển đổi từ byte sang MB
        }
        public override Task<RouteReponse> TSPRoute(RouteRequest request, ServerCallContext context)
        {
            long initialMemory = GetMemoryUsage();
            Console.WriteLine($"Initial Memory Usage: {initialMemory} MB");
            _ids = request.Ids;
            _matrixdistance = JsonConvert.DeserializeObject<double[,]>(request.Matrixdistance);
            _srcid = request.Srcid;
            _desid = request.Desid;
            this._masks = InitMask();
            int[] index = Enumerable.Range(0, this._ids.Split(',').Length).ToArray();
            _idList = (this._srcid + "," + request.Ids + "," + this._desid)
                         .Split(',')
                         .Select(int.Parse)
                         .Distinct()
                         .ToList().ToArray();
            _indextoarray = CreateMap(index, _idList);
            _arraytoindex = CreateMap(_idList, index);
            (List<int>idsreturn, double distance)=StartRouting();
            long finalMemory = GetMemoryUsage();
            Console.WriteLine($"Final Memory Usage: {finalMemory} MB");

            // Tính toán lượng bộ nhớ sử dụng bởi thuật toán
            long memoryUsed = finalMemory - initialMemory;
            Console.WriteLine($"Memory Used by Algorithm: {memoryUsed} MB");


            SortIDs sortid = new SortIDs();
            double distancetotal = 0;

             for (int i = 0; i < idsreturn.Count; i++)
            {

                sortid.Id.Add(idsreturn[i]);
            }
            return Task.FromResult(new RouteReponse { Sortids = sortid, Totaldistance = (float)distancetotal });


        }
        public (List<int>, double) StartRouting()
        {
            List<int> list = new List<int>() { _arraytoindex[_srcid] };
            int currentnodeindex = _arraytoindex[_srcid];
            double distance = 0;
            _masks[_arraytoindex[_srcid]] = 1;
            while (_masks.Contains(0))
            {
                double[] row = GetRow(_matrixdistance, currentnodeindex);
                int minIndex = row.Select((value, index) => new { Value = value, Index = index })
                             .Where(x => _masks[x.Index] != 1) // Chỉ lấy các phần tử chưa được sử dụng (mask[index] != 1)
                             .OrderBy(x => x.Value)
                             .First().Index;
                distance += row[minIndex];
                _masks[minIndex] = 1;
                currentnodeindex = minIndex;
                list.Add(minIndex);

            }
            List<int> sort = new List<int>();
            //mapping sort index to sort ids

            foreach (int ele in list)
            {
                sort.Add(_indextoarray[ele]);
            }
            sort.Add(_desid);
            distance += _matrixdistance[list[list.Count - 1], _arraytoindex[_desid]];


            return (sort, distance);
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
        private double[] GetRow(double[,] array, int rowIndex)
        {
            int rowLength = array.GetLength(1); // Lấy độ dài của hàng
            double[] row = new double[rowLength]; // Khởi tạo mảng chứa hàng

            // Sao chép dữ liệu từ mảng 2D vào mảng hàng
            for (int i = 0; i < rowLength; i++)
            {
                row[i] = array[rowIndex, i];
            }

            return row;
        }
        private int[] InitMask()
        {
            int length = this._matrixdistance.GetLength(0);
            int[] masks = new int[length];

            // Điền mảng masks bằng 0
            for (int i = 0; i < length; i++)
            {
                masks[i] = 0;
            }
            return masks;
        }

    }
}
