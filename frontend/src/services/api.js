import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "http://localhost:8080/api",

  timeout: 15000,

  headers: {
    Accept: "application/json",
  },
});

// Add the JWT token to requests when the user is logged in.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Keep API errors available to the page that made the request.
// Authentication state will be handled by AuthContext.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      error.message =
        "The server took too long to respond. Please try again.";
    } else if (!error.response) {
      error.message =
        "Cannot connect to the server. Check that Spring Boot is running.";
    }

    return Promise.reject(error);
  }
);

export default api;