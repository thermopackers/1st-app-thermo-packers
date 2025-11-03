import { useUserContext } from '../context/UserContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles, mustBeMainAccount = false, isAssistantRoute = false }) => {
  const { user, loading } = useUserContext();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // UserContext should now handle parsing, but keep this as fallback
  const parseUserRoles = (userData) => {
    if (!userData.role) return [];
    
    // If it's already a proper array, return it
    if (Array.isArray(userData.role) && userData.role.length > 0 && 
        (typeof userData.role[0] !== 'string' || !userData.role[0].startsWith('['))) {
      return userData.role;
    }
    
    // If it's an array containing a JSON string
    if (Array.isArray(userData.role) && userData.role.length === 1 && 
        typeof userData.role[0] === 'string' && userData.role[0].startsWith('[')) {
      try {
        return JSON.parse(userData.role[0]);
      } catch (err) {
        console.error('Failed to parse user roles in ProtectedRoute:', err);
        return [];
      }
    }
    
    // If it's a single role string
    if (typeof userData.role === 'string') {
      return [userData.role];
    }
    
    return [];
  };

  const userRoles = parseUserRoles(user);


  // Check if user has at least one of the allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = userRoles.some(role => allowedRoles.includes(role));
    
    
    if (!hasAllowedRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // For supplier main account check
  if (mustBeMainAccount) {
    const hasSupplierRole = userRoles.includes('suppliers');
    if (hasSupplierRole && user.isAssistant) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // For assistant route check
  if (isAssistantRoute) {
    const hasSupplierRole = userRoles.includes('suppliers');
    if (!user.isAssistant || !hasSupplierRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;