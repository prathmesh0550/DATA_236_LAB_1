import axios from "axios";

const addAuthInterceptor = (client, tokenKey = "token") => {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

export const userApi = axios.create({
  baseURL: "http://localhost:8000",
});

export const ownerApi = axios.create({
  baseURL: "http://localhost:8001",
});

export const restaurantApi = axios.create({
  baseURL: "http://localhost:8002",
});

export const reviewApi = axios.create({
  baseURL: "http://localhost:8003",
});

addAuthInterceptor(userApi, "token");
addAuthInterceptor(ownerApi, "ownerToken");
addAuthInterceptor(restaurantApi, "ownerToken");
addAuthInterceptor(reviewApi, "token");

const API = userApi;
export default API;