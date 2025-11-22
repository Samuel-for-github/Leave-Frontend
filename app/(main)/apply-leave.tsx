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
    const [facultyList, setFacultyList] = useState([]);
    const [adjustedBy, setAdjustedBy] = useState(""); // selected value only

    const [leaveType, setLeaveType] = useState("Earned_Leave");
    const [classOrLab, setClassOrLab] =  useState("CR-7");
    const [theoryOrPractical, setTheoryOrPractical] = useState("THEORY")
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [date, setDate] = useState(new Date());
    const [reason, setReason] = useState("");
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userLoading, setUserLoading] = useState(true);

    const [fromTime, setFromTime] = useState(new Date());
    const [showFromTimePicker, setShowFromTimePicker] = useState(false);

    const [toTime, setToTime] = useState(new Date());
    const [showToTimePicker, setShowToTimePicker] = useState(false);
// Run only once → load user
    useEffect(() => {
        loadUserData();
    }, []);

// Run when user is loaded
    useEffect(() => {
        if (user?.department) {
            loadFacultyData();
        }
    }, [user]);

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

    const loadFacultyData = async () => {
        try {
            console.log("apply leave: ", user.department);

            const facultyRes = await axios.get(`${process.env.EXPO_PUBLIC_URL}/users/department/${user.department}`);

            // Use facultyRes.data if needed
            console.log("faculty data:", facultyRes.data.data);
            setFacultyList(facultyRes.data.data);

        } catch (error: any) {
            console.error('Error loading faculty data:', error.message);
            Alert.alert('Error', 'Failed to load faculty data');
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
                    username: user.username,
                    role: user.role,
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
        setLeaveType("Earned_Leave");
        setStartDate(new Date());
        setEndDate(new Date());
        setDate(new Date())
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


                <View style={styles.loadContainer}>
                    <Text style={styles.loadText}>Load Adjustment</Text>
                    <Text style={styles.loadSubText}>(Lecture & Practicals)</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                        disabled={loading}
                    >
                        <Text style={styles.dateButtonText}>
                            {date.toDateString()}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            minimumDate={new Date()}
                            onChange={(event, date) => {
                                setShowDatePicker(Platform.OS === "ios");
                                if (date) setDate(date);
                            }}
                        />
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Class/Lab</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={classOrLab}
                            onValueChange={setClassOrLab}
                            style={styles.picker}
                            enabled={!loading}
                        >
                            <Picker.Item label="CR-3" value="CR-3" />
                            <Picker.Item label="CR-4" value="CR-4" />
                            <Picker.Item label="CR-5" value="CR-5" />
                            <Picker.Item label="CR-6" value="CR-6" />
                            <Picker.Item label="CR-7" value="CR-7" />
                            <Picker.Item label="CR-8" value="CR-8" />
                            <Picker.Item label="I1-LAB" value="I1-LAB" />
                            <Picker.Item label="I2-LAB" value="I2-LAB" />

                        </Picker>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Theory or Practical</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={theoryOrPractical}
                            onValueChange={setTheoryOrPractical}
                            style={styles.picker}
                            enabled={!loading}
                        >
                            <Picker.Item label="Theory" value="THEORY" />
                            <Picker.Item label="Practical" value="PRACTICAL" />
                        </Picker>
                    </View>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>From Time</Text>

                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowFromTimePicker(true)}
                        disabled={loading}
                    >
                        <Text style={styles.dateButtonText}>
                            {fromTime ? fromTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Select Time"}
                        </Text>
                    </TouchableOpacity>

                    {showFromTimePicker && (
                        <DateTimePicker
                            value={fromTime || new Date()}
                            mode="time"
                            display="default"
                            onChange={(event, selectedTime) => {
                                setShowFromTimePicker(false);
                                if (selectedTime) {
                                    setFromTime(selectedTime);
                                }
                            }}
                        />
                    )}
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>To Time</Text>

                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowToTimePicker(true)}
                        disabled={loading}
                    >
                        <Text style={styles.dateButtonText}>
                            {toTime ? toTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Select Time"}
                        </Text>
                    </TouchableOpacity>

                    {showToTimePicker && (
                        <DateTimePicker
                            value={toTime || new Date()}
                            mode="time"
                            display="default"
                            onChange={(event, selectedTime) => {
                                setShowToTimePicker(false);
                                if (selectedTime) {
                                    setToTime(selectedTime);
                                }
                            }}
                        />
                    )}
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Adjusted By</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={adjustedBy}
                            onValueChange={(value) => setAdjustedBy(value)}
                            style={styles.picker}
                            enabled={!loading}
                        >
                            <Picker.Item label="Select Faculty" value="" />

                            {facultyList.map((faculty: any) => (
                                <Picker.Item
                                    key={faculty.id}
                                    label={faculty.username}
                                    value={faculty.username}
                                />
                            ))}
                        </Picker>
                    </View>
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
    loadText:{
      fontSize: height*0.02,
      fontWeight: "bold",
        marginBottom: 8,
    },
    loadSubText:{

        marginBottom: 8,
    },
    loadContainer:{
        gap: width*0.01,
        flexDirection: 'row',
        // alignItems: "center",
        justifyContent: "center",
        alignItems: "center"
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