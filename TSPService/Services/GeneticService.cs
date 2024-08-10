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
using namespace_Genetic;
using NumSharp.Generic;
using MoreLinq;
using System.Numerics;
namespace TSP_service.Services
{
    public class GeneticService : Genetic.GeneticBase
    {
        private readonly ILogger<GeneticService> _logger;
        private Dictionary<string, double> memo = new Dictionary<string, double>();
        private Dictionary<string, int> count = new Dictionary<string, int>();
        private Dictionary<string, string> memopath = new Dictionary<string, string>();
        private int _depth;
        private List<int> _indexList;
        private List<int> _idList;
        private List<int> _indexlistrouting;
        private int _parentIndex;
        private double[,] _matrixdistance;
        private bool _optimizereturntostart = false;
        private int _srcid;
        private int _desid;
        private int _numparent;
        private int _temperture;
        private int[] _masks;
        private Dictionary<int, int> _indextoid;
        private Dictionary<int, int> _idtoindex;
        private Permutation _shortestPermutation=new Services.Permutation(null,float.MaxValue);
        public GeneticService(ILogger<GeneticService> logger)
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
            this._srcid = request.Srcid;
            this._desid = request.Desid;
            this._matrixdistance = JsonConvert.DeserializeObject<double[,]>(request.Matrixdistance);
            this._idList = request.Ids
                    .Split(',')
                    .Select(int.Parse)
                    .ToList();
            this._indexList = Enumerable.Range(0, request.Ids.Split(',').Select(int.Parse).ToArray().GetLength(0)).ToList();
            this._indextoid = CreateMap(this._indexList.ToArray(), _idList.ToArray());
            this._idtoindex = CreateMap( _idList.ToArray(), this._indexList.ToArray());
            this._temperture = request.Temperture;
            this._numparent = request.Initpopulation;
            /*   List<int> antcolonyids =JsonConvert.DeserializeObject<List<int>>(request.Antcolonyids);
               for(int i = 0; i < antcolonyids.Count; i++)
               {
                   antcolonyids[i] = _idtoindex[antcolonyids[i]];
               }
               float antcolonydistance = request.Antcolonydistance;*/
            _masks = InitMask();
            (string sortids, double totalDistance) = RoutingOptimize(this._indexList,this._optimizereturntostart, this._matrixdistance,this._numparent);
            SortIDs sortIDs = new SortIDs();
            sortIDs.Id.AddRange(sortids.Split(',')
                                  .Select(int.Parse)
                                  .ToArray());
            RouteReponse r = new RouteReponse() { Sortids = sortIDs, Totaldistance = (float)totalDistance };
            long finalMemory = GetMemoryUsage();
            Console.WriteLine($"Final Memory Usage: {finalMemory} MB");

            long memoryUsed = finalMemory - initialMemory;
            Console.WriteLine($"Memory Used by Algorithm: {memoryUsed} MB");
            return Task.FromResult(r);
        }

        public bool isGetnewGen(double distanceF1,double distanceF2,double temperature)
        {
            if(distanceF2< distanceF1)
            {
                return true;
            }
            else
            {
                /*double prob = (double)Math.Pow(2.7,(-1 * ((double)(distanceF2- distanceF1) / temperature)));
                if (prob > 0.5)
                {
                    return true;
                }
               */
            }
            return false;
        }
        public List<int> nearestNeigbor()
        {
            List<int> list = new List<int>() { _idtoindex[_srcid] };
            int currentnodeindex = _idtoindex[_srcid];
            double distance = 0;
            _masks[currentnodeindex] = 1;
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
            list.Add(_idtoindex[_desid]);
            return list;
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
        private (string, double) RoutingOptimize(List<int> indexlist, bool optimizereturntostart, double[,] matrixdistance, int numparent)
        {
            if (optimizereturntostart)
            {
                indexlist = indexlist.Append(indexlist[0]).ToList();
            }
            List<Permutation> F1 = new List<Permutation>();
           /* for (int i = 0; i < numparent; i++)
            {
                List<int> permu = Permutation(new List<int>(indexlist), optimizereturntostart);
                double distance = CalculateTotalDistance(permu, matrixdistance);
                Permutation p = new Permutation(permu, distance);
                if (p.Totaldistance < _shortestPermutation.Totaldistance)
                {
                    _shortestPermutation = new Permutation(p);
                }
                F1.Add(p);
 
 
            }*/

            List<int> permu_NN = nearestNeigbor();
            double distance_NN = CalculateTotalDistance(permu_NN, matrixdistance);
            Permutation p_NN = new Permutation(permu_NN, distance_NN);
            if (p_NN.Totaldistance < _shortestPermutation.Totaldistance)
            {
                _shortestPermutation = new Permutation(p_NN);
            }
            F1.Add(p_NN);
            while (F1.Count < numparent)
            {
                F1.Add(p_NN);
            }

            while (_temperture > 100)
            {
                List<Permutation> F2 = new List<Permutation>();
                for (int i = 0; i < F1.Count; i++)
                {
                    Permutation p = F1[i];
                    List<int> permu2 = PermutationF2(new List<int>(p.Indexs), 10);
                    double distance2 = CalculateTotalDistance(permu2, matrixdistance);
                    Permutation p2 = new Permutation(permu2, distance2);
                    if (p2.Totaldistance < _shortestPermutation.Totaldistance)
                    {
                        _shortestPermutation = new Permutation(p2);

                    }
                    bool isgetnew = isGetnewGen(p.Totaldistance, p2.Totaldistance, 100);
                    if (isgetnew)
                    {
                        F2.Add(p2);
                    }
                }
                while (F2.Count < F1.Count/2)
                {
                    F2.Add(new Permutation(_shortestPermutation.Indexs, _shortestPermutation.Totaldistance));
                }
                _temperture = CoolDown(_temperture);
                F1 = F2;
              /*  if (F1.Count == 0)
                {
                    break;
                }*/
            }

            return (string.Join(",", _shortestPermutation.Indexs.Select(index => _indextoid[index])), _shortestPermutation.Totaldistance);
        }

        public int CoolDown(int temp)
        {
            return (90 * temp) / 100;
        }
        public static double CalculateTotalDistance(List<int> permutation, double[,] matrixdistance)
        {
            double totalDistance = 0;

            // Calculate total distance for the shuffled permutation
            for (int i = 1; i < permutation.Count; i++)
            {
                int fromIndex = permutation[i - 1];
                int toIndex = permutation[i];
                totalDistance += matrixdistance[fromIndex, toIndex];
            }

        
            return totalDistance;
        }
        public List<int> RandomPermutation(List<int> nums)
        {
            Random rand = new Random();

            // Make a copy of the input list
            List<int> permutation = new List<int>(nums);

            // Fisher-Yates shuffle algorithm
            for (int i = permutation.Count - 1; i > 0; i--)
            {
                int j = rand.Next(0, i + 1); // Generate a random index within the range [0, i]

                // Swap elements at indices i and j
                int temp = permutation[i];
                permutation[i] = permutation[j];
                permutation[j] = temp;
            }

            return permutation;
        }
        public List<int> PermutationF2(List<int> n,int percentswap=10)
        {
            float percent = ((float)percentswap / 100) * (n.Count - 1);
            List<int> permutations = new List<int>();
            List<(int a, int b)> permuhistory = new List<(int a, int b)>();
            Random r = new Random();
            while (permuhistory.Count < percent)
            {
                int firstNum = _idtoindex[_srcid];
                int lastNum = _idtoindex[_desid];
                n.RemoveAll(item => item == _idtoindex[_srcid]);
                n.RemoveAll(item => item == _idtoindex[_desid]);
            start1:
                int first = r.Next(0, n.Count);
                int second = r.Next(0, n.Count);
                if (first == second && !permuhistory.Contains((first, second)))
                {
                    goto start1;
                }
                int temp = n[first];
                n[first] = n[second];
                n[second] = temp;
                n = n.Prepend(firstNum).ToList();
                n = n.Append(lastNum).ToList();
                permuhistory.Add((first, second));
            }
          
            return n;
        }
        public List<int> Permutation(List<int> n,bool optimizereturntostart)
        {
            List<int> permutations = new List<int>();
             if (_optimizereturntostart)
            {
                int firstNum = n[0];
                int lastNum = n[n.Count - 1];
                n.RemoveAt(0);
                n.RemoveAt(n.Count - 1);
                permutations = RandomPermutation(n);
                permutations = permutations.Prepend(firstNum).ToList();
                permutations = permutations.Append(lastNum).ToList();
            }
            else
            {
                int firstNum = n[0];
                n.RemoveAt(0);
                permutations = RandomPermutation(n);
                permutations=permutations.Prepend(firstNum).ToList();
            }
            return permutations;
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
       
        static byte[] SerializeObject<T>(T obj)
        {
            using (MemoryStream memoryStream = new MemoryStream())
            {
                Serializer.Serialize(memoryStream, obj);
                return memoryStream.ToArray();
            }
        }
     
    }

    public class Permutation
    {
        private List<int> _indexs;
        private double _totaldistance;

        public Permutation(List<int> permutation, double totaldistance)
        {
            this._indexs = permutation;
            this._totaldistance = totaldistance;
        }
        public Permutation(Permutation p)
        {
            this._indexs = p._indexs;
            this._totaldistance = p._totaldistance;
        }

        public List<int> Indexs { get => _indexs; set => _indexs = value; }
        public double Totaldistance { get => _totaldistance; set => _totaldistance = value; }
    }
}
