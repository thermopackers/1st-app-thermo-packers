import { useUserContext } from '../context/UserContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles, mustBeMainAccount = false, isAssistantRoute = false }) => {
  const { user, loading } = useUserContext();

  if (loading) return <div>Loading...</div>; // Or a loading spinner

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return <Navigate to="/unauthorized" />;
  }
// For supplier main account check
  if (mustBeMainAccount && user.role === 'suppliers' && user.isAssistant) {
    return <Navigate to="/unauthorized" replace />;
  }

  // For assistant route check
  if (isAssistantRoute && (!user.isAssistant || user.role !== 'suppliers')) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
