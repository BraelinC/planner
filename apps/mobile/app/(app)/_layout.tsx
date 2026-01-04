import { Tabs } from "expo-router";
import { Home, Calendar, CheckSquare } from "lucide-react-native";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { Image, View, Text, Pressable, StyleSheet } from "react-native";

function ProfileButton() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <Pressable onPress={() => signOut()} style={styles.profileButton}>
      {user?.imageUrl ? (
        <Image source={{ uri: user.imageUrl }} style={styles.profileImage} />
      ) : (
        <View style={styles.profilePlaceholder}>
          <Text style={styles.profileInitials}>{getInitials(user?.firstName)}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#fdf2f8",
        },
        headerTintColor: "#db2777",
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerRight: () => <ProfileButton />,
        tabBarActiveTintColor: "#ec4899",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#fce7f3",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Super Planner",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: "Todos",
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    marginRight: 16,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#fce7f3",
  },
  profilePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ec4899",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});
