import { useTab } from "@context/TabContext";
import {
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  EmojiEvents as TrophyIcon,
  AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import { Tooltip } from "@mui/material";

const Sidebar = () => {
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
    <div className="hidden fixed left-0 top-0 z-[1000] h-screen w-[72px] flex-col items-center border-r border-gray-200 bg-white py-2 md:flex">
      {/* Logo */}
      <div className="mb-12 flex h-10 w-10 items-center justify-center rounded-lg bg-black text-xl font-bold text-white">
        B
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-1 flex-col gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Tooltip key={tab.id} title={tab.label} placement="right">
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? "bg-black text-white hover:bg-black"
                      : "bg-transparent text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                <Icon />
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Profile Avatar */}
      <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-700">
        U
      </div>
    </div>
  );
};

export default Sidebar;
