import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '../components/AppShell.js';
import { AuditLogPage } from '../features/audit/AuditLogPage.js';
import { DashboardPage } from '../features/dashboard/DashboardPage.js';
import { KnowledgePage } from '../features/knowledge/KnowledgePage.js';
import { ResourceDetailPage } from '../features/resources/ResourceDetailPage.js';
import { ResourceFormPage } from '../features/resources/ResourceFormPage.js';
import { ResourceListPage } from '../features/resources/ResourceListPage.js';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="resources" element={<ResourceListPage />} />
        <Route path="resources/new" element={<ResourceFormPage mode="create" />} />
        <Route path="resources/:type/:id" element={<ResourceDetailPage />} />
        <Route path="resources/:type/:id/edit" element={<ResourceFormPage mode="edit" />} />
        <Route path="audit" element={<AuditLogPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
