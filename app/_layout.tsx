import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="dark" />
            <Slot />
        </AuthProvider>
    );
}