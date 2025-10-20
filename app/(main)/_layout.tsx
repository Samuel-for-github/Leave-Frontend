import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Alert, Dimensions } from "react-native";
const { height , width } = Dimensions.get("window");
export default function AppLayout() {
    const {user}:any = useAuth()
    return (
        <Tabs

            screenOptions={{

                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#6b7280',
                headerTintColor: '#000000',

                tabBarStyle:{
                    height: height*0.12,
                    backgroundColor: '#000000',
                    borderStartStartRadius: 20,
                    borderEndStartRadius: 20,
                    marginRight: width*0.025,
                    borderStyle: 'solid',
                    borderWidth: 2,
                    // alignItems: 'center',

                    // justifyContent: 'center'


                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                headerShown: false,
            }
        }

        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="apply-leave"
                options={{
                    title: 'Apply Leave',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle" size={size} color={color} />
                    ),
                }}
                listeners={{
                    tabPress: (e) => {
                        //
                        if (user.status === "PENDING") {
                            Alert.alert("Account Pending", "Your account is still pending. You cannot apply for leave at this time.");
                            e.preventDefault();
                        }
                    }
                }}
            />
            <Tabs.Screen
            name="leave-history"
                 options={{
                    title: 'Leave History',
                    tabBarIcon: ({ color, size }) => (
                       <Ionicons name="time" size={size} color={color} />
                    ),
                }}
            />

        </Tabs>
    );
}