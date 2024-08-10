using GarbageMonitorSystem.Interface;
using NumSharp;
using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;

namespace GarbageMonitorSystem.Common.RouteMethod
{
    public class AntColonyRoute : IRoute
    {
        private Dictionary<string, double> memo = new Dictionary<string, double>();
        private Dictionary<string, int> count = new Dictionary<string, int>();
        private Dictionary<string, string> memopath = new Dictionary<string, string>();
        
        private List<int> _indexList;
        private double[,] _matrixdistance;
        private double[,] _heuristicmatrix;
        private double[,] _phemon;
        private int[] _itemlist;
        private string _ids;
        private bool _isbacktosrc;
        private double _evaporationrate;
        private int _q;
        private int _numants;
        private int _episode;
        
        private int _alpha; // mức độ phụ thuộc vào khoảng cách
        private int _beta;  // mức độ phụ thuộc vào phemon
        public  AntColonyRoute(double[,] matrixdistance, string ids, double initphemon=0f,double evaporationrate=0.09f,int q=1,int numants=100,int episode=5,int alpha=2,int beta=4)
        {

            _itemlist = ids.Split(',').Select(int.Parse).ToArray();            
            _indexList = Enumerable.Range(0, _itemlist.GetLength(0)).ToList();
            _matrixdistance = matrixdistance;
            _phemon = GeneratePhemonMatrix(matrixdistance,0.2f);
            _heuristicmatrix = HeuristicmatrixCalculator(matrixdistance);
            _evaporationrate = evaporationrate;
            _ids = ids;
            _q = q;
            _numants = numants;
            _episode= episode;
            _alpha = alpha;
            _beta = beta;
         }

        public bool IsbackToSrc { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }

        public (List<int>, double) SortingDistance()
        {
            RoutingOptimize();
            List<int> indexs= new List<int>();
            bool isinit = false;
            int nextindex = 0;
            double distancetotal = 0;
            for (int i = 0; i < _indexList.Count; i++)
            {
                if (!isinit)
                {
                    indexs.Add(0);
                    nextindex=GetIndexHightestPhemonByRow(0, indexs.ToArray());
                    isinit = true;
                }
                else
                {
                    indexs.Add(nextindex);
                    var return_nextindex = GetIndexHightestPhemonByRow(nextindex, indexs.ToArray());
                    distancetotal += _matrixdistance[nextindex, return_nextindex];
                    nextindex = return_nextindex;
                }

            }
            int[] index = Enumerable.Range(0, this._ids.Split(',').Length).ToArray();
            int[] id = this._ids.Split(',').Select(int.Parse).ToArray();
            Dictionary<int, int> indextoid = Distance.CreateMap(index, id);
            List<int> sort = new List<int>();
            foreach (int ele in indexs)
            {
                sort.Add(indextoid[ele]);
            }

            return (sort, (distancetotal/1000));
        }


        private void RoutingOptimize()
        {
            for (int i = 0; i < _episode; i++)
            {
                AntsExploit(_indexList.ToArray(), _itemlist, _evaporationrate, _q, _numants, _alpha, _beta);
            }
        }

        private void AntsExploit(int[] indexList,int[] itemlist,double evaporationrate,int q,int numants,int alpha, int beta)
        {
            
            //step1 Ant Route Random
            Random random = new Random();
            for(int e=0; e < numants;e++)
            {
                List<(int[], double)> AnsMemory = new List<(int[], double)>();
                for (int j = 0; j < numants; j++)
                {
                    double distance = 0;
                    List<int> memo = new List<int>();
                    int randomIndex;
                    randomIndex = indexList[random.Next(indexList.Length)];
                    memo.Add(randomIndex);
                    //step1 Routing All Node 
                    for (int i = 0; i < indexList.Length - 1; i++)
                    {

                        double[] pro = getProbaDistributionOfRow(GetRow(_heuristicmatrix, randomIndex), GetRow(_phemon, randomIndex), memo, alpha, beta);
                        (int id, int index) = GetRandomNodeByProbaDistribution(itemlist, pro);
                        memo.Add(index);
                        randomIndex = index;
                        int row = memo[memo.Count - 2];
                        int col = memo[memo.Count - 1];
                        distance += _matrixdistance[row, col];
                    }
                    //step2 Update Phemom
                    AnsMemory.Add((memo.ToArray(), distance));
                }
                //step 2 Pheromone Evaporation
                for (int i = 0; i < _phemon.GetLength(0); i++)
                {
                    for (int j = 0; j < _phemon.GetLength(1); j++)
                    {
                        _phemon[i, j] -= evaporationrate;
                    }
                }

                //step 3 Pheromone Deposition
                for (int i = 0; i < AnsMemory.Count; i++)
                {
                    (int[], double) AntExperiment = AnsMemory[i];
                    double deltaphemon = q / AntExperiment.Item2;
                    for (int j = 1; j < AntExperiment.Item1.Length; j++)
                    {
                        int row = AntExperiment.Item1[j - 1];
                        int col = AntExperiment.Item1[j];
                        _phemon[row, col] = _phemon[row, col] + deltaphemon;
                    }
                }
            }
           
        }

        private double[] getProbaDistributionOfRow(double[] rowsHeuristicmatrix, double[] phemon, List<int> memo, int alpha, int beta)
        {
            List<double> result = new List<double>();
            double sumeven = 0;
            bool validValuesExist = false;

            // Calculate sum of even
            for (int i = 0; i < rowsHeuristicmatrix.Length; i++)
            {
                if (!memo.Contains(i))
                {
                    double value = Math.Pow(rowsHeuristicmatrix[i], alpha) * Math.Pow(phemon[i], beta);
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
                    double P = (Math.Pow(rowsHeuristicmatrix[i], alpha) * Math.Pow(phemon[i], beta)) / sumeven;
                    if (double.IsNaN(P)) // Handle division by zero (NaN)
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


        private int GetIndexHightestPhemonByRow(int rowindex, int[] memoryindex)
        {
           double[] row= GetRow(_phemon,rowindex);
            for(int i = 0; i < row.Length; i++)
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
        private double[,] GeneratePhemonMatrix(double[,] matrixdistance,double initphemon = 0.02f)
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
        private double[,] HeuristicmatrixCalculator(double[,] matrixdistance)
        {
            var length = matrixdistance.GetLength(0);

            double[,] heuristicmatrix= new double[length, length];
            for (int i = 0; i < length; i++)
            {
                for (int j = 0; j < length; j++)
                {
                    heuristicmatrix[i, j] = 1.0f / matrixdistance[i, j];
                }
            }
            return heuristicmatrix;
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
    }
}
