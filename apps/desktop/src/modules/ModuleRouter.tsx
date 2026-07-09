import { CalendarMonthlyPage } from './calendar/CalendarMonthlyPage.js';
import { CalendarEventDetailPage } from './calendar/CalendarEventDetailPage.js';
import { DocumentViewPage } from './knowledge/DocumentViewPage.js';
import { OperationsDetailPage } from './operations/OperationsDetailPage.js';
import { OperationsListPage } from './operations/OperationsListPage.js';
import { TransportDeparturePage } from './transport/TransportDeparturePage.js';
import { TransportRoutePage } from './transport/TransportRoutePage.js';
import { WeatherDetailPage } from './weather/WeatherDetailPage.js';
import { ModuleStubPage } from './ModuleStubPage.js';

type Props = {
  readonly screenId: string;
};

export function ModuleRouter({ screenId }: Props) {
  if (screenId === 'M-WEA-DET') {
    return <WeatherDetailPage />;
  }

  if (screenId === 'M-CAL-MON') {
    return <CalendarMonthlyPage />;
  }

  if (screenId === 'M-CAL-DET') {
    return <CalendarEventDetailPage />;
  }

  if (screenId === 'M-TRN-DEP') {
    return <TransportDeparturePage />;
  }

  if (screenId === 'M-TRN-ROUTE') {
    return <TransportRoutePage />;
  }

  if (screenId === 'M-OPS-LST') {
    return <OperationsListPage />;
  }

  if (screenId === 'M-OPS-DET') {
    return <OperationsDetailPage />;
  }

  if (screenId === 'M-DOC-VIEW') {
    return <DocumentViewPage />;
  }

  if (screenId === 'D-02') {
    return (
      <ModuleStubPage screenId={screenId} />
    );
  }

  if (screenId.startsWith('M-') || screenId.startsWith('D-0')) {
    return <ModuleStubPage screenId={screenId} />;
  }

  return <ModuleStubPage screenId={screenId} />;
}
