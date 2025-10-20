import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function AuthRoutesLayout() {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            setIsAuthenticated(!!token);
        } catch (error) {
            console.error('Error checking auth:', error);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    // Show loading indicator while checking auth
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    // If already authenticated, redirect to main app
    if (isAuthenticated) {
        return <Redirect href="/(main)" />;
    }

    // Show auth screens (sign-in, sign-up)
    return <Stack screenOptions={{ headerShown: false }} />;
}