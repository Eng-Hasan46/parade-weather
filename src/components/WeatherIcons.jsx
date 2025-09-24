// Weather Icons Component with SVG icons
const WeatherIcons = {
    // Temperature
    thermometer: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15 13V5a3 3 0 0 0-6 0v8a5 5 0 1 0 6 0zM12 4a1 1 0 0 1 1 1v8.26a3 3 0 1 1-2 0V5a1 1 0 0 1 1-1z" />
        </svg>
    ),

    // Rain/Precipitation
    rainDrop: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l-4 8c0 2.21 1.79 4 4 4s4-1.79 4-4l-4-8z" />
            <path d="M6 14l-2 4c0 1.1.9 2 2 2s2-.9 2-2l-2-4zm12 0l-2 4c0 1.1.9 2 2 2s2-.9 2-2l-2-4z" />
        </svg>
    ),

    // UV Index / Sun
    sun: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
    ),

    // Wind
    wind: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h1a3 3 0 0 1 0 6h-1m5-6h2.5a2.5 2.5 0 0 1 0 5H16m-5-5V9a3 3 0 0 1 6 0v1" />
        </svg>
    ),

    // Cloud
    cloud: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 20q-2.075 0-3.537-1.463T1 15q0-1.95 1.175-3.375T5.25 10.1q.625-2.3 2.5-3.7T12 5q2.925 0 4.963 2.038T19 12q1.725.2 2.863 1.487T23 16.5q0 1.875-1.312 3.187T18.5 21H6Z" />
        </svg>
    ),

    // Lightning/Storm
    lightning: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 2L6 10h5v10l5-8h-5V2z" />
        </svg>
    ),

    // Snow
    snowflake: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20m8.66-15L3.34 17M20.66 7L3.34 17m0-10L20.66 17M8 8l8 8M8 16l8-8" />
        </svg>
    ),

    // Location Pin
    mapPin: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
    ),

    // Umbrella
    umbrella: (
        <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C7.03 2 3 6.03 3 11h18c0-4.97-4.03-9-9-9zm-1 9v7c0 .55-.45 1-1 1s-1-.45-1-1h-2c0 1.65 1.35 3 3 3s3-1.35 3-3v-7h-2z" />
        </svg>
    ),

    // Globe/Earth
    globe: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            <path d="M2 12h20" />
        </svg>
    )
};

export default WeatherIcons;