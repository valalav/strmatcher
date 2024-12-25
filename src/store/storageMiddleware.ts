import { Middleware } from '@reduxjs/toolkit';
import type { UserProfile } from './userProfile';

const STORAGE_KEY = 'str_matcher_user_profile';

export const storageMiddleware: Middleware = store => next => action => {
  const result = next(action);
  
  if (action.type.startsWith('userProfile/')) {
    try {
      const state = store.getState();
      const profile: UserProfile = state.userProfile;
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save profile to storage:', error);
    }
  }
  
  return result;
};

export function loadProfileFromStorage(): UserProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load profile from storage:', error);
  }
  return null;
}