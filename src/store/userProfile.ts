import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Repository } from '@/utils/constants';

export interface UserProfile {
  id: string;
  settings: {
    defaultMarkerCount: number;
    maxDistance: number;
    maxMatches: number;
    markerSortOrder: 'default' | 'mutation_rate';
    selectedRepositories: string[];
    customRepositories: Repository[];
    tableSettings: {
      pageSize: number;
      visibleColumns: string[];
    };
    performance: {
      useWorkers: boolean;
      chunkSize: number;
      cacheResults: boolean;
    };
  };
  lastSyncTime?: Date;
}

const initialState: UserProfile = {
  id: '',
  settings: {
    defaultMarkerCount: 37,
    maxDistance: 25,
    maxMatches: 200,
    markerSortOrder: 'mutation_rate',
    selectedRepositories: [],
    customRepositories: [],
    tableSettings: {
      pageSize: 50,
      visibleColumns: []
    },
    performance: {
      useWorkers: true,
      chunkSize: 1000,
      cacheResults: true
    }
  }
};

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      return { ...state, ...action.payload };
    },
    updateSettings: (state, action: PayloadAction<Partial<UserProfile['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    addCustomRepository: (state, action: PayloadAction<Repository>) => {
      state.settings.customRepositories.push(action.payload);
    },
    removeCustomRepository: (state, action: PayloadAction<string>) => {
      state.settings.customRepositories = state.settings.customRepositories
        .filter(repo => repo.id !== action.payload);
    },
    setLastSyncTime: (state) => {
      state.lastSyncTime = new Date();
    },
    resetProfile: () => initialState
  }
});

export const {
  setProfile,
  updateSettings,
  addCustomRepository,
  removeCustomRepository,
  setLastSyncTime,
  resetProfile
} = userProfileSlice.actions;

export const selectUserProfile = (state: { userProfile: UserProfile }) => state.userProfile;
export const selectUserSettings = (state: { userProfile: UserProfile }) => state.userProfile.settings;

export default userProfileSlice.reducer;