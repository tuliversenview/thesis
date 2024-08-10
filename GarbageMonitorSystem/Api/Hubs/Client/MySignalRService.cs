using Microsoft.AspNetCore.SignalR.Client;
using System;
using System.Threading.Tasks;

public interface IMySignalRService
{
    Task StartConnectionAsync();
    Task SendMessageToHubAsync(string key, string data);
}

public class MySignalRService : IMySignalRService
{
    private readonly HubConnection _hubConnection;

    public MySignalRService()
    {
        // URL of your SignalR hub
        var hubUrl = "http://wastemanager.ddns.net:5000/api/hubs/DashBoardHub"; // Adjust URL as per your setup

        // Create connection to the hub
        _hubConnection = new HubConnectionBuilder()
            .WithUrl(hubUrl)
            .Build();

        // Start the connection
        StartConnectionAsync().Wait(); // Waiting synchronously for demo purposes
    }

    public async Task StartConnectionAsync()
    {
        try
        {
            await _hubConnection.StartAsync();
            Console.WriteLine("SignalR connection started");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error starting SignalR connection: {ex.Message}");
        }
    }

    public async Task SendMessageToHubAsync(string key, string data)
    {
        try
        {
            await _hubConnection.InvokeAsync("SendMessage", key, data);
            Console.WriteLine($"Sent message with key '{key}' and data '{data}' to hub.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending message to hub: {ex.Message}");
        }
    }
}
