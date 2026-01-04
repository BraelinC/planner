# Monorepo Conversion Plan: HealthyMama Planner

## Overview

Convert the existing Vite/React web application into a Turborepo monorepo with:
- Existing web app (apps/web)
- New React Native/Expo mobile app (apps/mobile)
- Shared Convex backend package (packages/convex)
- Shared TypeScript config (packages/tsconfig)
- Shared Tailwind config (packages/tailwind-config)

## Target Directory Structure

```
planner/
├── apps/
│   ├── web/                          # Existing Vite/React web app
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── pages/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   └── tsconfig.json
│   │
│   └── mobile/                       # New React Native/Expo app
│       ├── app/                      # Expo Router file-based routes
│       │   ├── _layout.tsx           # Root layout
│       │   ├── index.tsx             # Home screen
│       │   ├── (auth)/               # Auth group
│       │   │   ├── _layout.tsx
│       │   │   ├── login.tsx
│       │   │   └── register.tsx
│       │   └── (app)/                # Authenticated app group
│       │       ├── _layout.tsx
│       │       ├── index.tsx         # Dashboard/Home
│       │       ├── calendar.tsx
│       │       └── todos.tsx
│       ├── components/
│       │   ├── ui/                   # RN UI components
│       │   ├── calendar/
│       │   └── todos/
│       ├── hooks/
│       ├── lib/
│       ├── assets/
│       ├── app.json
│       ├── babel.config.js
│       ├── metro.config.js
│       ├── tailwind.config.js
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── convex/                       # Shared Convex backend
│   │   ├── ai.ts
│   │   ├── auth.config.ts
│   │   ├── events.ts
│   │   ├── googleCalendar.ts
│   │   ├── schema.ts
│   │   ├── todos.ts
│   │   ├── users.ts
│   │   ├── convex.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── tsconfig/                     # Shared TypeScript configs
│   │   ├── base.json
│   │   ├── react.json
│   │   ├── react-native.json
│   │   └── package.json
│   │
│   └── tailwind-config/              # Shared Tailwind theme
│       ├── index.js
│       └── package.json
│
├── turbo.json                        # Turborepo config
├── package.json                      # Root package.json (workspace)
├── bun.lock
├── .env.local                        # Shared env vars
└── .gitignore
```

---

## Phase 1: Initialize Turborepo Structure

### Step 1.1: Create Root Workspace Configuration

Create root `package.json` with Bun workspaces:

```json
{
  "name": "healthymama-planner",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=@healthymama/web",
    "dev:mobile": "turbo run dev --filter=@healthymama/mobile",
    "build": "turbo run build",
    "build:web": "turbo run build --filter=@healthymama/web",
    "lint": "turbo run lint",
    "check": "turbo run check",
    "convex:dev": "turbo run convex:dev --filter=@healthymama/convex",
    "convex:deploy": "turbo run convex:deploy --filter=@healthymama/convex"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "5.6.3"
  }
}
```

### Step 1.2: Create Turborepo Configuration

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env.local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "check": {
      "dependsOn": ["^build"]
    },
    "convex:dev": {
      "cache": false,
      "persistent": true
    },
    "convex:deploy": {
      "cache": false
    }
  }
}
```

---

## Phase 2: Create Shared Packages

### Step 2.1: Create Shared TypeScript Config Package

Create `packages/tsconfig/package.json`:

```json
{
  "name": "@healthymama/tsconfig",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  }
}
```

Create `packages/tsconfig/base.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "incremental": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false
  },
  "exclude": ["node_modules"]
}
```

Create `packages/tsconfig/react.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "types": ["vite/client"]
  }
}
```

Create `packages/tsconfig/react-native.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  }
}
```

### Step 2.2: Create Shared Tailwind Config Package

Create `packages/tailwind-config/package.json`:

```json
{
  "name": "@healthymama/tailwind-config",
  "version": "0.0.0",
  "private": true,
  "main": "index.js",
  "license": "MIT"
}
```

Create `packages/tailwind-config/index.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
```

### Step 2.3: Move Convex to Shared Package

Create `packages/convex/package.json`:

```json
{
  "name": "@healthymama/convex",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./_generated/api.js",
  "types": "./_generated/api.d.ts",
  "scripts": {
    "convex:dev": "convex dev",
    "convex:deploy": "convex deploy"
  },
  "dependencies": {
    "convex": "^1.31.0"
  },
  "devDependencies": {
    "@healthymama/tsconfig": "workspace:*"
  },
  "exports": {
    ".": "./_generated/api.js",
    "./api": "./_generated/api.js",
    "./dataModel": "./_generated/dataModel.d.ts",
    "./server": "./_generated/server.js"
  }
}
```

Create `packages/convex/tsconfig.json`:

```json
{
  "extends": "@healthymama/tsconfig/base.json",
  "compilerOptions": {
    "allowJs": true,
    "strict": true
  },
  "include": ["./**/*"],
  "exclude": ["node_modules"]
}
```

Move all existing convex files:
- `convex/ai.ts` → `packages/convex/ai.ts`
- `convex/auth.config.ts` → `packages/convex/auth.config.ts`
- `convex/events.ts` → `packages/convex/events.ts`
- `convex/googleCalendar.ts` → `packages/convex/googleCalendar.ts`
- `convex/schema.ts` → `packages/convex/schema.ts`
- `convex/todos.ts` → `packages/convex/todos.ts`
- `convex/users.ts` → `packages/convex/users.ts`
- `convex/convex.json` → `packages/convex/convex.json`
- `convex/_generated/` → `packages/convex/_generated/`

---

## Phase 3: Migrate Web App

### Step 3.1: Create Web App Directory Structure

Create `apps/web/package.json`:

```json
{
  "name": "@healthymama/web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "tsc --noEmit"
  },
  "dependencies": {
    "@clerk/clerk-react": "^5.58.1",
    "@healthymama/convex": "workspace:*",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-tabs": "^1.1.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "convex": "^1.31.0",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.453.0",
    "openai": "^6.15.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "wouter": "^3.3.5"
  },
  "devDependencies": {
    "@healthymama/tailwind-config": "workspace:*",
    "@healthymama/tsconfig": "workspace:*",
    "@types/node": "20.16.11",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "typescript": "5.6.3",
    "vite": "^5.4.19"
  }
}
```

### Step 3.2: Update Web App tsconfig.json

Create `apps/web/tsconfig.json`:

```json
{
  "extends": "@healthymama/tsconfig/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@healthymama/convex": ["../../packages/convex/_generated/api"],
      "@healthymama/convex/*": ["../../packages/convex/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3.3: Update Web Vite Config

Update `apps/web/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@healthymama/convex": path.resolve(__dirname, "../../packages/convex/_generated/api"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  envDir: path.resolve(__dirname, "../.."),
});
```

### Step 3.4: Update Web Tailwind Config

Update `apps/web/tailwind.config.js`:

```js
const sharedConfig = require("@healthymama/tailwind-config");

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...sharedConfig,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [require("tailwindcss-animate")],
};
```

### Step 3.5: Move Web Source Files

Move files from `client/` to `apps/web/`:
- `client/src/` → `apps/web/src/`
- `client/index.html` → `apps/web/index.html`

### Step 3.6: Update Web Imports

Update import statements in web app to use the new Convex package:

**Before:**
```ts
import { api } from "convex/_generated/api";
```

**After:**
```ts
import { api } from "@healthymama/convex";
```

---

## Phase 4: Create React Native Mobile App

### Step 4.1: Initialize Expo App

Create `apps/mobile/package.json`:

```json
{
  "name": "@healthymama/mobile",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "android": "expo run:android",
    "build:android": "eas build --platform android",
    "check": "tsc --noEmit"
  },
  "dependencies": {
    "@clerk/clerk-expo": "^2.0.0",
    "@healthymama/convex": "workspace:*",
    "convex": "^1.31.0",
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-status-bar": "~2.0.0",
    "nativewind": "^4.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.1.0",
    "date-fns": "^3.6.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@healthymama/tailwind-config": "workspace:*",
    "@healthymama/tsconfig": "workspace:*",
    "@types/react": "~18.3.11",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.6.3"
  }
}
```

### Step 4.2: Create Mobile App Config

Create `apps/mobile/app.json`:

```json
{
  "expo": {
    "name": "HealthyMama Planner",
    "slug": "healthymama-planner",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "healthymama",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "android": {
      "package": "com.healthymama.planner",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "plugins": ["expo-router", "expo-secure-store"]
  }
}
```

### Step 4.3: Create Mobile TypeScript Config

Create `apps/mobile/tsconfig.json`:

```json
{
  "extends": "@healthymama/tsconfig/react-native.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@healthymama/convex": ["../../packages/convex/_generated/api"],
      "@healthymama/convex/*": ["../../packages/convex/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules"]
}
```

### Step 4.4: Create Babel Config for NativeWind

Create `apps/mobile/babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

### Step 4.5: Create Metro Config for Monorepo

Create `apps/mobile/metro.config.js`:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Force Metro to resolve shared packages from monorepo root
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: "./global.css" });
```

### Step 4.6: Create Mobile Tailwind Config

Create `apps/mobile/tailwind.config.js`:

```js
const sharedConfig = require("@healthymama/tailwind-config");

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...sharedConfig,
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
};
```

### Step 4.7: Create Global CSS for NativeWind

Create `apps/mobile/global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}
```

---

## Phase 5: Mobile App Core Files

### Step 5.1: Create Root Layout

Create `apps/mobile/app/_layout.tsx`:

```tsx
import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { ConvexProviderWithClerk, ConvexReactClient } from "convex/react-clerk";
import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isSignedIn && inAuthGroup) {
      router.replace("/(app)");
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    }
  }, [isSignedIn, isLoaded]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <InitialLayout />
        </ConvexProviderWithClerk>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
```

### Step 5.2: Create Auth Layout

Create `apps/mobile/app/(auth)/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
```

### Step 5.3: Create Login Screen

Create `apps/mobile/app/(auth)/login.tsx`:

```tsx
import { View, Text, Pressable } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { useState } from "react";

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Implement sign-in logic here

  return (
    <View className="flex-1 justify-center items-center bg-background p-6">
      <Text className="text-3xl font-bold text-foreground mb-8">
        HealthyMama Planner
      </Text>
      {/* Add sign-in form components */}
      <Link href="/(auth)/register" asChild>
        <Pressable>
          <Text className="text-primary">Don't have an account? Sign up</Text>
        </Pressable>
      </Link>
    </View>
  );
}
```

### Step 5.4: Create App Layout (Authenticated)

Create `apps/mobile/app/(app)/_layout.tsx`:

```tsx
import { Tabs } from "expo-router";
import { Calendar, CheckSquare, Home } from "lucide-react-native";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "hsl(221.2, 83.2%, 53.3%)",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
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
```

### Step 5.5: Create Home Screen

Create `apps/mobile/app/(app)/index.tsx`:

```tsx
import { View, Text, ScrollView } from "react-native";
import { useUser } from "@clerk/clerk-expo";

export default function HomeScreen() {
  const { user } = useUser();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6">
        <Text className="text-2xl font-bold text-foreground">
          Welcome, {user?.firstName || "there"}!
        </Text>
        {/* Add dashboard content */}
      </View>
    </ScrollView>
  );
}
```

### Step 5.6: Create Todos Screen

Create `apps/mobile/app/(app)/todos.tsx`:

```tsx
import { View, Text, FlatList, Pressable, TextInput } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@healthymama/convex";
import { useState } from "react";

export default function TodosScreen() {
  const todos = useQuery(api.todos.list);
  const createTodo = useMutation(api.todos.create);
  const toggleTodo = useMutation(api.todos.toggle);
  const [newTodo, setNewTodo] = useState("");

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    await createTodo({ title: newTodo.trim() });
    setNewTodo("");
  };

  return (
    <View className="flex-1 bg-background p-4">
      <View className="flex-row mb-4">
        <TextInput
          className="flex-1 border border-input rounded-md px-3 py-2 mr-2"
          value={newTodo}
          onChangeText={setNewTodo}
          placeholder="Add a new todo..."
          onSubmitEditing={handleAddTodo}
        />
        <Pressable
          onPress={handleAddTodo}
          className="bg-primary px-4 py-2 rounded-md"
        >
          <Text className="text-primary-foreground font-medium">Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => toggleTodo({ id: item._id })}
            className="flex-row items-center p-3 bg-card rounded-lg mb-2"
          >
            <View
              className={`w-5 h-5 rounded border mr-3 ${
                item.completed ? "bg-primary border-primary" : "border-input"
              }`}
            />
            <Text
              className={`flex-1 ${
                item.completed ? "line-through text-muted-foreground" : "text-foreground"
              }`}
            >
              {item.title}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text className="text-muted-foreground text-center py-8">
            No todos yet. Add one above!
          </Text>
        }
      />
    </View>
  );
}
```

### Step 5.7: Create Calendar Screen

Create `apps/mobile/app/(app)/calendar.tsx`:

```tsx
import { View, Text, ScrollView } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@healthymama/convex";
import { startOfMonth, endOfMonth } from "date-fns";

export default function CalendarScreen() {
  const now = new Date();
  const events = useQuery(api.events.list, {
    startDate: startOfMonth(now).getTime(),
    endDate: endOfMonth(now).getTime(),
  });

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-xl font-bold text-foreground mb-4">
          Your Events
        </Text>
        {/* Implement calendar view - consider using react-native-calendars */}
        {events?.map((event) => (
          <View
            key={event._id}
            className="p-3 bg-card rounded-lg mb-2 border-l-4"
            style={{ borderLeftColor: event.color || "#3b82f6" }}
          >
            <Text className="font-medium text-foreground">{event.title}</Text>
            {event.description && (
              <Text className="text-muted-foreground text-sm">
                {event.description}
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
```

---

## Phase 6: Environment Variables Setup

### Step 6.1: Root .env.local

Update root `.env.local` (shared by all apps):

```env
# Convex
VITE_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx

# OpenAI (for AI features)
OPENAI_API_KEY=sk-xxx
```

### Step 6.2: Update .gitignore

Update root `.gitignore`:

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
build/
.expo/

# Environment
.env
.env.local
.env.*.local

# Turbo
.turbo/

# Convex
packages/convex/_generated/

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Android
*.apk
*.aab
apps/mobile/android/

# Logs
*.log
```

---

## Phase 7: Implementation Checklist

### 7.1: Initialization Steps

1. [ ] Create directory structure (`apps/`, `packages/`)
2. [ ] Create root `package.json` with workspaces
3. [ ] Create `turbo.json` configuration
4. [ ] Install Turborepo globally: `bun add -g turbo`

### 7.2: Shared Packages

1. [ ] Create `packages/tsconfig/` with shared configs
2. [ ] Create `packages/tailwind-config/` with shared theme
3. [ ] Move `convex/` to `packages/convex/`
4. [ ] Create `packages/convex/package.json` with exports

### 7.3: Web App Migration

1. [ ] Create `apps/web/` directory
2. [ ] Move `client/src/` to `apps/web/src/`
3. [ ] Move `client/index.html` to `apps/web/index.html`
4. [ ] Update `apps/web/package.json`
5. [ ] Update `apps/web/vite.config.ts`
6. [ ] Update `apps/web/tsconfig.json`
7. [ ] Update `apps/web/tailwind.config.js`
8. [ ] Update imports to use `@healthymama/convex`
9. [ ] Test web app works: `bun run dev:web`

### 7.4: Mobile App Creation

1. [ ] Create `apps/mobile/` directory structure
2. [ ] Create `apps/mobile/package.json`
3. [ ] Create `apps/mobile/app.json`
4. [ ] Create `apps/mobile/tsconfig.json`
5. [ ] Create `apps/mobile/babel.config.js`
6. [ ] Create `apps/mobile/metro.config.js`
7. [ ] Create `apps/mobile/tailwind.config.js`
8. [ ] Create `apps/mobile/global.css`
9. [ ] Create Expo Router layouts and screens
10. [ ] Install dependencies: `cd apps/mobile && bun install`
11. [ ] Test mobile app: `bun run dev:mobile`

### 7.5: Final Steps

1. [ ] Run `bun install` from root to link workspaces
2. [ ] Verify `bun run dev` starts both apps
3. [ ] Verify `bun run build` builds both apps
4. [ ] Test Convex connection from both apps
5. [ ] Delete old `client/` and `convex/` directories
6. [ ] Update any CI/CD pipelines

---

## Commands Reference

```bash
# Development
bun run dev              # Start all apps
bun run dev:web          # Start web app only
bun run dev:mobile       # Start mobile app only

# Building
bun run build            # Build all apps
bun run build:web        # Build web app only

# Type checking
bun run check            # Type check all packages

# Convex
bun run convex:dev       # Start Convex dev server
bun run convex:deploy    # Deploy Convex to production

# Mobile specific (from apps/mobile/)
bun run android          # Run on Android device/emulator
bun run build:android    # Build Android APK/AAB
```

---

## Notes & Considerations

### NativeWind (Uniwind) Setup
- NativeWind v4 requires the `nativewind/babel` preset
- Metro config must be wrapped with `withNativeWind`
- CSS variables work differently in RN - colors need explicit values in some cases

### Convex Sharing Strategy
- The `@healthymama/convex` package exports the generated API
- Both web and mobile import from the same package
- Convex dev server should be run from `packages/convex/`

### Android-Only Focus
- `app.json` only includes Android configuration
- No iOS folders or configurations created
- EAS Build configured for Android only

### Clerk Integration
- Web uses `@clerk/clerk-react`
- Mobile uses `@clerk/clerk-expo` with SecureStore for tokens
- Same Clerk application works for both platforms

### Potential Future Enhancements
- Add shared UI primitives package for common components
- Add shared hooks package for business logic
- Consider react-native-calendars for mobile calendar view
- Add push notifications for mobile
