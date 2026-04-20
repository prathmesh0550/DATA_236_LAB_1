import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { restaurantApi } from "../../api/axios"

export const fetchRestaurants = createAsyncThunk(
  "restaurants/fetchRestaurants",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await restaurantApi.get("/restaurants", { params })
      return res.data || []
    } catch (e) {
      return rejectWithValue(e.response?.data?.detail || e.message)
    }
  }
)

const restaurantsSlice = createSlice({
  name: "restaurants",
  initialState: {
    list: [],
    loading: false,
    error: null,
    filters: { keyword: "", city: "", zip: "" }
  },
  reducers: {
    setRestaurantFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearRestaurantError(state) {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to load restaurants"
        state.list = []
      })
  }
})

export const { setRestaurantFilters, clearRestaurantError } = restaurantsSlice.actions
export default restaurantsSlice.reducer