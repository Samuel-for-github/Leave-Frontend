import React from 'react';
import { Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import {Link, router} from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { authStyles } from "../../assets/styles/auth.styles";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Page() {
    const { login } = useAuth();

    const [emailAddress, setEmailAddress] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    // Email validation
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Handle the submission of the sign-in form
    const onSignInPress = async () => {
        // Validation
        if (!emailAddress.trim()) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }

        if (!validateEmail(emailAddress)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        if (!password) {
            Alert.alert('Error', 'Please enter a password');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`${process.env.EXPO_PUBLIC_URL}/users/login`, {
                email: emailAddress.trim().toLowerCase(),
                password: password,
            });

            console.log('Login response:', response.data.data.token);

            // Use the login function from AuthContext
            if (response.data.data && response.data.data.token) {
                await login(response.data.data.token, response.data.data.user);

                Alert.alert('Success', 'Login successful!');

                    router.push('/(main)');


                // No need to manually navigate - the context will trigger redirect
            } else {
                Alert.alert('Error', 'Invalid response from server');
            }
        } catch (err) {
            console.error('Login error:', err);

            // Handle different error cases
            if (err.response) {
                const errorMessage = err.response.data.message || 'Login failed. Please check your credentials.';
                Alert.alert('Login Failed', errorMessage);
            } else if (err.request) {
                Alert.alert('Network Error', 'Please check your internet connection.');
            } else {
                Alert.alert('Error', 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={authStyles.container}>
            <View>
                <Text style={authStyles.title}>Sign in</Text>
                <View style={authStyles.formContainer}>
                    {/* Email Input */}
                    <TextInput
                        style={[authStyles.textInput, authStyles.inputContainer]}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={emailAddress}
                        placeholder="Enter email"
                        onChangeText={setEmailAddress}
                        editable={!loading}
                    />

                    {/* Password Input with Show/Hide */}
                    <View style={{ flexDirection: "row" }}>
                        <TextInput
                            style={[authStyles.textInput, authStyles.inputContainer, { flex: 1 }]}
                            value={password}
                            placeholder="Enter password"
                            secureTextEntry={!showPassword}
                            onChangeText={setPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={authStyles.eyeButton}
                            disabled={loading}
                        >
                            {!showPassword ? (
                                <EyeOff size={20} color="gray" />
                            ) : (
                                <Eye size={20} color="gray" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity
                        style={[authStyles.authButton, loading && { opacity: 0.6 }]}
                        onPress={onSignInPress}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={authStyles.buttonText}>Login</Text>
                        )}
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <View style={authStyles.linkContainer}>
                        <Text style={authStyles.subtitle}>Don't have an account?</Text>
                        <Link href="/sign-up">
                            <Text style={authStyles.linkText}>Sign up</Text>
                        </Link>
                    </View>
                </View>
            </View>
        </View>
    );
}