import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {router} from 'expo-router';
const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const userData = await AsyncStorage.getItem('userData');

            setIsAuthenticated(!!token);
            setUser(userData ? JSON.parse(userData) : null);
        } catch (error) {
            console.error('Error checking auth:', error);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (token, userData) => {
        console.log(token, userData)
        await AsyncStorage.setItem('authToken', token);

        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        setIsAuthenticated(true);
        setUser(userData);
    };

    const logout = async () => {
        console.log("pressed logout")
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
        if (!await AsyncStorage.getItem('authToken')) {
            router.push('/(auth)/sign-in');
        }
        setIsAuthenticated(false);
        setUser(null);
    };

    const updateUser = async (userData) => {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                loading,
                login,
                logout,
                updateUser,
                checkAuth
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};