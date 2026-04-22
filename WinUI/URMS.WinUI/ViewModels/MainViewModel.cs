using URMS.WinUI.Services;

namespace URMS.WinUI.ViewModels
{
    public class MainViewModel : BaseViewModel
    {
        private readonly IExampleService _service;

        public MainViewModel(IExampleService service)
        {
            _service = service;
            Message = _service.GetMessage();
        }

        private string _message = string.Empty;
        public string Message
        {
            get => _message;
            set
            {
                if (_message == value) return;
                _message = value;
                RaisePropertyChanged();
            }
        }
    }
}
