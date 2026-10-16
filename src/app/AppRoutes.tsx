import { Navigate, Route, Routes } from 'react-router';
import { ReportPage } from '../features/report/ReportPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { TasksPage } from '../features/tasks/TasksPage';
import { Layout } from './Layout';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TasksPage />} />
        <Route path="bao-cao" element={<ReportPage />} />
        <Route path="cai-dat" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
