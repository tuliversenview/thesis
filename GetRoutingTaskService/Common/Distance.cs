 
using Newtonsoft.Json;
using System;
using TSPservice.models;

namespace TSPservice.Common
{
    public class Distance
    {
     
        public static double[,] GetDistanceMatrixSQL(string ids,List<GarbageDistance> garbages)
        {
            int[] index = Enumerable.Range(0, ids.Split(',').Length).ToArray();
            int[] array = ids.Split(',').Select(int.Parse).ToArray();
            Dictionary<int, int> arraytoindex = CreateMap(array, index);
            double[,] array2D = new double[ids.Split(',').Length, ids.Split(',').Length];
            for (int i = 0; i < garbages.Count; i++)
            {
                int from = garbages[i].FromGarbagePointID;
                int to = garbages[i].ToGarbagePointID;
                int from_index = arraytoindex[from];
                int to_index = arraytoindex[to];
                array2D[from_index, to_index] = garbages[i].Distance;
            }
            return array2D;
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
    }
}



