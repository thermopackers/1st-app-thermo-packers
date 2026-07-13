// utils/locationUtils.js

// Office coordinates
const OFFICE_LAT = 31.342061136168773;
const OFFICE_LNG = 75.50998319319028;
// const OFFICE_LAT = 31.255052828282206;
// const OFFICE_LNG = 75.69665962698429;
const MAX_DISTANCE_METERS = 100;


/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Check if user is within office geo-fence
 * @param {number} lat - User's latitude
 * @param {number} lng - User's longitude
 * @returns {Object} { isWithinFence, distance }
 */
export const isWithinGeoFence = (lat, lng) => {
  const distance = calculateDistance(lat, lng, OFFICE_LAT, OFFICE_LNG);
  return {
    isWithinFence: distance <= MAX_DISTANCE_METERS,
    distance: Math.round(distance),
    maxDistance: MAX_DISTANCE_METERS,
    officeLat: OFFICE_LAT,
    officeLng: OFFICE_LNG
  };
};

/**
 * Get user's current location with error handling
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        let errorMessage = 'Could not get your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'Please check your device settings.';
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  });
};