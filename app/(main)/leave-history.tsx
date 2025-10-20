// app/leave-history.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface Leave {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
}

const { height, width } = Dimensions.get("window");
const isSmallDevice = width < 375;
const isShortDevice = height < 700;

export default function LeaveHistory() {
  const { user, token }: any = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaveHistory = async () => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_URL}/users/leave/history/${user.email}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLeaves(response.data);
    } catch (error) {
      console.error("Error fetching leave history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaveHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaveHistory();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'checkmark-circle';
      case 'pending':
        return 'time-outline';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getLeaveTypeIcon = (leaveType: string) => {
    switch (leaveType.toLowerCase()) {
      case 'sick_leave':
        return 'medical';
      case 'casual_leave':
        return 'calendar';
      case 'annual_leave':
        return 'sunny';
      default:
        return 'document-text';
    }
  };

  const formatLeaveType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading leave history...</Text>
      </View>
    );
  }

  if (leaves.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={isShortDevice ? 64 : 80} color="#cbd5e1" />
        <Text style={styles.emptyTitle}>No Leave History</Text>
        <Text style={styles.emptySubtitle}>
          Your leave applications will appear here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={leaves}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2563eb']}
          tintColor="#2563eb"
        />
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.leaveTypeContainer}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={getLeaveTypeIcon(item.leaveType) as any}
                  size={20}
                  color="#2563eb"
                />
              </View>
              <View style={styles.leaveTypeTextContainer}>
                <Text style={styles.leaveTypeText}>
                  {formatLeaveType(item.leaveType)}
                </Text>
                <Text style={styles.durationText}>
                  {calculateDuration(item.startDate, item.endDate)}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) + '15' },
              ]}
            >
              <Ionicons
                name={getStatusIcon(item.status) as any}
                size={16}
                color={getStatusColor(item.status)}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.dateContainer}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={16} color="#64748b" />
              <Text style={styles.dateLabel}>From:</Text>
              <Text style={styles.dateValue}>
                {new Date(item.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="calendar" size={16} color="#64748b" />
              <Text style={styles.dateLabel}>To:</Text>
              <Text style={styles.dateValue}>
                {new Date(item.endDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Reason */}
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason</Text>
            <Text style={styles.reasonText} numberOfLines={2}>
              {item.reason}
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.appliedText}>
              Applied on{' '}
              {new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: width * 0.05,
  },
  loadingText: {
    marginTop: height * 0.015,
    fontSize: isSmallDevice ? 14 : 16,
    color: '#64748b',
  },
  emptyTitle: {
    fontSize: isSmallDevice ? 20 : 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: height * 0.02,
  },
  emptySubtitle: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#64748b',
    marginTop: height * 0.01,
    textAlign: 'center',
    paddingHorizontal: width * 0.1,
  },
  listContainer: {
    padding: width * 0.04,
    backgroundColor: '#f8fafc',
    paddingBottom: height * 0.02,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: isSmallDevice ? 12 : 16,
    marginTop: isShortDevice? 12 : 25,
    marginBottom: isShortDevice ? 12 : 16,
    padding: isSmallDevice ? 14 : 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: isShortDevice ? 12 : 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  leaveTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: width * 0.5,
  },
  iconContainer: {
    width: isSmallDevice ? 36 : 40,
    height: isSmallDevice ? 36 : 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaveTypeTextContainer: {
    flex: 1,
  },
  leaveTypeText: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  durationText: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallDevice ? 10 : 12,
    paddingVertical: isSmallDevice ? 5 : 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: isSmallDevice ? 12 : 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dateContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: isSmallDevice ? 10 : 12,
    marginBottom: isShortDevice ? 10 : 12,
    gap: isSmallDevice ? 6 : 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#64748b',
    fontWeight: '500',
    minWidth: 40,
  },
  dateValue: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
  },
  reasonContainer: {
    marginBottom: isShortDevice ? 10 : 12,
  },
  reasonLabel: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#475569',
    lineHeight: isSmallDevice ? 18 : 20,
  },
  cardFooter: {
    paddingTop: isShortDevice ? 10 : 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  appliedText: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});