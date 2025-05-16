import React from "react";
import { AuthModalProvider } from "./providers/AuthModalProvider";
import { AuthModal } from "./AuthModal";

export default function AuthModalIsland() {
  return (
    <AuthModalProvider>
      <AuthModal />
    </AuthModalProvider>
  );
}
