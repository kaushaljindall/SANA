import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const token = localStorage.getItem('token');

    if (!token) {
        // Not authenticated, redirect to login
        return <Navigate to="/login" replace />;
    }

    // Authenticated, render the protected component
    return <>{children}</>;
}

interface PublicRouteProps {
    children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
    const token = localStorage.getItem('token');

    if (token) {
        // Already authenticated, redirect to home
        return <Navigate to="/" replace />;
    }

    // Not authenticated, render login/register
    return <>{children}</>;
}
