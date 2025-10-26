import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { height, width } = Dimensions.get("window");

export default function ApplyLeave() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [leaveType, setLeaveType] = useState("Earned_Leave");
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [reason, setReason] = useState("");
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userLoading, setUserLoading] = useState(true);

    // Load user data on mount
    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                setUser(JSON.parse(userData));
            } else {
                Alert.alert('Error', 'User data not found. Please login again.');
                router.replace('/(auth)/sign-in');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            Alert.alert('Error', 'Failed to load user data');
        } finally {
            setUserLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert("Error", "Please provide a reason for leave");
            return;
        }

        if (endDate < startDate) {
            Alert.alert("Error", "End date cannot be before start date");
            return;
        }

        if (!user?.email) {
            Alert.alert("Error", "User email not found. Please login again.");
            return;
        }

        try {
            setLoading(true);

            const token = await AsyncStorage.getItem('authToken');

            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_URL}/users/leave/apply`,
                {
                    email: user.email,
                    department: user.department,
                    leaveType,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    reason,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            Alert.alert("Success", "Leave request submitted successfully", [
                { text: "OK", onPress: () => {
                        resetForm();
                        router.back();
                    }},
            ]);
        } catch (error: any) {
            console.error('Error submitting leave:', error);

            if (error.response?.status === 401) {
                Alert.alert("Session Expired", "Please login again", [
                    { text: "OK", onPress: () => router.replace('/(auth)/sign-in') }
                ]);
            } else {
                Alert.alert(
                    "Error",
                    error.response?.data?.message || "Failed to submit leave request"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setLeaveType("annual");
        setStartDate(new Date());
        setEndDate(new Date());
        setReason("");
    };

    // Show loading while fetching user data
    if (userLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Apply for Leave</Text>
                <Text style={styles.subtitle}>
                    Fill in the details below to submit your leave request
                </Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Leave Type</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={leaveType}
                            onValueChange={setLeaveType}
                            style={styles.picker}
                            enabled={!loading}
                        >
                            <Picker.Item label="Earned Leave" value="Earned_Leave" />
<Picker.Item label="Reserved Leave" value="Reserved_Leave" />
<Picker.Item label="Casual Leave" value="Casual_Leave" />
                            <Picker.Item label="Sick Leave" value="Sick_Leave" />
<Picker.Item label="Paid Leave" value="Paid_Leave" />

                        </Picker>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Start Date</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowStartPicker(true)}
                        disabled={loading}
                    >
                        <Text style={styles.dateButtonText}>
                            {startDate.toDateString()}
                        </Text>
                    </TouchableOpacity>
                    {showStartPicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            display="default"
                            minimumDate={new Date()}
                            onChange={(event, date) => {
                                setShowStartPicker(Platform.OS === "ios");
                                if (date) setStartDate(date);
                            }}
                        />
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>End Date</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowEndPicker(true)}
                        disabled={loading}
                    >
                        <Text style={styles.dateButtonText}>
                            {endDate.toDateString()}
                        </Text>
                    </TouchableOpacity>
                    {showEndPicker && (
                        <DateTimePicker
                            value={endDate}
                            mode="date"
                            display="default"
                            minimumDate={startDate}
                            onChange={(event, date) => {
                                setShowEndPicker(Platform.OS === "ios");
                                if (date) setEndDate(date);
                            }}
                        />
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Reason</Text>
                    <TextInput
                        style={styles.textArea}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Please provide a reason for your leave"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        editable={!loading}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Request</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => router.back()}
                    disabled={loading}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f3f4f6",
        marginTop: height * 0.05,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#f3f4f6",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#6b7280",
    },
    header: {
        backgroundColor: "#fff",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: "#6b7280",
    },
    form: {
        backgroundColor: "#fff",
        margin: 20,
        padding: 20,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        backgroundColor: "#f9fafb",
    },
    picker: {
        height: 50,
    },
    dateButton: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        padding: 15,
        backgroundColor: "#f9fafb",
    },
    dateButtonText: {
        fontSize: 16,
        color: "#374151",
    },
    textArea: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        padding: 15,
        backgroundColor: "#f9fafb",
        minHeight: 100,
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: "#2563eb",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
    },
    disabledButton: {
        backgroundColor: "#9ca3af",
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    cancelButton: {
        backgroundColor: "transparent",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#d1d5db",
    },
    cancelButtonText: {
        color: "#6b7280",
        fontSize: 16,
        fontWeight: "600",
    },
});