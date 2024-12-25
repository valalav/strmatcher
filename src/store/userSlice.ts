import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Repository } from '../utils/constants';

interface UserSettings {
  markerCount: number;
  maxDistance: number;
  maxMatches: number;
  markerSortOrder: 'default' | 'mutation_rate';
  repositories: Repository[];
}

interface UserState {
  id: string | null;
  settings: UserSettings;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  id: null,
  settings: {
    markerCount: 37,
    maxDistance: 25,
    maxMatches: 200,
    markerSortOrder: 'mutation_rate',
    repositories: []
  },
  isAuthenticated: false
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<string>) {
      state.id = action.payload;
      state.isAuthenticated = true;
    },
    updateSettings(state, action: PayloadAction<Partial<UserSettings>>) {
      state.settings = { ...state.settings, ...action.payload };
    },
    addRepository(state, action: PayloadAction<Repository>) {
      state.settings.repositories.push(action.payload);
    },
    removeRepository(state, action: PayloadAction<string>) {
      state.settings.repositories = state.settings.repositories.filter(
        repo => repo.id !== action.payload
      );
    },
    logout(state) {
      state.id = null;
      state.isAuthenticated = false;
    }
  }
});

export const { 
  setUser, 
  updateSettings, 
  addRepository, 
  removeRepository, 
  logout 
} = userSlice.actions;

export default userSlice.reducer;