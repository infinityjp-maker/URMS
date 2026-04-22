using Microsoft.UI.Xaml;
using Microsoft.Extensions.DependencyInjection;
using System;
using URMS.WinUI.Services;
using URMS.WinUI.Navigation;
using URMS.WinUI.ViewModels;

namespace URMS.WinUI
{
    public partial class App : Application
    {
        public IServiceProvider Services { get; private set; } = null!;

        public App()
        {
            this.InitializeComponent();

            var services = new ServiceCollection();
            // Register services and viewmodels (minimal, non-invasive)
            services.AddSingleton<IExampleService, ExampleService>();
            services.AddSingleton<MainViewModel>();
            services.AddSingleton<INavigationService, Navigation.NavigationService>();

            Services = services.BuildServiceProvider();
        }

        protected override void OnLaunched(Microsoft.UI.Xaml.LaunchActivatedEventArgs args)
        {
            var window = new MainWindow();
            window.Activate();
        }
    }
}
