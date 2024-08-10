using GarbageMonitorSystem.Api.Hubs;
using GarbageMonitorSystem.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Text;
namespace GarbageMonitorSystem
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddSignalR();

            var configBuilder = new ConfigurationBuilder()
                       .SetBasePath(Directory.GetCurrentDirectory())      
                       .AddJsonFile("appsettings.json");                  
            var configurationroot = configBuilder.Build();                            
            builder.Services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = configurationroot.GetSection("Redis")["ConnectionString"];
            });

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateIssuerSigningKey = false,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE3MTM2ODk1MTQsImV4cCI6MTcxNDI5NDMxNCwiaWF0IjoxNzEzNjg5NTE0fQ.EbnpdeDF_O-TlLLJvYnAos6DTJ1Cx1NlNK38a77INeQ"))
                };
            });


            builder.Services.AddScoped<IMySignalRService, MySignalRService>();
            // Add services to the container.
            builder.Services.AddControllersWithViews();

            var app = builder.Build();
            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Home/Error");
                app.UseHsts();
            }

           /* app.UseHttpsRedirection();*/
            app.UseStaticFiles();   

            app.UseMiddleware<JWTAuthenticationHandler>();


            app.UseRouting();
            app.UseAuthorization();
            app.MapHub<DashBoardHub>("api/hubs/DashBoardHub");

            app.MapControllerRoute(
                name: "default",
                pattern: "{controller=Home}/{action=Index}/{id?}");

            app.Run();
        }
    }
}
