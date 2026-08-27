import { Outlet, useLocation } from "react-router-dom";
import {
  FinMarketingMobileBar,
  FinMarketingSidebar,
} from "@/components/marketing/fin/FinMarketingShell";
import { FinMarketingFooter } from "@/components/marketing/fin/FinMarketingFooter";
import { PageEnter } from "@/components/motion/Motion";

export function MarketingLayout() {
  const location = useLocation();

  return (
    <div className="fin-marketing flex min-h-dvh w-full min-w-0 flex-col overflow-x-clip lg:flex-row">
      <FinMarketingSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <FinMarketingMobileBar />
        <main className="fin-page-content flex-1 px-4 py-5 safe-area-x sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <PageEnter key={location.pathname}>
            <Outlet />
          </PageEnter>
        </main>
        <FinMarketingFooter />
      </div>
    </div>
  );
}
