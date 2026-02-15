"use client";

import AppLayout from "@components/layout/AppLayout";
import { TIMEOUTS } from "@constants";
import { BudgetProvider } from "@context/BudgetContext";
import { TabProvider } from "@context/TabContext";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { theme } from "@theme";
import { ErrorBoundary } from "@ui/ErrorBoundary";
import { ToastContainer } from "react-toastify";

export default function HomePage() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
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
        </LocalizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
