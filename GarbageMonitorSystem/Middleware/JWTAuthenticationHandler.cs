using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;

namespace GarbageMonitorSystem.Middleware
{
    public class JWTAuthenticationHandler
    {
        private readonly RequestDelegate _next;
        public IAuthenticationSchemeProvider Schemes { get; set; }
        public JWTAuthenticationHandler(RequestDelegate next, IAuthenticationSchemeProvider schemes)
        {
            _next = next;
            Schemes = schemes;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            context.Features.Set<IAuthenticationFeature>(new AuthenticationFeature
            {
                OriginalPath = context.Request.Path,
                OriginalPathBase = context.Request.PathBase
            });

            // Give any IAuthenticationRequestHandler schemes a chance to handle the request
            var handlers = context.RequestServices.GetRequiredService<IAuthenticationHandlerProvider>();
            foreach (var scheme in await Schemes.GetRequestHandlerSchemesAsync())
            {
                var handler = await handlers.GetHandlerAsync(context, scheme.Name) as IAuthenticationRequestHandler;
                if (handler != null && await handler.HandleRequestAsync())
                {
                    return;
                }
            }

            var defaultAuthenticate = await Schemes.GetDefaultAuthenticateSchemeAsync();
            if (defaultAuthenticate != null)
            {
                var result = await context.AuthenticateAsync(defaultAuthenticate.Name);
                if (result?.Principal != null)
                {
                    context.User = result.Principal;
                }
                if (context.Request.Path.StartsWithSegments("/api") 
                    && context.Request.Path.StartsWithSegments("/api/user") == false 
                    && context.Request.Path.StartsWithSegments("/api/iot") == false
                    && context.Request.Path.StartsWithSegments("/api/hubs") == false
                    && context.Request.Path.StartsWithSegments("/api/mobile") == false )
                {
                    if (context.User.Identities.FirstOrDefault().IsAuthenticated == false)
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return;
                    }
                    // Return an "Unauthorized" response

                }
            }
            await _next(context);
        }
    }
}
