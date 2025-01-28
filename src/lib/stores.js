
import { writable } from 'svelte/store';

// Get initial value from localStorage or default to 'C'
const storedUnit = typeof localStorage !== 'undefined' ? localStorage.getItem('temperatureUnit') : null;
export const temperatureUnit = writable(storedUnit || 'C');

// Subscribe to changes and update localStorage
if (typeof localStorage !== 'undefined') {
  temperatureUnit.subscribe(value => {
    localStorage.setItem('temperatureUnit', value);
  });
}
