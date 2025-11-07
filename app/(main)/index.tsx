import React, { useEffect, useState, useCallback } from "react";
import {
    Text,
    View,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Alert,
    Platform,
    ScrollView,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import HODScreen from "@/app/(main)/HOD";
import Principal from "@/app/(main)/Principal";

const { height, width } = Dimensions.get("window");
const isSmallDevice = width < 375;
const isShortDevice = height < 700;

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_URL,
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
});

export default function Dashboard() {
    const router = useRouter();
    const { user, updateUser, logout }: any = useAuth();
    const [leaveBalance, setLeaveBalance] = useState<any>({
        Earned_Leave: 0,
        Sick_Leave: 0,
        Reserved_Leave: 0,
        Casual_Leave: 0,
        Paid_Leave: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // 🔹 Fetch user data
    const fetchData = async () => {
        if (!user?.email) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await api.post("/users/email", { email: user.email });
            const userInfo = response.data.data;
            console.log("Fetched User Info:", userInfo);

            await updateUser(userInfo);

            if (userInfo.status === "ACCEPTED") {
                setLeaveBalance({
                    Earned_Leave: userInfo.earned_leave,
                    Sick_Leave: userInfo.sick_leave,
                    Reserved_Leave: userInfo.reserved_leave,
                    Casual_Leave: userInfo.casual_leave,
                    Paid_Leave: userInfo.paid_leave,
                });
            }
        } catch (err: any) {
            console.error("Error fetching data:", err);
            setError(err.message || "Error fetching data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 🔹 Pull to refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, []);

    // 🔹 Logout Handler
    const handleLogout = () => {
        if (Platform.OS === "web") {
            const confirmed = window.confirm("Are you sure you want to logout?");
            if (confirmed) logout();
        } else {
            Alert.alert("Logout", "Are you sure you want to logout?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => await logout(),
                },
            ]);
        }
    };

    // 🔹 Color for role badges
    const getRoleColor = (role: string) => {
        switch (role) {
            case "FACULTY":
                return "#10b981";
            case "PRINCIPAL":
                return "#ef4444";
            case "HOD":
                return "#f59e0b";
            default:
                return "#6b7280";
        }
    };

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.welcomeText}>
                        Welcome back, {user?.username || "User"}!
                    </Text>
                    <Text style={styles.dateText}>
                        {new Date().toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: getRoleColor(user?.role) },
                        ]}
                    >
                        <Text style={styles.statusBadgeText}>{user?.role}</Text>
                    </View>

                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Loading / Error Handling */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Error: {error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* 🔹 Render Different Views for Roles */}
                    {user?.role === "HOD" ? (
                        <HODScreen
                          //  onRefresh={onRefresh}
                        //    refreshing={refreshing}
                        />
                    ) : user?.role === "PRINCIPAL" ? (
                        <Principal
                        //    onRefresh={onRefresh}
                          //  refreshing={refreshing}
                        />
                    ) : (
                        // Faculty view only (safe ScrollView)
                        <ScrollView
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    colors={["#2563eb"]}
                                    tintColor="#2563eb"
                                />
                            }
                            contentContainerStyle={{ flexGrow: 1 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Leave Balance Section */}
                            <View style={styles.balanceSection}>
                                <Text
                                    style={[
                                        styles.sectionTitle,
                                        { paddingHorizontal: width * 0.05 },
                                    ]}
                                >
                                    Leave Balance
                                </Text>

                                <View style={styles.balanceCards}>
                                    <View
                                        style={[
                                            styles.balanceCard,
                                            styles.halfCard,
                                            { backgroundColor: "#dbeafe" },
                                        ]}
                                    >
                                        <Ionicons
                                            name="medkit-outline"
                                            size={24}
                                            color="#2563eb"
                                        />
                                        <Text style={styles.balanceNumber}>
                                            {leaveBalance.Sick_Leave}
                                        </Text>
                                        <Text style={styles.balanceLabel}>Sick Leave</Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.balanceCard,
                                            styles.halfCard,
                                            { backgroundColor: "#fef3c7" },
                                        ]}
                                    >
                                        <Ionicons
                                            name="briefcase-outline"
                                            size={24}
                                            color="#f59e0b"
                                        />
                                        <Text style={styles.balanceNumber}>
                                            {leaveBalance.Earned_Leave}
                                        </Text>
                                        <Text style={styles.balanceLabel}>Earned Leave</Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.balanceCard,
                                            styles.halfCard,
                                            { backgroundColor: "#dcfce7" },
                                        ]}
                                    >
                                        <Ionicons
                                            name="sunny-outline"
                                            size={24}
                                            color="#16a34a"
                                        />
                                        <Text style={styles.balanceNumber}>
                                            {leaveBalance.Casual_Leave}
                                        </Text>
                                        <Text style={styles.balanceLabel}>Casual Leave</Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.balanceCard,
                                            styles.halfCard,
                                            { backgroundColor: "#fee2e2" },
                                        ]}
                                    >
                                        <Ionicons
                                            name="cash-outline"
                                            size={24}
                                            color="#dc2626"
                                        />
                                        <Text style={styles.balanceNumber}>
                                            {leaveBalance.Paid_Leave}
                                        </Text>
                                        <Text style={styles.balanceLabel}>Paid Leave</Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.balanceCard,
                                            styles.fullCard,
                                            { backgroundColor: "#f3e8ff" },
                                        ]}
                                    >
                                        <Ionicons
                                            name="lock-closed-outline"
                                            size={24}
                                            color="#8b5cf6"
                                        />
                                        <Text style={styles.balanceNumber}>
                                            {leaveBalance.Reserved_Leave}
                                        </Text>
                                        <Text style={styles.balanceLabel}>Reserved Leave</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Quick Actions */}
                            <View style={styles.quickActions}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={() => {
                                        if (user.status === "PENDING") {
                                            Alert.alert(
                                                "Account Pending",
                                                "Your account is still pending. You cannot apply for leave at this time."
                                            );
                                            return;
                                        }
                                        router.push("/(main)/apply-leave");
                                    }}
                                >
                                    <Ionicons
                                        name="add-circle-outline"
                                        size={24}
                                        color="#fff"
                                    />
                                    <Text style={styles.primaryButtonText}>
                                        Apply for Leave
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: height * 0.05,
        marginBottom: height * 0.05,
        backgroundColor: "#f3f4f6",
    },
    header: {
        backgroundColor: "#fff",
        padding: width * 0.05,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    welcomeText: {
        fontSize: height * 0.023,
        fontWeight: "bold",
        color: "#1f2937",
    },
    dateText: {
        fontSize: height * 0.016,
        color: "#6b7280",
        marginTop: height * 0.005,
    },
    statusBadge: {
        paddingHorizontal: width * 0.03,
        paddingVertical: height * 0.008,
        borderRadius: width * 0.05,
    },
    statusBadgeText: {
        color: "#fff",
        fontSize: height * 0.014,
        fontWeight: "600",
    },
    logoutButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#fee2e2",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        fontSize: height * 0.018,
        color: "#6b7280",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        fontSize: height * 0.018,
        color: "#ef4444",
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: "#2563eb",
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    balanceSection: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: height * 0.021,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 10,
    },
    balanceCards: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: width * 0.08,
    },
    balanceCard: {
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
        paddingVertical: 12,
        marginVertical: 8,
        elevation: 3,
    },
    halfCard: { width: "48%" },
    fullCard: { width: "100%" },
    balanceNumber: {
        fontSize: height * 0.038,
        fontWeight: "bold",
        color: "#1f2937",
        marginVertical: height * 0.012,
    },
    balanceLabel: {
        fontSize: height * 0.016,
        color: "#6b7280",
    },
    quickActions: {
        padding: width * 0.05,
    },
    primaryButton: {
        backgroundColor: "#2563eb",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: height * 0.02,
        borderRadius: width * 0.03,
        gap: width * 0.025,
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: height * 0.018,
        fontWeight: "bold",
    },
});
