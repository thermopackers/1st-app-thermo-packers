// src/context/UserContext.js
import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [shouldRefetchOrders, setShouldRefetchOrders] = useState(false);

  // Helper function to parse roles
  const parseUserRoles = (userData) => {
    if (!userData || !userData.role) return userData;
    
    let parsedUser = { ...userData };
    
    // If role is an array containing a JSON string
    if (Array.isArray(parsedUser.role) && parsedUser.role.length === 1 && 
        typeof parsedUser.role[0] === 'string' && parsedUser.role[0].startsWith('[')) {
      try {
        parsedUser.role = JSON.parse(parsedUser.role[0]);
      } catch (err) {
        console.error('Failed to parse user roles:', err);
      }
    }
    // If role is a JSON string (not in array)
    else if (typeof parsedUser.role === 'string' && parsedUser.role.startsWith('[')) {
      try {
        parsedUser.role = JSON.parse(parsedUser.role);
      } catch (err) {
        console.error('Failed to parse user roles:', err);
      }
    }
    
    return parsedUser;
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      
      
      if (!token) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const res = await axiosInstance.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // ✅ PARSE THE USER ROLES
        const parsedUser = parseUserRoles(res.data);
        
        setUser(parsedUser);
        setToken(token);
      } catch (err) {
        console.error("❌ UserContext: Auth failed:", err);
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);


  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      loading, 
      token, 
      shouldRefetchOrders,
      setShouldRefetchOrders 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);