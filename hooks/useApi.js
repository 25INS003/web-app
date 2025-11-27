// src/hooks/useApi.js
"use client";

import { useCallback, useState } from "react";
import apiClient from "@/api/apiClient";

/**
 * A custom React hook for making API requests with built-in loading and error states
 * @returns {Object} An object containing loading state, error state, and HTTP methods
 * @property {boolean} loading - Indicates if a request is in progress
 * @property {string|null} error - The error message from the last failed request, or null if no error
 * @property {Function} get - HTTP GET method
 * @property {Function} post - HTTP POST method  
 * @property {Function} put - HTTP PUT method
 * @property {Function} patch - HTTP PATCH method
 * @property {Function} delete - HTTP DELETE method
 * @property {Function} softDelete - Soft delete using PATCH method
 * 
 * @example
 * const { loading, error, get, post } = useApi();
 * 
 * // GET request
 * const users = await get('/api/users');
 * 
 * // POST request  
 * const newUser = await post('/api/users', { name: 'John' });
 */
export default function useApi() {
    // State for tracking request loading status
    const [loading, setLoading] = useState(false);
    
    // State for storing error messages from failed requests
    const [error, setError] = useState(null);

    /**
     * Core request function that handles all API calls
     * @param {string} method - HTTP method (get, post, put, patch, delete)
     * @param {string} url - The endpoint URL
     * @param {Object|null} data - Request payload for POST, PUT, PATCH requests
     * @param {Object} config - Additional Axios configuration options
     * @returns {Promise} Promise resolving to response data
     * @throws {Error} Throws error if request fails
     */
    const request = useCallback(async (method, url, data = null, config = {}) => {
        // Set loading state to true when request starts
        setLoading(true);
        
        // Clear any previous errors
        setError(null);

        try {
            // Make API request using axios instance
            const response = await apiClient({
                method,          // HTTP method
                url,            // Endpoint URL
                data,           // Request body data
                withCredentials: true, // 🔐 Include cookies in cross-origin requests
                ...config,      // Merge with any additional configuration
            });

            // Return response data for successful requests
            return response.data;
        } catch (err) {
            // Extract error message from response data or use generic message
            const errorMessage = err.response?.data || err.message;
            setError(errorMessage);
            
            // Re-throw error to allow calling code to handle it
            throw err;
        } finally {
            // Always set loading to false when request completes (success or failure)
            setLoading(false);
        }
    }, []); // Empty dependency array ensures function stability across re-renders

    // Return public API of the hook
    return {
        loading,
        error,
        
        /**
         * HTTP GET - Retrieve resources
         * @param {string} url - The endpoint URL
         * @param {Object} config - Additional Axios configuration
         * @returns {Promise} Promise resolving to response data
         */
        get: (url, config = {}) => request("get", url, null, config),
        
        /**
         * HTTP POST - Create new resource
         * @param {string} url - The endpoint URL
         * @param {Object} data - Request payload
         * @param {Object} config - Additional Axios configuration  
         * @returns {Promise} Promise resolving to created resource data
         */
        post: (url, data, config = {}) => request("post", url, data, config),
        
        /**
         * HTTP PUT - Replace entire resource
         * @param {string} url - The endpoint URL
         * @param {Object} data - Complete resource data for replacement
         * @param {Object} config - Additional Axios configuration
         * @returns {Promise} Promise resolving to updated resource data
         */
        put: (url, data, config = {}) => request("put", url, data, config),
        
        /**
         * HTTP PATCH - Partially update resource
         * @param {string} url - The endpoint URL  
         * @param {Object} data - Partial resource data for update
         * @param {Object} config - Additional Axios configuration
         * @returns {Promise} Promise resolving to updated resource data
         */
        patch: (url, data, config = {}) => request("patch", url, data, config),
        
        /**
         * HTTP DELETE - Remove resource permanently
         * @param {string} url - The endpoint URL
         * @param {Object} config - Additional Axios configuration
         * @returns {Promise} Promise resolving to deletion result
         */
        delete: (url, config = {}) => request("delete", url, null, config),
        
        /**
         * Soft delete - Mark resource as deleted without permanent removal
         * @param {string} url - The endpoint URL
         * @param {Object} data - Soft deletion data (e.g., { deleted: true })
         * @param {Object} config - Additional Axios configuration
         * @returns {Promise} Promise resolving to soft-deleted resource data
         */
        softDelete: (url, data, config = {}) => request("patch", url, data, config),
    };
}