import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import { Search, Package, TrendingUp } from "lucide-react";
import Select from 'react-select';
import debounce from 'lodash/debounce';

// ✅ Starting location constant
const STARTING_LOCATION = {
  address: 'Village Sangal Sohal, Kapurthala Road, Jalandhar - 144013, Punjab, India',
  pincode: '144013',
  city: 'Jalandhar',
  state: 'Punjab',
  coordinates: { lat: 31.3260, lon: 75.5762 }
};

export default function ProductRateChecker() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rmRate, setRmRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Customer and freight related states
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDistance, setCustomerDistance] = useState(0);
  const [loadingDistance, setLoadingDistance] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Freight constants
  const FREIGHT_RATE = { tempo: 15, truck: 20 };
  const TEMPO_CAPACITY = 12;
  const TRUCK_CAPACITY = 40;

  // Coordinates cache
  const [coordinatesCache, setCoordinatesCache] = useState({
    '144013': STARTING_LOCATION.coordinates
  });

  useEffect(() => {
    fetchRMRate();
    fetchCustomers();
  }, []);

  const fetchRMRate = async () => {
    try {
      const res = await axiosInstance.get("/rm-rate");
      setRmRate(res.data.rate || 0);
    } catch (err) {
      console.error("Error fetching RM rate:", err);
    }
  };

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const res = await axiosInstance.get("/customers/customers-pincode");
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching customers:", err);
      toast.error("Failed to load customers");
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  };

  // ✅ Search products from backend with debounce
  const searchProducts = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setProducts([]);
        setShowResults(false);
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const res = await axiosInstance.get(
          `/products-multer/search?q=${encodeURIComponent(searchQuery)}&limit=50`
        );
        setProducts(res.data.products || []);
        setShowResults(true);
      } catch (err) {
        console.error("Error searching products:", err);
        toast.error("Failed to search products");
        setProducts([]);
      } finally {
        setSearching(false);
      }
    }, 300),
    []
  );

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === "") {
      setProducts([]);
      setShowResults(false);
      setSelectedProduct(null);
      return;
    }
    
    searchProducts(term);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setShowResults(false);
    setProducts([]);
  };

  // ✅ Get coordinates from pincode
  const getCoordinatesFromPincode = async (pincode) => {
    if (coordinatesCache[pincode]) {
      return coordinatesCache[pincode];
    }

    try {
      // Method 1: Try OpenStreetMap Nominatim with full address
      const pincodeRes = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
      
      if (pincodeRes.data[0].Status === 'Success' && pincodeRes.data[0].PostOffice.length > 0) {
        const area = pincodeRes.data[0].PostOffice[0];
        const fullAddress = `${area.Name}, ${area.Block || area.District}, ${area.District}, ${area.State}, ${pincode}, India`;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const osmRes = await axios.get(
          `https://nominatim.openstreetmap.org/search`,
          {
            params: {
              q: fullAddress,
              format: 'json',
              limit: 1,
              email: 'it.thermopackers@gmail.com'
            }
          }
        );
        
        if (osmRes.data.length > 0) {
          const coordinates = {
            lat: parseFloat(osmRes.data[0].lat),
            lon: parseFloat(osmRes.data[0].lon),
            city: area.District,
            state: area.State,
            area: area.Name,
            pincode: pincode,
            source: 'nominatim'
          };
          setCoordinatesCache(prev => ({ ...prev, [pincode]: coordinates }));
          return coordinates;
        }
        
        const cityStateQuery = `${area.District}, ${area.State}, India`;
        const osmRes2 = await axios.get(
          `https://nominatim.openstreetmap.org/search`,
          {
            params: {
              q: cityStateQuery,
              format: 'json',
              limit: 1,
              email: 'it.thermopackers@gmail.com'
            }
          }
        );
        
        if (osmRes2.data.length > 0) {
          const coordinates = {
            lat: parseFloat(osmRes2.data[0].lat),
            lon: parseFloat(osmRes2.data[0].lon),
            city: area.District,
            state: area.State,
            area: area.Name,
            pincode: pincode,
            source: 'nominatim-city'
          };
          setCoordinatesCache(prev => ({ ...prev, [pincode]: coordinates }));
          return coordinates;
        }
      }
      
      return getPincodeCoordinates(pincode);
    } catch (err) {
      console.error('Error getting coordinates:', err);
      return getPincodeCoordinates(pincode);
    }
  };

  // ✅ Get pincode coordinates from database
  const getPincodeCoordinates = (pincode) => {
    const pincodeDatabase = {
      '144013': { lat: 31.3260, lon: 75.5762, city: 'Jalandhar', state: 'Punjab' },
      '144001': { lat: 31.3256, lon: 75.5792, city: 'Jalandhar', state: 'Punjab' },
      '144002': { lat: 31.3265, lon: 75.5780, city: 'Jalandhar', state: 'Punjab' },
      '144003': { lat: 31.3270, lon: 75.5775, city: 'Jalandhar', state: 'Punjab' },
      '144004': { lat: 31.3245, lon: 75.5800, city: 'Jalandhar', state: 'Punjab' },
      '144005': { lat: 31.3280, lon: 75.5750, city: 'Jalandhar', state: 'Punjab' },
      '144026': { lat: 31.3300, lon: 75.5800, city: 'Jalandhar', state: 'Punjab' },
      '144411': { lat: 31.3800, lon: 75.3800, city: 'Kapurthala', state: 'Punjab' },
      '141001': { lat: 30.9010, lon: 75.8573, city: 'Ludhiana', state: 'Punjab' },
      '141002': { lat: 30.9020, lon: 75.8580, city: 'Ludhiana', state: 'Punjab' },
      '141003': { lat: 30.9000, lon: 75.8550, city: 'Ludhiana', state: 'Punjab' },
      '141004': { lat: 30.9030, lon: 75.8590, city: 'Ludhiana', state: 'Punjab' },
      '141008': { lat: 30.9040, lon: 75.8600, city: 'Ludhiana', state: 'Punjab' },
      '141401': { lat: 30.9200, lon: 75.8700, city: 'Ludhiana', state: 'Punjab' },
      '143001': { lat: 31.6340, lon: 74.8723, city: 'Amritsar', state: 'Punjab' },
      '143002': { lat: 31.6350, lon: 74.8730, city: 'Amritsar', state: 'Punjab' },
      '143005': { lat: 31.6360, lon: 74.8740, city: 'Amritsar', state: 'Punjab' },
      '143006': { lat: 31.6330, lon: 74.8710, city: 'Amritsar', state: 'Punjab' },
      '147001': { lat: 30.3398, lon: 76.3869, city: 'Patiala', state: 'Punjab' },
      '147002': { lat: 30.3400, lon: 76.3870, city: 'Patiala', state: 'Punjab' },
      '147003': { lat: 30.3380, lon: 76.3850, city: 'Patiala', state: 'Punjab' },
      '147004': { lat: 30.3410, lon: 76.3880, city: 'Patiala', state: 'Punjab' },
      '151001': { lat: 30.2110, lon: 74.9455, city: 'Bathinda', state: 'Punjab' },
      '151002': { lat: 30.2120, lon: 74.9460, city: 'Bathinda', state: 'Punjab' },
      '151005': { lat: 30.2100, lon: 74.9440, city: 'Bathinda', state: 'Punjab' },
      '841301': { lat: 25.7800, lon: 84.7500, city: 'Chapra', state: 'Bihar' },
      '841302': { lat: 25.7810, lon: 84.7510, city: 'Chapra', state: 'Bihar' },
      '841305': { lat: 25.7820, lon: 84.7520, city: 'Chapra', state: 'Bihar' },
      '841236': { lat: 25.8500, lon: 84.6500, city: 'Siwan', state: 'Bihar' },
      '800001': { lat: 25.5941, lon: 85.1376, city: 'Patna', state: 'Bihar' },
      '800002': { lat: 25.5950, lon: 85.1380, city: 'Patna', state: 'Bihar' },
      '800006': { lat: 25.5960, lon: 85.1390, city: 'Patna', state: 'Bihar' },
      '800020': { lat: 25.5970, lon: 85.1400, city: 'Patna', state: 'Bihar' },
      '842001': { lat: 26.1227, lon: 85.3748, city: 'Muzaffarpur', state: 'Bihar' },
      '842002': { lat: 26.1230, lon: 85.3750, city: 'Muzaffarpur', state: 'Bihar' },
      '843001': { lat: 25.9231, lon: 85.5868, city: 'Vaishali', state: 'Bihar' },
      '844101': { lat: 25.7500, lon: 85.2167, city: 'Hajipur', state: 'Bihar' },
      '845401': { lat: 26.6500, lon: 85.6167, city: 'Sitamarhi', state: 'Bihar' },
      '846001': { lat: 26.4573, lon: 85.8928, city: 'Darbhanga', state: 'Bihar' },
      '847001': { lat: 26.4000, lon: 86.0833, city: 'Madhubani', state: 'Bihar' },
      '848101': { lat: 25.6833, lon: 85.2167, city: 'Samastipur', state: 'Bihar' },
      '110001': { lat: 28.6166, lon: 77.2167, city: 'Delhi', state: 'Delhi' },
      '110002': { lat: 28.6170, lon: 77.2170, city: 'Delhi', state: 'Delhi' },
      '110003': { lat: 28.6180, lon: 77.2180, city: 'Delhi', state: 'Delhi' },
      '110005': { lat: 28.6190, lon: 77.2190, city: 'Delhi', state: 'Delhi' },
      '110020': { lat: 28.6200, lon: 77.2200, city: 'Delhi', state: 'Delhi' },
      '226001': { lat: 26.8467, lon: 80.9462, city: 'Lucknow', state: 'Uttar Pradesh' },
      '226002': { lat: 26.8470, lon: 80.9470, city: 'Lucknow', state: 'Uttar Pradesh' },
      '226003': { lat: 26.8480, lon: 80.9480, city: 'Lucknow', state: 'Uttar Pradesh' },
      '226004': { lat: 26.8490, lon: 80.9490, city: 'Lucknow', state: 'Uttar Pradesh' },
      '226005': { lat: 26.8500, lon: 80.9500, city: 'Lucknow', state: 'Uttar Pradesh' },
      '208001': { lat: 26.4499, lon: 80.3319, city: 'Kanpur', state: 'Uttar Pradesh' },
      '208002': { lat: 26.4500, lon: 80.3320, city: 'Kanpur', state: 'Uttar Pradesh' },
      '208003': { lat: 26.4510, lon: 80.3330, city: 'Kanpur', state: 'Uttar Pradesh' },
      '122001': { lat: 28.4089, lon: 77.3178, city: 'Gurgaon', state: 'Haryana' },
      '122002': { lat: 28.4090, lon: 77.3180, city: 'Gurgaon', state: 'Haryana' },
      '122003': { lat: 28.4100, lon: 77.3190, city: 'Gurgaon', state: 'Haryana' },
      '122004': { lat: 28.4110, lon: 77.3200, city: 'Gurgaon', state: 'Haryana' },
      '122005': { lat: 28.4120, lon: 77.3210, city: 'Gurgaon', state: 'Haryana' },
      '121001': { lat: 28.4675, lon: 77.0280, city: 'Faridabad', state: 'Haryana' },
      '121002': { lat: 28.4680, lon: 77.0290, city: 'Faridabad', state: 'Haryana' },
      '121003': { lat: 28.4690, lon: 77.0300, city: 'Faridabad', state: 'Haryana' },
      '121004': { lat: 28.4700, lon: 77.0310, city: 'Faridabad', state: 'Haryana' },
      '121005': { lat: 28.4710, lon: 77.0320, city: 'Faridabad', state: 'Haryana' },
      '302001': { lat: 26.9124, lon: 75.7873, city: 'Jaipur', state: 'Rajasthan' },
      '302002': { lat: 26.9130, lon: 75.7880, city: 'Jaipur', state: 'Rajasthan' },
      '302003': { lat: 26.9140, lon: 75.7890, city: 'Jaipur', state: 'Rajasthan' },
      '302004': { lat: 26.9150, lon: 75.7900, city: 'Jaipur', state: 'Rajasthan' },
      '302005': { lat: 26.9160, lon: 75.7910, city: 'Jaipur', state: 'Rajasthan' },
      '400001': { lat: 18.9220, lon: 72.8347, city: 'Mumbai', state: 'Maharashtra' },
      '400002': { lat: 18.9230, lon: 72.8350, city: 'Mumbai', state: 'Maharashtra' },
      '400003': { lat: 18.9240, lon: 72.8360, city: 'Mumbai', state: 'Maharashtra' },
      '400004': { lat: 18.9250, lon: 72.8370, city: 'Mumbai', state: 'Maharashtra' },
      '400005': { lat: 18.9260, lon: 72.8380, city: 'Mumbai', state: 'Maharashtra' },
      '411001': { lat: 18.5204, lon: 73.8567, city: 'Pune', state: 'Maharashtra' },
      '411002': { lat: 18.5210, lon: 73.8570, city: 'Pune', state: 'Maharashtra' },
      '411003': { lat: 18.5220, lon: 73.8580, city: 'Pune', state: 'Maharashtra' },
      '411004': { lat: 18.5230, lon: 73.8590, city: 'Pune', state: 'Maharashtra' },
      '411005': { lat: 18.5240, lon: 73.8600, city: 'Pune', state: 'Maharashtra' },
      '700001': { lat: 22.5726, lon: 88.3639, city: 'Kolkata', state: 'West Bengal' },
      '700002': { lat: 22.5730, lon: 88.3640, city: 'Kolkata', state: 'West Bengal' },
      '700003': { lat: 22.5740, lon: 88.3650, city: 'Kolkata', state: 'West Bengal' },
      '700004': { lat: 22.5750, lon: 88.3660, city: 'Kolkata', state: 'West Bengal' },
      '700005': { lat: 22.5760, lon: 88.3670, city: 'Kolkata', state: 'West Bengal' },
      '700006': { lat: 22.5770, lon: 88.3680, city: 'Kolkata', state: 'West Bengal' },
      '700007': { lat: 22.5780, lon: 88.3690, city: 'Kolkata', state: 'West Bengal' },
      '700008': { lat: 22.5790, lon: 88.3700, city: 'Kolkata', state: 'West Bengal' },
      '700009': { lat: 22.5800, lon: 88.3710, city: 'Kolkata', state: 'West Bengal' },
      '700010': { lat: 22.5810, lon: 88.3720, city: 'Kolkata', state: 'West Bengal' },
      '600001': { lat: 13.0827, lon: 80.2707, city: 'Chennai', state: 'Tamil Nadu' },
      '600002': { lat: 13.0830, lon: 80.2710, city: 'Chennai', state: 'Tamil Nadu' },
      '600003': { lat: 13.0840, lon: 80.2720, city: 'Chennai', state: 'Tamil Nadu' },
      '600004': { lat: 13.0850, lon: 80.2730, city: 'Chennai', state: 'Tamil Nadu' },
      '600005': { lat: 13.0860, lon: 80.2740, city: 'Chennai', state: 'Tamil Nadu' },
      '600006': { lat: 13.0870, lon: 80.2750, city: 'Chennai', state: 'Tamil Nadu' },
      '600007': { lat: 13.0880, lon: 80.2760, city: 'Chennai', state: 'Tamil Nadu' },
      '600008': { lat: 13.0890, lon: 80.2770, city: 'Chennai', state: 'Tamil Nadu' },
      '600009': { lat: 13.0900, lon: 80.2780, city: 'Chennai', state: 'Tamil Nadu' },
      '600010': { lat: 13.0910, lon: 80.2790, city: 'Chennai', state: 'Tamil Nadu' }
    };
    
    if (pincodeDatabase[pincode]) {
      const data = pincodeDatabase[pincode];
      return {
        lat: data.lat,
        lon: data.lon,
        city: data.city,
        state: data.state,
        area: '',
        pincode: pincode,
        source: 'database'
      };
    }
    
    const firstTwoDigits = parseInt(pincode.substring(0, 2));
    const zoneCoordinates = {
      11: { lat: 28.6139, lon: 77.2090, state: 'Delhi' },
      12: { lat: 28.4675, lon: 77.0280, state: 'Haryana' },
      13: { lat: 29.0588, lon: 76.0856, state: 'Haryana' },
      14: { lat: 31.3260, lon: 75.5762, city: 'Punjab', state: 'Punjab' },
      15: { lat: 26.8467, lon: 80.9462, state: 'UP' },
      16: { lat: 30.7339, lon: 76.7794, state: 'Punjab' },
      17: { lat: 31.1471, lon: 75.3412, state: 'Himachal' },
      18: { lat: 32.7266, lon: 74.8570, state: 'J&K' },
      19: { lat: 34.0837, lon: 74.7973, state: 'J&K' },
      20: { lat: 26.9124, lon: 75.7873, state: 'Rajasthan' },
      21: { lat: 25.2138, lon: 75.8648, state: 'Rajasthan' },
      22: { lat: 26.4499, lon: 80.3319, state: 'UP' },
      23: { lat: 25.3176, lon: 82.9739, state: 'UP' },
      24: { lat: 26.4499, lon: 80.3319, state: 'UP' },
      25: { lat: 25.5941, lon: 85.1376, state: 'Bihar' },
      26: { lat: 28.6139, lon: 77.2090, state: 'Bihar' },
      27: { lat: 26.1227, lon: 85.3748, state: 'Bihar' },
      28: { lat: 27.1767, lon: 78.0081, state: 'UP' },
      30: { lat: 27.0238, lon: 74.2179, state: 'Rajasthan' },
      31: { lat: 26.2389, lon: 73.0243, state: 'Rajasthan' },
      32: { lat: 27.2046, lon: 77.4977, state: 'MP' },
      34: { lat: 26.2183, lon: 78.1828, state: 'MP' },
      36: { lat: 22.7196, lon: 75.8577, state: 'MP' },
      37: { lat: 27.4924, lon: 77.6737, state: 'MP' },
      38: { lat: 23.1645, lon: 79.9361, state: 'MP' },
      39: { lat: 22.0796, lon: 82.1391, state: 'Chhattisgarh' },
      40: { lat: 18.9220, lon: 72.8347, state: 'Maharashtra' },
      41: { lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
      42: { lat: 19.8762, lon: 75.3433, state: 'Maharashtra' },
      44: { lat: 21.1458, lon: 79.0882, state: 'Maharashtra' },
      45: { lat: 22.7196, lon: 75.8577, state: 'MP' },
      46: { lat: 23.2599, lon: 77.4126, state: 'MP' },
      47: { lat: 23.1645, lon: 79.9361, state: 'MP' },
      48: { lat: 23.2599, lon: 77.4126, state: 'MP' },
      49: { lat: 22.0796, lon: 82.1391, state: 'Chhattisgarh' },
      50: { lat: 17.3850, lon: 78.4867, state: 'Telangana' },
      51: { lat: 16.5062, lon: 80.6480, state: 'AP' },
      52: { lat: 16.5062, lon: 80.6480, state: 'AP' },
      53: { lat: 17.3850, lon: 78.4867, state: 'AP' },
      56: { lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
      57: { lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
      58: { lat: 15.3173, lon: 75.7139, state: 'Karnataka' },
      59: { lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
      60: { lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
      63: { lat: 12.9716, lon: 77.5946, state: 'Tamil Nadu' },
      64: { lat: 10.7905, lon: 78.7047, state: 'Tamil Nadu' },
      67: { lat: 9.9312, lon: 76.2673, state: 'Kerala' },
      68: { lat: 9.9312, lon: 76.2673, state: 'Kerala' },
      69: { lat: 8.5241, lon: 76.9366, state: 'Kerala' },
      70: { lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
      71: { lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
      73: { lat: 23.6102, lon: 85.2799, state: 'Jharkhand' },
      75: { lat: 20.2961, lon: 85.8245, state: 'Odisha' },
      76: { lat: 19.8204, lon: 82.7679, state: 'Odisha' },
      77: { lat: 21.2787, lon: 81.8661, state: 'Chhattisgarh' },
      78: { lat: 26.1227, lon: 85.3748, state: 'Bihar' },
      79: { lat: 26.4573, lon: 85.8928, state: 'Bihar' },
      80: { lat: 25.5941, lon: 85.1376, state: 'Bihar' },
      81: { lat: 25.5941, lon: 85.1376, state: 'Bihar' },
      82: { lat: 24.8170, lon: 84.2344, state: 'Bihar' },
      83: { lat: 23.3441, lon: 85.3096, state: 'Jharkhand' },
      84: { lat: 25.7800, lon: 84.7500, state: 'Bihar' },
      85: { lat: 26.1227, lon: 85.3748, state: 'Bihar' },
      90: { lat: 20.2961, lon: 85.8245, state: 'Odisha' }
    };
    
    const zone = zoneCoordinates[firstTwoDigits];
    if (zone) {
      return {
        lat: zone.lat,
        lon: zone.lon,
        city: `Zone ${firstTwoDigits}`,
        state: zone.state,
        area: '',
        pincode: pincode,
        source: 'zone'
      };
    }
    
    return {
      lat: 22.5726,
      lon: 78.3639,
      city: 'India',
      state: 'India',
      area: '',
      pincode: pincode,
      source: 'fallback'
    };
  };

  // ✅ Calculate Haversine distance
  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const straightDistance = R * c;
    
    let roadFactor;
    if (straightDistance <= 10) {
      roadFactor = 1.4;
    } else if (straightDistance <= 30) {
      roadFactor = 1.25;
    } else if (straightDistance <= 100) {
      roadFactor = 1.2;
    } else if (straightDistance <= 300) {
      roadFactor = 1.15;
    } else {
      roadFactor = 1.1;
    }
    
    const isInPunjab = (lat, lon) => {
      return lat >= 29.5 && lat <= 32.5 && lon >= 73.5 && lon <= 77.0;
    };
    
    if (isInPunjab(lat1, lon1) && isInPunjab(lat2, lon2)) {
      roadFactor = Math.min(roadFactor, 1.2);
    }
    
    const isMetro = (lat, lon) => {
      const metros = [
        { lat: 28.6139, lon: 77.2090, radius: 0.5 },
        { lat: 19.0760, lon: 72.8777, radius: 0.5 },
        { lat: 13.0827, lon: 80.2707, radius: 0.5 },
        { lat: 12.9716, lon: 77.5946, radius: 0.5 },
        { lat: 22.5726, lon: 88.3639, radius: 0.5 },
        { lat: 17.3850, lon: 78.4867, radius: 0.5 },
      ];
      for (const metro of metros) {
        const d = Math.sqrt(Math.pow(lat - metro.lat, 2) + Math.pow(lon - metro.lon, 2));
        if (d < metro.radius) return true;
      }
      return false;
    };
    
    if (isMetro(lat1, lon1) || isMetro(lat2, lon2)) {
      roadFactor = roadFactor * 1.05;
    }
    
    const roadDistance = Math.ceil(straightDistance * roadFactor);
    
    console.log(`Distance: ${straightDistance.toFixed(2)} km (straight) -> ${roadDistance} km (road), Factor: ${roadFactor}`);
    
    return roadDistance;
  };

  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer);
    if (customer && customer.pincode) {
      setLoadingDistance(true);
      try {
        const destCoords = await getCoordinatesFromPincode(customer.pincode);
        const distance = calculateHaversineDistance(
          STARTING_LOCATION.coordinates.lat,
          STARTING_LOCATION.coordinates.lon,
          destCoords.lat,
          destCoords.lon
        );
        setCustomerDistance(distance);
        toast.success(`Distance: ${distance} km from Jalandhar`);
      } catch (err) {
        console.error("Error calculating distance:", err);
        toast.error("Failed to calculate distance");
      } finally {
        setLoadingDistance(false);
      }
    } else {
      setCustomerDistance(0);
    }
  };

  const calculatePrice = (product) => {
    if (!product) return null;
    
    const conversionRate = product.conversion || 0;
    const totalPerKg = rmRate + conversionRate;
    
    let weightInKg = 0;
    let weightInGrams = 0;
    
    if (product.weight) {
      const num = parseFloat(product.weight);
      if (!isNaN(num)) {
        weightInKg = num;
        weightInGrams = num * 1000;
      }
    }
    
    const unit = product.unit?.toLowerCase() || "";
    const isKgUnit = unit === "kg" || unit === "kgs";
    
    let pricePerPiece = 0;
    let isWeightBased = false;
    
    if (isKgUnit) {
      pricePerPiece = totalPerKg;
      isWeightBased = false;
    } else {
      if (weightInKg > 0) {
        pricePerPiece = totalPerKg * weightInKg;
        isWeightBased = true;
      } else {
        pricePerPiece = totalPerKg;
        isWeightBased = false;
      }
    }
    
    const gstAmount = pricePerPiece * 0.18;
    const finalPrice = pricePerPiece + gstAmount;
    
    let freightTempo = 0;
    let freightTruck = 0;
    let volumePerPiece = parseFloat(product.volumePerPiece) || 0;
    let piecesInTempo = 0;
    let piecesInTruck = 0;
    
    if (customerDistance > 0 && volumePerPiece > 0) {
      piecesInTempo = Math.floor(TEMPO_CAPACITY / volumePerPiece);
      piecesInTruck = Math.floor(TRUCK_CAPACITY / volumePerPiece);
      
      const roundTripDistance = customerDistance * 2;
      freightTempo = piecesInTempo > 0 ? (FREIGHT_RATE.tempo * roundTripDistance) / piecesInTempo : 0;
      freightTruck = piecesInTruck > 0 ? (FREIGHT_RATE.truck * roundTripDistance) / piecesInTruck : 0;
    }
    
    return {
      conversionRate,
      weightInGrams: Math.round(weightInGrams),
      weightInKg: weightInKg,
      totalPerKg,
      pricePerPiece: pricePerPiece.toFixed(2),
      isWeightBased,
      gstAmount: gstAmount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      unit: product.unit || "kg",
      customerDistance,
      volumePerPiece,
      piecesInTempo,
      piecesInTruck,
      freightTempo: freightTempo.toFixed(2),
      freightTruck: freightTruck.toFixed(2),
      tempoTotal: (parseFloat(pricePerPiece) + freightTempo).toFixed(2),
      truckTotal: (parseFloat(pricePerPiece) + freightTruck).toFixed(2)
    };
  };

  // Customer options for dropdown
  const customerOptions = Array.isArray(customers) 
    ? customers.map(c => ({
        value: c._id,
        label: `${c.name || ''} ${c.company ? `- ${c.company}` : ''} ${c.pincode ? `(${c.pincode})` : ''}`,
        customer: c
      }))
    : [];

  const result = selectedProduct ? calculatePrice(selectedProduct) : null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 relative">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">₹</span>
        Product Rate Checker
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Search product and select customer to see rate with GST and Freight
      </p>
      
      {/* Product Search */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search product by name..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {/* Search Results Dropdown */}
      {showResults && products.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto left-0">
          {products.map((product) => (
            <button
              key={product._id}
              onClick={() => handleProductSelect(product)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-150 flex items-center gap-2 border-b border-gray-100 last:border-0"
            >
              <Package size={16} className="text-blue-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800">{product.name}</span>
              <span className="text-xs text-gray-500 ml-auto">{product.unit || 'kg'}</span>
            </button>
          ))}
          {products.length >= 50 && (
            <div className="px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
              Showing first 50 results. Refine your search for more specific results.
            </div>
          )}
        </div>
      )}
      
      {showResults && products.length === 0 && searchTerm.trim() !== "" && !searching && (
        <div className="mt-2 text-sm text-gray-500 text-center py-2">
          No products found matching "{searchTerm}"
        </div>
      )}
      
      {/* Customer Selection */}
      {selectedProduct && (
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Select Customer (for freight calculation)
          </label>
          <Select
            options={customerOptions}
            onChange={(option) => handleCustomerSelect(option?.customer)}
            placeholder="Search customer by name or pincode..."
            isClearable
            isLoading={customersLoading}
            className="text-sm"
            noOptionsMessage={() => "No customers found"}
          />
          {loadingDistance && (
            <p className="text-xs text-blue-600 mt-1">Calculating distance...</p>
          )}
          {selectedCustomer && customerDistance > 0 && (
            <p className="text-xs text-green-600 mt-1">
              📍 {selectedCustomer.name} - Distance: {customerDistance} km (one way)
            </p>
          )}
        </div>
      )}
      
      {/* Results Display */}
      {selectedProduct && result && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 text-sm mb-2">
              {selectedProduct.name}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500 text-xs">Unit:</span>
                <span className="ml-1 font-medium text-xs">{selectedProduct.unit || 'kg'}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs">RM Rate:</span>
                <span className="ml-1 font-medium text-xs">₹{rmRate.toFixed(2)}/kg</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Conversion:</span>
                <span className="ml-1 font-medium text-xs">₹{result.conversionRate.toFixed(2)}/kg</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Total/kg:</span>
                <span className="ml-1 font-medium text-green-600 text-xs">₹{result.totalPerKg.toFixed(2)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 text-xs">Volume/Piece:</span>
                <span className="ml-1 font-medium text-xs">
                  {result.volumePerPiece > 0 ? `${result.volumePerPiece} m³` : '⚠️ N/A (Add volume in product)'}
                </span>
              </div>
              {result.isWeightBased && (
                <div className="col-span-2">
                  <span className="text-gray-500 text-xs">Weight:</span>
                  <span className="ml-1 font-medium text-xs">{result.weightInGrams > 0 ? `${result.weightInGrams} g` : 'N/A'}</span>
                </div>
              )}
            </div>
            
            {/* Main Price */}
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium text-xs">Price per {result.isWeightBased ? 'Piece' : 'kg'}:</span>
                <span className="text-sm font-bold text-purple-600">₹{result.pricePerPiece}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-500 text-xs">GST (18%):</span>
                <span className="text-orange-600 font-medium text-xs">₹{result.gstAmount}</span>
              </div>
              <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-200">
                <span className="text-gray-700 font-semibold text-xs">Price incl. GST:</span>
                <span className="text-sm font-bold text-green-600">₹{result.finalPrice}</span>
              </div>
            </div>
            
            {/* Freight Calculation Details */}
            {customerDistance > 0 && result.volumePerPiece > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">🚚 Freight Calculation Details</p>
                
                <div className="bg-gray-50 p-2 rounded mb-2 text-xs">
                  <p className="font-medium">📏 Distance: {customerDistance} km (one way)</p>
                  <p className="font-medium">🔄 Round Trip: {customerDistance * 2} km</p>
                  <p className="font-medium">📦 Volume per piece: {result.volumePerPiece} m³</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Tempo Details */}
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="font-bold text-blue-700 mb-1">🚛 Tempo (12m³)</p>
                    
                    <div className="bg-white p-1 rounded mb-1">
                      <p className="text-gray-600">1️⃣ Pieces per tempo:</p>
                      <p className="font-mono text-xs">
                        {TEMPO_CAPACITY} ÷ {result.volumePerPiece} = <span className="font-bold">{result.piecesInTempo}</span>
                      </p>
                    </div>
                    
                    <div className="bg-white p-1 rounded mb-1">
                      <p className="text-gray-600">2️⃣ Round trip distance:</p>
                      <p className="font-mono text-xs">
                        {customerDistance} × 2 = <span className="font-bold">{customerDistance * 2} km</span>
                      </p>
                    </div>
                    
                    <div className="bg-white p-1 rounded mb-1">
                      <p className="text-gray-600">3️⃣ Total freight:</p>
                      <p className="font-mono text-xs">
                        {customerDistance * 2} × ₹{FREIGHT_RATE.tempo} = <span className="font-bold">₹{(FREIGHT_RATE.tempo * customerDistance * 2).toLocaleString()}</span>
                      </p>
                    </div>
                    
                    <div className="bg-white p-1 rounded mb-1">
                      <p className="text-gray-600">4️⃣ Freight per piece:</p>
                      <p className="font-mono text-xs">
                        ₹{(FREIGHT_RATE.tempo * customerDistance * 2).toLocaleString()} ÷ {result.piecesInTempo} = <span className="font-bold">₹{result.freightTempo}</span>
                      </p>
                    </div>
                    
                    <div className="bg-blue-100 p-1 rounded">
                      <p className="font-bold text-blue-700">5️⃣ Total per piece:</p>
                      <p className="font-mono text-xs font-bold">
                        ₹{result.pricePerPiece} + ₹{result.freightTempo} = <span className="text-lg">₹{result.tempoTotal}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Truck Details */}
                  <div className="bg-orange-50 p-2 rounded">
                    <p className="font-bold text-orange-700 mb-1">🚛 Truck (40m³)</p>
                    
                    <div className="bg-white p-1 rounded mb-1">
                      <p className="text-gray-600">1️⃣ Pieces per truck:</p>
                      <p className="font-mono text-xs">
                        {TRUCK_CAPACITY} ÷ {result.volumePerPiece} = <span className="font-bold">{result.piecesInTruck}</span>
                      </p>
                    </div>
                    
                    <div className="bg-white p-1 rounded mb-1">
                      <p className="text-gray-600">2️⃣ Round trip distance:</p>
                      <p className="font-mono text-xs">
                        {customerDistance} × 2 = <span className="font-bold">{customerDistance * 2} km</span>
                      </p>
                    </div>
                    
                    <div className="bg-white p-1 rounded mb-1">
                      <p className="text-gray-600">3️⃣ Total freight:</p>
                      <p className="font-mono text-xs">
                        {customerDistance * 2} × ₹{FREIGHT_RATE.truck} = <span className="font-bold">₹{(FREIGHT_RATE.truck * customerDistance * 2).toLocaleString()}</span>
                      </p>
                    </div>
                    
                    <div className="bg-white p-1 rounded mb-1">
                      <p className="text-gray-600">4️⃣ Freight per piece:</p>
                      <p className="font-mono text-xs">
                        ₹{(FREIGHT_RATE.truck * customerDistance * 2).toLocaleString()} ÷ {result.piecesInTruck} = <span className="font-bold">₹{result.freightTruck}</span>
                      </p>
                    </div>
                    
                    <div className="bg-orange-100 p-1 rounded">
                      <p className="font-bold text-orange-700">5️⃣ Total per piece:</p>
                      <p className="font-mono text-xs font-bold">
                        ₹{result.pricePerPiece} + ₹{result.freightTruck} = <span className="text-lg">₹{result.truckTotal}</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 mt-1">
                  📍 Based on {customerDistance} km (one way) • {customerDistance * 2} km round trip
                </p>
              </div>
            )}
            
            {customerDistance > 0 && result.volumePerPiece === 0 && (
              <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                ⚠️ Volume per piece not set. Add volume in product to calculate freight.
              </div>
            )}
            
            {customerDistance === 0 && selectedCustomer && (
              <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                ⚠️ Could not calculate distance. Please check customer pincode.
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
              <TrendingUp size={12} />
              <span>Based on current RM rate: ₹{rmRate.toFixed(2)}/kg</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}