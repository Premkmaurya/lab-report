import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { AppRoutes } from "./routes/AppRoutes";
import { OfflineFallback } from "./components/OfflineFallback";
import { PrintTemplateProvider } from "./context/PrintTemplateContext";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PrintTemplateProvider>
          <Router>
            <AppRoutes />
            <OfflineFallback />
            <Toaster position="top-right" richColors closeButton />
          </Router>
        </PrintTemplateProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
export default App;
