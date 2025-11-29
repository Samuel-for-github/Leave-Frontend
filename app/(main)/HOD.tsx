import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
    Modal,
    ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios, { AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext';

type LeaveStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface LeaveRequest {
    id: string;
    email: string;
    username: string;
    role: string;
    department: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveStatus;
    adjustedBy: string;
    classOrLab: string;
    theoryOrPractical: string;
    createdAt: string;
}

interface TransformedLeaveRequest extends LeaveRequest {
    facultyName: string;
    days: number;
    formatedDate: string;
    formatedFromTime: string;
    formatedToTime: string;
    formattedStartDate: string;
    formattedEndDate: string;
    formattedSubmittedDate: string;
}

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default function HODScreen() {
    const { user }: any = useAuth();
    const [leaveRequests, setLeaveRequests] = useState<TransformedLeaveRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<TransformedLeaveRequest[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<LeaveStatus | 'ALL'>('PENDING');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<TransformedLeaveRequest | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formateTime = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const calculateDays = (startDate: string, endDate: string): number => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    };

    const getNameFromEmail = (email: string): string => {
        const name = email.split('@')[0];
        return name.charAt(0).toUpperCase() + name.slice(1).replace(/[0-9]/g, '');
    };

    const formatLeaveType = (leaveType: string): string => {
        return leaveType.replace(/_/g, ' ');
    };

    const transformLeaveRequest = (request: LeaveRequest): TransformedLeaveRequest => {
        console.log("test", request);
        return {
            ...request,
            facultyName: request.username,
            days: calculateDays(request.startDate, request.endDate),
            formatedDate: formatDate(request.startDate),
            formatedFromTime: formateTime(request.startDate),
            formatedToTime: formateTime(request.endDate),
            formattedStartDate: formatDate(request.startDate),
            formattedEndDate: formatDate(request.endDate),
            formattedSubmittedDate: formatDate(request.createdAt),
        };
    };

    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    useEffect(() => {
        filterRequests();
    }, [selectedFilter, leaveRequests]);

    const fetchLeaveRequests = async () => {
        try {
            setRefreshing(true);

            const response = await api.get<LeaveRequest[]>(
                `/leaves/department/${user?.department}`
            );

            // @ts-ignore
            const transformedData = response.data.data.map(transformLeaveRequest);
            setLeaveRequests(transformedData);
        } catch (error) {
            console.error('Fetch error:', error);

            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                if (axiosError.response) {
                    Alert.alert(
                        'Error',
                        `Failed to fetch leave requests: ${axiosError.response.status}`
                    );
                } else if (axiosError.request) {
                    Alert.alert('Error', 'No response from server. Please check your connection.');
                } else {
                    Alert.alert('Error', 'Failed to fetch leave requests');
                }
            } else {
                Alert.alert('Error', 'An unexpected error occurred');
            }
        } finally {
            setRefreshing(false);
        }
    };

    const filterRequests = () => {
        if (selectedFilter === 'ALL') {
            setFilteredRequests(leaveRequests);
        } else {
            setFilteredRequests(
                leaveRequests.filter((req) => req.status === selectedFilter)
            );
        }
    };

    const handleLeaveAction = async (
        requestId: string,
        action: 'ACCEPTED' | 'REJECTED',
        leaveType?: string,
        email?: string,
        days?: number
    ) => {
        Alert.alert(
            `${action === 'ACCEPTED' ? 'Approve' : 'Reject'} Leave`,
            `Are you sure you want to ${action === 'ACCEPTED' ? 'approve' : 'reject'} this leave request?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: action === 'ACCEPTED' ? 'Approve' : 'Reject',
                    style: action === 'ACCEPTED' ? 'default' : 'destructive',
                    onPress: async () => {
                        console.log(leaveType, days)
                        try {
                            const response = await api.post(`/users/email`, { email });
                            console.log(response.data.data);

                            await api.patch(`/leaves/${requestId}/${email}`, {
                                status: action === 'ACCEPTED' && 'ACCEPTED_BY_HOD' || action === 'REJECTED' && 'REJECTED_BY_HOD',
                                reviewedBy: user?.id || user?.email,
                                reviewedAt: new Date().toISOString(),
                            });

                            setLeaveRequests((prev) =>
                                prev.map((req) =>
                                    req.id === requestId ? { ...req, status: action } : req
                                )
                            );

                            setModalVisible(false);
                            Alert.alert(
                                'Success',
                                `Leave request ${action === 'ACCEPTED' ? 'approved' : 'rejected'} successfully`
                            );

                        } catch (error) {
                            console.error('Action error:', error);

                            if (axios.isAxiosError(error)) {
                                const axiosError = error as AxiosError;
                                if (axiosError.response) {
                                    Alert.alert(
                                        'Error',
                                        `Failed to ${action.toLowerCase()} leave request: ${axiosError.response.status}`
                                    );
                                } else {
                                    Alert.alert('Error', `Failed to ${action.toLowerCase()} leave request`);
                                }
                            } else {
                                Alert.alert('Error', 'An unexpected error occurred');
                            }
                        }
                    },
                },
            ]
        );
    };

    const getStatusStyle = (status: LeaveStatus) => {
        switch (status) {
            case 'PENDING':
                return styles.status_pending;
            case 'ACCEPTED':
                return styles.status_approved;
            case 'REJECTED':
                return styles.status_rejected;
            default:
                return styles.status_pending;
        }
    };

    const renderLeaveCard = ({ item }: { item: TransformedLeaveRequest }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                setSelectedRequest(item);
                setModalVisible(true);
            }}
        >
            <View style={styles.cardHeader}>
                <View style={styles.facultyInfo}>
                    <Text style={styles.facultyName}>{item.facultyName}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    <Text style={styles.leaveType}>{formatLeaveType(item.leaveType)}</Text>
                </View>
                <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.dateText}>
                        {item.formattedStartDate} - {item.formattedEndDate} ({item.days} day{item.days !== 1 ? 's' : ''})
                    </Text>
                </View>
                <Text style={styles.reason} numberOfLines={2}>
                    {item.reason}
                </Text>
                <Text style={styles.submittedDate}>
                    Submitted: {item.formattedSubmittedDate}
                </Text>
            </View>

            {item.status === 'PENDING' && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleLeaveAction(item.id, 'REJECTED');
                        }}
                    >
                        <Ionicons name="close-circle" size={20} color="#fff" />
                        <Text style={styles.btnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleLeaveAction(item.id, 'ACCEPTED', item.leaveType.toLowerCase(), item.email, item.days);
                        }}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.btnText}>Accept</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.filterTab,
                            selectedFilter === filter && styles.activeFilterTab,
                        ]}
                        onPress={() => setSelectedFilter(filter)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                selectedFilter === filter && styles.activeFilterText,
                            ]}
                        >
                            {filter.charAt(0) + filter.slice(1).toLowerCase()}
                        </Text>
                        {filter !== 'ALL' && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {leaveRequests.filter((req) => req.status === filter).length}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Leave Requests List */}
            <FlatList
                data={filteredRequests}
                renderItem={renderLeaveCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchLeaveRequests} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No leave requests found</Text>
                    </View>
                }
            />

            {/* Detail Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Leave Request Details</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {selectedRequest && (
                            <ScrollView style={styles.modalBody}>
                                <DetailRow
                                    icon="person-outline"
                                    label="Faculty Name"
                                    iconLib="ion"
                                    value={selectedRequest.facultyName}
                                />
                                <DetailRow
                                    iconLib="ion"
                                    icon="mail-outline"
                                    label="Email"
                                    value={selectedRequest.email}
                                />
                                <DetailRow
                                    iconLib="ion"
                                    icon="business-outline"
                                    label="Department"
                                    value={selectedRequest.department}
                                />
                                <DetailRow
                                    iconLib="ion"
                                    icon="briefcase-outline"
                                    label="Leave Type"
                                    value={formatLeaveType(selectedRequest.leaveType)}
                                />
                                <DetailRow
                                    iconLib="ion"
                                    icon="calendar-outline"
                                    label="Duration"
                                    value={`${selectedRequest.formattedStartDate} to ${selectedRequest.formattedEndDate}`}
                                />
                                <DetailRow
                                    iconLib="ion"
                                    icon="time-outline"
                                    label="Total Days"
                                    value={`${selectedRequest.days} day${selectedRequest.days !== 1 ? 's' : ''}`}
                                />
                                <DetailRow
                                    iconLib="ion"
                                    icon="document-text-outline"
                                    label="Reason"
                                    value={selectedRequest.reason}
                                />
                                <DetailRow
                                    iconLib="ion"
                                    icon="information-circle-outline"
                                    label="Status"
                                    value={selectedRequest.status}
                                />
                                <DetailRow
                                    iconLib="ion"
                                    icon="person-outline"
                                    label="Adjusted By"
                                    value={selectedRequest.adjustedBy || 'N/A'}
                                />
                                <DetailRow
                                    iconLib="material"
                                    icon="meeting-room"
                                    label="Class/Lab"
                                    value={selectedRequest.classOrLab || 'N/A'}
                                />
                                <DetailRow
                                    iconLib="ion"
                                    icon="calendar-outline"
                                    label="Date"
                                    value={selectedRequest.formatedDate}
                                />
                                <DetailRow
                                    iconLib="ion"
                                    icon="time-outline"
                                    label="From Time"
                                    value={selectedRequest.formatedFromTime}
                                />
                                <DetailRow
                                    iconLib="ion"
                                    icon="time-outline"
                                    label="To Time"
                                    value={selectedRequest.formatedToTime}
                                />
                                <DetailRow
                                    iconLib="material"
                                    icon="science"
                                    label="Theory/Practical"
                                    value={selectedRequest.theoryOrPractical || 'N/A'}
                                />
                                <DetailRow
                                    iconLib="ion"
                                    icon="checkmark-done-outline"
                                    label="Submitted On"
                                    value={selectedRequest.formattedSubmittedDate}
                                />

                                {selectedRequest.status === 'PENDING' && (
                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={[styles.modalBtn, styles.rejectBtn]}
                                            onPress={() =>
                                                handleLeaveAction(selectedRequest.id, 'REJECTED')
                                            }
                                        >
                                            <Text style={styles.btnText}>Reject</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalBtn, styles.approveBtn]}
                                            onPress={() =>
                                                handleLeaveAction(selectedRequest.id, 'ACCEPTED')
                                            }
                                        >
                                            <Text style={styles.btnText}>Accept</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Fixed DetailRow component with proper typing
const DetailRow = ({
                       icon,
                       label,
                       value,
                       iconLib = "ion"
                   }: {
    icon: string;
    label: string;
    value: string;
    iconLib?: "ion" | "material";
}) => (
    <View style={styles.detailRow}>
        <View style={styles.detailLabel}>
            {iconLib === "ion" ? (
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color="#666" />
            ) : (
                <MaterialIcons name={icon as keyof typeof MaterialIcons.glyphMap} size={20} color="#666" />
            )}
            <Text style={styles.labelText}>{label}</Text>
        </View>
        <Text style={styles.valueText}>{value}</Text>
    </View>
);

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 40,
        backgroundColor: '#f5f5f5',
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 16,
        marginTop: -45,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    filterTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 4,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    activeFilterTab: {
        backgroundColor: '#007AFF',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    activeFilterText: {
        color: '#fff',
    },
    badge: {
        marginLeft: 6,
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    facultyInfo: {
        flex: 1,
    },
    facultyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    email: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    leaveType: {
        fontSize: 14,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    status_pending: {
        backgroundColor: '#FFA500',
    },
    status_approved: {
        backgroundColor: '#4CAF50',
    },
    status_rejected: {
        backgroundColor: '#F44336',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    cardBody: {
        marginBottom: 12,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    dateText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    reason: {
        fontSize: 14,
        fontWeight: "600",
        color: '#333',
        lineHeight: 20,
        marginBottom: 4,
    },
    submittedDate: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    rejectBtn: {
        backgroundColor: '#F44336',
    },
    approveBtn: {
        backgroundColor: '#4CAF50',
    },
    btnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '83%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBody: {
        paddingHorizontal: 20,
        marginVertical: 10
    },
    detailRow: {
        marginBottom: 20,
    },
    detailLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    labelText: {
        marginLeft: 8,
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    valueText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 28,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        marginBottom: 20,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
});