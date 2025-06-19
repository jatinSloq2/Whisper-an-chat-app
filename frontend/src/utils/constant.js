export const  HOST = import.meta.env.VITE_API_URL || 'http://localhost:7777';

export const AUTH_ROUTES = "api/auth";
export const SIGNUP_ROUTES = `${AUTH_ROUTES}/signup`;
export const LOGIN_ROUTES = `${AUTH_ROUTES}/login`;
export const GET_USER_INFO = `${AUTH_ROUTES}/user-info`; 
export const UPDATE_USER_INFO = `${AUTH_ROUTES}/update-user-info`;   
export const UPLOAD_PROFILE_IMAGE = `${AUTH_ROUTES}/upload-profile-image`;
export const REMOVE_PROFILEIMAGE = `${AUTH_ROUTES}/remove-profile-image`