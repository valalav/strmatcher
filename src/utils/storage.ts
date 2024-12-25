export const saveToLocalStorage = (key: string, data: any) => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    console.error('Error saving to localStorage:', e);
    return false;
  }
};

export const loadFromLocalStorage = (key: string) => {
  try {
    const serialized = localStorage.getItem(key);
    if (!serialized) return null;
    return JSON.parse(serialized);
  } catch (e) {
    console.error('Error loading from localStorage:', e);
    return null;
  }
};