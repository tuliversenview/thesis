using Microsoft.AspNetCore.Mvc;

namespace GarbageMonitorSystem.Controllers
{
    [Route("category/[controller]")]
    public class UserManagerController : Controller
    {
        public IActionResult Index()
        {
            return View("~/Views/Category/UserManager/Index.cshtml");
        }
    }
}
