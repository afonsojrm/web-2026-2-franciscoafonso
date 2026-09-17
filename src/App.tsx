import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Module Pages
import { LoginPage } from './modules/auth/LoginPage';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { TutorsPage } from './modules/core/TutorsPage';
import { PetsPage } from './modules/core/PetsPage';
import { ClinicPage } from './modules/clinic/ClinicPage';
import { ShopPage } from './modules/shop/ShopPage';
import { HotelPage } from './modules/hotel/HotelPage';
import { DaycarePage } from './modules/daycare/DaycarePage';
import { FinancePage } from './modules/finance/FinancePage';
import { AuditPage } from './modules/audit/AuditPage';
import { ClientBookingsPage } from './modules/scheduling/ClientBookingsPage';

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Management Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/tutores" element={<TutorsPage />} />
                      <Route path="/pets" element={<PetsPage />} />
                      <Route path="/agendamentos" element={<ClientBookingsPage />} />
                      <Route path="/clinica" element={<ClinicPage />} />
                      <Route path="/shop" element={<ShopPage />} />
                      <Route path="/hotel" element={<HotelPage />} />
                      <Route path="/creche" element={<DaycarePage />} />
                      <Route path="/financeiro" element={<FinancePage />} />
                      <Route path="/auditoria" element={<AuditPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
