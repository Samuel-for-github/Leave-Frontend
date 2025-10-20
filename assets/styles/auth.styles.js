import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../../constants/colors";

const { height, width } = Dimensions.get("window");

export const authStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: "center",

    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    imageContainer: {
        height: height * 0.3,
        marginBottom: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: 320,
        height: 320,
    },
    title: {
        fontSize: height*0.05,
        fontWeight: "bold",
        color: COLORS.text,
        textAlign: "center",
        marginBottom: height*0.2,
        marginTop: -height*0.1,
    },
    subtitle: {
        fontSize: height*0.02,
        color: COLORS.text,
        textAlign: "center",
        marginBottom: 30,
    },
    formContainer: {
        justifyContent: "center",
        paddingHorizontal: width*0.05,
        marginTop: -height*0.1,
    },

    inputContainer: {
        marginBottom: 20,
        position: "relative",
    },
    textInput: {
        fontSize: height*0.02,
        color: COLORS.text,
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    eyeButton: {
        position: "absolute",
        right: 16,
        top: 16,
        padding: 4,
    },
    authButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 30,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontSize: height*0.02,
        fontWeight: "600",
        color: COLORS.white,
        textAlign: "center",
    },
    linkContainer: {
        gap: width*0.02,
        flexDirection: "row",
        justifyContent: "center",

        paddingBottom: 20,
    },
    linkText: {
        fontSize: height*0.02,
        color: COLORS.textLight,
    },
    link: {
        color: COLORS.primary,
        fontWeight: "600",
    },
});