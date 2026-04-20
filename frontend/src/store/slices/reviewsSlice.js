import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { reviewApi } from "../../api/axios"

export const fetchReviewsForRestaurant = createAsyncThunk(
  "reviews/fetchForRestaurant",
  async (restaurantId, { rejectWithValue }) => {
    try {
      const res = await reviewApi.get(`/restaurants/${restaurantId}/reviews`)
      return { restaurantId, items: res.data || [] }
    } catch (e) {
      return rejectWithValue(e.response?.data?.detail || e.message)
    }
  }
)

const reviewsSlice = createSlice({
  name: "reviews",
  initialState: {
    byRestaurantId: {},
    pendingByReviewId: {},
    loading: false,
    error: null
  },
  reducers: {
    setReviewPendingStatus(state, action) {
      const { reviewId, status, message } = action.payload
      state.pendingByReviewId[reviewId] = { status, message, updatedAt: Date.now() }
    },
    clearReviewPending(state, action) {
      delete state.pendingByReviewId[action.payload]
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewsForRestaurant.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReviewsForRestaurant.fulfilled, (state, action) => {
        state.loading = false
        const { restaurantId, items } = action.payload
        state.byRestaurantId[restaurantId] = items
      })
      .addCase(fetchReviewsForRestaurant.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to load reviews"
      })
  }
})

export const { setReviewPendingStatus, clearReviewPending } = reviewsSlice.actions
export default reviewsSlice.reducer