
import grpc
from concurrent import futures
from PointClustering_pb2 import  MarkersData, Coordinate, Cluster, ClusterResponse
from PointClustering_pb2_grpc import PointClusteringServicer, add_PointClusteringServicer_to_server
import json
import numpy as np
from scipy.spatial import ConvexHull
from sklearn.cluster import AgglomerativeClustering

class ClusterServicerImpl(PointClusteringServicer):
    def Clustering(self, request, context):
        
        points = [(marker.Lat, marker.Lng) for marker in request.markers]

        n_clusters = request.numCluster
        # Cluterring 
        clustering = AgglomerativeClustering(n_clusters=n_clusters, linkage='ward')
        labels = clustering.fit_predict(points)

        # Create the response

        _Clusters=[]
        for i in range(n_clusters):
            _Cluster=[]
            for j, point in enumerate(points):
                if labels[j] == i:
                    _Cluster.append((point[0],point[1]))
            _Clusters.append(_Cluster)
        print('cluster ',str(_Clusters))

        response = ClusterResponse()
        for clus_point in _Clusters:
            cluster = Cluster()
            hull_coordinates=self.createPolygon(clus_point)
            for coor in hull_coordinates:
                coordinate =Coordinate(Lat=coor['Lat'], Lng=coor['Lng'])
                cluster.coordinates.append(coordinate)
            print('cluster ',str(cluster))
            response.clusters.append(cluster)
        print(response)
      
        # Compute convex hull
        hull_coordinates=self.createPolygon(points)

        # Convert to JSON string
        hull_json = json.dumps(hull_coordinates)

        return response



    def createPolygon(selft,points,margin=0.3):
        points = np.array(points)
        hull = ConvexHull(points)
        # Extract hull coordinates
        hull_points = points[hull.vertices]
        centroid = np.mean(hull_points, axis=0)
        expanded_hull_vertices = []
        for vertex in hull_points:
            direction = vertex - centroid
            expanded_vertex = vertex + margin * direction
            expanded_hull_vertices.append(expanded_vertex)
        # Prepare response
        hull_coordinates = [{'Lat': float(point[0]), 'Lng': float(point[1])} for point in expanded_hull_vertices]
        return hull_coordinates

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    add_PointClusteringServicer_to_server(ClusterServicerImpl(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    print("Serving...")
    serve()