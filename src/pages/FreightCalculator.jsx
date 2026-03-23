// pages/FreightCalculator.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { useUserContext } from '../context/UserContext';
import InternalNavbar from '../components/InternalNavbar';
import toast from 'react-hot-toast';
import axiosInstance from '../axiosInstance';

// Fixed starting location
const STARTING_LOCATION = {
  address: 'Village Sangal Sohal, Kapurthala Road, Jalandhar - 144013, Punjab, India',
  pincode: '144013',
  city: 'Jalandhar',
  state: 'Punjab',
  coordinates: { lat: 31.3260, lon: 75.5762 } // Jalandhar coordinates
};

const FreightCalculator = () => {
  const { user } = useUserContext();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [destinationPincode, setDestinationPincode] = useState('');
  const [pincodeDetails, setPincodeDetails] = useState(null);
  const [vehicleType, setVehicleType] = useState('tempo');
  const [distance, setDistance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState(null);
  const [multipleDestinations, setMultipleDestinations] = useState([]);
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  // Rate per km - Load from database
  const [rates, setRates] = useState({ tempo: 15, truck: 50 });
  const [loadingRates, setLoadingRates] = useState(true);

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

  // Cache for coordinates
  const [coordinatesCache, setCoordinatesCache] = useState({
    '144013': STARTING_LOCATION.coordinates // Cache starting location
  });

  useEffect(() => {
    fetchCustomers();
    fetchRates();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axiosInstance.get('/customers/customers-pincode', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      toast.error('Failed to load customers');
      setCustomers([]);
    }
  };

  // Load rates from database
  const fetchRates = async () => {
    try {
      setLoadingRates(true);
      const res = await axiosInstance.get('/settings/freight-rates', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setRates(res.data);
    } catch (err) {
      console.error('Error fetching rates:', err);
      toast.error('Failed to load freight rates');
      // Fallback to defaults
      setRates({ tempo: 15, truck: 50 });
    } finally {
      setLoadingRates(false);
    }
  };

  const updateRate = async (vehicle, newRate) => {
    const value = parseFloat(newRate);
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid rate');
      return;
    }
    
    const updatedRates = { ...rates, [vehicle]: value };
    
    try {
      // Optimistic update
      setRates(updatedRates);
      
      await axiosInstance.post('/settings/freight-rates', updatedRates, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      toast.success(`${vehicle} rate updated to ₹${value}/km (Saved to database)`);
    } catch (err) {
      console.error('Error saving rate:', err);
      toast.error('Failed to save rate to database');
      // Revert on error
      fetchRates();
    }
  };

  // Get coordinates using multiple methods
  const getCoordinatesFromPincode = async (pincode) => {
    // Check cache first
    if (coordinatesCache[pincode]) {
      return coordinatesCache[pincode];
    }

    try {
      // Method 1: Try OpenStreetMap Nominatim with full address
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
          
          return coordinates;
        }
      }
      
      // Method 3: Use pincode range database (fallback)
      return getPincodeCoordinates(pincode);
      
    } catch (err) {
      console.error('Error getting coordinates:', err);
      return getPincodeCoordinates(pincode);
    }
  };

  // Pincode to approximate coordinates database for India
const getPincodeCoordinates = (pincode) => {
  const pincodeNum = parseInt(pincode);
  
  // Major city coordinates database
  const pincodeDatabase = {
    // Jalandhar region (144001-144999)
    // Jalandhar region (144001-144999) - WITH MORE ACCURATE COORDINATES
    '144013': { lat: 31.3260, lon: 75.5762, city: 'Jalandhar', state: 'Punjab' }, // Sangal Sohal
    
    // Jalandhar City Center and nearby areas
    '144001': { lat: 31.3256, lon: 75.5792, city: 'Jalandhar City', state: 'Punjab' }, // Civil Lines
    '144002': { lat: 31.3265, lon: 75.5780, city: 'Jalandhar City', state: 'Punjab' }, // Model Town
    '144003': { lat: 31.3270, lon: 75.5775, city: 'Jalandhar City', state: 'Punjab' }, // Guru Teg Bahadur Nagar
    '144004': { lat: 31.3245, lon: 75.5800, city: 'Jalandhar City', state: 'Punjab' }, // Adarsh Nagar
    '144005': { lat: 31.3280, lon: 75.5750, city: 'Jalandhar City', state: 'Punjab' }, // Basti Sheikh
    '144006': { lat: 31.3220, lon: 75.5820, city: 'Jalandhar City', state: 'Punjab' }, // Patel Chowk
    '144007': { lat: 31.3290, lon: 75.5730, city: 'Jalandhar City', state: 'Punjab' }, // New Jawahar Nagar
    '144008': { lat: 31.3300, lon: 75.5720, city: 'Jalandhar City', state: 'Punjab' }, // Urban Estate
    '144009': { lat: 31.3310, lon: 75.5710, city: 'Jalandhar City', state: 'Punjab' }, // Mota Singh Nagar
    '144010': { lat: 31.3320, lon: 75.5700, city: 'Jalandhar City', state: 'Punjab' }, // Shastri Nagar
    '144011': { lat: 31.3330, lon: 75.5690, city: 'Jalandhar City', state: 'Punjab' }, // Lajpat Nagar
    '144012': { lat: 31.3340, lon: 75.5680, city: 'Jalandhar City', state: 'Punjab' }, // Tagore Nagar
    '144014': { lat: 31.3350, lon: 75.5670, city: 'Jalandhar City', state: 'Punjab' }, // New Rajinder Nagar
    '144015': { lat: 31.3360, lon: 75.5660, city: 'Jalandhar City', state: 'Punjab' }, // Kapurthala Road
    '144016': { lat: 31.3370, lon: 75.5650, city: 'Jalandhar City', state: 'Punjab' }, // Nakodar Road
    '144017': { lat: 31.3380, lon: 75.5640, city: 'Jalandhar City', state: 'Punjab' }, // Maqsudan
    '144018': { lat: 31.3390, lon: 75.5630, city: 'Jalandhar City', state: 'Punjab' }, // Ladhewali
    '144019': { lat: 31.3400, lon: 75.5620, city: 'Jalandhar City', state: 'Punjab' }, // Rurka Kalan
    '144020': { lat: 31.3410, lon: 75.5610, city: 'Jalandhar City', state: 'Punjab' }, // Goraya
    '144021': { lat: 31.3420, lon: 75.5600, city: 'Jalandhar City', state: 'Punjab' }, // Phillaur
    '144022': { lat: 31.3430, lon: 75.5590, city: 'Jalandhar City', state: 'Punjab' }, // Apra (About 17 km from city center)
    
    '144026': { lat: 31.3300, lon: 75.5800, city: 'Jalandhar', state: 'Punjab' },
    
    // Kapurthala region
    '144411': { lat: 31.3800, lon: 75.3800, city: 'Kapurthala', state: 'Punjab' },
    
    // Ludhiana region
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

  // Calculate distance using Haversine formula
  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    // Add 15% buffer for road distance
    const straightDistance = R * c;
    const roadDistance = Math.ceil(straightDistance * 1.27);
    
    return roadDistance;
  };

  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer);
    if (customer && customer.pincode) {
      setDestinationPincode(customer.pincode);
      await calculatePincodeDistance(customer.pincode, customer);
    }
  };

  const handlePincodeSearch = async () => {
    if (!destinationPincode || destinationPincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    await calculatePincodeDistance(destinationPincode);
  };

  const calculatePincodeDistance = async (pincode, customer = null) => {
    setCalculatingDistance(true);
    
    try {
      // Get coordinates for destination
      const destCoords = await getCoordinatesFromPincode(pincode);
      
      // Get coordinates for starting location (from cache)
      const startCoords = coordinatesCache['144013'] || STARTING_LOCATION.coordinates;
      
      if (destCoords && startCoords) {
        const distance = calculateHaversineDistance(
          startCoords.lat, startCoords.lon,
          destCoords.lat, destCoords.lon
        );
        
        setDistance(distance);
        setPincodeDetails({
          city: destCoords.city,
          state: destCoords.state,
          area: destCoords.area || '',
          pincode: pincode,
          customer: customer,
          source: destCoords.source || 'api'
        });
        
        toast.success(`Distance: ${distance} km (approx.) - ${destCoords.city}, ${destCoords.state}`);
        
        // Log for debugging
        console.log(`Distance from Jalandhar to ${pincode} (${destCoords.city}): ${distance} km`);
      } else {
        toast.error('Could not find coordinates for this pincode');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to calculate distance');
    } finally {
      setCalculatingDistance(false);
    }
  };

  const addDestination = () => {
    if (!destinationPincode || distance === 0) {
      toast.error('Please select a valid destination first');
      return;
    }

    setMultipleDestinations([
      ...multipleDestinations,
      {
        id: Date.now(),
        pincode: destinationPincode,
        city: pincodeDetails?.city,
        area: pincodeDetails?.area,
        state: pincodeDetails?.state,
        distance: distance,
        customer: selectedCustomer || pincodeDetails?.customer
      }
    ]);

    // Reset for next entry
    setDestinationPincode('');
    setPincodeDetails(null);
    setSelectedCustomer(null);
    setDistance(0);
  };

  const removeDestination = (id) => {
    setMultipleDestinations(multipleDestinations.filter(dest => dest.id !== id));
  };

const calculateFreight = async () => {
  if (multipleDestinations.length === 0) {
    toast.error('Please add at least one destination');
    return;
  }

  console.log("========== FREIGHT CALCULATOR DEBUG ==========");
  console.log("Destinations:", multipleDestinations.map(d => ({
    city: d.city,
    pincode: d.pincode,
    storedDistance: d.distance
  })));
  console.log("Vehicle Type:", vehicleType);
  console.log("Rate per km:", rates[vehicleType]);
  console.log("Mileage:", MILEAGE[vehicleType]);

  // Get coordinates for all destinations (including start)
  const allPoints = [
    { ...STARTING_LOCATION, type: 'start' },
    ...multipleDestinations
  ];

  // Get coordinates for each destination (use cache if available)
  const pointsWithCoords = [];
  for (let i = 0; i < allPoints.length; i++) {
    const point = allPoints[i];
    
    if (i === 0) {
      // Starting point
      pointsWithCoords.push({
        ...point,
        coords: STARTING_LOCATION.coordinates
      });
    } else {
      // Get coordinates for destination
      const coords = await getCoordinatesFromPincode(point.pincode);
      pointsWithCoords.push({
        ...point,
        coords
      });
    }
  }

  // Calculate sequential distances
  let totalOneWayDistance = 0;
  const segmentDistances = [];

  for (let i = 0; i < pointsWithCoords.length - 1; i++) {
    const from = pointsWithCoords[i];
    const to = pointsWithCoords[i + 1];
    
    if (from.coords && to.coords) {
      const segmentDistance = calculateHaversineDistance(
        from.coords.lat, from.coords.lon,
        to.coords.lat, to.coords.lon
      );
      
      segmentDistances.push({
        from: i === 0 ? 'Jalandhar' : `Customer ${i}`,
        to: `Customer ${i + 1}`,
        distance: segmentDistance
      });
      
      totalOneWayDistance += segmentDistance;
    }
  }

  console.log("Segment Distances:", segmentDistances);
  console.log("One-Way Distance (sequential):", totalOneWayDistance);

  // Calculate return distance (last customer to Jalandhar)
  const lastCustomer = pointsWithCoords[pointsWithCoords.length - 1];
  const returnDistance = calculateHaversineDistance(
    lastCustomer.coords.lat, lastCustomer.coords.lon,
    STARTING_LOCATION.coordinates.lat, STARTING_LOCATION.coordinates.lon
  );
  console.log("Return Distance:", returnDistance);

  // Total round trip distance = one-way total + return from last customer
  const roundTripDistance = totalOneWayDistance + returnDistance;
  console.log("Round Trip Distance:", roundTripDistance);

  // Calculate running cost (based on round trip)
  const runningCost = roundTripDistance * rates[vehicleType];

  // Calculate diesel consumption for round trip (with 10% extra)
  const baseDiesel = roundTripDistance / MILEAGE[vehicleType];
  console.log("Base Diesel:", baseDiesel);

  const totalDiesel = baseDiesel * 1.1; // Adding 10%
  console.log("Total Diesel (+10%):", totalDiesel);

  // Base kharcha
  let kharcha = KHARCHA[vehicleType];
  console.log("Base Kharcha:", kharcha);

  // Add extra kharcha for each additional customer beyond the first
  const extraCustomers = multipleDestinations.length - 1;
  console.log("Extra Customers:", extraCustomers);

  if (extraCustomers > 0) {
    if (vehicleType === 'tempo') {
      kharcha += extraCustomers * 50;
      console.log("Extra Kharcha (tempo):", extraCustomers * 50);
    } else if (vehicleType === 'truck') {
      kharcha += extraCustomers * 100;
      console.log("Extra Kharcha (truck):", extraCustomers * 100);
    }
  }

  console.log("Total Kharcha:", kharcha);
  console.log("================================================");

  setCalculation({
    oneWayDistance: totalOneWayDistance,
    returnDistance,
    roundTripDistance,
    runningCost,
    totalDiesel: totalDiesel.toFixed(2),
    kharcha,
    destinations: multipleDestinations,
    vehicleType,
    ratePerKm: rates[vehicleType],
    mileage: MILEAGE[vehicleType],
    extraCustomers,
    segmentDistances // Optional: store segment distances for display
  });
};

  const resetAll = () => {
    setMultipleDestinations([]);
    setCalculation(null);
    setDestinationPincode('');
    setPincodeDetails(null);
    setSelectedCustomer(null);
    setDistance(0);
  };

  // Safely prepare customer options
  const customerOptions = Array.isArray(customers) 
    ? customers.map(c => ({
        value: c._id,
        label: `${c.name || ''} ${c.company ? `- ${c.company}` : ''} ${c.pincode ? `(${c.pincode})` : ''}`,
        customer: c
      }))
    : [];

  return (
    <>
      <InternalNavbar />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-4xl">
        {/* Header with Reset Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Outward Freight Calculator</h1>
          {(multipleDestinations.length > 0 || calculation) && (
            <button
              onClick={resetAll}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition text-sm sm:text-base"
            >
              Reset All
            </button>
          )}
        </div>

        {/* Starting Location Display */}
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-blue-200">
          <h2 className="font-semibold text-blue-800 mb-2 flex items-center text-sm sm:text-base">
            <span className="mr-2">🚚</span> Starting Location:
          </h2>
          <p className="text-blue-700 text-xs sm:text-sm">{STARTING_LOCATION.address}</p>
          <p className="text-xs sm:text-sm text-blue-600 mt-1">Pincode: {STARTING_LOCATION.pincode}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Customer Selection and Pincode Input */}
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Customer Selection */}
            <div className="w-full">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Select Customer (Optional)
              </label>
              <Select
                options={customerOptions}
                onChange={(option) => handleCustomerSelect(option?.customer)}
                placeholder="Search customer..."
                isClearable
                isDisabled={calculatingDistance}
                className="text-xs sm:text-sm"
                noOptionsMessage={() => "No customers found"}
              />
            </div>

            {/* Or Enter Pincode */}
            <div className="w-full">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Or Enter Destination Pincode
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={destinationPincode}
                  onChange={(e) => setDestinationPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit pincode"
                  className="w-full sm:flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength="6"
                  disabled={calculatingDistance}
                />
                <button
                  onClick={handlePincodeSearch}
                  disabled={loading || calculatingDistance || !destinationPincode}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 text-sm"
                >
                  {calculatingDistance ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="hidden sm:inline">Calculating...</span>
                      <span className="sm:hidden">...</span>
                    </span>
                  ) : 'Search'}
                </button>
              </div>
            </div>
          </div>

          {/* Pincode Details */}
          {pincodeDetails && (
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
              <h3 className="font-semibold mb-2 flex items-center text-sm sm:text-base">
                <span className="mr-2">📍</span> Destination Details:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div>
                  <span className="font-medium block sm:inline">Area:</span> 
                  <span className="block sm:inline sm:ml-1">{pincodeDetails.area || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium block sm:inline">City:</span> 
                  <span className="block sm:inline sm:ml-1">{pincodeDetails.city || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium block sm:inline">State:</span> 
                  <span className="block sm:inline sm:ml-1">{pincodeDetails.state || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium block sm:inline">Pincode:</span> 
                  <span className="block sm:inline sm:ml-1">{pincodeDetails.pincode}</span>
                </div>
              </div>
              {pincodeDetails.customer && (
                <p className="text-xs sm:text-sm mt-2">
                  <span className="font-medium">Customer:</span> {pincodeDetails.customer.name}
                </p>
              )}
              {distance > 0 && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-green-700 font-semibold text-sm sm:text-base">
                    📏 Approximate Distance: {distance} km
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    *Jalandhar → {pincodeDetails.city}, {pincodeDetails.state}
                  </p>
                </div>
              )}
              <button
                onClick={addDestination}
                disabled={distance === 0}
                className="mt-3 w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 transition text-sm"
              >
                + Add to List
              </button>
            </div>
          )}

          {/* Multiple Destinations List */}
          {multipleDestinations.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <h3 className="font-semibold mb-3 flex items-center text-sm sm:text-base">
                <span className="mr-2">📋</span> Destinations Added:
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {multipleDestinations.map((dest) => (
                  <div key={dest.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-3 rounded border border-gray-200 gap-2">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <span className="font-medium text-sm">{dest.city}</span>
                        {dest.area && <span className="text-xs text-gray-600">({dest.area})</span>}
                        <span className="text-xs text-gray-600">{dest.pincode}</span>
                        {dest.customer && (
                          <span className="text-xs text-blue-600">- {dest.customer.name}</span>
                        )}
                        <span className="text-xs sm:text-sm font-semibold text-green-600 ml-auto sm:ml-2">{dest.distance} km</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDestination(dest.id)}
                      className="text-red-600 hover:text-red-800 text-xl self-end sm:self-auto"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Total Distance Summary */}
              <div className="bg-blue-50 p-3 rounded-lg mt-3">
                <p className="font-semibold flex justify-between text-sm">
                  <span>Total Distance:</span>
                  <span>{multipleDestinations.reduce((sum, dest) => sum + dest.distance, 0)} km</span>
                </p>
              </div>
            </div>
          )}

          {/* Vehicle Type */}
          <div className="mt-4 sm:mt-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Vehicle Type
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="tempo"
                  checked={vehicleType === 'tempo'}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="mr-2"
                />
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-medium text-sm">Tempo</span>
                  <span className="text-xs sm:text-sm text-gray-600 sm:ml-2">₹{rates.tempo}/km</span>
                  <span className="text-xs text-yellow-600 sm:ml-2">Kharcha: ₹{KHARCHA.tempo}</span>
                </div>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="truck"
                  checked={vehicleType === 'truck'}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="mr-2"
                />
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-medium text-sm">Truck</span>
                  <span className="text-xs sm:text-sm text-gray-600 sm:ml-2">₹{rates.truck}/km</span>
                  <span className="text-xs text-yellow-600 sm:ml-2">Kharcha: ₹{KHARCHA.truck}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Rate Configuration - Only visible to accounts */}
          {user?.role?.includes('accounts') && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-sm mb-3 flex items-center">
                <span className="mr-2">⚙️</span> Configure Freight Rates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tempo Rate (₹/km)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={rates.tempo}
                      onChange={(e) => {
                        const newRates = { ...rates, tempo: parseFloat(e.target.value) || 0 };
                        setRates(newRates);
                      }}
                      onBlur={() => updateRate('tempo', rates.tempo)}
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      min="1"
                      step="1"
                      disabled={loadingRates}
                    />
                    <button
                      onClick={() => updateRate('tempo', rates.tempo)}
                      className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-300"
                      disabled={loadingRates}
                    >
                      Save
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Truck Rate (₹/km)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={rates.truck}
                      onChange={(e) => {
                        const newRates = { ...rates, truck: parseFloat(e.target.value) || 0 };
                        setRates(newRates);
                      }}
                      onBlur={() => updateRate('truck', rates.truck)}
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      min="1"
                      step="1"
                      disabled={loadingRates}
                    />
                    <button
                      onClick={() => updateRate('truck', rates.truck)}
                      className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-300"
                      disabled={loadingRates}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
             
            </div>
          )}

          {/* Calculate Button */}
          {multipleDestinations.length > 0 && (
            <button
              onClick={calculateFreight}
              className="mt-4 sm:mt-6 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition text-sm sm:text-base"
            >
              Calculate Freight
            </button>
          )}
        </div>

        {/* Calculation Results */}
        {calculation && (
          <div className="bg-green-50 rounded-lg shadow-md p-4 sm:p-6 border border-green-200">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-green-800 flex items-center">
              <span className="mr-2">📊</span> Calculation Result
            </h2>
            
            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-white p-2 sm:p-3 rounded-lg">
                <p className="text-gray-600 text-xs">Starting Point</p>
                <p className="font-semibold text-sm">{STARTING_LOCATION.city}</p>
                <p className="text-xs text-gray-500">{STARTING_LOCATION.pincode}</p>
              </div>
              <div className="bg-white p-2 sm:p-3 rounded-lg">
                <p className="text-gray-600 text-xs">Vehicle</p>
                <p className="font-semibold text-sm capitalize">{calculation.vehicleType}</p>
              </div>
              <div className="bg-white p-2 sm:p-3 rounded-lg">
                <p className="text-gray-600 text-xs">Rate/km</p>
                <p className="font-semibold text-sm">₹{calculation.ratePerKm}</p>
              </div>
              <div className="bg-white p-2 sm:p-3 rounded-lg">
                <p className="text-gray-600 text-xs">One-Way</p>
                <p className="font-semibold text-sm">{calculation.oneWayDistance} km</p>
              </div>
              <div className="bg-white p-2 sm:p-3 rounded-lg">
                <p className="text-gray-600 text-xs">Round Trip</p>
                <p className="font-semibold text-sm text-blue-600">{calculation.roundTripDistance} km</p>
              </div>
              <div className="bg-white p-2 sm:p-3 rounded-lg">
                <p className="text-gray-600 text-xs">Mileage</p>
                <p className="font-semibold text-sm">{calculation.mileage} km/L</p>
              </div>
            </div>

            {/* Diesel & Kharcha Section */}
            <div className="border-t border-green-200 pt-3 sm:pt-4 mt-2">
              <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">⛽ Diesel & Kharcha (Round Trip):</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-3 sm:p-4 rounded-lg">
                  <p className="text-gray-600 text-xs sm:text-sm">Base Diesel (Round Trip):</p>
                  <p className="text-lg sm:text-2xl font-bold">{(calculation.roundTripDistance / calculation.mileage).toFixed(2)} L</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg">
                  <p className="text-gray-600 text-xs sm:text-sm">+ 10% Extra:</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{((calculation.roundTripDistance / calculation.mileage) * 0.1).toFixed(2)} L</p>
                </div>
              </div>

              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mt-3 sm:mt-4">
                <p className="text-gray-600 text-xs sm:text-sm">Total Diesel Required (Round Trip):</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-700">{calculation.totalDiesel} Liters</p>
              </div>

              <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg mt-3 sm:mt-4">
                <p className="text-gray-600 text-xs sm:text-sm">Kharcha (Fixed - One Time):</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-700">₹{calculation.kharcha}</p>
              </div>
            </div>

            {/* Total Freight Amount */}
            <div className="mt-6 bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 rounded-lg shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <div>
                  <p className="text-blue-100 text-sm sm:text-base mb-1">Total Freight Amount (Round Trip + Kharcha)</p>
                  <p className="text-white text-2xl sm:text-3xl font-bold">
                    ₹{(calculation.roundTripDistance * calculation.ratePerKm + calculation.kharcha).toLocaleString()}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 bg-white px-4 py-2 rounded-lg">
                  <p className="text-blue-700 font-semibold text-sm">Rate: ₹{calculation.ratePerKm}/km</p>
                  <p className="text-blue-600 text-xs">Kharcha: ₹{calculation.kharcha}</p>
                </div>
              </div>
              
              {/* Breakdown */}
              <div className="mt-3 pt-3 border-t border-blue-400 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-blue-100">
                <div>Running Cost: <span className="font-semibold">₹{(calculation.roundTripDistance * calculation.ratePerKm).toLocaleString()}</span></div>
                <div>Kharcha: <span className="font-semibold">₹{calculation.kharcha}</span></div>
                <div className="col-span-2 sm:col-span-1">Round Trip: <span className="font-semibold">{calculation.roundTripDistance} km</span></div>
              </div>
            </div>

           {/* Route Summary with correct return logic */}
<div className="mt-4 sm:mt-6 bg-white p-3 sm:p-4 rounded-lg">
  <p className="font-semibold mb-2 flex items-center text-sm sm:text-base">
    <span className="mr-2">🛣️</span> Route Summary:
  </p>
  <div className="ml-2">
    {/* Outward journey */}
    <div className="flex items-start mb-2 text-blue-700 text-xs sm:text-sm">
      <span className="mr-2">🚚</span>
      <span className="break-words">Start: {STARTING_LOCATION.address}</span>
    </div>
    
    {/* All destinations in sequence */}
    {calculation.destinations.map((dest, idx) => (
      <div key={dest.id} className="flex items-start mb-2 ml-4">
        <span className="mr-2 text-green-600">↓</span>
        <div className="text-xs sm:text-sm">
          <span className="font-medium">📍 Customer {idx + 1}: {dest.city}</span>
          {dest.area && <span className="text-gray-600"> ({dest.area})</span>}
          <span className="text-gray-600 ml-1 sm:ml-2">{dest.pincode}</span>
          <span className="text-green-600 ml-1 sm:ml-2">+{dest.distance} km</span>
          {dest.customer && (
            <span className="text-blue-600 ml-1 sm:ml-2 block sm:inline">- {dest.customer.name}</span>
          )}
        </div>
      </div>
    ))}
    
    {/* Return journey from last customer */}
    <div className="flex items-start mt-2 ml-4 text-purple-600">
      <span className="mr-2">↩️</span>
      <span className="text-xs sm:text-sm">
        Return from {calculation.destinations[calculation.destinations.length - 1].city} to {STARTING_LOCATION.city} (+{calculation.returnDistance} km)
      </span>
    </div>
    
    {/* Distance summary */}
    <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs">
      <p><span className="font-medium">Outward journey:</span> {calculation.oneWayDistance} km</p>
      <p><span className="font-medium">Return journey:</span> {calculation.returnDistance} km</p>
      <p><span className="font-medium">Total round trip:</span> {calculation.roundTripDistance} km</p>
    </div>
  </div>
</div>

{/* Extra Kharcha Breakdown */}
{calculation.extraCustomers > 0 && (
  <div className="mt-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
    <p className="text-xs sm:text-sm font-semibold text-yellow-800 mb-1">Kharcha Breakdown:</p>
    <p className="text-xs text-yellow-700">Base Kharcha: ₹{KHARCHA[calculation.vehicleType]}</p>
    <p className="text-xs text-yellow-700">Extra for {calculation.extraCustomers} additional customer{calculation.extraCustomers > 1 ? 's' : ''}: 
      +₹{calculation.vehicleType === 'tempo' ? calculation.extraCustomers * 50 : calculation.extraCustomers * 100}
    </p>
    <p className="text-xs font-bold text-yellow-800 mt-1">Total Kharcha: ₹{calculation.kharcha}</p>
  </div>
)}
          </div>
        )}
      </div>
    </>
  );
};

export default FreightCalculator;