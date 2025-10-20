import * as React from 'react';
import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { authStyles } from "../../assets/styles/auth.styles";
import { Link, useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUpScreen() {
    const router = useRouter();

    const [username, setUsername] = React.useState('');
    const [emailAddress, setEmailAddress] = React.useState('');
    const [mobile, setMobile] = React.useState('');
    const [role, setRole] = React.useState('FACULTY');
    const [department, setDepartment] = React.useState('IT');
    const [loading, setLoading] = React.useState(false);

    // Email validation
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const onSignUpPress = async () => {
        // Dismiss keyboard before processing
        Keyboard.dismiss();

        // Validation
        if (!username.trim()) {
            Alert.alert('Error', 'Please enter a username');
            return;
        }

        if (!emailAddress.trim()) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }

        if (!validateEmail(emailAddress)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`${process.env.EXPO_PUBLIC_URL}/users/register`, {
                username: username.trim(),
                email: emailAddress.trim().toLowerCase(),
                role: role,
                department,
                mobile: mobile
            });

            console.log('Signup response:', response.data);

            if (response.data.success || response.status === 201) {
                Alert.alert(
                    'Success',
                    'Account created successfully! check your email for login credentials.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.replace('/sign-in')
                        }
                    ]
                );
            }
        } catch (err) {
            console.error('Signup error:', err);

            if (err.response) {
                const errorMessage = err.response.data.message || 'Signup failed. Please try again.';
                Alert.alert('Signup Failed', errorMessage);
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
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={authStyles.container}>
                        <View>
                            <Text style={authStyles.title}>Sign up</Text>
                            <View style={authStyles.formContainer}>
                                {/* Username Input */}
                                <TextInput
                                    style={[authStyles.textInput, authStyles.inputContainer]}
                                    autoCapitalize="none"
                                    value={username}
                                    placeholder="Enter username"
                                    onChangeText={setUsername}
                                    editable={!loading}
                                    returnKeyType="next"
                                />

                                {/* Email Input */}
                                <TextInput
                                    style={[authStyles.textInput, authStyles.inputContainer]}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    value={emailAddress}
                                    placeholder="Enter email"
                                    onChangeText={setEmailAddress}
                                    editable={!loading}
                                    returnKeyType="next"
                                />

                                {/* Mobile Input */}
                                <View style={{ flexDirection: "row" }}>
                                    <TextInput
                                        style={[authStyles.textInput, authStyles.inputContainer, { flex: 1 }]}
                                        value={mobile}
                                        placeholder="Enter Mobile Number"
                                        keyboardType="phone-pad"
                                        onChangeText={setMobile}
                                        editable={!loading}
                                        returnKeyType="done"
                                    />
                                </View>

                                {/* Role Dropdown */}
                                <View style={[authStyles.inputContainer, { borderWidth: 1, borderColor: '#ccc', borderRadius: 5 }]}>
                                    <Picker
                                        selectedValue={role}
                                        onValueChange={(itemValue) => setRole(itemValue)}
                                        enabled={!loading}
                                    >
                                        <Picker.Item label="Faculty" value="FACULTY" />
                                        <Picker.Item label="HOD" value="HOD" />
                                        <Picker.Item label="Principal" value="PRINCIPAL" />
                                    </Picker>
                                </View>

                                {/* Department Dropdown */}
                                <View style={[authStyles.inputContainer, { borderWidth: 1, borderColor: '#ccc', borderRadius: 5 }]}>
                                    <Picker
                                        selectedValue={department}
                                        onValueChange={(itemValue) => setDepartment(itemValue)}
                                        enabled={!loading}
                                    >
                                        <Picker.Item label="IT" value="IT" />
                                        <Picker.Item label="CSE" value="CSE" />
                                        <Picker.Item label="ECOMP" value="ECOMP" />
                                    </Picker>
                                </View>

                                {/* Continue Button */}
                                <TouchableOpacity
                                    style={[authStyles.authButton, loading && { opacity: 0.6 }]}
                                    onPress={onSignUpPress}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={authStyles.buttonText}>Continue</Text>
                                    )}
                                </TouchableOpacity>

                                {/* Sign In Link */}
                                <View style={authStyles.linkContainer}>
                                    <Text style={authStyles.subtitle}>Already have an account?</Text>
                                    <Link href="/sign-in">
                                        <Text style={authStyles.linkText}>Sign in</Text>
                                    </Link>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}