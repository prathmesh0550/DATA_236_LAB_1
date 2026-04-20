import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { userApi } from "../../api/axios"

export const fetchFavorites = createAsyncThunk(
  "favorites/fetchFavorites",
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.get("/users/me/favorites")
      return res.data || []
    } catch (e) {
      return rejectWithValue(e.response?.data?.detail || e.message)
    }
  }
)

const favoritesSlice = createSlice({
  name: "favorites",
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    removeFavoriteLocal(state, action) {
      const id = action.payload
      state.items = state.items.filter((x) => x.restaurant_id !== id)
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false
        state.items = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to load favorites"
      })
  }
})

export const { removeFavoriteLocal } = favoritesSlice.actions
export default favoritesSlice.reducer