import { configureStore } from '@reduxjs/toolkit';
import userProfileReducer from './userProfile';
import { storageMiddleware } from './storageMiddleware';

export const store = configureStore({
  reducer: {
    userProfile: userProfileReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ['payload.lastSyncTime'],
        ignoredPaths: ['userProfile.lastSyncTime']
      }
    }).concat(storageMiddleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export { store };