import { createSlice } from "@reduxjs/toolkit"

function readStoredAuth() {
  return {
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    displayName: localStorage.getItem("displayName"),
    profilePicture: localStorage.getItem("profilePicture")
  }
}

const stored = readStoredAuth()
const initialState = {
  token: stored.token,
  role: stored.role,
  displayName: stored.displayName,
  profilePicture: stored.profilePicture
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { token, role, displayName, profilePicture } = action.payload
      state.token = token ?? null
      state.role = role ?? null
      state.displayName = displayName ?? null
      state.profilePicture = profilePicture ?? null
      if (token) localStorage.setItem("token", token)
      else localStorage.removeItem("token")
      if (role) localStorage.setItem("role", role)
      else localStorage.removeItem("role")
      if (displayName != null) localStorage.setItem("displayName", displayName)
      else localStorage.removeItem("displayName")
      if (profilePicture != null) localStorage.setItem("profilePicture", profilePicture)
      else localStorage.removeItem("profilePicture")
    },
    clearCredentials(state) {
      state.token = null
      state.role = null
      state.displayName = null
      state.profilePicture = null
      localStorage.removeItem("token")
      localStorage.removeItem("role")
      localStorage.removeItem("displayName")
      localStorage.removeItem("profilePicture")
    },
    hydrateAuthFromStorage(state) {
      const s = readStoredAuth()
      state.token = s.token
      state.role = s.role
      state.displayName = s.displayName
      state.profilePicture = s.profilePicture
    }
  }
})

export const { setCredentials, clearCredentials, hydrateAuthFromStorage } = authSlice.actions
export default authSlice.reducer