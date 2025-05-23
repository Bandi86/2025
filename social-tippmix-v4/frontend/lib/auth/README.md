# Authentication System

This folder contains the authentication system for the Social Tippmix application. The system uses:

- Zustand for state management
- Next.js Server Components for server-side authentication
- JWT for authentication tokens
- Route-based access control via Next.js middleware

## Components

### Client Components

- `LoginForm`: Form for user login
- `RegisterForm`: Form for new user registration
- `LogoutButton`: Button to log out the current user
- `AuthProvider`: Provider component that hydrates auth state from server
- `withAuth`: Higher-order component (HOC) for protecting routes

## Hooks and Services

- `useAuth`: Custom hook for working with auth state in components
- `authService`: Service for handling auth-related API requests

## Implementation Details

### Auth Flow

1. User logs in via the `LoginForm`
2. Backend returns a JWT token which is stored as an HTTP-only cookie
3. `authStore` maintains the user state across the app
4. `middleware.ts` checks routes to ensure proper permissions
5. `withAuth` HOC protects client components that need authentication
6. `AuthProvider` keeps auth state in sync with the server

### Usage Examples

#### Protecting a route

```tsx
// In a component that needs to be protected
import { withAuth } from '@/components/auth'

function AdminDashboard() {
  return <div>Admin Dashboard</div>
}

// Export with auth protection, requiring admin role
export default withAuth(AdminDashboard, { requireAdmin: true })
```

#### Using the auth state in a component

```tsx
import { useAuth } from '@/lib/auth'

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) {
    return <div>Please login</div>
  }

  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

#### Setting up the auth provider

```tsx
// In your root layout
import { AuthProvider } from '@/components/auth'
import { getCurrentUser } from '@/lib/auth/session'

export default async function RootLayout({ children }) {
  // Get user from server-side
  const user = await getCurrentUser()

  return (
    <html>
      <body>
        <AuthProvider user={user}>{children}</AuthProvider>
      </body>
    </html>
  )
}
```
