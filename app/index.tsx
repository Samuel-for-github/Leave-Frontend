import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import {useAuth} from "@/contexts/AuthContext";

export default function Index() {
    const { isAuthenticated, loading }:any = useAuth();

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return <Redirect href={isAuthenticated ? "/(main)" : "/(auth)/sign-in"} />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});