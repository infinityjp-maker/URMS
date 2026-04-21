using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.Extensions.DependencyInjection;
using URMS.WinUI.Navigation;
using URMS.WinUI.ViewModels;

namespace URMS.WinUI
{
    public sealed partial class MainWindow : Window
    {
        public MainWindow()
        {
            this.InitializeComponent();

            var app = Application.Current as App;
            var services = app?.Services ?? throw new System.InvalidOperationException("Services not configured");

            // ViewModel will be attached by pages (HomePage) from DI to avoid setting DataContext on Window

            // Create Frame and register with navigation service
            var frame = new Frame();
            var nav = services.GetRequiredService<INavigationService>();
            nav.Initialize(frame);

            // add frame to root grid
            LayoutRoot.Children.Add(frame);

            // Navigate to home page
            nav.Navigate(typeof(URMS.WinUI.Pages.HomePage));
        }
    }
}
