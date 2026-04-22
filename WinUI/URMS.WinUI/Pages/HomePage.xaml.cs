using Microsoft.UI.Xaml.Controls;
using Microsoft.Extensions.DependencyInjection;
using URMS.WinUI.ViewModels;

namespace URMS.WinUI.Pages
{
    public sealed partial class HomePage : Page
    {
        public HomePage()
        {
            this.InitializeComponent();

            // Attach viewmodel from DI
            var app = Microsoft.UI.Xaml.Application.Current as URMS.WinUI.App;
            if (app?.Services is IServiceProvider sp)
            {
                var vm = sp.GetRequiredService<MainViewModel>();
                this.DataContext = vm;
            }
        }
    }
}
