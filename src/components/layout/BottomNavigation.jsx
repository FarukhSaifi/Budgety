import { useTab } from "@context/TabContext";
import {
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  EmojiEvents as TrophyIcon,
  AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";

const BottomNavigation = () => {
  const { activeTab, setActiveTab } = useTab();

  const tabs = [
    { id: "overview", icon: DashboardIcon, label: "Dashboard" },
    { id: "transactions", icon: ReceiptIcon, label: "Transactions" },
    { id: "budgets", icon: WalletIcon, label: "Budgets" },
    { id: "bills", icon: CalendarIcon, label: "Bills" },
    { id: "reports", icon: AssessmentIcon, label: "Reports" },
    { id: "goals", icon: TrophyIcon, label: "Goals" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] flex h-16 items-center justify-around border-t border-gray-200 bg-white shadow-lg md:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex flex-1 flex-col items-center justify-center gap-1 transition-colors
              ${isActive ? "text-black" : "text-gray-500"}
            `}
            aria-label={tab.label}
          >
            <Icon
              className={`h-6 w-6 ${
                isActive ? "scale-110" : ""
              } transition-transform`}
            />
            <span
              className={`text-[10px] font-medium ${
                isActive ? "font-semibold" : ""
              }`}
            >
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute top-0 h-1 w-12 rounded-b-full bg-black" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BottomNavigation;
