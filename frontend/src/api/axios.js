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
addAuthInterceptor(reviewApi, "token");

restaurantApi.interceptors.request.use((config) => {
  const role = localStorage.getItem("role");
  const token = role === "owner"
    ? localStorage.getItem("ownerToken")
    : localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const API = userApi;
export default API;