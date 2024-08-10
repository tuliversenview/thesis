using GarbageMonitorSystem.Interface;
using System;

namespace GarbageMonitorSystem.Common.RouteMethod
{
    public class NearestNeighborRoute : IRoute
    {
         bool IRoute.IsbackToSrc { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }
        private double[,] _matrixdistance;
        private int[] _masks;
        private string _ids;
        public NearestNeighborRoute(double[,] matrixdistance,string ids)
        {
            this._matrixdistance = matrixdistance;
            this._masks = InitMask();
            this._ids = ids;
        }
        
        public (List<int>, double) SortingDistance()
        {
            int[] index = Enumerable.Range(0, this._ids.Split(',').Length).ToArray();
            int[] id = this._ids.Split(',').Select(int.Parse).ToArray();
            Dictionary<int, int> indextoarray = Distance.CreateMap(index, id);
            List<int> list = new List<int>() { 0 };  
            int currentnodeindex = 0;
            double distance = 0;
            _masks[0] = 1;
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
                sort.Add(indextoarray[ele]);
            }

            return (sort, distance/1000);
        }

        #region create masks to store visit index
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
        #endregion
    }
}
