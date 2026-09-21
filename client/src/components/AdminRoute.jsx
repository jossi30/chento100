import { useSelector } from 'react-redux';
import { Outlet, Navigate } from 'react-router-dom';

export default function AdminRoute() {
  const { currentUser } = useSelector((state) => state.user);

  if (!currentUser) {
    return <Navigate to='/sign-in' replace />;
  }

  // Check if authenticated user has isAdmin: true (with fallback for role === 'admin' or admin email)
  const isAdmin =
    currentUser.isAdmin === true ||
    currentUser.role === 'admin' ||
    (typeof currentUser.email === 'string' &&
      (currentUser.email.toLowerCase() === 'jossvision11@gmail.com' ||
        currentUser.email.toLowerCase() === 'admin@chento100.com' ||
        currentUser.email.toLowerCase().includes('admin')));

  return isAdmin ? <Outlet /> : <Navigate to='/' replace />;
}
