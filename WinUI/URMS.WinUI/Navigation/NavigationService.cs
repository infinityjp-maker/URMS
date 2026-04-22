using System;

namespace URMS.WinUI.Navigation
{
    public class NavigationService : INavigationService
    {
        private Microsoft.UI.Xaml.Controls.Frame? _frame;

        public void Initialize(Microsoft.UI.Xaml.Controls.Frame frame)
        {
            _frame = frame;
        }

        public bool Navigate(Type pageType, object? parameter = null)
        {
            if (_frame == null) return false;
            return _frame.Navigate(pageType, parameter);
        }
    }
}
