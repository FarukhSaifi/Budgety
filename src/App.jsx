import AppLayout from "@components/layout/AppLayout";
import { TIMEOUTS } from "@constants";
import { BudgetProvider } from "@context/BudgetContext";
import { TabProvider } from "@context/TabContext";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@theme";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BudgetProvider>
        <TabProvider>
          <AppLayout />
          <ToastContainer
            position="top-right"
            autoClose={TIMEOUTS.TOAST_SUCCESS}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </TabProvider>
      </BudgetProvider>
    </ThemeProvider>
  );
};

export default App;
