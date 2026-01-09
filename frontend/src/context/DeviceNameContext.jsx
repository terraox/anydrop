import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const DeviceNameContext = createContext(null);

export const DeviceNameProvider = ({ children }) => {
    const [deviceName, setDeviceName] = useState(() => {
        // Initialize from localStorage if available
        return localStorage.getItem('anydrop_device_name') || '';
    });
    const [isLoading, setIsLoading] = useState(true);

    // Generate a random device name if none exists
    const generateDeviceName = () => {
        const prefixes = ['Orbit', 'Nexus', 'Flux', 'Cyber', 'Titan', 'Aero', 'Prime'];
        const suffixes = ['Alpha', 'Beta', 'Prime', 'X', '9', 'V2', 'Link'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${suffixes[Math.floor(Math.random() * suffixes.length)]}-${Math.floor(Math.random() * 100)}`;
    };

    // Load device name from backend
    const loadDeviceName = useCallback(async () => {
        try {
            const response = await api.get('/device/identity');
            if (response.data?.deviceName) {
                const name = response.data.deviceName;
                setDeviceName(name);
                localStorage.setItem('anydrop_device_name', name);
                return name;
            }
        } catch (error) {
            console.warn('Failed to load device name from backend:', error);
        }
        
        // Fallback to localStorage or generate new name
        const storedName = localStorage.getItem('anydrop_device_name');
        if (storedName) {
            setDeviceName(storedName);
            return storedName;
        }
        
        // Generate new name if none exists
        const newName = generateDeviceName();
        setDeviceName(newName);
        localStorage.setItem('anydrop_device_name', newName);
        return newName;
    }, []);

    // Update device name (save to both localStorage and backend)
    const updateDeviceName = useCallback(async (newName) => {
        if (!newName || newName.trim() === '') {
            throw new Error('Device name cannot be empty');
        }

        const trimmedName = newName.trim();
        
        // Optimistic update to localStorage and state
        setDeviceName(trimmedName);
        localStorage.setItem('anydrop_device_name', trimmedName);

        // Also save to backend
        try {
            await api.put('/device/name', {
                deviceName: trimmedName
            });
            console.log('✅ Device name updated successfully');
        } catch (error) {
            console.error('Failed to update device name on backend:', error);
            // Revert optimistic update on error
            const storedName = localStorage.getItem('anydrop_device_name');
            if (storedName) {
                setDeviceName(storedName);
            }
            throw error;
        }
    }, []);

    // Listen for localStorage changes (cross-tab sync)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'anydrop_device_name' && e.newValue) {
                setDeviceName(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Load device name on mount
    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            await loadDeviceName();
            setIsLoading(false);
        };
        initialize();
    }, [loadDeviceName]);

    const value = {
        deviceName,
        isLoading,
        updateDeviceName,
        refreshDeviceName: loadDeviceName,
        generateDeviceName
    };

    return (
        <DeviceNameContext.Provider value={value}>
            {children}
        </DeviceNameContext.Provider>
    );
};

export const useDeviceName = () => {
    const context = useContext(DeviceNameContext);
    if (!context) {
        throw new Error('useDeviceName must be used within DeviceNameProvider');
    }
    return context;
};
