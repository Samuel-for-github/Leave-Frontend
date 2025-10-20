import {
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    StyleSheet,
    Dimensions,
    Alert,
} from "react-native";
const { height, width } = Dimensions.get("window");
import { useRouter } from "expo-router";
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import {Platform} from "react-native";

export default function Dashboard() {
    const router = useRouter();
    const { user, updateUser, logout }: any = useAuth();

    const [leaveBalance, setLeaveBalance] = useState<any>({
        annual: 0,
        sick: 0,
        personal: 0,
    });
    const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        if (!user?.email) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_URL}/users/email`,
                {
                    email: user.email,
                }
            );

            const userInfo = response.data.data;
            console.log("Fetched User Info:", userInfo);

            await updateUser(userInfo);
            if (userInfo.status === "ACCEPTED") {
                setLeaveBalance({
                    annual: 15,
                    sick: 7,
                    personal: 5,
                });
            }


            setRecentLeaves([
                {
                    id: "1",
                    type: "Annual Leave",
                    startDate: "2025-10-15",
                    endDate: "2025-10-17",
                    status: "PENDING",
                },
                {
                    id: "2",
                    type: "Sick Leave",
                    startDate: "2025-09-10",
                    endDate: "2025-09-11",
                    status: "APPROVED",
                },
            ]);
        } catch (err: any) {
            console.error('Error fetching data:', err);
            setError(err.message || "Error fetching data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
       const res =  fetchData();

    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, []);
    const handleLogout = () => {
        console.log("Logout");

        if (Platform.OS === 'web') {
            // Use browser confirm dialog on web
            const confirmed = window.confirm('Are you sure you want to logout?');
            if (confirmed) {
                logout(); // call your async logout function
            }
        } else {
            // Use native alert on mobile
            Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: async () => {
                            await logout();
                            // Navigation handled automatically
                        },
                    },
                ]
            );
        }
    };

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
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Welcome Section with Logout Button */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.welcomeText}>
                        Welcome back, {user?.username || "User"}!
                    </Text>
                    <Text style={styles.dateText}>
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: getRoleColor(user?.role) }
                    ]}>
                        <Text style={styles.statusBadgeText}>
                            {user?.role}
                        </Text>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={styles.logoutButton}
                    >
                        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>

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
                    {/* Leave Balance Cards */}
                    <View style={styles.balanceSection}>
                        <Text style={[styles.sectionTitle, { paddingHorizontal: width * 0.05 }]}>
                            Leave Balance
                        </Text>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.balanceCards}
                        >
                            <View style={[styles.balanceCard, { backgroundColor: "#dbeafe" }]}>
                                <Ionicons name="calendar" size={24} color="#2563eb" />
                                <Text style={styles.balanceNumber}>{leaveBalance.annual}</Text>
                                <Text style={styles.balanceLabel}>Annual</Text>
                            </View>
                            <View style={[styles.balanceCard, { backgroundColor: "#fef3c7" }]}>
                                <Ionicons name="medkit" size={24} color="#f59e0b" />
                                <Text style={styles.balanceNumber}>{leaveBalance.sick}</Text>
                                <Text style={styles.balanceLabel}>Sick</Text>
                            </View>
                            <View style={[styles.balanceCard, { backgroundColor: "#ede9fe" }]}>
                                <Ionicons name="person" size={24} color="#8b5cf6" />
                                <Text style={styles.balanceNumber}>{leaveBalance.personal}</Text>
                                <Text style={styles.balanceLabel}>Personal</Text>
                            </View>
                        </ScrollView>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() =>
                            {
                                if (user.status === "PENDING") {
                                    Alert.alert("Account Pending", "Your account is still pending. You cannot apply for leave at this time.");
                                    return;
                                }
                                router.push("/(main)/apply-leave")
                            }
                        }
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#fff" />
                            <Text style={styles.primaryButtonText}>Apply for Leave</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </ScrollView>
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
        paddingVertical: height * 0.06,
    },
    loadingText: {
        fontSize: height * 0.018,
        color: "#6b7280",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: height * 0.06,
    },
    errorText: {
        fontSize: height * 0.018,
        color: "#ef4444",
        marginBottom: height * 0.025,
    },
    retryButton: {
        backgroundColor: "#2563eb",
        paddingHorizontal: width * 0.05,
        paddingVertical: height * 0.012,
        borderRadius: width * 0.02,
    },
    retryButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    balanceSection: {
        marginTop: height * 0.02,
        marginRight: width * 0.025,
    },
    sectionTitle: {
        fontSize: height * 0.021,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: height * 0.018,
    },
    balanceCards: {
        paddingHorizontal: width * 0.08,
    },
    balanceCard: {
        padding: width * 0.05,
        borderRadius: width * 0.03,
        marginRight: width * 0.04,
        alignItems: "center",
        minWidth: width * 0.25,
    },
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