using System;

namespace URMS.WinUI.Navigation
{
    public interface INavigationService
    {
        void Initialize(Microsoft.UI.Xaml.Controls.Frame frame);
        bool Navigate(Type pageType, object? parameter = null);
    }
}
