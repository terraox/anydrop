import { useCallback } from 'react';

// Simple audio URLs (using free sound effects)
const SOUNDS = {
    uploadStart: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA',
    uploadSuccess: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA',
    uploadError: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA',
};

// Simple beep generator using Web Audio API
const playBeep = (frequency = 440, duration = 100, volume = 0.1) => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gainNode.gain.value = volume;

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
        console.warn('Audio not supported:', e);
    }
};

export const useSoundEffects = () => {
    const isSoundEnabled = () => {
        return localStorage.getItem('anydrop_sound_effects') !== 'false';
    };

    const playUploadStart = useCallback(() => {
        if (!isSoundEnabled()) return;
        playBeep(523.25, 80, 0.08); // C5 note, short
    }, []);

    const playUploadSuccess = useCallback(() => {
        if (!isSoundEnabled()) return;
        // Happy ascending notes
        playBeep(523.25, 80, 0.08); // C5
        setTimeout(() => playBeep(659.25, 80, 0.08), 100); // E5
        setTimeout(() => playBeep(783.99, 120, 0.1), 200); // G5
    }, []);

    const playUploadError = useCallback(() => {
        if (!isSoundEnabled()) return;
        // Descending notes
        playBeep(349.23, 150, 0.08); // F4
        setTimeout(() => playBeep(293.66, 200, 0.1), 150); // D4
    }, []);

    const toggleSoundEffects = useCallback((enabled) => {
        localStorage.setItem('anydrop_sound_effects', enabled ? 'true' : 'false');
    }, []);

    const getSoundEnabled = useCallback(() => {
        return localStorage.getItem('anydrop_sound_effects') !== 'false';
    }, []);

    return {
        playUploadStart,
        playUploadSuccess,
        playUploadError,
        toggleSoundEffects,
        getSoundEnabled,
    };
};

export default useSoundEffects;
