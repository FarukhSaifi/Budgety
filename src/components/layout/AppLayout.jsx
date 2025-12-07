import MainContent from "@components/MainContent";
import BottomNavigation from "./BottomNavigation";
import Header from "./Header";
import Sidebar from "./Sidebar";

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col md:ml-[72px]">
        <Header />
        <div className="flex-1 overflow-auto bg-gray-50 p-2 md:p-4 pb-20 md:pb-8">
          <MainContent />
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default AppLayout;
