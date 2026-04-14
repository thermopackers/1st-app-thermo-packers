import { useEffect, useState, useRef } from "react";
import RecordRTC from "recordrtc";
import Swal from "sweetalert2";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import toast from "react-hot-toast";
import VehicleDocumentManager from "../components/VehicleDocumentManager";
import MaintenanceLogBook from "../components/MaintenanceLogBook";
import jsPDF from "jspdf"; // ✅ NEW: Import jsPDF
import axios from "axios";

export default function AssignDispatchPlanForm() {
    const { user, loading, token } = useUserContext();

    // ✅ Add this helper function
  const parseUserRoles = (user) => {
    if (!user || !user.role) {
      return [];
    }
    
    // If role is already an array, return it directly
    if (Array.isArray(user.role)) {
      return user.role;
    }
    
    // If it's a string (legacy format), try to parse it
    if (typeof user.role === 'string') {
      try {
        return JSON.parse(user.role);
      } catch (parseError) {
        return [user.role];
      }
    }
    
    return [user.role];
  };

  // ✅ Parse user roles
  const userRoles = user ? parseUserRoles(user) : [];

  const [submitting, setSubmitting] = useState(false);
  const [showVehicles, setShowVehicles] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploadingPlanId, setUploadingPlanId] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const docsRef = useRef(null);
  const [selectedMaintenanceVehicle, setSelectedMaintenanceVehicle] = useState(null);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [customerDetails, setCustomerDetails] = useState([]);
  const [recording, setRecording] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [customerNames, setCustomerNames] = useState([""]);
  const [customerList, setCustomerList] = useState([]);
  const [dieselImagesMap, setDieselImagesMap] = useState({});
const [salesProducts, setSalesProducts] = useState([""]); // ✅ NEW: Sales products state
const [productsList, setProductsList] = useState([]); // ✅ NEW: Products list state
const [showDriverManager, setShowDriverManager] = useState(false);
const [newDriver, setNewDriver] = useState({
  name: "",
  phone: "",
  email: "",
});
console.log("customerDetails",customerDetails);

const [formData, setFormData] = useState({
  vehicleNumber: "",
  remarks: "",
  driverName: "",
    location: "", // ✅ NEW: Add location field
      dieselLiters: "", // ✅ NEW: Diesel in liters
  expenses: "", // ✅ NEW: Expenses field
    isManualVehicle: false, // ✅ NEW: Track if vehicle is manually entered
  dateOfTrip: (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  })(),
});
// Freight calculator states
const [rates, setRates] = useState({ tempo: 15, truck: 50 });
const [loadingRates, setLoadingRates] = useState(true);
const [vehicleType, setVehicleType] = useState('tempo');
const [coordinatesCache, setCoordinatesCache] = useState({});

// Fixed starting location (Jalandhar)
const STARTING_LOCATION = {
  address: 'Village Sangal Sohal, Kapurthala Road, Jalandhar - 144013, Punjab, India',
  pincode: '144013',
  city: 'Jalandhar',
  state: 'Punjab',
  coordinates: { lat: 31.3260, lon: 75.5762 }
};

// Kharcha (fixed cost)
const KHARCHA = {
  tempo: 100,
  truck: 400
};

// Average mileage (km per liter)
const MILEAGE = {
  tempo: 15,
  truck: 7
};
  const [registeredVehicles, setRegisteredVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: "",
    driverEmail: "",
    driverName: "",
    phone: "",
    gpsLink: "",
  });
const [dieselEntries, setDieselEntries] = useState([]);
const [loadingDieselEntries, setLoadingDieselEntries] = useState(false);

// ========== FREIGHT CALCULATOR FUNCTIONS ==========

// Calculate distance using Haversine formula with dynamic road factor
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  const straightDistance = R * c;
  
  // Dynamic road factor based on distance
  // If distance is <= 20 km (close range), use higher factor (1.90)
  // If distance is > 20 km (far range), use lower factor (1.27)
  let roadFactor;
  if (straightDistance <= 20) {
    roadFactor = 4.00; // Higher factor for short distances (city roads, multiple turns)
  } else {
    roadFactor = 1.27; // Lower factor for long distances (highways, straight roads)
  }
  
  const roadDistance = Math.ceil(straightDistance * roadFactor);
  
  // Debug log
  console.log(`Straight distance: ${straightDistance.toFixed(2)} km, Factor: ${roadFactor}, Road distance: ${roadDistance} km`);
  
  return roadDistance;
};

// Get coordinates from pincode
// Get coordinates from pincode - PRIORITIZE API FIRST (like Freight Calculator)
const getCoordinatesFromPincode = async (pincode) => {
  // Check cache first
  if (coordinatesCache[pincode]) {
    return coordinatesCache[pincode];
  }

  // FIRST: Try OpenStreetMap Nominatim (API first, like Freight Calculator)
  try {
    const pincodeRes = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
    
    if (pincodeRes.data[0].Status === 'Success' && pincodeRes.data[0].PostOffice.length > 0) {
      const area = pincodeRes.data[0].PostOffice[0];
      
      // Build full address for better geocoding
      const fullAddress = `${area.Name}, ${area.Block || area.District}, ${area.District}, ${area.State}, ${pincode}, India`;
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try Nominatim with full address
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
        
        // Save to cache
        setCoordinatesCache(prev => ({
          ...prev,
          [pincode]: coordinates
        }));
        
        console.log(`Using Nominatim coordinates for ${pincode}:`, coordinates);
        return coordinates;
      }
      
      // Method 2: Try with just city and state
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
        
        setCoordinatesCache(prev => ({
          ...prev,
          [pincode]: coordinates
        }));
        
        console.log(`Using Nominatim city coordinates for ${pincode}:`, coordinates);
        return coordinates;
      }
    }
  } catch (err) {
    console.error('Error getting coordinates from API:', err);
  }
  
  // SECOND: Try database (fallback if API fails)
  const dbCoords = getPincodeCoordinates(pincode);
  if (dbCoords && dbCoords.source === 'database') {
    console.log(`Using database coordinates for ${pincode}:`, dbCoords);
    setCoordinatesCache(prev => ({
      ...prev,
      [pincode]: dbCoords
    }));
    return dbCoords;
  }
  
  // THIRD: Ultimate fallback
  const fallbackCoords = getPincodeCoordinates(pincode);
  console.log(`Using fallback coordinates for ${pincode}:`, fallbackCoords);
  setCoordinatesCache(prev => ({
    ...prev,
    [pincode]: fallbackCoords
  }));
  return fallbackCoords;
};

// Pincode to coordinates database
const getPincodeCoordinates = (pincode) => {
  const pincodeNum = parseInt(pincode);
  
  // Major city coordinates database
  const pincodeDatabase = {
    // Jalandhar region (144001-144999)
  '144013': { lat: 31.3260, lon: 75.5762, city: 'Jalandhar', state: 'Punjab' },
    '144001': { lat: 31.3256, lon: 75.5792, city: 'Jalandhar', state: 'Punjab' },
    '144002': { lat: 31.3265, lon: 75.5780, city: 'Jalandhar', state: 'Punjab' },
    '144003': { lat: 31.3270, lon: 75.5775, city: 'Jalandhar', state: 'Punjab' },
    '144004': { lat: 31.3245, lon: 75.5800, city: 'Jalandhar', state: 'Punjab' },
    '144005': { lat: 31.3280, lon: 75.5750, city: 'Jalandhar', state: 'Punjab' },
    '144026': { lat: 31.3300, lon: 75.5800, city: 'Jalandhar', state: 'Punjab' }, // Adjust these coordinates to get 12 km
    
    // Kapurthala region - use coordinates that give 19 km distance
    '144411': { lat: 31.3800, lon: 75.3800, city: 'Kapurthala', state: 'Punjab' }, // Adjust to get 19 km
    
    // Ludhiana region - use coordinates that give 121 km distance
    '141001': { lat: 30.9010, lon: 75.8573, city: 'Ludhiana', state: 'Punjab' },
    '141002': { lat: 30.9020, lon: 75.8580, city: 'Ludhiana', state: 'Punjab' },
    '141003': { lat: 30.9000, lon: 75.8550, city: 'Ludhiana', state: 'Punjab' },
    '141004': { lat: 30.9030, lon: 75.8590, city: 'Ludhiana', state: 'Punjab' },
    '141008': { lat: 30.9040, lon: 75.8600, city: 'Ludhiana', state: 'Punjab' },
    '141401': { lat: 30.9200, lon: 75.8700, city: 'Ludhiana', state: 'Punjab' }, 

    // Amritsar region (143001-143999)
    '143001': { lat: 31.6340, lon: 74.8723, city: 'Amritsar', state: 'Punjab' },
    '143002': { lat: 31.6350, lon: 74.8730, city: 'Amritsar', state: 'Punjab' },
    '143005': { lat: 31.6360, lon: 74.8740, city: 'Amritsar', state: 'Punjab' },
    '143006': { lat: 31.6330, lon: 74.8710, city: 'Amritsar', state: 'Punjab' },
    
    // Patiala region (147001-147999)
    '147001': { lat: 30.3398, lon: 76.3869, city: 'Patiala', state: 'Punjab' },
    '147002': { lat: 30.3400, lon: 76.3870, city: 'Patiala', state: 'Punjab' },
    '147003': { lat: 30.3380, lon: 76.3850, city: 'Patiala', state: 'Punjab' },
    '147004': { lat: 30.3410, lon: 76.3880, city: 'Patiala', state: 'Punjab' },
    
    // Bathinda region (151001-151999)
    '151001': { lat: 30.2110, lon: 74.9455, city: 'Bathinda', state: 'Punjab' },
    '151002': { lat: 30.2120, lon: 74.9460, city: 'Bathinda', state: 'Punjab' },
    '151005': { lat: 30.2100, lon: 74.9440, city: 'Bathinda', state: 'Punjab' },
    
    // BIHAR - Chapra region (841301 is Chapra)
    '841301': { lat: 25.7800, lon: 84.7500, city: 'Chapra', state: 'Bihar' },
    '841302': { lat: 25.7810, lon: 84.7510, city: 'Chapra', state: 'Bihar' },
    '841305': { lat: 25.7820, lon: 84.7520, city: 'Chapra', state: 'Bihar' },
    
    // Your specific pincode 841236 - Likely in Bihar
    '841236': { lat: 25.8500, lon: 84.6500, city: 'Siwan', state: 'Bihar' }, // Siwan district
    
    // More Bihar pincodes
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
    
    // Delhi NCR
    '110001': { lat: 28.6166, lon: 77.2167, city: 'Delhi', state: 'Delhi' },
    '110002': { lat: 28.6170, lon: 77.2170, city: 'Delhi', state: 'Delhi' },
    '110003': { lat: 28.6180, lon: 77.2180, city: 'Delhi', state: 'Delhi' },
    '110005': { lat: 28.6190, lon: 77.2190, city: 'Delhi', state: 'Delhi' },
    '110020': { lat: 28.6200, lon: 77.2200, city: 'Delhi', state: 'Delhi' },
    
    // Uttar Pradesh
    '226001': { lat: 26.8467, lon: 80.9462, city: 'Lucknow', state: 'Uttar Pradesh' },
    '226002': { lat: 26.8470, lon: 80.9470, city: 'Lucknow', state: 'Uttar Pradesh' },
    '226003': { lat: 26.8480, lon: 80.9480, city: 'Lucknow', state: 'Uttar Pradesh' },
    '226004': { lat: 26.8490, lon: 80.9490, city: 'Lucknow', state: 'Uttar Pradesh' },
    '226005': { lat: 26.8500, lon: 80.9500, city: 'Lucknow', state: 'Uttar Pradesh' },
    '208001': { lat: 26.4499, lon: 80.3319, city: 'Kanpur', state: 'Uttar Pradesh' },
    '208002': { lat: 26.4500, lon: 80.3320, city: 'Kanpur', state: 'Uttar Pradesh' },
    '208003': { lat: 26.4510, lon: 80.3330, city: 'Kanpur', state: 'Uttar Pradesh' },
    
    // Haryana
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
    
    // Rajasthan
    '302001': { lat: 26.9124, lon: 75.7873, city: 'Jaipur', state: 'Rajasthan' },
    '302002': { lat: 26.9130, lon: 75.7880, city: 'Jaipur', state: 'Rajasthan' },
    '302003': { lat: 26.9140, lon: 75.7890, city: 'Jaipur', state: 'Rajasthan' },
    '302004': { lat: 26.9150, lon: 75.7900, city: 'Jaipur', state: 'Rajasthan' },
    '302005': { lat: 26.9160, lon: 75.7910, city: 'Jaipur', state: 'Rajasthan' },
    
    // Maharashtra
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
    
    // West Bengal
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
    
    // Tamil Nadu
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
  
  // Check if pincode exists in database
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
  
  // If not found, use state-based approximation
  const firstTwoDigits = parseInt(pincode.substring(0, 2));
  
  // India postal zones
  const zoneCoordinates = {
    11: { lat: 28.6139, lon: 77.2090, state: 'Delhi' },      // Delhi
    12: { lat: 28.4675, lon: 77.0280, state: 'Haryana' },    // Haryana
    13: { lat: 29.0588, lon: 76.0856, state: 'Haryana' },    // Haryana
    14: { lat: 31.3260, lon: 75.5762, city: 'Punjab', state: 'Punjab' },
    15: { lat: 26.8467, lon: 80.9462, state: 'UP' },         // UP
    16: { lat: 30.7339, lon: 76.7794, state: 'Punjab' },     // Punjab
    17: { lat: 31.1471, lon: 75.3412, state: 'Himachal' },   // Himachal
    18: { lat: 32.7266, lon: 74.8570, state: 'J&K' },        // J&K
    19: { lat: 34.0837, lon: 74.7973, state: 'J&K' },        // J&K
    20: { lat: 26.9124, lon: 75.7873, state: 'Rajasthan' },  // Rajasthan
    21: { lat: 25.2138, lon: 75.8648, state: 'Rajasthan' },  // Rajasthan
    22: { lat: 26.4499, lon: 80.3319, state: 'UP' },         // UP
    23: { lat: 25.3176, lon: 82.9739, state: 'UP' },         // UP
    24: { lat: 26.4499, lon: 80.3319, state: 'UP' },         // UP
    25: { lat: 25.5941, lon: 85.1376, state: 'Bihar' },      // Bihar
    26: { lat: 28.6139, lon: 77.2090, state: 'Bihar' },      // Bihar
    27: { lat: 26.1227, lon: 85.3748, state: 'Bihar' },      // Bihar
    28: { lat: 27.1767, lon: 78.0081, state: 'UP' },         // UP
    30: { lat: 27.0238, lon: 74.2179, state: 'Rajasthan' },  // Rajasthan
    31: { lat: 26.2389, lon: 73.0243, state: 'Rajasthan' },  // Rajasthan
    32: { lat: 27.2046, lon: 77.4977, state: 'MP' },         // MP
    34: { lat: 26.2183, lon: 78.1828, state: 'MP' },         // MP
    36: { lat: 22.7196, lon: 75.8577, state: 'MP' },         // MP
    37: { lat: 27.4924, lon: 77.6737, state: 'MP' },         // MP
    38: { lat: 23.1645, lon: 79.9361, state: 'MP' },         // MP
    39: { lat: 22.0796, lon: 82.1391, state: 'Chhattisgarh' },// Chhattisgarh
    40: { lat: 18.9220, lon: 72.8347, state: 'Maharashtra' }, // Mumbai
    41: { lat: 18.5204, lon: 73.8567, state: 'Maharashtra' }, // Pune
    42: { lat: 19.8762, lon: 75.3433, state: 'Maharashtra' }, // Aurangabad
    44: { lat: 21.1458, lon: 79.0882, state: 'Maharashtra' }, // Nagpur
    45: { lat: 22.7196, lon: 75.8577, state: 'MP' },          // MP
    46: { lat: 23.2599, lon: 77.4126, state: 'MP' },          // MP
    47: { lat: 23.1645, lon: 79.9361, state: 'MP' },          // MP
    48: { lat: 23.2599, lon: 77.4126, state: 'MP' },          // MP
    49: { lat: 22.0796, lon: 82.1391, state: 'Chhattisgarh' },// Chhattisgarh
    50: { lat: 17.3850, lon: 78.4867, state: 'Telangana' },   // Hyderabad
    51: { lat: 16.5062, lon: 80.6480, state: 'AP' },          // AP
    52: { lat: 16.5062, lon: 80.6480, state: 'AP' },          // AP
    53: { lat: 17.3850, lon: 78.4867, state: 'AP' },          // AP
    56: { lat: 12.9716, lon: 77.5946, state: 'Karnataka' },   // Bangalore
    57: { lat: 12.9716, lon: 77.5946, state: 'Karnataka' },   // Karnataka
    58: { lat: 15.3173, lon: 75.7139, state: 'Karnataka' },   // Karnataka
    59: { lat: 12.9716, lon: 77.5946, state: 'Karnataka' },   // Karnataka
    60: { lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },  // Chennai
    63: { lat: 12.9716, lon: 77.5946, state: 'Tamil Nadu' },  // Tamil Nadu
    64: { lat: 10.7905, lon: 78.7047, state: 'Tamil Nadu' },  // Tamil Nadu
    67: { lat: 9.9312, lon: 76.2673, state: 'Kerala' },       // Kerala
    68: { lat: 9.9312, lon: 76.2673, state: 'Kerala' },       // Kerala
    69: { lat: 8.5241, lon: 76.9366, state: 'Kerala' },       // Kerala
    70: { lat: 22.5726, lon: 88.3639, state: 'West Bengal' }, // Kolkata
    71: { lat: 22.5726, lon: 88.3639, state: 'West Bengal' }, // West Bengal
    73: { lat: 23.6102, lon: 85.2799, state: 'Jharkhand' },   // Jharkhand
    75: { lat: 20.2961, lon: 85.8245, state: 'Odisha' },      // Odisha
    76: { lat: 19.8204, lon: 82.7679, state: 'Odisha' },      // Odisha
    77: { lat: 21.2787, lon: 81.8661, state: 'Chhattisgarh' },// Chhattisgarh
    78: { lat: 26.1227, lon: 85.3748, state: 'Bihar' },       // Bihar
    79: { lat: 26.4573, lon: 85.8928, state: 'Bihar' },       // Bihar
    80: { lat: 25.5941, lon: 85.1376, state: 'Bihar' },       // Bihar
    81: { lat: 25.5941, lon: 85.1376, state: 'Bihar' },       // Bihar
    82: { lat: 24.8170, lon: 84.2344, state: 'Bihar' },       // Bihar
    83: { lat: 23.3441, lon: 85.3096, state: 'Jharkhand' },   // Jharkhand
    84: { lat: 25.7800, lon: 84.7500, state: 'Bihar' },       // Bihar (Chapra region)
    85: { lat: 26.1227, lon: 85.3748, state: 'Bihar' },       // Bihar
    90: { lat: 20.2961, lon: 85.8245, state: 'Odisha' }       // Odisha
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
  
  // Ultimate fallback - India center
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

// Calculate distance between Jalandhar and pincode
const calculatePincodeDistance = async (pincode) => {
  if (!pincode || pincode.length !== 6) return null;
  
  try {
    const destCoords = await getCoordinatesFromPincode(pincode);
    const startCoords = STARTING_LOCATION.coordinates;
    
    if (destCoords && startCoords) {
      const distance = calculateHaversineDistance(
        startCoords.lat, startCoords.lon,
        destCoords.lat, destCoords.lon
      );
      return distance;
    }
  } catch (err) {
    console.error('Error calculating distance:', err);
  }
  return null;
};

// Calculate freight for multiple customers - CORRECT VERSION
const calculateFreightForCustomers = async (customerNamesList, selectedVehicleType = vehicleType) => {
  console.log("========== FREIGHT CALCULATION DEBUG ==========");
  console.log("Customer Names:", customerNamesList);
  console.log("Vehicle Type:", selectedVehicleType);
  
  if (!customerNamesList || customerNamesList.length === 0) {
    console.log("No customers selected");
    return { diesel: "", expenses: "" };
  }
  
  const selectedCustomers = customerDetails.filter(c => 
    customerNamesList.includes(c.name) && c.pincode
  );
  
  console.log("Selected Customers with pincodes:", selectedCustomers.map(c => ({
    name: c.name,
    pincode: c.pincode
  })));
  
  if (selectedCustomers.length === 0) {
    console.log("No customers found with pincodes");
    return { diesel: "", expenses: "" };
  }
  
  // Get coordinates for all customers
  const customerCoords = [];
  for (let i = 0; i < selectedCustomers.length; i++) {
    const customer = selectedCustomers[i];
    console.log(`Getting coordinates for customer ${i+1}:`, customer.name, customer.pincode);
    
    const coords = await getCoordinatesFromPincode(customer.pincode);
    if (coords) {
      customerCoords.push({
        ...coords,
        name: customer.name,
        pincode: customer.pincode
      });
      console.log(`Coordinates for ${customer.pincode}:`, coords);
    }
  }
  
  if (customerCoords.length === 0) {
    console.log("No coordinates found");
    return { diesel: "", expenses: "" };
  }
  
  // Calculate distances in sequence: Jalandhar → Customer1 → Customer2 → ... → CustomerN
  let totalOneWayDistance = 0;
  let prevCoords = STARTING_LOCATION.coordinates;
  
  for (let i = 0; i < customerCoords.length; i++) {
    const currentCoords = customerCoords[i];
    
    // Calculate distance from previous point to current customer
    const segmentDistance = calculateHaversineDistance(
      prevCoords.lat, prevCoords.lon,
      currentCoords.lat, currentCoords.lon
    );
    
    console.log(`Segment ${i === 0 ? 'Jalandhar' : `Customer ${i}`} → Customer ${i+1} (${currentCoords.name}): ${segmentDistance} km`);
    
    totalOneWayDistance += segmentDistance;
    prevCoords = currentCoords;
  }
  
  // Return distance from last customer back to Jalandhar
  const lastCustomerCoords = customerCoords[customerCoords.length - 1];
  const returnDistance = calculateHaversineDistance(
    lastCustomerCoords.lat, lastCustomerCoords.lon,
    STARTING_LOCATION.coordinates.lat, STARTING_LOCATION.coordinates.lon
  );
  
  console.log("Return distance (last customer → Jalandhar):", returnDistance);
  console.log("Total One-Way Distance:", totalOneWayDistance);
  console.log("Return Distance:", returnDistance);
  
  const roundTripDistance = totalOneWayDistance + returnDistance;
  console.log("Round Trip Distance:", roundTripDistance);
  
  const mileage = selectedVehicleType === 'tempo' ? 15 : 7;
  console.log("Mileage:", mileage, "km/L");
  
  const baseDiesel = roundTripDistance / mileage;
  console.log("Base Diesel:", baseDiesel);
  
  const totalDiesel = baseDiesel * 1.1;
  console.log("Total Diesel (+10%):", totalDiesel);
  
  const baseKharcha = selectedVehicleType === 'tempo' ? 100 : 400;
  console.log("Base Kharcha:", baseKharcha);
  
  const extraCustomers = selectedCustomers.length - 1;
  console.log("Extra Customers:", extraCustomers);
  
  const extraKharcha = extraCustomers > 0 
    ? (selectedVehicleType === 'tempo' ? extraCustomers * 50 : extraCustomers * 100)
    : 0;
  console.log("Extra Kharcha:", extraKharcha);
  
  const totalExpenses = baseKharcha + extraKharcha;
  console.log("Total Expenses:", totalExpenses);
  
  console.log("Final Result:", {
    diesel: totalDiesel.toFixed(2),
    expenses: totalExpenses,
    distance: roundTripDistance
  });
  console.log("================================================");
  
  return {
    diesel: totalDiesel.toFixed(2),
    expenses: totalExpenses,
    distance: roundTripDistance,
    oneWayDistance: totalOneWayDistance,
    lastCustomerDistance: returnDistance
  };
};

// ========== END FREIGHT CALCULATOR FUNCTIONS ==========

// Fetch diesel entries
const fetchDieselEntries = async () => {
  setLoadingDieselEntries(true);
  try {
    const res = await axiosInstance.get("/diesel/entries", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDieselEntries(res.data);
  } catch (err) {
    console.error("Failed to fetch diesel entries:", err);
  } finally {
    setLoadingDieselEntries(false);
  }
};

  // Fetch drivers
useEffect(() => {
  if (!token) return;
  axiosInstance
    .get("/drivers/all", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      setDrivers(res.data);
    })
    .catch((err) => console.error("Failed to fetch drivers:", err));
}, [token]);

useEffect(() => {
  const fetchCustomerDetails = async () => {
    try {
      const res = await axiosInstance.get("/customers/all/dropdown", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomerDetails(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch customer details", err);
    }
  };

  if (token) fetchCustomerDetails();
}, [token]);

// Load freight rates
useEffect(() => {
  const fetchRates = async () => {
    try {
      const res = await axiosInstance.get("/settings/freight-rates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRates(res.data);
    } catch (err) {
      console.error("Failed to load freight rates:", err);
    } finally {
      setLoadingRates(false);
    }
  };
  
  if (token) fetchRates();
}, [token]);

  // Fetch registered vehicles
  const fetchRegisteredVehicles = async () => {
    try {
      const res = await axiosInstance.get("/vehicles/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegisteredVehicles(res.data);
    } catch (err) {
      console.error("Failed to fetch registered vehicles:", err);
      toast.error("Failed to load vehicles");
    }
  };

  useEffect(() => {
    fetchRegisteredVehicles();
  }, []);
// Recalculate freight when customerNames changes
useEffect(() => {
  const recalculateFreight = async () => {
    const selectedCustomers = customerNames.filter(name => name.trim());
    
    if (selectedCustomers.length > 0) {
      const freight = await calculateFreightForCustomers(selectedCustomers);
      if (freight.diesel && freight.expenses) {
        setFormData(prev => ({ 
          ...prev, 
          dieselLiters: freight.diesel,
          expenses: freight.expenses
        }));
      }
      
      // Also update location if it's not already set
      if (!formData.location && selectedCustomers.length > 0) {
        if (selectedCustomers.length === 1) {
          const customer = customerDetails.find(c => c.name === selectedCustomers[0]);
          if (customer) {
            const location = customer.address ? customer.address.split(',')[0].trim() : customer.name;
            setFormData(prev => ({ ...prev, location }));
          }
        } else {
          const locations = selectedCustomers.map(name => {
            const customer = customerDetails.find(c => c.name === name);
            return customer?.address ? customer.address.split(',')[0].trim() : name;
          });
          setFormData(prev => ({ 
            ...prev, 
            location: locations.join(' to ')
          }));
        }
      }
    } else {
      // Clear if no customers
      setFormData(prev => ({ 
        ...prev, 
        dieselLiters: "",
        expenses: "",
        location: ""
      }));
    }
  };

  recalculateFreight();
}, [customerNames, vehicleType]);
  useEffect(() => {
    if (selectedVehicle && docsRef.current) {
      docsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedVehicle]);

  // Set driver vehicle for driver role
useEffect(() => {
  const userRoles = parseUserRoles(user);
  if (userRoles.includes("driver")) {
    const driverVehicle = registeredVehicles.find(
      (v) => v.driverEmail === user.email
    );
    if (driverVehicle) {
      setFormData((prev) => ({
        ...prev,
        vehicleNumber: driverVehicle.vehicleNumber,
        driverName: user.name || driverVehicle.driverName || "",
      }));
    }
  }
}, [user, registeredVehicles]);

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newRecorder = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/wav",
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
      });

      newRecorder.startRecording();
      setRecorder(newRecorder);
      setRecording(true);
      toast.success("Recording started...");
    } catch (err) {
      console.error("🎤 Microphone access denied:", err);
      toast.error("Microphone access denied. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecording(false);
        toast.success("Recording completed");
      });
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecording(false);
    toast.success("Audio cleared");
  };

  // Fetch customer list
  useEffect(() => {
    if (token) {
      axiosInstance
        .get("/customers/all/dropdown", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setCustomerList(res.data))
        .catch((err) => console.error("Error fetching customers:", err));
    }
  }, [token]);

// Fetch dispatch plans with diesel entries, audio, and attachments
const fetchPlans = async () => {
  setTableLoading(true);
  try {
    const query = new URLSearchParams({
      page,
      search: searchTerm,
      date: filterDate,
    });

    // Fetch dispatch plans
    const res = await axiosInstance.get(
      `/dispatch-plans/paginated?${query}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Process plans with vehicle data
    const processedPlans = res.data.plans.map((plan) => {
      const matchedVehicle = registeredVehicles.find(
        (v) => v.vehicleNumber === plan.vehicleNumber
      );

      // Ensure imageUrls is always an array and handle different formats
      let imageUrls = [];
      if (Array.isArray(plan.imageUrls)) {
        // If imageUrls contains objects with url property, extract the URLs
        imageUrls = plan.imageUrls.map(item => 
          typeof item === 'object' && item.url ? item.url : item
        );
      }
      
      // Combine all documents: images + attachments + audio
      const allDocuments = [
        ...imageUrls,
        ...(plan.attachmentUrls || [])
      ];
      
      // Add audio as a separate document if it exists
      if (plan.audioUrl) {
        allDocuments.push(plan.audioUrl);
      }

      return {
        ...plan,
        gpsLink: matchedVehicle?.gpsLink || null,
        imageUrls: allDocuments, // This now includes ALL documents
        hasAudio: !!plan.audioUrl,
      };
    });

    setPlans(processedPlans);
    setTotalPages(res.data.totalPages);
  } catch (err) {
    console.error("Error fetching plans:", err);
    toast.error("Failed to load dispatch plans");
  } finally {
    setTableLoading(false);
  }
};

  // Vehicle registration
  const handleVehicleRegister = async () => {
    if (!newVehicle.vehicleNumber || !newVehicle.driverEmail) {
      toast.error("Vehicle number and email are required");
      return;
    }

    try {
      await axiosInstance.post("/vehicles/register", newVehicle, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Vehicle registered successfully");
      setNewVehicle({
        vehicleNumber: "",
        driverEmail: "",
        driverName: "",
        phone: "",
        gpsLink: "",
      });
      fetchRegisteredVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  // Edit vehicle function
const handleEditVehicle = async (vehicle) => {
  const { value: formValues } = await Swal.fire({
    title: 'Edit Vehicle',
    html: `
      <input id="vehicle-number" class="swal2-input" placeholder="Vehicle Number" value="${vehicle.vehicleNumber}" readonly>
      <input id="driver-email" class="swal2-input" placeholder="Driver Email" value="${vehicle.driverEmail}">
      <input id="driver-name" class="swal2-input" placeholder="Driver Name" value="${vehicle.driverName || ''}">
      <input id="phone" class="swal2-input" placeholder="Phone" value="${vehicle.phone || ''}">
      <input id="gps-link" class="swal2-input" placeholder="GPS Link" value="${vehicle.gpsLink || ''}">
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Update',
    preConfirm: () => {
      return {
        vehicleNumber: document.getElementById('vehicle-number').value,
        driverEmail: document.getElementById('driver-email').value,
        driverName: document.getElementById('driver-name').value,
        phone: document.getElementById('phone').value,
        gpsLink: document.getElementById('gps-link').value
      };
    }
  });

  if (formValues) {
    try {
      await axiosInstance.patch(`/vehicles/update/${vehicle._id}`, formValues, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Vehicle updated successfully');
      fetchRegisteredVehicles(); // Refresh the list
    } catch (err) {
      console.error('Vehicle update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update vehicle');
    }
  }
};
  // Fetch drivers
  // useEffect(() => {
  //   if (!token) return;
  //   axiosInstance
  //     .get("/users/get-all-users", {
  //       headers: { Authorization: `Bearer ${token}` },
  //     })
  //     .then((res) => {
  //       setDrivers(res.data.filter((u) => u.role === "driver"));
  //     })
  //     .catch((err) => console.error("Failed to fetch drivers:", err));
  // }, [token]);

  // Fetch plans when dependencies change
  useEffect(() => {
    if (token && registeredVehicles.length > 0) {
      fetchPlans();
          fetchDieselEntries(); // Add this line
    }
  }, [token, page, searchTerm, filterDate, registeredVehicles]);

// Fetch drivers - UPDATED with proper state management
useEffect(() => {
  const fetchDrivers = async () => {
    if (!token) return;
    
    setLoadingDrivers(true);
    try {
      console.log("Fetching drivers...");
      const response = await axiosInstance.get("/drivers/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Drivers data:", response.data);
      
      // Ensure we have a valid array
      if (Array.isArray(response.data)) {
        setDrivers(response.data);
        console.log(`${response.data.length} drivers loaded successfully`);
        
        // Debug: Log each driver
        response.data.forEach((driver, index) => {
          console.log(`Driver ${index + 1}:`, driver.name, driver.phone);
        });
      } else {
        console.error("Expected array but got:", typeof response.data);
        setDrivers([]);
      }
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
      toast.error("Failed to load drivers list");
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  fetchDrivers();
}, [token]);

  // Fetch products list
useEffect(() => {
  if (token) {
    axiosInstance
      .get("/products-multer/all-products", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProductsList(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }
}, [token]);

// Helper function to get diesel entry for a specific plan
const getDieselEntryForPlan = (planId) => {
  if (!planId) return null;
  return dieselEntries.find(entry => entry.planId === planId);
};

// Form submission for table format
const handleTableSubmit = async () => {
  const { vehicleNumber, driverName, remarks, dateOfTrip } = formData;

  if (!vehicleNumber || !driverName) {
    toast.error("Please select vehicle and driver name.");
    return;
  }

  if (customerNames.length === 0 || customerNames.some((name) => !name.trim())) {
    toast.error("Please enter valid customer name(s).");
    return;
  }

  setSubmitting(true);

  try {
    const payload = {
      vehicleNumber,
        vehicleType: vehicleType, // ADD THIS
      driverName,
        location: formData.location, // ✅ NEW: Add location
         dieselLiters: formData.dieselLiters ? parseFloat(formData.dieselLiters) : null, // ✅ NEW: Add diesel liters
  expenses: formData.expenses ? parseFloat(formData.expenses) : null, // ✅ NEW: Add expenses
      remarks,
      customerNames: customerNames.filter(name => name.trim()), // Remove empty customer names
        salesProducts: salesProducts.filter(product => product.trim()), // ✅ NEW: Add sales products
      dateOfTrip,
        isManualVehicle: formData.isManualVehicle, // ✅ Add this line
    };

    console.log("Submitting payload:", payload); // Debug log

    // Upload audio if exists
    if (audioBlob) {
      console.log("Uploading audio..."); // Debug log
      const audioForm = new FormData();
      audioForm.append("file", audioBlob, "recording.wav");
      audioForm.append("upload_preset", "todo_uploads");
      audioForm.append("cloud_name", "dcr8k5amk");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dcr8k5amk/raw/upload",
        {
          method: "POST",
          body: audioForm,
        }
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error?.message || "Audio upload failed");
      payload.audioUrl = data.secure_url;
      console.log("Audio uploaded:", data.secure_url); // Debug log
    }

    // Upload attachments if exist
    if (attachments.length > 0) {
      console.log("Uploading attachments:", attachments.length); // Debug log
      const uploadedFiles = [];
      for (let file of attachments) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "todo_uploads");
        formData.append("cloud_name", "dcr8k5amk");

        const uploadUrl =
          file.type === "application/pdf"
            ? "https://api.cloudinary.com/v1_1/dcr8k5amk/raw/upload"
            : "https://api.cloudinary.com/v1_1/dcr8k5amk/image/upload";

        const res = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error?.message || "Attachment upload failed");
        uploadedFiles.push(data.secure_url);
      }
      payload.attachmentUrls = uploadedFiles;
      console.log("Attachments uploaded:", uploadedFiles); // Debug log
    }

    // Send final payload
    console.log("Sending final payload to API..."); // Debug log
    await axiosInstance.post("/dispatch-plans/assign", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success("Dispatch plan assigned successfully");

// Send WhatsApp notification to driver (non-blocking)
const selectedDriver = drivers.find(d => d.name === formData.driverName);
if (selectedDriver && selectedDriver.phone && selectedDriver.whatsappEnabled) {
  // Send notification in background without waiting
  setTimeout(async () => {
    try {
      await sendDriverNotification(selectedDriver.phone, {
        dateOfTrip: formData.dateOfTrip,
        vehicleNumber: formData.vehicleNumber,
        location: formData.location,
        customerNames: customerNames.filter(name => name.trim())
      });
    } catch (err) {
      console.error("Background WhatsApp failed:", err);
      // Don't show error to user - it's non-critical
    }
  }, 1000);
}
    // Reset form
    setFormData({
      vehicleNumber: "",
        location: "", // ✅ NEW: Reset location
      driverName: "",
      remarks: "",
        dieselLiters: "", // ✅ NEW: Reset diesel liters
  expenses: "", // ✅ NEW: Reset expenses
      dateOfTrip: (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split("T")[0];
      })(),
    });
    setCustomerNames([""]);
    setSalesProducts([""]); // ✅ NEW: Reset sales products
    setAudioBlob(null);
    setAudioUrl(null);
    setAttachments([]);
    
    // Refresh the plans list
    fetchPlans();
  } catch (err) {
    console.error("🔥 ASSIGN ERROR:", err?.response?.data || err);
    toast.error(err.response?.data?.message || "Error assigning plan");
  } finally {
    setSubmitting(false);
  }
};

// Export formatted data as PDF
const exportFormattedPDF = () => {
  if (plans.length === 0) {
    toast.error("No data to export");
    return;
  }

  try {
    toast.loading("Generating PDF...", { id: "pdf-export" });
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add company header
    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 0, 297, 20, 'F');
    
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Dispatch Plans Report', 148, 12, { align: 'center' });
    
    // Add generation date
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 148, 18, { align: 'center' });

    // Table headers
    const headers = ['Sr No', 'Date', 'Vehicle', 'Driver', 'Location', 'Customers', 'City', 'Material Unloading Location', 'Sales Products', 'Fuel - Diesel(Ltrs)(To & Fro)', 'Driver Expenses (Kharcha)', 'Remarks'];
    const columnWidths = [10, 14, 20, 20, 24, 28, 22, 28, 28, 28, 26, 27];
    
    let yPosition = 30;
    
    // Add table headers with multi-line support for long headers
    pdf.setFillColor(243, 244, 246);
    
    // Calculate header rows needed
    const headerRows = [];
    headers.forEach((header, index) => {
      const maxWidth = columnWidths[index] - 2;
      const lines = pdf.splitTextToSize(header, maxWidth);
      headerRows.push(lines);
    });
    
    const maxHeaderLines = Math.max(...headerRows.map(lines => lines.length));
    const headerHeight = maxHeaderLines * 4;
    
    // Draw header background
    pdf.rect(10, yPosition - 5, 277, headerHeight + 2, 'F');
    
    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    
    // Draw multi-line headers
    let xPosition = 10;
    headers.forEach((header, index) => {
      const lines = headerRows[index];
      lines.forEach((line, lineIndex) => {
        pdf.text(line, xPosition + 2, yPosition + (lineIndex * 4));
      });
      xPosition += columnWidths[index];
    });

    yPosition += headerHeight + 5;

    // Add table rows
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(7);
    
    for (let idx = 0; idx < plans.length; idx++) {
      const plan = plans[idx];
      
      // Check if we need a new page
      if (yPosition > 180) {
        pdf.addPage();
        yPosition = 20;
        
        // Add header on new page
        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, 0, 297, 20, 'F');
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Dispatch Plans Report - Continued', 148, 12, { align: 'center' });
        
        yPosition = 30;
        
        // Add headers again with multi-line support
        pdf.setFillColor(243, 244, 246);
        pdf.rect(10, yPosition - 5, 277, headerHeight + 2, 'F');
        pdf.setFontSize(7);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        
        xPosition = 10;
        headers.forEach((header, hIdx) => {
          const lines = headerRows[hIdx];
          lines.forEach((line, lineIndex) => {
            pdf.text(line, xPosition + 2, yPosition + (lineIndex * 4));
          });
          xPosition += columnWidths[hIdx];
        });
        
        yPosition += headerHeight + 5;
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(7);
      }

      // Alternate row background
      if (idx % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(10, yPosition - 3, 277, 10, 'F');
      }

      // Format customer names with bullet points
      let customersText = "-";
      if (Array.isArray(plan.customerNames) && plan.customerNames.length > 0) {
        customersText = plan.customerNames.map((name, i) => `${i + 1}. ${name}`).join('\n');
      }
      
      // Format cities with numbering (matching customer order)
      let citiesText = "-";
      if (Array.isArray(plan.customerNames) && plan.customerNames.length > 0) {
        const cities = [];
        plan.customerNames.forEach((customerName, i) => {
          const customer = customerDetails.find(c => c.name === customerName);
          
          if (customer && customer.city) {
            cities.push(`${i + 1}. ${customer.city}`);
          } else if (customer && customer.address) {
            const addressParts = customer.address.split(',');
            const possibleCity = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : null;
            if (possibleCity) {
              cities.push(`${i + 1}. ${possibleCity}`);
            } else {
              cities.push(`${i + 1}. -`);
            }
          } else {
            cities.push(`${i + 1}. -`);
          }
        });
        
        if (cities.length > 0) {
          citiesText = cities.join('\n');
        }
      }
      
      // Format map links with numbering - store separately for link annotations
      let mapIconsText = "";
      let mapUrls = [];
      let mapLines = [];
      
      if (Array.isArray(plan.customerNames) && plan.customerNames.length > 0) {
        plan.customerNames.forEach((customerName, i) => {
          const customer = customerDetails.find(c => c.name === customerName);
          
          let mapUrl = null;
          if (customer && customer.locationLink) {
            mapUrl = customer.locationLink.trim();
          }
          
          const lineText = `${i + 1}. ${mapUrl ? '[MAP]' : '[NO MAP]'}`;
          mapLines.push({ text: lineText, url: mapUrl, index: i });
          
          if (mapUrl) {
            mapUrls.push(mapUrl);
          }
        });
      }
      
      if (mapLines.length === 0) {
        mapIconsText = "-";
      }
      
      // Format sales products with bullet points
      let productsText = "-";
      if (Array.isArray(plan.salesProducts) && plan.salesProducts.length > 0) {
        productsText = plan.salesProducts.map((product, i) => `${i + 1}. ${product}`).join('\n');
      }
      
      // Format diesel liters
      let dieselText = "-";
      if (plan.dieselLiters && plan.dieselLiters !== "") {
        dieselText = String(plan.dieselLiters);
      }
      
      // Format expenses
      let expensesText = "-";
      if (plan.expenses && plan.expenses !== "") {
        const cleanExpense = String(plan.expenses).replace(/[^0-9.-]/g, '');
        if (cleanExpense && cleanExpense !== "-") {
          expensesText = cleanExpense;
        }
      }
      
      // Format remarks - FIXED: Allow more text and proper wrapping
      let remarksText = "-";
      if (plan.remarks && plan.remarks !== "") {
        let cleanRemark = String(plan.remarks).replace(/[^\w\s\-.,!?]/g, '');
        // Remove length limit - let it wrap naturally within column width
        remarksText = cleanRemark;
      }
      
      // Format date
      let dateText = "-";
      if (plan.dateOfTrip) {
        dateText = new Date(plan.dateOfTrip).toLocaleDateString("en-GB");
      }
      
      // Format driver name
      let driverText = plan.driverName || (plan.assignedTo?.name) || "-";
      
      // Format vehicle number
      let vehicleText = plan.vehicleNumber || "-";
      
      // Format location
      let locationText = plan.location || "-";

      // Calculate row height - FIXED: Include all text wrapping
      let maxLines = 1;
      
      const locationLinesCount = pdf.splitTextToSize(locationText, columnWidths[4] - 4).length;
      const customersLines = pdf.splitTextToSize(customersText, columnWidths[5] - 4).length;
      const citiesLines = pdf.splitTextToSize(citiesText, columnWidths[6] - 4).length;
      const productsLines = pdf.splitTextToSize(productsText, columnWidths[8] - 4).length;
      const remarksLines = pdf.splitTextToSize(remarksText, columnWidths[11] - 4).length;
      
      // For map lines, count each line
      const mapLinesCount = mapLines.length > 0 ? mapLines.length : 1;
      
      maxLines = Math.max(1, locationLinesCount, customersLines, citiesLines, mapLinesCount, productsLines, remarksLines);
      
      // Calculate row height based on max lines
      const rowHeight = Math.max(10, maxLines * 3.5 + 4);
      
      // Draw row data
      let currentX = 10;
      let lineY = yPosition;

      // Sr No
      pdf.text((idx + 1).toString(), currentX + 2, lineY);
      currentX += columnWidths[0];
      
      // Date
      pdf.text(dateText, currentX + 2, lineY);
      currentX += columnWidths[1];
      
      // Vehicle
      pdf.text(vehicleText, currentX + 2, lineY);
      currentX += columnWidths[2];
      
      // Driver
      pdf.text(driverText, currentX + 2, lineY);
      currentX += columnWidths[3];
      
      // Location
      const locationLines = pdf.splitTextToSize(locationText, columnWidths[4] - 4);
      locationLines.forEach((line, lineIdx) => {
        pdf.text(line, currentX + 2, lineY + (lineIdx * 3.5));
      });
      currentX += columnWidths[4];
      
      // Customers
      const customerLines = pdf.splitTextToSize(customersText, columnWidths[5] - 4);
      customerLines.forEach((line, lineIdx) => {
        pdf.text(line, currentX + 2, lineY + (lineIdx * 3.5));
      });
      currentX += columnWidths[5];
      
      // Cities
      const cityLines = pdf.splitTextToSize(citiesText, columnWidths[6] - 4);
      cityLines.forEach((line, lineIdx) => {
        pdf.text(line, currentX + 2, lineY + (lineIdx * 3.5));
      });
      currentX += columnWidths[6];
      
      // Map Icons - Draw each line individually with clickable link
      if (mapLines.length > 0) {
        mapLines.forEach((line, lineIdx) => {
          const lineYPos = lineY + (lineIdx * 3.5);
          
          if (line.url) {
            // Draw [MAP] in blue
            pdf.setTextColor(0, 0, 255);
            pdf.text(line.text, currentX + 2, lineYPos);
            
            // Calculate the exact text width to make it clickable
            const textWidth = pdf.getTextWidth(line.text);
            // Add link annotation over the text area
            pdf.link(currentX + 2, lineYPos - 2, textWidth, 3.5, { url: line.url });
          } else {
            // Draw [NO MAP] in black
            pdf.setTextColor(0, 0, 0);
            pdf.text(line.text, currentX + 2, lineYPos);
          }
        });
        pdf.setTextColor(0, 0, 0);
      } else {
        pdf.text("-", currentX + 2, lineY);
      }
      currentX += columnWidths[7];
      
      // Sales Products
      const productLines = pdf.splitTextToSize(productsText, columnWidths[8] - 4);
      productLines.forEach((line, lineIdx) => {
        pdf.text(line, currentX + 2, lineY + (lineIdx * 3.5));
      });
      currentX += columnWidths[8];
      
      // Diesel
      pdf.text(dieselText, currentX + 2, lineY);
      currentX += columnWidths[9];
      
      // Expenses
      pdf.text(expensesText, currentX + 2, lineY);
      currentX += columnWidths[10];
      
      // Remarks - FIXED: Properly display all text with wrapping
      const remarkLines = pdf.splitTextToSize(remarksText, columnWidths[11] - 4);
      remarkLines.forEach((line, lineIdx) => {
        pdf.text(line, currentX + 2, lineY + (lineIdx * 3.5));
      });
      
      // Draw row border
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.2);
      pdf.rect(10, yPosition - 3, 277, rowHeight, 'S');
      
      // Move to next row
      yPosition += rowHeight;
    }

    // Add footer
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(7);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Page ${i} of ${pageCount}`, 280, 195, { align: 'right' });
      pdf.text(`Total Plans: ${plans.length}`, 15, 195);
      pdf.setTextColor(0, 0, 255);
      pdf.text(`[MAP] = Clickable Google Maps Link (blue text)`, 15, 190);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`[NO MAP] = No map link available`, 15, 186);
    }

    pdf.save(`dispatch-plans-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("PDF exported successfully!", { id: "pdf-export" });
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to export PDF", { id: "pdf-export" });
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">User not found. Please log in again.</p>
        </div>
      </div>
    );
  }

  // Delete dispatch plan
const handleDelete = async (planId) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!'
  });

  if (result.isConfirmed) {
    try {
      await axiosInstance.delete(`/dispatch-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Dispatch plan deleted successfully');
      fetchPlans();
    } catch (err) {
      toast.error('Failed to delete dispatch plan');
      console.error('Delete error:', err);
    }
  }
};

// Create new driver - Updated version
const handleCreateDriver = async () => {
  if (!newDriver.name || !newDriver.phone) {
    toast.error("Driver name and phone are required");
    return;
  }

  // Validate phone number length
  const cleanPhone = newDriver.phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    toast.error("Phone number must be 10 digits");
    return;
  }

  try {
    const response = await axiosInstance.post("/drivers/create", newDriver, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (response.data.success) {
      toast.success("Driver created successfully");
      setNewDriver({ name: "", phone: "", email: "" });
      
      // Refresh drivers list
      const driversRes = await axiosInstance.get("/drivers/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrivers(driversRes.data);
    } else {
      toast.error(response.data.message || "Failed to create driver");
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || 
                     err.response?.data?.errors?.join(', ') || 
                     "Failed to create driver";
    toast.error(errorMsg);
  }
};

// Send WhatsApp notification - Updated version
// Send WhatsApp notification - ALWAYS send (with template fallback)
const sendDriverNotification = async (driverPhone, planDetails) => {
  try {
    // Create TWO versions of the message:
    
    // 1. Regular message (for within 24-hour window)
    const regularMessage = `🚚 *New Dispatch Plan Assigned!*\n\n📅 *Date:* ${planDetails.dateOfTrip}\n🚛 *Vehicle:* ${planDetails.vehicleNumber}\n📍 *Location:* ${planDetails.location}\n👥 *Customers:* ${planDetails.customerNames.join(', ')}\n\nPlease check the dispatch portal for complete details.`;
    
    // 2. Template message parameters (for outside 24-hour window)
    const templateParams = {
      date_of_trip: planDetails.dateOfTrip || "Check portal",
      vehicle_number: planDetails.vehicleNumber || "Check portal",
      location: planDetails.location || "Check portal",
      customers: planDetails.customerNames.join(', ') || "Check portal"
    };
    
    console.log("Sending WhatsApp to:", driverPhone);
    
    const response = await axiosInstance.post("/whatsapp/send-whatsapp", {
      to: driverPhone,
      message: regularMessage,
      planDetails: templateParams // Pass data for template fallback
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log("WhatsApp response:", response.data);
    
    if (response.data.success) {
      if (response.data.type === 'template') {
        toast.success("WhatsApp template message sent to driver (24-hour window expired)");
      } else {
        toast.success("WhatsApp notification sent to driver");
      }
      return { success: true, type: response.data.type };
    } else {
      toast.error(`WhatsApp failed: ${response.data.error || 'Unknown error'}`);
      return { success: false, error: response.data.error };
    }
  } catch (err) {
    console.error("WhatsApp notification failed:", err.response?.data || err);
    const errorMsg = err.response?.data?.error || err.message;
    toast.error(`WhatsApp failed: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
};

// Enhanced Editable Plan Row Component with Document Uploads
const EditablePlanRow = ({ plan, index, page, userRoles, handleDelete, registeredVehicles, customerList, productsList, token, fetchPlans, drivers, customerDetails, calculateFreightForCustomers }) => {
  const [isEditing, setIsEditing] = useState(false);
const [editablePlan, setEditablePlan] = useState({
  ...plan,
   vehicleType: plan.vehicleType || 'tempo', // ADD THIS
  // Check if this is a manual vehicle (not found in registered vehicles)
  isManualVehicle: !registeredVehicles.find(v => v.vehicleNumber === plan.vehicleNumber)
});
  const [updating, setUpdating] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
// Add this useEffect inside EditablePlanRow component
useEffect(() => {
  const recalculateFreight = async () => {
    if (!isEditing) return;
    
    console.log("Recalculating freight with:", {
      customerNames: editablePlan.customerNames,
      vehicleType: editablePlan.vehicleType,
      isEditing
    });
    
    const selectedCustomers = (editablePlan.customerNames || []).filter(name => name.trim());
    console.log("Selected customers:", selectedCustomers);
    
    if (selectedCustomers.length > 0) {
      // Check if all customers have pincodes
      const customersWithPincodes = customerDetails.filter(c => 
        selectedCustomers.includes(c.name) && c.pincode
      );
      console.log("Customers with pincodes:", customersWithPincodes);
      
      if (customersWithPincodes.length === selectedCustomers.length) {
        // Pass the vehicle type from editablePlan to the calculation
        const freight = await calculateFreightForCustomers(selectedCustomers, editablePlan.vehicleType || 'tempo');
        console.log("Freight calculated:", freight);
        
        if (freight.diesel && freight.expenses) {
          setEditablePlan(prev => ({ 
            ...prev, 
            dieselLiters: freight.diesel,
            expenses: freight.expenses
          }));
        }
        
        // Update location
        if (selectedCustomers.length === 1) {
          const customer = customerDetails.find(c => c.name === selectedCustomers[0]);
          if (customer) {
            const location = customer.address ? customer.address.split(',')[0].trim() : customer.name;
            setEditablePlan(prev => ({ ...prev, location }));
          }
        } else {
          const locations = selectedCustomers.map(name => {
            const customer = customerDetails.find(c => c.name === name);
            return customer?.address ? customer.address.split(',')[0].trim() : name;
          });
          setEditablePlan(prev => ({ 
            ...prev, 
            location: locations.join(' to ')
          }));
        }
      } else {
        console.log("Some customers missing pincodes");
      }
    } else {
      // Clear if no customers
      setEditablePlan(prev => ({ 
        ...prev, 
        dieselLiters: "",
        expenses: "",
        location: ""
      }));
    }
  };

  recalculateFreight();
}, [editablePlan.customerNames, editablePlan.vehicleType, isEditing]); // Added vehicleType to dependencies
  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newRecorder = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/wav",
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
      });

      newRecorder.startRecording();
      setRecorder(newRecorder);
      setRecording(true);
      toast.success("Recording started...");
    } catch (err) {
      console.error("🎤 Microphone access denied:", err);
      toast.error("Microphone access denied. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecording(false);
        toast.success("Recording completed");
      });
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecording(false);
    toast.success("Audio cleared");
  };

  const uploadDocuments = async () => {
    const uploadedDocuments = {
      audioUrl: editablePlan.audioUrl,
      attachmentUrls: [...(editablePlan.attachmentUrls || [])]
    };

    // Upload new audio if exists
    if (audioBlob) {
      try {
        const audioForm = new FormData();
        audioForm.append("file", audioBlob, "recording.wav");
        audioForm.append("upload_preset", "todo_uploads");
        audioForm.append("cloud_name", "dcr8k5amk");

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dcr8k5amk/raw/upload",
          {
            method: "POST",
            body: audioForm,
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Audio upload failed");
        uploadedDocuments.audioUrl = data.secure_url;
      } catch (err) {
        console.error("Audio upload error:", err);
        throw new Error("Audio upload failed");
      }
    }

    // Upload new attachments if exist
    if (attachments.length > 0) {
      const uploadedFiles = [];
      for (let file of attachments) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "todo_uploads");
          formData.append("cloud_name", "dcr8k5amk");

          const uploadUrl = file.type === "application/pdf"
            ? "https://api.cloudinary.com/v1_1/dcr8k5amk/raw/upload"
            : "https://api.cloudinary.com/v1_1/dcr8k5amk/image/upload";

          const res = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || "Attachment upload failed");
          uploadedFiles.push(data.secure_url);
        } catch (err) {
          console.error("Attachment upload error:", err);
          throw new Error("Attachment upload failed");
        }
      }
      uploadedDocuments.attachmentUrls = [...uploadedDocuments.attachmentUrls, ...uploadedFiles];
    }

    return uploadedDocuments;
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setUploadingDocuments(true);
    
    try {
      let documents = {
        audioUrl: editablePlan.audioUrl,
        attachmentUrls: editablePlan.attachmentUrls || []
      };

      // Upload new documents if any
      if (audioBlob || attachments.length > 0) {
        documents = await uploadDocuments();
      }

      // Prepare update data with documents
      const updateData = {
        ...editablePlan,
          vehicleType: editablePlan.vehicleType, // ADD THIS
        audioUrl: documents.audioUrl,
        attachmentUrls: documents.attachmentUrls,
          isManualVehicle: editablePlan.isManualVehicle // ✅ Add this
      };

      await axiosInstance.patch(`/dispatch-plans/${plan._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Dispatch plan updated successfully');
      setIsEditing(false);
      setAudioBlob(null);
      setAudioUrl(null);
      setAttachments([]);
      fetchPlans();
    } catch (err) {
      toast.error('Failed to update dispatch plan');
      console.error('Update error:', err);
    } finally {
      setUpdating(false);
      setUploadingDocuments(false);
    }
  };

  const handleCancel = () => {
  setEditablePlan({
    ...plan,
    isManualVehicle: !registeredVehicles.find(v => v.vehicleNumber === plan.vehicleNumber)
  });
      setIsEditing(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setAttachments([]);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
        {(page - 1) * 10 + index + 1}
      </td>
      
      {/* Date - Editable */}
      <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
        {isEditing ? (
          <input
            type="date"
            value={editablePlan.dateOfTrip ? new Date(editablePlan.dateOfTrip).toISOString().split('T')[0] : ''}
            onChange={(e) => setEditablePlan(prev => ({ ...prev, dateOfTrip: e.target.value }))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <span className="text-sm text-gray-900">
            {plan.dateOfTrip ? new Date(plan.dateOfTrip).toLocaleDateString("en-GB") : "—"}
          </span>
        )}
      </td>

    {/* Vehicle - Editable */}
<td className="px-4 py-4 whitespace-nowrap border border-gray-200">
  {isEditing ? (
    <div className="relative">
      {/* Combobox for vehicle selection */}
      <div className="flex gap-1">
        <select
          value={editablePlan.vehicleNumber}
          onChange={(e) => {
            if (e.target.value === "manual") {
              // Show manual input
              setEditablePlan(prev => ({ 
                ...prev, 
                vehicleNumber: "",
                isManualVehicle: true 
              }));
            } else {
              setEditablePlan(prev => ({ 
                ...prev, 
                vehicleNumber: e.target.value,
                isManualVehicle: false 
              }));
            }
          }}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select Vehicle</option>
          {registeredVehicles.map((v) => (
            <option key={v._id} value={v.vehicleNumber}>
              {v.vehicleNumber}
            </option>
          ))}
          <option value="manual" className="text-blue-600 font-medium">
            + Add New Vehicle Manually
          </option>
        </select>
      </div>
      
      {/* Manual input field (shown when "Add New Vehicle Manually" is selected OR when editing a manual vehicle) */}
      {(editablePlan.isManualVehicle || (!registeredVehicles.find(v => v.vehicleNumber === editablePlan.vehicleNumber) && editablePlan.vehicleNumber)) && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-600 text-sm font-medium">⚠️ Manual Vehicle Entry</span>
          </div>
          <input
            type="text"
            value={editablePlan.vehicleNumber}
            onChange={(e) => {
              let value = e.target.value.toUpperCase();
              
              // Format the vehicle number as user types
              let cleanValue = value.replace(/\s/g, '');
              let formattedValue = cleanValue;
              
              if (cleanValue.length > 4) {
                formattedValue = cleanValue.slice(0, 4) + ' ' + cleanValue.slice(4, 6) + ' ' + cleanValue.slice(6, 10);
              } else if (cleanValue.length > 2) {
                formattedValue = cleanValue.slice(0, 4) + ' ' + cleanValue.slice(4);
              }
              
              formattedValue = formattedValue.trim();
              
              setEditablePlan(prev => ({ ...prev, vehicleNumber: formattedValue, isManualVehicle: true }));
            }}
            placeholder="Enter vehicle number (e.g., PB08 EL 9364)"
            className="w-full px-2 py-1 border border-yellow-300 rounded text-sm focus:ring-1 focus:ring-yellow-500"
            autoFocus={editablePlan.isManualVehicle}
          />
          <p className="text-xs text-yellow-600 mt-1">
            This vehicle is not registered in the system. It will be used for this dispatch only.
          </p>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <div>
        {plan.vehicleNumber}
        {plan.isManualVehicle && (
          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Manual
          </span>
        )}
      </div>
      {plan.gpsLink && (
        <a
          href={plan.gpsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700"
          title="Track Vehicle"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </a>
      )}
    </div>
  )}
</td>
{/* Vehicle Type */}
<td className="px-4 py-4 whitespace-nowrap border border-gray-200">
  {isEditing ? (
    <select
      value={editablePlan.vehicleType || 'tempo'}
      onChange={(e) => {
        setEditablePlan(prev => ({ 
          ...prev, 
          vehicleType: e.target.value 
        }));
        // No need for setTimeout, the useEffect will handle recalculation
      }}
      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
    >
      <option value="tempo">Tempo (15 km/L)</option>
      <option value="truck">Truck (7 km/L)</option>
    </select>
  ) : (
    <span className="text-sm text-gray-900 capitalize">
      {plan.vehicleType || 'tempo'}
    </span>
  )}
</td>
     {/* Driver - Editable with dropdown */}
<td className="px-4 py-4 whitespace-nowrap border border-gray-200">
  {isEditing ? (
    <div className="flex gap-1">
      <select
        value={editablePlan.driverName || ''}
        onChange={(e) => {
          console.log("Editing driver:", e.target.value);
          setEditablePlan(prev => ({ ...prev, driverName: e.target.value }));
        }}
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Select Driver</option>
        {drivers.map((driver) => (
          <option key={driver._id} value={driver.name}>
            {driver.name} ({driver.phone})
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setShowDriverManager(true)}
        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
        title="Add New Driver"
      >
        +
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-900">
        {plan.driverName || plan.assignedTo?.name || "-"}
      </span>
      {plan.driverName && (
        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
          Driver
        </span>
      )}
    </div>
  )}
</td>



      {/* Customers - Editable */}
      <td className="px-4 py-4 border border-gray-200">
        {isEditing ? (
          <div className="space-y-1 min-w-[200px]">
            {(editablePlan.customerNames || []).map((name, i) => (
              <div key={i} className="flex gap-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const updated = [...(editablePlan.customerNames || [])];
                    updated[i] = e.target.value;
                    setEditablePlan(prev => ({ ...prev, customerNames: updated }));
                  }}
                  list={`edit-customer-options-${index}-${i}`}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                />
                <datalist id={`edit-customer-options-${index}-${i}`}>
                  {customerList
                    .filter((c) => c.name.toLowerCase().includes(name.toLowerCase()))
                    .map((c) => (
                      <option key={c._id} value={c.name} />
                    ))}
                </datalist>
               {(editablePlan.customerNames || []).length > 1 && (
  <button
    type="button"
    onClick={() => {
      const updated = [...(editablePlan.customerNames || [])];
      updated.splice(i, 1);
      setEditablePlan(prev => ({ ...prev, customerNames: updated }));
    }}
    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
  >
    ×
  </button>
)}
              </div>
            ))}
          <button
  type="button"
  onClick={() => {
    setEditablePlan(prev => ({ 
      ...prev, 
      customerNames: [...(prev.customerNames || []), ""] 
    }));
  }}
  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
>
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  Add Customer
</button>
          </div>
        ) : (
          <div className="space-y-1">
            {Array.isArray(plan.customerNames) && plan.customerNames.length > 0 ? (
              plan.customerNames.map((name, i) => (
                <div key={i} className={`text-xs px-2 py-1 rounded ${
                  plan.customerNames.length > 1 
                    ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                    : 'bg-gray-50 text-gray-700'
                }`}>
                  <span className="font-medium">{name}</span>
                </div>
              ))
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-4 border border-gray-200">
  <div className="space-y-1">
    {Array.isArray(plan.customerNames) && plan.customerNames.length > 0 ? (
      plan.customerNames.map((customerName, i) => {
        // Find the customer in customerDetails
        const customer = customerDetails.find(c => c.name === customerName);
        let cityName = "-";
        
        if (customer && customer.city) {
          cityName = customer.city;
        } else if (customer && customer.address) {
          // Try to extract city from address
          const addressParts = customer.address.split(',');
          const possibleCity = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : null;
          if (possibleCity) {
            cityName = possibleCity;
          }
        }
        
        return (
          <div key={i} className={`text-xs px-2 py-1 rounded ${
            plan.customerNames.length > 1 
              ? 'bg-purple-50 border border-purple-200 text-purple-700' 
              : 'bg-gray-50 text-gray-700'
          }`}>
            <span className="font-medium">{i + 1}. {cityName}</span>
          </div>
        );
      })
    ) : (
      <span className="text-gray-400">-</span>
    )}
  </div>
</td>
      {/* Location - Editable */}
     <td className="px-4 py-4 border border-gray-200 min-w-[300px]">
  {isEditing ? (
    <textarea
      value={editablePlan.location || ''}
      onChange={(e) => setEditablePlan(prev => ({ ...prev, location: e.target.value }))}
      rows="2"
      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 resize-y"
    />
  ) : (
    <div className="text-sm text-gray-900 whitespace-normal break-words">
      {plan.location || "-"}
    </div>
  )}
</td>
      {/* Sales Products - Editable */}
      <td className="px-4 py-4 border border-gray-200">
        {isEditing ? (
          <div className="space-y-1 min-w-[200px]">
            {(editablePlan.salesProducts || []).map((product, i) => (
              <div key={i} className="flex gap-1">
                <input
                  type="text"
                  value={product}
                  onChange={(e) => {
                    const updated = [...(editablePlan.salesProducts || [])];
                    updated[i] = e.target.value;
                    setEditablePlan(prev => ({ ...prev, salesProducts: updated }));
                  }}
                  list={`edit-product-options-${index}-${i}`}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                />
                <datalist id={`edit-product-options-${index}-${i}`}>
                  {productsList
                    .filter((p) => p.name?.toLowerCase().includes(product.toLowerCase()))
                    .map((p) => (
                      <option key={p._id} value={p.name} />
                    ))}
                </datalist>
                {(editablePlan.salesProducts || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...(editablePlan.salesProducts || [])];
                      updated.splice(i, 1);
                      setEditablePlan(prev => ({ ...prev, salesProducts: updated }));
                    }}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setEditablePlan(prev => ({ 
                ...prev, 
                salesProducts: [...(prev.salesProducts || []), ""] 
              }))}
              className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {Array.isArray(plan.salesProducts) && plan.salesProducts.length > 0 ? (
              plan.salesProducts.map((product, i) => (
                <div key={i} className={`text-xs px-2 py-1 rounded ${
                  plan.salesProducts.length > 1 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-gray-50 text-gray-700'
                }`}>
                  <span className="font-medium">{product}</span>
                </div>
              ))
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        )}
      </td>

      {/* Diesel in Liters - Editable */}
<td className="px-4 py-4 whitespace-nowrap border border-gray-200">
  {isEditing ? (
    <input
      type="number"
      step="0.01"
      value={editablePlan.dieselLiters || ''}
      onChange={(e) => setEditablePlan(prev => ({ ...prev, dieselLiters: e.target.value }))}
      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
    />
  ) : (
    <span className="text-sm text-gray-900">
      {plan.dieselLiters || "-"}
    </span>
  )}
</td>

{/* Expenses - Editable */}
<td className="px-4 py-4 whitespace-nowrap border border-gray-200">
  {isEditing ? (
    <input
      type="number"
      step="0.01"
      value={editablePlan.expenses || ''}
      onChange={(e) => setEditablePlan(prev => ({ ...prev, expenses: e.target.value }))}
      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
    />
  ) : (
    <span className="text-sm text-gray-900">
      {plan.expenses || "-"}
    </span>
  )}
</td>

      {/* Remarks - Editable */}
      <td className="px-4 py-4 border border-gray-200">
        {isEditing ? (
          <input
            type="text"
            value={editablePlan.remarks || ''}
            onChange={(e) => setEditablePlan(prev => ({ ...prev, remarks: e.target.value }))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <span className="text-sm text-gray-900">
            {plan.remarks || "-"}
          </span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          plan.status === "Completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
        }`}>
          {plan.status || "Pending"}
        </span>
      </td>

      {/* Documents - Enhanced for Editing */}
      <td className="px-4 py-4 border border-gray-200">
        {isEditing ? (
          <div className="flex flex-col gap-2 min-w-[150px]">
            {/* Audio Recording */}
            <div className="flex items-center gap-2">
              {audioUrl ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    New Audio
                  </span>
                  <button
                    type="button"
                    onClick={clearAudio}
                    className="text-red-500 hover:text-red-700 text-xs"
                    title="Remove audio"
                  >
                    ×
                  </button>
                </div>
              ) : recording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 p-1 border border-red-200 rounded"
                >
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1 p-1 border border-blue-200 rounded"
                  title="Record audio message"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Record
                </button>
              )}
            </div>

            {/* File Attachments */}
            <div className="flex flex-col gap-1">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  if (files.length > 0) {
                    setAttachments(prev => [...prev, ...files]);
                  }
                  e.target.value = '';
                }}
                className="hidden"
                id={`file-input-${index}`}
              />
              <label
                htmlFor={`file-input-${index}`}
                className="text-blue-500 hover:text-blue-700 text-xs cursor-pointer flex items-center gap-1 p-1 border border-blue-200 rounded w-fit"
              >
                📎 Add Files
              </label>
              
              {/* Show attached files preview */}
              {attachments.length > 0 && (
                <div className="text-xs text-gray-600">
                  <div className="font-medium mb-1">New Files ({attachments.length}):</div>
                  {attachments.map((file, fileIndex) => (
                    <div key={fileIndex} className="flex items-center gap-1 mb-1">
                      <span className="truncate max-w-[80px]" title={file.name}>
                        {file.type.startsWith('image/') ? '🖼️' : '📄'} {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...attachments];
                          updated.splice(fileIndex, 1);
                          setAttachments(updated);
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Existing Documents */}
            {(editablePlan.attachmentUrls && editablePlan.attachmentUrls.length > 0) && (
              <div className="text-xs text-gray-600 mt-2">
                <div className="font-medium mb-1">Existing Files:</div>
                {editablePlan.attachmentUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-1 mb-1">
                    <span className="truncate max-w-[80px]" title={url}>
                      {url.includes('.pdf') ? '📄 PDF' : '🖼️ Image'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...editablePlan.attachmentUrls];
                        updated.splice(i, 1);
                        setEditablePlan(prev => ({ ...prev, attachmentUrls: updated }));
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-1 flex-wrap">
            {(plan.imageUrls || []).map((url, i) => {
              const isAudio = url.includes('audio') || url === plan.audioUrl || url.endsWith('.wav') || url.endsWith('.mp3');
              const isPDF = url.includes('.pdf') || url.includes('/raw/upload') || url.endsWith('.pdf');
              
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (isAudio) {
                      Swal.fire({
                        title: 'Audio Recording',
                        html: `
                          <audio controls autoplay style="width: 100%; margin: 10px 0;">
                            <source src="${url}" type="audio/wav">
                            Your browser does not support the audio element.
                          </audio>
                        `,
                        showCloseButton: true,
                        showConfirmButton: false,
                        width: "80%",
                        background: "#f9fafb",
                        customClass: { popup: "rounded-xl" },
                      });
                    } else if (isPDF) {
                      window.open(url, '_blank');
                    } else {
                      Swal.fire({
                        imageUrl: url,
                        imageAlt: `Document ${i + 1}`,
                        showCloseButton: true,
                        showConfirmButton: false,
                        width: "90%",
                        background: "#f9fafb",
                        customClass: { popup: "rounded-xl" },
                      });
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg hover:opacity-80 transition-colors duration-200 border ${
                    isAudio 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : isPDF
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                  title={isAudio ? 'Play Audio' : isPDF ? 'Open PDF' : 'View Image'}
                >
                  {isAudio ? 'Audio' : isPDF ? 'PDF' : 'Image'}
                </button>
              );
            })}
            {(plan.imageUrls || []).length === 0 && (
              <span className="text-xs text-gray-400">No documents</span>
            )}
          </div>
        )}
      </td>
{/* Image Uploaded by Drivers - New Column */}
<td className="px-4 py-4 border border-gray-200">
  {(() => {
    const dieselEntry = getDieselEntryForPlan(plan._id);
    
    if (!dieselEntry) {
      return (
        <span className="text-xs text-gray-400">No images uploaded</span>
      );
    }
    
    return (
      <div className="space-y-2">
        {/* KMS Reading */}
        {dieselEntry.kmsReading && (
          <div className="text-xs bg-gray-50 p-1 rounded">
            <span className="font-medium">KMS:</span> {dieselEntry.kmsReading}
          </div>
        )}
        
        {/* Diesel Liters */}
        {dieselEntry.dieselLiters && (
          <div className="text-xs bg-gray-50 p-1 rounded">
            <span className="font-medium">Diesel:</span> {dieselEntry.dieselLiters} L
          </div>
        )}
        
        {/* Images */}
        {dieselEntry.imageUrls && dieselEntry.imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dieselEntry.imageUrls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => {
                  Swal.fire({
                    imageUrl: url,
                    imageAlt: `Diesel Image ${idx + 1}`,
                    showCloseButton: true,
                    showConfirmButton: false,
                    width: "90%",
                    background: "#f9fafb",
                    customClass: { popup: "rounded-xl" },
                  });
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:opacity-80 transition-colors duration-200"
                title="View Image"
              >
                🖼️ Image {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  })()}
</td>
      {/* Actions */}
      <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
        <div className="flex flex-col gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleUpdate}
                disabled={updating || uploadingDocuments}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200 flex items-center gap-1"
              >
                {(updating || uploadingDocuments) ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    {uploadingDocuments ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  'Save'
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={updating}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 disabled:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {!userRoles.includes("driver") && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
              <button
                onClick={() => handleDelete(plan._id)}
                className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-700 font-medium">
              Assigning dispatch plan...
            </p>
          </div>
        </div>
      )}

      <InternalNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dispatch Management
          </h1>
          <p className="text-gray-600">
            Assign and manage vehicle dispatch plans efficiently
          </p>
        </div>

 {/* Combined Dispatch Plans Table - For all roles except driver */}
{!userRoles.includes("driver") && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
 <div className="p-6 border-b border-gray-200">
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
    <div>
  <h2 className="text-xl font-semibold text-gray-900 mb-1">
    Dispatch Plans Management
  </h2>
  <p className="text-gray-600 mb-2">Manage and assign dispatch plans in table format</p>
  <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
    💡 <strong>Tip:</strong> To get a specific date plan, just filter that date and click export
  </p>
</div>

    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
      {/* Export PDF Button - NEW */}
      <button
        onClick={exportFormattedPDF}
        disabled={plans.length === 0}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export PDF
      </button>

      <div className="relative w-full sm:w-64">
        <input
          type="text"
          placeholder="Search by customer or driver..."
          value={searchTerm}
          onChange={(e) => {
            setPage(1);
            setSearchTerm(e.target.value);
          }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <input
        type="date"
        value={filterDate}
        onChange={(e) => {
          setPage(1);
          setFilterDate(e.target.value);
        }}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
      />

      <button
        onClick={() => {
          setSearchTerm("");
          setFilterDate("");
          setPage(1);
        }}
        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
      >
        Clear Filters
      </button>
    </div>
  </div>
</div>

    {tableLoading ? (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dispatch plans...</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
  <table className="min-w-full border border-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Sr No
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Date
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Vehicle & 🛰️ GPS Tracking
        </th>
         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Vehicle Type
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Driver
        </th>
           
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Customers
        </th>
         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
      City
    </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200 min-w-[200px]">
  Location
</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Sales Products / Material Name
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200 min-w-[120px]">
  ⛽Diesel in Liters
</th>
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
      💰Expenses
    </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Remarks
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Status
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Documents
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
  📸 Image Uploaded by Drivers
</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Actions
        </th>
      </tr>
    </thead>
      <tbody className="bg-white">
      {/* Add New Plan Row */}
     
        <tr className="bg-blue-50 hover:bg-blue-100 transition-colors duration-150">
          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
            New
          </td>
          <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
            <input
              type="date"
              value={formData.dateOfTrip}
              onChange={(e) => setFormData(prev => ({ ...prev, dateOfTrip: e.target.value }))}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
              required
            />
          </td>
         <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
  <div className="relative">
    {/* Combobox for vehicle selection */}
    <div className="flex gap-1">
      <select
        value={formData.vehicleNumber}
        onChange={(e) => {
          if (e.target.value === "manual") {
            // Show manual input
            setFormData(prev => ({ 
              ...prev, 
              vehicleNumber: "",
              isManualVehicle: true 
            }));
          } else {
            setFormData(prev => ({ 
              ...prev, 
              vehicleNumber: e.target.value,
              isManualVehicle: false 
            }));
          }
        }}
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
        disabled={user.role === "driver"}
        required
      >
        <option value="">Select Vehicle</option>
        {registeredVehicles
          .filter((v) => user.role === "driver" ? v.driverEmail === user.email : true)
          .map((v) => (
            <option key={v._id} value={v.vehicleNumber}>
              {v.vehicleNumber}
            </option>
          ))}
        <option value="manual" className="text-blue-600 font-medium">
          + Add New Vehicle Manually
        </option>
      </select>
    </div>
    
    {/* Manual input field (shown when "Add New Vehicle Manually" is selected) */}
    {formData.isManualVehicle && (
      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-yellow-600 text-sm font-medium">⚠️ Manual Vehicle Entry</span>
        </div>
        <input
          type="text"
          value={formData.vehicleNumber}
          onChange={(e) => {
            let value = e.target.value.toUpperCase();
            
            // Format the vehicle number as user types
            let cleanValue = value.replace(/\s/g, '');
            let formattedValue = cleanValue;
            
            if (cleanValue.length > 4) {
              formattedValue = cleanValue.slice(0, 4) + ' ' + cleanValue.slice(4, 6) + ' ' + cleanValue.slice(6, 10);
            } else if (cleanValue.length > 2) {
              formattedValue = cleanValue.slice(0, 4) + ' ' + cleanValue.slice(4);
            }
            
            formattedValue = formattedValue.trim();
            
            setFormData(prev => ({ ...prev, vehicleNumber: formattedValue }));
          }}
          placeholder="Enter vehicle number (e.g., PB08 EL 9364)"
          className="w-full px-2 py-1 border border-yellow-300 rounded text-sm focus:ring-1 focus:ring-yellow-500"
          autoFocus
        />
        <p className="text-xs text-yellow-600 mt-1">
          This vehicle is not registered in the system. It will be used for this dispatch only.
        </p>
      </div>
    )}
  </div>
</td>
<td className="px-4 py-4 whitespace-nowrap border border-gray-200">
 <select
  value={vehicleType}
  onChange={(e) => {
    setVehicleType(e.target.value);
    // The useEffect will handle recalculation automatically
  }}
  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
>
  <option value="tempo">Tempo (15 km/L)</option>
  <option value="truck">Truck (7 km/L)</option>
</select>
</td>
         {/* Driver - Updated to dropdown */}
<td className="px-4 py-4 whitespace-nowrap border border-gray-200">
  <div className="flex gap-1">
    <select
      value={formData.driverName}
      onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
      required
    >
      <option value="">Select Driver</option>
      {drivers.map((driver) => (
        <option key={driver._id} value={driver.name}>
          {driver.name} ({driver.phone})
        </option>
      ))}
    </select>
    <button
      type="button"
      onClick={() => setShowDriverManager(true)}
      className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
      title="Add New Driver"
    >
      +
    </button>
  </div>
</td>
       
          <td className="px-4 py-4 border border-gray-200">
            <div className="space-y-1 min-w-[200px]">
              {/* Add customer count badge */}
              {customerNames.filter(name => name.trim()).length > 0 && (
                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-flex items-center gap-1">
                  <span>👥 {customerNames.filter(name => name.trim()).length} customer(s)</span>
                </div>
              )}
              
              {customerNames.map((name, index) => (
                <div key={index} className="flex gap-1">
              <input
  type="text"
  placeholder="Customer name"
  value={name}
  onChange={(e) => {
    const updated = [...customerNames];
    updated[index] = e.target.value;
    setCustomerNames(updated);
    
    // Auto-fill location based on selected customers
    const selectedCustomers = updated.filter(n => n.trim());
    
    if (selectedCustomers.length === 1) {
      // Single customer
      const customer = customerDetails.find(c => c.name === selectedCustomers[0]);
      if (customer) {
        const location = customer.address ? customer.address.split(',')[0].trim() : customer.name;
        setFormData(prev => ({ ...prev, location }));
      }
    } 
    else if (selectedCustomers.length > 1) {
      // Multiple customers - show as "city1 to city2 to city3"
      const locations = selectedCustomers.map(name => {
        const customer = customerDetails.find(c => c.name === name);
        return customer?.address ? customer.address.split(',')[0].trim() : name;
      });
      
      setFormData(prev => ({ 
        ...prev, 
        location: locations.join(' to ')
      }));
    }
    else {
      // No customers - clear location
      setFormData(prev => ({ ...prev, location: "" }));
    }
  }}
  list={`customer-options-${index}`}
  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
/>
                  <datalist id={`customer-options-${index}`}>
                    {customerList
                      .filter((c) => c.name.toLowerCase().includes(name.toLowerCase()))
                      .map((c) => (
                        <option key={c._id} value={c.name} />
                      ))}
                  </datalist>
                {index > 0 && (
  <button
    type="button"
    onClick={() => {
      const updated = [...customerNames];
      updated.splice(index, 1);
      setCustomerNames(updated);
      
      // Update location after deletion
      const selectedCustomers = updated.filter(n => n.trim());
      
      if (selectedCustomers.length === 1) {
        const customer = customerDetails.find(c => c.name === selectedCustomers[0]);
        if (customer) {
          const location = customer.address ? customer.address.split(',')[0].trim() : customer.name;
          setFormData(prev => ({ ...prev, location }));
        }
      } 
      else if (selectedCustomers.length > 1) {
        const locations = selectedCustomers.map(name => {
          const customer = customerDetails.find(c => c.name === name);
          return customer?.address ? customer.address.split(',')[0].trim() : name;
        });
        setFormData(prev => ({ 
          ...prev, 
          location: locations.join(' to ')
        }));
      }
      else {
        setFormData(prev => ({ ...prev, location: "" }));
      }
    }}
    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
  >
    ×
  </button>
)}
                </div>
              ))}
             <button
  type="button"
  onClick={() => {
    setCustomerNames([...customerNames, ""]);
    // No need to recalculate here as new empty customer won't affect calculation
  }}
  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
>
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  Add Customer
</button>
            </div>
          </td>
          <td className="px-4 py-4 border border-gray-200">
  <div className="space-y-1">
    {customerNames.filter(name => name.trim()).length > 0 ? (
      customerNames.map((customerName, idx) => {
        if (!customerName.trim()) return null;
        
        // Find the customer in customerDetails
        const customer = customerDetails.find(c => c.name === customerName);
        let cityName = "-";
        
        if (customer && customer.city) {
          cityName = customer.city;
        } else if (customer && customer.address) {
          // Try to extract city from address
          const addressParts = customer.address.split(',');
          const possibleCity = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : null;
          if (possibleCity) {
            cityName = possibleCity;
          }
        }
        
        return (
          <div key={idx} className="text-xs px-2 py-1 rounded bg-purple-50 border border-purple-200 text-purple-700">
            <span className="font-medium">{idx + 1}. {cityName}</span>
          </div>
        );
      })
    ) : (
      <span className="text-xs text-gray-400">No customers selected</span>
    )}
  </div>
</td>
            <td className="px-4 py-4 border border-gray-200 min-w-[300px]">
  <textarea
    value={formData.location}
    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
    placeholder="Location (auto-filled from customer)"
    rows="2"
    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 resize-y"
  />
</td>
          <td className="px-4 py-4 border border-gray-200">
            <div className="space-y-1 min-w-[200px]">
              {/* Add product count badge */}
              {salesProducts.filter(product => product.trim()).length > 0 && (
                <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-flex items-center gap-1">
                  <span>📦 {salesProducts.filter(product => product.trim()).length} product(s)</span>
                </div>
              )}
              
              {salesProducts.map((product, index) => (
                <div key={index} className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Sales product"
                    value={product}
                    onChange={(e) => {
                      const updated = [...salesProducts];
                      updated[index] = e.target.value;
                      setSalesProducts(updated);
                    }}
                    list={`product-options-${index}`}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                  />
                  <datalist id={`product-options-${index}`}>
                    {productsList
                      .filter((p) => p.name?.toLowerCase().includes(product.toLowerCase()))
                      .map((p) => (
                        <option key={p._id} value={p.name} />
                      ))}
                  </datalist>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...salesProducts];
                        updated.splice(index, 1);
                        setSalesProducts(updated);
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSalesProducts([...salesProducts, ""])}
                className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            </div>
          </td>
          {/* Diesel in Liters */}
<td className="px-4 py-4 whitespace-nowrap border border-gray-200 min-w-[120px]">
  <input
    type="number"
    step="0.01"
    value={formData.dieselLiters}
    onChange={(e) => setFormData(prev => ({ ...prev, dieselLiters: e.target.value }))}
    placeholder="Diesel in liters"
    className={`w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 ${formData.dieselLiters ? 'bg-blue-50' : ''}`}
    readOnly={!!formData.dieselLiters}
  />
</td>

{/* Expenses */}
<td className="px-4 py-4 whitespace-nowrap border border-gray-200">
  <input
  type="number"
  step="0.01"
  value={formData.expenses}
  onChange={(e) => setFormData(prev => ({ ...prev, expenses: e.target.value }))}
  placeholder="Expenses"
  className={`w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 ${formData.expenses ? 'bg-yellow-50' : ''}`}
  readOnly={!!formData.expenses}
/>
</td>
          <td className="px-4 py-4 border border-gray-200">
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Remarks"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
            />
          </td>
          <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
              New
            </span>
          </td>
          <td className="px-4 py-4 border border-gray-200">
            <div className="flex flex-col gap-2">
              {/* Audio Recording */}
              <div className="flex items-center gap-2">
                {audioUrl ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Audio Ready
                    </span>
                    <button
                      type="button"
                      onClick={clearAudio}
                      className="text-red-500 hover:text-red-700 text-xs"
                      title="Remove audio"
                    >
                      ×
                    </button>
                  </div>
                ) : recording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 p-1 border border-red-200 rounded"
                  >
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1 p-1 border border-blue-200 rounded"
                    title="Record audio message"
                  >
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Record
                  </button>
                )}
              </div>

              {/* File Attachments */}
              <div className="flex flex-col gap-1">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                      setAttachments(prev => [...prev, ...files]);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="text-blue-500 hover:text-blue-700 text-xs cursor-pointer flex items-center gap-1 p-1 border border-blue-200 rounded w-fit"
                >
                  📎 Attach Files
                </label>
                
                {/* Show attached files preview */}
                {attachments.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <div className="font-medium mb-1">Files ({attachments.length}):</div>
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-1 mb-1">
                        <span className="truncate max-w-[80px]" title={file.name}>
                          {file.type.startsWith('image/') ? '🖼️' : '📄'} {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...attachments];
                            updated.splice(index, 1);
                            setAttachments(updated);
                          }}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </td>
          <td colSpan={2} className="px-11 py-4 whitespace-nowrap border border-gray-200">
            <button
              onClick={handleTableSubmit}
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 flex items-center gap-2 text-sm"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Plan
                </>
              )}
            </button>
          </td>
        </tr>
      

      {/* Existing Plans - Now Editable */}
      {plans.map((plan, index) => (
        <EditablePlanRow 
          key={plan._id} 
          plan={plan} 
          index={index}
          page={page}
          userRoles={userRoles}
          handleDelete={handleDelete}
          registeredVehicles={registeredVehicles}
          customerList={customerList}
          productsList={productsList}
          token={token}
          fetchPlans={fetchPlans}
              drivers={drivers} // ✅ Add this line
               customerDetails={customerDetails}  // Add this
  calculateFreightForCustomers={calculateFreightForCustomers}  // Add this
        />
      ))}
    </tbody>
  </table>
</div>
    )}

    {/* Show empty state when no plans exist */}
    {plans.length === 0 && !tableLoading && (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          {searchTerm || filterDate ? "No plans found" : "No dispatch plans yet"}
        </h3>
        <p className="text-gray-500">
          {searchTerm || filterDate ? "Try adjusting your search criteria" : "Start by adding your first dispatch plan above"}
        </p>
      </div>
    )}

    {/* Pagination */}
    {plans.length > 0 && (
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}

        {/* Vehicle Management Section */}
        <div className="mt-8 space-y-6">
          {/* Register New Vehicle */}
           {!userRoles.includes("driver") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                  />
                </svg>
                Register New Vehicle
              </h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      Format Example
                    </h4>
                    <p className="text-blue-800 text-sm">
                      <code className="bg-blue-100 px-2 py-1 rounded text-blue-700 font-mono">
                        PB08 EL 9364 : pb08el9364@thermopackers.com
                      </code>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
               <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Vehicle Number *
  </label>
  <input
    type="text"
    placeholder="e.g., PB08 EL 9364"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
    value={newVehicle.vehicleNumber}
    onChange={(e) => {
      let value = e.target.value.toUpperCase();
      
      // Remove all spaces first
      let cleanValue = value.replace(/\s/g, '');
      
      // Format as PB08 AB 1234 (if long enough)
      let formattedValue = cleanValue;
      if (cleanValue.length > 4) {
        formattedValue = cleanValue.slice(0, 4) + ' ' + cleanValue.slice(4, 6) + ' ' + cleanValue.slice(6, 10);
      } else if (cleanValue.length > 2) {
        formattedValue = cleanValue.slice(0, 4) + ' ' + cleanValue.slice(4);
      }
      
      // Remove trailing spaces
      formattedValue = formattedValue.trim();
      
      setNewVehicle((v) => ({ ...v, vehicleNumber: formattedValue }));
    }}
  />
  <p className="text-xs text-gray-500 mt-1">
    Format: PB08 AB 1234 (automatically formatted)
  </p>
</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Email *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g., vehicle@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    value={newVehicle.driverEmail}
                    onChange={(e) =>
                      setNewVehicle((v) => ({
                        ...v,
                        driverEmail: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Driver Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g., 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    value={newVehicle.phone}
                    onChange={(e) =>
                      setNewVehicle((v) => ({
                        ...v,
                        phone: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GPS Tracking Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://gps-tracker.com/your-vehicle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    value={newVehicle.gpsLink}
                    onChange={(e) =>
                      setNewVehicle((v) => ({ ...v, gpsLink: e.target.value }))
                    }
                  />
                </div>
              </div>

              <button
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                onClick={handleVehicleRegister}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Register Vehicle
              </button>
            </div>
          )}

          {/* Registered Vehicles Toggle */}
          <div className="text-center">
            <button
              onClick={() => setShowVehicles((prev) => !prev)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              {showVehicles
                ? "Hide Registered Vehicles"
                : "Show Registered Vehicles"}
            </button>
          </div>

          {/* Registered Vehicles List */}
          {showVehicles && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-500">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Registered Vehicles ({registeredVehicles.length})
                </h3>
              </div>

              <div className="p-6">
                {registeredVehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">🚗</div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No vehicles registered yet
                    </h3>
                    <p className="text-gray-500">
                      Start by registering your first vehicle above
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registeredVehicles.map((vehicle) => (
                      <div
                        key={vehicle._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <svg
                                className="w-6 h-6 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {vehicle.vehicleNumber}
                              </h4>
                              <p className="text-gray-600">
                                {vehicle.driverEmail}
                              </p>
                              <div className="flex flex-wrap gap-4 mt-2">
                                {vehicle.phone && (
                                  <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                      />
                                    </svg>
                                    {vehicle.phone}
                                  </span>
                                )}
                                {vehicle.gpsLink && (
                                  <a
                                    href={vehicle.gpsLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                    Track Vehicle
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleEditVehicle(vehicle)}
                              className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg font-medium hover:bg-yellow-100 transition-colors duration-200 text-sm"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit
                            </button>

                            <button
                              onClick={() => setSelectedVehicle(vehicle)}
                              className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors duration-200 text-sm"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              Manage Docs
                            </button>

                           {userRoles.includes("accounts") && (
                              <button
                                onClick={() =>
                                  setSelectedMaintenanceVehicle(vehicle)
                                }
                                className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors duration-200 text-sm"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                  />
                                </svg>
                                Maintenance
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Document Manager Section */}
 {selectedVehicle && userRoles.includes("accounts") && (
            <div
            ref={docsRef}
            className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-xl font-semibold text-gray-900">
                Managing Documents for:{" "}
                <span className="text-blue-600">
                  {selectedVehicle.vehicleNumber}
                </span>
              </h3>
              <p className="text-gray-600 mt-1">
                Upload and manage vehicle documents and certificates
              </p>
            </div>
            <div className="p-6">
              <VehicleDocumentManager
                vehicleNumber={selectedVehicle.vehicleNumber}
              />
            </div>
          </div>
        )}
      </main>

      {/* Maintenance Log Book Modal */}
      {selectedMaintenanceVehicle && (
        <MaintenanceLogBook
          vehicleNumber={selectedMaintenanceVehicle.vehicleNumber}
          onClose={() => setSelectedMaintenanceVehicle(null)}
        />
      )}
      {/* Driver Manager Modal */}
{showDriverManager && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">Driver Manager</h3>
        <p className="text-gray-600 mt-1">Add and manage drivers</p>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver Name *
            </label>
            <input
              type="text"
              placeholder="Enter driver name"
              value={newDriver.name}
              onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
         <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Phone Number *
  </label>
  <input
    type="tel"
    placeholder="e.g., 9876543210"
    value={newDriver.phone}
    onChange={(e) => {
      // Allow only digits, max 10
      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
      setNewDriver(prev => ({ ...prev, phone: value }));
    }}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
  <p className="text-xs text-gray-500 mt-1">
    Enter 10-digit mobile number (e.g., 9876543210)
  </p>
</div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              placeholder="driver@example.com"
              value={newDriver.email}
              onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleCreateDriver}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Add Driver
          </button>
          <button
            onClick={() => setShowDriverManager(false)}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
        
        {/* Existing Drivers List */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-3">Existing Drivers</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
           {drivers.map((driver) => (
  <div key={driver._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
    <div>
      <div className="font-medium">{driver.name}</div>
      <div className="text-sm text-gray-600">
        {driver.phone}
        {driver.email && <div className="text-xs">{driver.email}</div>}
      </div>
    </div>
    <div className="text-sm">
      {driver.whatsappEnabled ? (
        <span className="text-green-600">✓ WhatsApp Enabled</span>
      ) : (
        <span className="text-red-600">✗ WhatsApp Disabled</span>
      )}
    </div>
  </div>
))}
          </div>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
