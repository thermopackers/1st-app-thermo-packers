import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';

export const useOrderData = (token) => {
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [role, setRole] = useState(["sales"]);
  const [resolvedPOUrls, setResolvedPOUrls] = useState({});

  const parseUserRoles = useCallback((user) => {
    if (!user || !user.role) {
      return [];
    }
    
    let userRoles = [];
    if (Array.isArray(user.role)) {
      if (user.role.length > 0 && typeof user.role[0] === 'string' && user.role[0].startsWith('[')) {
        try {
          userRoles = JSON.parse(user.role[0]);
        } catch (parseError) {
          userRoles = user.role;
        }
      } else {
        userRoles = user.role;
      }
    } else if (typeof user.role === 'string') {
      try {
        userRoles = JSON.parse(user.role);
      } catch (parseError) {
        userRoles = [user.role];
      }
    } else {
      userRoles = [user.role];
    }
    return userRoles;
  }, []);

  useEffect(() => {
    axiosInstance.get("/products/all-backend-products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  useEffect(() => {
    axiosInstance.get("/customers")
      .then(res => {
        setCustomers(Array.isArray(res.data) ? res.data : res.data.customers || []);
      })
      .catch(err => console.error("Error fetching customers:", err));
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const currentUser = { _id: decoded.userId, name: decoded.name };

        const userRoles = parseUserRoles(decoded);
        setRole(userRoles);

        if (userRoles.includes("admin") || userRoles.includes("accounts")) {
          const res = await axiosInstance.get("/users/employees", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setEmployees([...res.data]);
        } else {
          setEmployees([currentUser]);
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      }
    };

    if (token) {
      fetchEmployees();
    }
  }, [token, parseUserRoles]);

  const getCustomerPhone = useCallback((name) => {
    if (!Array.isArray(customers)) return "N/A";
    const customer = customers.find(c => c.name === name);
    return customer ? customer.phone : "N/A";
  }, [customers]);

  const getStockForProduct = useCallback((productName) => {
    const product = products.find((p) => p.name === productName);
    return product
      ? product.quantity + product.materialPacked - product.materialDispatch
      : 0;
  }, [products]);

  return {
    products,
    employees,
    customers,
    role,
    resolvedPOUrls,
    setResolvedPOUrls,
    getCustomerPhone,
    getStockForProduct,
    parseUserRoles
  };
};