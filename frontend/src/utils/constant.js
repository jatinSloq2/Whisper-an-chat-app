export const  HOST = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AUTH_ROUTES = "api/auth";
export const SIGNUP_ROUTES = `${AUTH_ROUTES}/signup`;
export const LOGIN_ROUTES = `${AUTH_ROUTES}/login`;
export const GET_USER_INFO = `${AUTH_ROUTES}/user-info`; 
export const UPDATE_USER_INFO = `${AUTH_ROUTES}/update-user-info`;   
