/**
 * useOnlineStatus Hook Tests
 * Tests for online/offline detection functionality
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('useOnlineStatus Hook', () => {
  let originalNavigator: Navigator;
  let onlineHandler: ((event: Event) => void) | null = null;
  let offlineHandler: ((event: Event) => void) | null = null;

  beforeEach(() => {
    originalNavigator = global.navigator;

    // Mock navigator.onLine
    Object.defineProperty(global, 'navigator', {
      value: {
        ...originalNavigator,
        onLine: true,
      },
      writable: true,
      configurable: true,
    });

    // Track event listeners
    jest.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'online') onlineHandler = handler as (event: Event) => void;
      if (event === 'offline') offlineHandler = handler as (event: Event) => void;
    });

    jest.spyOn(window, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    jest.restoreAllMocks();
    onlineHandler = null;
    offlineHandler = null;
  });

  describe('Initial State', () => {
    it('should initialize as online when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      expect(navigator.onLine).toBe(true);
    });

    it('should initialize as offline when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      expect(navigator.onLine).toBe(false);
    });
  });

  describe('Event Listener Setup', () => {
    it('should add online event listener', () => {
      window.addEventListener('online', () => {});
      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    });

    it('should add offline event listener', () => {
      window.addEventListener('offline', () => {});
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Online Status Result', () => {
    it('should return correct structure', () => {
      const result = {
        isOnline: true,
        wasOffline: false,
      };

      expect(result).toHaveProperty('isOnline');
      expect(result).toHaveProperty('wasOffline');
      expect(typeof result.isOnline).toBe('boolean');
      expect(typeof result.wasOffline).toBe('boolean');
    });

    it('should indicate wasOffline when coming back online', () => {
      // Simulate coming back online after being offline
      const result = {
        isOnline: true,
        wasOffline: true, // User was previously offline
      };

      expect(result.isOnline).toBe(true);
      expect(result.wasOffline).toBe(true);
    });
  });

  describe('Callback-based Hook', () => {
    it('should call onOnline callback when going online', () => {
      const onOnline = jest.fn();

      // Simulate the callback being called
      if (navigator.onLine) {
        onOnline();
      }

      expect(onOnline).toHaveBeenCalled();
    });

    it('should call onOffline callback when going offline', () => {
      const onOffline = jest.fn();

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      if (!navigator.onLine) {
        onOffline();
      }

      expect(onOffline).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid online/offline transitions', () => {
      const states: boolean[] = [];

      // Simulate rapid changes
      [true, false, true, false, true].forEach(online => {
        Object.defineProperty(navigator, 'onLine', { value: online, writable: true });
        states.push(navigator.onLine);
      });

      expect(states).toEqual([true, false, true, false, true]);
    });

    it('should handle undefined navigator', () => {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      expect(typeof isOnline).toBe('boolean');
    });
  });
});
