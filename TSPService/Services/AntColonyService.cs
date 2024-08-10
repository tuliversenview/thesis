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
using namespace_AntColony;

namespace TSP_service.Services
{
    public class AntColonyService : AntColony.AntColonyBase
    {
        private readonly ILogger<AntColonyService> _logger;
        private Dictionary<string, double> memo = new Dictionary<string, double>();
        private Dictionary<string, int> count = new Dictionary<string, int>();
        private Dictionary<string, string> memopath = new Dictionary<string, string>();
        private double[,]? _matrixdistance;
        private double[,]? _heuristicmatrix;
        private double[,] _phemon;
        private List<int> _idslist;
        private int[] _indexList;
        private string _ids;
        private double _evaporationrate;
        private int _q;
        private int _numants;
        private int _episode;
        private float _alpha;
        private float _beta;
        private int _srcid;
        private int _desid;
        private Dictionary<int, int> _indextoarray;
        private Dictionary<int, int> _arraytoindex;

        public AntColonyService(ILogger<AntColonyService> logger)
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

            InitProp(request);

            double mindistance = double.MaxValue;
            double[,] minphemon = _phemon;
            var countdownEvent = new CountdownEvent(_episode);
            //Parallel.For(0, _episode, j => nhớ back lại đoạn này
            Parallel.For(0, _episode, j =>
            {
                double[,] phemon_return = AntsExploit(_indexList.ToArray(), _idslist.ToArray(), _evaporationrate, _q, _numants, _alpha, _beta);
                List<int> indexs = new List<int>();
                bool isinit = false;
                int nextindex = 0;
                double distanceCurrent = 0;
                for (int i = 0; i < _idslist.Count; i++)
                {
                    if (!isinit)
                    {
                        indexs.Add(_arraytoindex[_srcid]);
                        nextindex = GetIndexHightestPhemonByRow(0, indexs.ToArray(), phemon_return);
                        isinit = true;
                    }
                    else
                    {
                        indexs.Add(nextindex);
                        var return_nextindex = GetIndexHightestPhemonByRow(nextindex, indexs.ToArray(), phemon_return);
                        distanceCurrent += _matrixdistance[nextindex, return_nextindex];
                        nextindex = return_nextindex;
                    }

                }
                indexs.Add(_arraytoindex[_desid]);
                distanceCurrent += _matrixdistance[nextindex, _arraytoindex[_desid]];

                if (mindistance > distanceCurrent)
                {
                    mindistance = distanceCurrent;
                    minphemon = phemon_return;
                }

                Console.WriteLine(j + "___" + distanceCurrent);
                countdownEvent.Signal();

            });
            _phemon = minphemon;
            countdownEvent.Wait();
            List<int> indexs = new List<int> { _arraytoindex[_srcid], _arraytoindex[_desid] };
            SortIDs sortid = new SortIDs();
            sortid.Id.Add(_indextoarray[_arraytoindex[_srcid]]);
            double distancetotal = 0;

            int currentIndex = _arraytoindex[_srcid];
            for (int i = 1; i <= _idslist.Count - 2; i++)
            {
                int nextIndex = GetIndexHightestPhemonByRow(currentIndex, indexs.ToArray(), minphemon);
                distancetotal += _matrixdistance[currentIndex, nextIndex];
                currentIndex = nextIndex;
                indexs.Add(currentIndex);
                sortid.Id.Add(_indextoarray[currentIndex]);
            }

            distancetotal += _matrixdistance[currentIndex, _arraytoindex[_desid]];
            sortid.Id.Add(_desid);

            long finalMemory = GetMemoryUsage();
            Console.WriteLine($"Final Memory Usage: {finalMemory} MB");

            // Tính toán lượng bộ nhớ sử dụng bởi thuật toán
            long memoryUsed = finalMemory - initialMemory;
            Console.WriteLine($"Memory Used by Algorithm: {memoryUsed} MB");
            return Task.FromResult(new RouteReponse { Sortids = sortid, Totaldistance = (float)distancetotal });


        }
        public void InitProp(RouteRequest request)
        {
            _ids = request.Ids;
            _evaporationrate = request.Evaporationrate;
            _q = request.Q;
            _numants = request.NumAnts;
            _episode = request.Episode;
            _alpha = request.Alpha;
            _beta = request.Beta;
            _srcid = request.Srcid;
            _desid = request.Desid;
            _idslist =(this._srcid + "," + request.Ids + "," + this._desid)
                        .Split(',')
                        .Select(int.Parse)
                        .Distinct()
                        .ToList();
            _indexList = Enumerable.Range(0, _idslist.Count).ToList().ToArray();
            _matrixdistance = JsonConvert.DeserializeObject<double[,]>(request.Matrixdistance);
            _heuristicmatrix = JsonConvert.DeserializeObject<double[,]>(request.Heuristicmatrix);
            _phemon = GeneratePhemonMatrix(_matrixdistance, request.InitPhemon);
            _indextoarray = CreateMap(_indexList, _idslist.ToArray());
            _arraytoindex = CreateMap(_idslist.ToArray(), _indexList);
        }
        private double[,] AntsExploit(int[] indexList, int[] itemlist, double evaporationrate, int q, int numants, float alpha, float beta)
        {
            Stopwatch stopwatch = Stopwatch.StartNew();
            int hash = GetHashCode();

            int rows = _phemon.GetLength(0);
            int cols = _phemon.GetLength(1);
            double[,] clone_phenom = new double[rows, cols];

            Buffer.BlockCopy(_phemon, 0, clone_phenom, 0, _phemon.Length * sizeof(double));
            //step1 Ant Route Random
            Random random = new Random();
            for (int e = 0; e < numants; e++)
            {
                List<(int[], double)> AnsMemory = new List<(int[], double)>();
                for (int j = 0; j < numants; j++)
                {
                    double distance = 0;
                    List<int> memo = new List<int>();
                    int randomIndex;
                    randomIndex = 0;
                    memo.Add(randomIndex);
                    //step1 Routing All Node 
                   
                    for (int i = 0; i < indexList.Length - 1; i++)
                    {

                        double[] pro = getProbaDistributionOfRow(GetRow(_heuristicmatrix, randomIndex), GetRow(_phemon, randomIndex), memo, alpha, beta);
                        double sum = pro.Sum();
                        (int id, int index) = GetRandomNodeByProbaDistribution(itemlist, pro);
                        memo.Add(index);
                        randomIndex = index;
                        int row = memo[memo.Count - 2];
                        int col = memo[memo.Count - 1];
                        distance += _matrixdistance[row, col];
                    }
                    distance += _matrixdistance[memo[memo.Count - 1], _arraytoindex[_desid]];
                    memo.Add(_arraytoindex[_desid]);
                    AnsMemory.Add((memo.ToArray(), distance));
                }
                //step 2 Pheromone Evaporation
                Parallel.For(0, clone_phenom.GetLength(0), i =>
                {
                    for (int j = 0; j < clone_phenom.GetLength(1); j++)
                    {
                        clone_phenom[i, j] -= evaporationrate;
                    }
                });

                //step 3 Pheromone Deposition
                for (int i = 0; i < AnsMemory.Count; i++)
                {
                    (int[], double) AntExperiment = AnsMemory[i];
                    double deltaphemon = q / AntExperiment.Item2;
                    for (int j = 1; j < AntExperiment.Item1.Length; j++)
                    {
                        int row = AntExperiment.Item1[j - 1];
                        int col = AntExperiment.Item1[j];
                        clone_phenom[row, col] = clone_phenom[row, col] + deltaphemon;
                    }
                }
            }

            stopwatch.Stop();

            // Get the elapsed time as a TimeSpan value
            TimeSpan ts = stopwatch.Elapsed;

            // Format and display the elapsed time
            string elapsedTime = System.String.Format("{0:00}:{1:00}:{2:00}.{3:00}",
                ts.Hours, ts.Minutes, ts.Seconds, ts.Milliseconds / 10);
            return clone_phenom;

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

            // Extract the row using slicing
            NDArray row = npArray[rowIndex, ":"];

            // Convert the NDArray row to a double array
            return row.ToArray<double>();
        }
        //input is list node and list proba of each item return random node
        private (int item, int index) GetRandomNodeByProbaDistribution(int[] items, double[] probabilities)
        {
            // Generate a random number between 0 and 1
            Random random = new Random();
            double randomNumber = random.NextDouble();

            // Initialize cumulative probability
            double cumulativeProbability = 0.0;

            // Iterate through items and their probabilities
            for (int i = 0; i < items.Length; i++)
            {
                cumulativeProbability += probabilities[i];

                // Check if the random number falls within the current cumulative probability
                if (randomNumber < cumulativeProbability)
                {
                    return (items[i], i); // Return a tuple containing the lucky item and its index
                }
            }

            return (-1, -1); // Default return if no item is found (should not happen ideally)
        }
        private double[] getProbaDistributionOfRow(double[] rowsHeuristicmatrix, double[] phemon, List<int> memo, float alpha, float beta)
        {
            List<double> result = new List<double>();
            double sumeven = 0;
            bool validValuesExist = false;
            Dictionary<int,double> values = new Dictionary<int, double>();
            // Calculate sum of even
            for (int i = 0; i < rowsHeuristicmatrix.Length; i++)
            {
                if (!memo.Contains(i))
                {
                    double value = Math.Pow(rowsHeuristicmatrix[i], beta) * Math.Pow(phemon[i], alpha);
                    values[i]= value;
                    if (!double.IsNaN(value)) // Check for NaN values
                    {
                        sumeven += value;
                        validValuesExist = true; // Flag to indicate at least one valid value exists
                    }
                }
            }

            // If no valid values exist, return an array of zeros
            if (!validValuesExist)
            {
                return Enumerable.Repeat(0.0, rowsHeuristicmatrix.Length).ToArray();
            }

            // Calculate probabilities
            for (int i = 0; i < rowsHeuristicmatrix.Length; i++)
            {
                if (!memo.Contains(i))
                {
                    double P = (values[i]) / sumeven;
                    if (double.IsNaN(P)) // Handle division by zero (NaN)
                    {
                        result.Add(0);
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
