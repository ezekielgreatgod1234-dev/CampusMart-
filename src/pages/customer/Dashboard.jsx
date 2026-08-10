import CustomerLayout from "../../layouts/CustomerLayout";

import Greeting from "../../components/dashboard/Greeting";
import HeroBanner from "../../components/dashboard/HeroBanner";
import StatsCards from "../../components/dashboard/StatsCards";
import Categories from "../../components/dashboard/Categories";
import RecommendedProducts from "../../components/dashboard/RecommendedProducts";


import OrderSummary from "../../components/dashboard/rightSideBar/OrderSummary";
import RecentMessages from "../../components/dashboard/rightSideBar/RecentMessages";
import FlashSales from "../../components/dashboard/rightSideBar/FlashSales";

function Dashboard({ cartCount }) {
  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Main Content */}
        <div className="xl:col-span-9 space-y-6">

          <Greeting />

          <HeroBanner />

          <StatsCards cartCount={cartCount} />

          <Categories />

          <RecommendedProducts />


        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-3 space-y-6">

          <OrderSummary />

          <RecentMessages />

          <FlashSales />

        </div>

      </div>
    </CustomerLayout>
  );
}

export default Dashboard;