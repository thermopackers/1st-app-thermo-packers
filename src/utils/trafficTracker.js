import axiosInstance from "../axiosInstance";

const VISITOR_KEY = "tp_visitor_id";
const SESSION_START_KEY = "tp_session_start";

export const getVisitorId = () => {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
};

export const sendTraffic = async (extra = {}) => {
  try {
    const visitorId = getVisitorId();

    if (!sessionStorage.getItem(SESSION_START_KEY)) {
      sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
    }
    const sessionStart = Number(sessionStorage.getItem(SESSION_START_KEY));
    const timeSpent = Math.round((Date.now() - sessionStart) / 1000);

    const payload = {
      visitorId,
      timeSpent,
      ...extra,
    };

    // Strip empty values so we don't accidentally clear fields
    Object.keys(payload).forEach((k) => {
      if (
        payload[k] === undefined ||
        payload[k] === null ||
        payload[k] === ""
      ) {
        delete payload[k];
      }
    });

    const res = await axiosInstance.post("/traffic/track", payload);
    return res.data;
  } catch (err) {
    console.warn("traffic track failed", err?.message);
  }
};

// Initialize session on load
export const initTraffic = () => {
  if (!sessionStorage.getItem(SESSION_START_KEY)) {
    sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
  }
  sendTraffic({ pageVisited: window.location.pathname });

  // Heartbeat every 30s to update timeSpent
  setInterval(() => {
    sendTraffic();
  }, 30000);
};

export const trackExit = () => {
  sendTraffic({ sessionEnd: new Date().toISOString() });
};