using Microsoft.AspNetCore.Mvc;

namespace GarbageMonitorSystem.Controllers
{
    public class LoginController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
