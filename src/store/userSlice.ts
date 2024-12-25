import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Repository } from '../utils/constants';
import type { RootState } from './store';

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
  name: 'userProfile',
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

// Селекторы
export const selectUserSettings = (state: RootState) => state.userProfile.settings;
export const addCustomRepository = userSlice.actions.addRepository;

// Экспорт экшенов и редюсера
export const { 
  setUser, 
  updateSettings, 
  removeRepository, 
  logout 
} = userSlice.actions;

export default userSlice.reducer;