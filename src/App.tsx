import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { AuthProvider } from "./lib/auth";
import { FittingRoomProvider } from "@/pages/fitting-room/context";

function App() {
  const base = typeof __BASE_PATH__ !== "undefined" && __BASE_PATH__ !== "/" ? __BASE_PATH__ : undefined;

  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <BrowserRouter basename={base}>
          <FittingRoomProvider>
            <AppRoutes />
          </FittingRoomProvider>
        </BrowserRouter>
      </AuthProvider>
    </I18nextProvider>
  );
}

export default App;
