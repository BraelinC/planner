import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const onSignUpWithEmail = useCallback(async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(app)");
      } else {
        setError("Please check your email to verify your account");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, email, password, firstName, signUp, setActive, router]);

  const onSignUpWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const { createdSessionId, setActive: setActiveSession } =
        await startOAuthFlow();

      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        router.replace("/(app)");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Google sign up failed");
    } finally {
      setIsLoading(false);
    }
  }, [startOAuthFlow, router]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.formContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Join HealthyMama</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          <Pressable
            onPress={onSignUpWithGoogle}
            disabled={isLoading}
            style={styles.googleButton}
          >
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Jane"
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="--------"
              secureTextEntry
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            onPress={onSignUpWithEmail}
            disabled={isLoading || !email || !password}
            style={[
              styles.signUpButton,
              (isLoading || !email || !password) && styles.signUpButtonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={styles.loginLink}>Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fdf2f8",
    padding: 24,
  },
  formContainer: {
    width: "100%",
    maxWidth: 384,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#db2777",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#4b5563",
  },
  googleButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  googleButtonText: {
    color: "#374151",
    fontWeight: "500",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#d1d5db",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: "#6b7280",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: "#111827",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  signUpButton: {
    backgroundColor: "#ec4899",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  signUpButtonDisabled: {
    backgroundColor: "#f9a8d4",
  },
  signUpButtonText: {
    color: "white",
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "#4b5563",
  },
  loginLink: {
    color: "#ec4899",
    fontWeight: "500",
  },
});
