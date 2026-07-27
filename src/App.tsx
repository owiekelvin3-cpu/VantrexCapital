import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute, AdminRoute, AdminProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";

const HomePage = lazy(() => import("@/pages/marketing/HomePage"));
const AboutPage = lazy(() => import("@/pages/marketing/AboutPage"));
const ServicesPage = lazy(() => import("@/pages/marketing/ServicesPage"));
const ServiceDetailPage = lazy(() => import("@/pages/marketing/ServiceDetailPage"));
const ReviewsPage = lazy(() => import("@/pages/marketing/ReviewsPage"));
const FAQsPage = lazy(() => import("@/pages/marketing/FAQsPage"));
const PayoutsPage = lazy(() => import("@/pages/marketing/PayoutsPage"));
const SecurityPage = lazy(() => import("@/pages/marketing/SecurityPage"));
const TradingSignalsPage = lazy(() => import("@/pages/marketing/TradingSignalsPage"));
const HoldingsPage = lazy(() => import("@/pages/marketing/HoldingsPage"));
const MarketingTradingRoomPage = lazy(() => import("@/pages/marketing/TradingRoomPage"));
const WorldEconomyPage = lazy(() => import("@/pages/marketing/WorldEconomyPage"));
const EconomyTrendsPage = lazy(() => import("@/pages/marketing/EconomyTrendsPage"));
const ForexNewsPage = lazy(() => import("@/pages/marketing/ForexNewsPage"));
const BrokersPage = lazy(() => import("@/pages/marketing/BrokersPage"));
const VerifyPage = lazy(() => import("@/pages/marketing/VerifyPage"));
const PrivacyPage = lazy(() => import("@/pages/marketing/LegalPages").then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("@/pages/marketing/LegalPages").then(m => ({ default: m.TermsPage })));
const CookiesPage = lazy(() => import("@/pages/marketing/LegalPages").then(m => ({ default: m.CookiesPage })));

const AuthPage = lazy(() => import("@/pages/auth/AuthPage"));
const AdminAuthPage = lazy(() => import("@/pages/auth/AdminAuthPage"));

const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const DepositsPage = lazy(() => import("@/pages/dashboard/DepositsPage"));
const CryptoDepositPage = lazy(() => import("@/pages/dashboard/CryptoDepositPage"));
const GiftCardDepositPage = lazy(() => import("@/pages/dashboard/GiftCardDepositPage"));
const GiftCardBrandDepositPage = lazy(() => import("@/pages/dashboard/GiftCardBrandDepositPage"));
const AITradingPage = lazy(() => import("@/pages/dashboard/AITradingPage"));
const WithdrawalsPage = lazy(() => import("@/pages/dashboard/WithdrawalsPage"));
const CryptoWithdrawalPage = lazy(() => import("@/pages/dashboard/CryptoWithdrawalPage"));
const BankWithdrawalPage = lazy(() => import("@/pages/dashboard/BankWithdrawalPage"));
const WireWithdrawalPage = lazy(() => import("@/pages/dashboard/WireWithdrawalPage"));
const EwalletWithdrawalPage = lazy(() => import("@/pages/dashboard/EwalletWithdrawalPage"));
const TradesPage = lazy(() => import("@/pages/dashboard/TradesPage"));
const TransactionsPage = lazy(() => import("@/pages/dashboard/TransactionsPage"));
const NotificationsPage = lazy(() => import("@/pages/dashboard/NotificationsPage"));
const KYCPage = lazy(() => import("@/pages/dashboard/KYCPage"));
const CopyTradingPage = lazy(() => import("@/pages/dashboard/CopyTradingPage"));
const MiningPage = lazy(() => import("@/pages/dashboard/MiningPage"));
const SignalsPage = lazy(() => import("@/pages/dashboard/SignalsPage"));
const SettingsPage = lazy(() => import("@/pages/dashboard/SettingsPage"));
const DashboardTradingRoomPage = lazy(() => import("@/pages/dashboard/TradingRoomPage"));

const AdminOverviewPage = lazy(() => import("@/pages/admin/AdminOverviewPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminKYCPage = lazy(() => import("@/pages/admin/AdminKYCPage"));
const AdminDepositsPage = lazy(() => import("@/pages/admin/AdminDepositsPage"));
const AdminWithdrawalsPage = lazy(() => import("@/pages/admin/AdminWithdrawalsPage"));
const AdminFeesPage = lazy(() => import("@/pages/admin/AdminFeesPage"));
const AdminTradesPage = lazy(() => import("@/pages/admin/AdminTradesPage"));
const AdminAITradingPage = lazy(() => import("@/pages/admin/AdminAITradingPage"));
const AdminDepositConfigPage = lazy(() => import("@/pages/admin/AdminDepositConfigPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));
const AdminNotificationsPage = lazy(() => import("@/pages/admin/AdminNotificationsPage"));
const AdminEmailPage = lazy(() => import("@/pages/admin/AdminEmailPage"));
const SupportPage = lazy(() => import("@/pages/dashboard/SupportPage"));
const AdminSupportPage = lazy(() => import("@/pages/admin/AdminSupportPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PageLoader() {
  return <LoadingScreen />;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route element={<MarketingLayout />}>
                <Route index element={<HomePage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="services/:slug" element={<ServiceDetailPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="community" element={<ReviewsPage />} />
                <Route path="faqs" element={<FAQsPage />} />
                <Route path="payouts" element={<PayoutsPage />} />
                <Route path="security" element={<SecurityPage />} />
                <Route path="trading-signals" element={<TradingSignalsPage />} />
                <Route path="holdings" element={<HoldingsPage />} />
                <Route path="trading-room" element={<MarketingTradingRoomPage />} />
                <Route path="world-economy" element={<WorldEconomyPage />} />
                <Route path="world-economy/trends" element={<EconomyTrendsPage />} />
                <Route path="forex-news" element={<ForexNewsPage />} />
                <Route path="brokers" element={<BrokersPage />} />
                <Route path="verify" element={<VerifyPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="cookies" element={<CookiesPage />} />
              </Route>

              <Route path="auth" element={<AuthPage />} />
              <Route path="admin-auth" element={<AdminAuthPage />} />

              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="dashboard/deposits" element={<DepositsPage />} />
                <Route path="dashboard/deposits/crypto" element={<CryptoDepositPage />} />
                <Route path="dashboard/deposits/gift-card/:brandId" element={<GiftCardBrandDepositPage />} />
                <Route path="dashboard/deposits/gift-card" element={<GiftCardDepositPage />} />
                <Route path="dashboard/withdrawals/crypto" element={<CryptoWithdrawalPage />} />
                <Route path="dashboard/withdrawals/bank" element={<BankWithdrawalPage />} />
                <Route path="dashboard/withdrawals/wire" element={<WireWithdrawalPage />} />
                <Route path="dashboard/withdrawals/ewallet" element={<EwalletWithdrawalPage />} />
                <Route path="dashboard/withdrawals" element={<WithdrawalsPage />} />
                <Route path="dashboard/transactions" element={<TransactionsPage />} />
                <Route path="dashboard/notifications" element={<NotificationsPage />} />
                <Route path="dashboard/trades" element={<TradesPage />} />
                <Route path="dashboard/ai-trading" element={<AITradingPage />} />
                <Route path="dashboard/trading-room" element={<DashboardTradingRoomPage />} />
                <Route path="dashboard/copy-trading" element={<CopyTradingPage />} />
                <Route path="dashboard/mining" element={<MiningPage />} />
                <Route path="dashboard/signals" element={<SignalsPage />} />
                <Route path="dashboard/settings" element={<SettingsPage />} />
                <Route path="dashboard/support" element={<SupportPage />} />
                <Route path="dashboard/kyc" element={<KYCPage />} />
                <Route path="kyc" element={<KYCPage />} />
              </Route>

              <Route element={<AdminProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></AdminProtectedRoute>}>
                <Route path="dashboard/admin" element={<AdminOverviewPage />} />
                <Route path="dashboard/admin/users" element={<AdminUsersPage />} />
                <Route path="dashboard/admin/kyc" element={<AdminKYCPage />} />
                <Route path="dashboard/admin/deposits" element={<AdminDepositsPage />} />
                <Route path="dashboard/admin/deposit-config" element={<AdminDepositConfigPage />} />
                <Route path="dashboard/admin/withdrawals" element={<AdminWithdrawalsPage />} />
                <Route path="dashboard/admin/fees" element={<AdminFeesPage />} />
                <Route path="dashboard/admin/trades" element={<AdminTradesPage />} />
                <Route path="dashboard/admin/ai-trading" element={<AdminAITradingPage />} />
                <Route path="dashboard/admin/settings" element={<AdminSettingsPage />} />
                <Route path="dashboard/admin/notifications" element={<AdminNotificationsPage />} />
                <Route path="dashboard/admin/support" element={<AdminSupportPage />} />
                <Route path="dashboard/admin/email" element={<AdminEmailPage />} />
              </Route>
              </Routes>
            </Suspense>
            <PwaInstallBanner />
          </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
