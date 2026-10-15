/**
 * BistroPulse Haptics & Vibration API Service
 * Handles real mobile device vibration patterns for order alerts, games, and tactile feedback.
 * Also provides fallback visual haptic pulses for browsers/OS without Vibration API (e.g. iOS Safari).
 */

export type HapticPatternName = 'readyPager' | 'pulseAlert' | 'doubleBuzz' | 'lightTap' | 'successFanfare';

export const HAPTIC_PATTERNS: Record<HapticPatternName, number[]> = {
  // Classic restaurant pager buzzer pattern (vibrate, pause, vibrate, pause, long buzz)
  readyPager: [300, 120, 300, 120, 450, 150, 600],
  // Quick double buzz for updates
  pulseAlert: [200, 100, 200, 100, 400],
  // Double tap
  doubleBuzz: [150, 80, 150],
  // Micro haptic click for buttons
  lightTap: [35],
  // Victory fanfare cadence
  successFanfare: [100, 60, 100, 60, 200, 80, 350]
};

class HapticsService {
  private isEnabled: boolean = true;
  private isSupported: boolean = false;
  private listeners: Set<(enabled: boolean) => void> = new Set();

  constructor() {
    this.checkSupport();
    this.loadPreference();
  }

  private checkSupport() {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.isSupported = 'vibrate' in navigator && typeof navigator.vibrate === 'function';
    }
  }

  private loadPreference() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('bistropulse_vibration_enabled');
      if (saved !== null) {
        this.isEnabled = saved === 'true';
      }
    } catch {}
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('bistropulse_vibration_enabled', enabled ? 'true' : 'false');
    } catch {}
    this.notify();
    if (enabled) {
      this.trigger('lightTap');
    } else {
      this.stop();
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  /**
   * Triggers the Vibration API with the specified pattern or custom ms array.
   * Returns true if navigator.vibrate executed successfully.
   */
  public trigger(pattern: HapticPatternName | number[] = 'readyPager'): boolean {
    if (!this.isEnabled) return false;
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

    if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
      return false;
    }

    try {
      const patternArray = Array.isArray(pattern) ? pattern : (HAPTIC_PATTERNS[pattern] || HAPTIC_PATTERNS.readyPager);
      const result = navigator.vibrate(patternArray);
      return result;
    } catch {
      return false;
    }
  }

  /**
   * Immediately stops any active vibration
   */
  public stop() {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {}
    }
  }

  public subscribe(listener: (enabled: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isEnabled);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.isEnabled);
    }
  }
}

export const hapticsService = new HapticsService();
