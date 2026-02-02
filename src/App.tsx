import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Landing from "./pages/Landing";
import PublicRegistration from "./pages/PublicRegistration";
import ActivateAccount from "./pages/ActivateAccount";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminGraduation from "./pages/admin/AdminGraduation";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminExpenses from "./pages/admin/AdminExpenses";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminProfessors from "./pages/admin/AdminProfessors";
import AdminModalities from "./pages/admin/AdminModalities";
import AdminAgenda from "./pages/admin/AdminAgenda";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminAcademy from "./pages/admin/AdminAcademy";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminContracts from "./pages/admin/AdminContracts";
import AdminReports from "./pages/admin/AdminReports";
import ContractSign from "./pages/ContractSign";
import StudentContracts from "./pages/student/StudentContracts";
import ProfessorStudents from "./pages/professor/ProfessorStudents";
import ProfessorAttendance from "./pages/professor/ProfessorAttendance";
import ProfessorGraduation from "./pages/professor/ProfessorGraduation";
import ProfessorSettings from "./pages/professor/ProfessorSettings";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProgress from "./pages/student/StudentProgress";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentEvolution from "./pages/student/StudentEvolution";
import StudentPayments from "./pages/student/StudentPayments";
import StudentSettings from "./pages/student/StudentSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/cadastro" element={<PublicRegistration />} />
              <Route path="/ativar-conta" element={<ActivateAccount />} />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/alunos"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminStudents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/presencas"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/graduacao"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminGraduation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/financeiro"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminFinance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/despesas"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminExpenses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/planos"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPlans />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/professores"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminProfessors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/modalidades"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminModalities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/agenda"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminAgenda />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cadastros"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminRegistrations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/academia"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminAcademy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cobrancas"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminBilling />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/contratos"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminContracts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/relatorios"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminReports />
                  </ProtectedRoute>
                }
              />

              {/* Public Contract Signing */}
              <Route path="/contrato/:token" element={<ContractSign />} />
              <Route
                path="/professor/alunos"
                element={
                  <ProtectedRoute allowedRoles={['professor']}>
                    <ProfessorStudents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/professor/presencas"
                element={
                  <ProtectedRoute allowedRoles={['professor']}>
                    <ProfessorAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/professor/graduacao"
                element={
                  <ProtectedRoute allowedRoles={['professor']}>
                    <ProfessorGraduation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/professor/configuracoes"
                element={
                  <ProtectedRoute allowedRoles={['professor']}>
                    <ProfessorSettings />
                  </ProtectedRoute>
                }
              />

              {/* Student Routes */}
              <Route
                path="/aluno/painel"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/aluno/progresso"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentProgress />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/aluno/presencas"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/aluno/evolucao"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentEvolution />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/aluno/mensalidade"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentPayments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/aluno/configuracoes"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/aluno/contratos"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentContracts />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Landing />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
