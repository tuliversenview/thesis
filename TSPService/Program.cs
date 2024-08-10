using Microsoft.AspNetCore.Server.Kestrel.Core;
using System.Net;
using TSP_service.Services;

namespace TSP_service
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            
            // Add services to the container.
            builder.Services.AddGrpc();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            app.MapGrpcService<AntColonyService>();
            app.MapGrpcService<DynamicProgramService>();
            app.MapGrpcService<GeneticService>();
            app.MapGrpcService<NearestNeigbor>();
            app.MapGrpcService<BruteForceService>();

            app.MapGet("/", () => "Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/?linkid=2086909");

            app.Run();
        }
    }
}