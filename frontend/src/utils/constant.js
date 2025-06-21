export const  HOST = import.meta.env.VITE_API_URL || 'http://localhost:7777';

export const AUTH_ROUTES = "api/auth";
export const SIGNUP_ROUTES = `${AUTH_ROUTES}/signup`;
export const LOGIN_ROUTES = `${AUTH_ROUTES}/login`;
export const LOGOUT_ROUTES = `${AUTH_ROUTES}/logout`;
export const GET_USER_INFO = `${AUTH_ROUTES}/user-info`; 
export const UPDATE_USER_INFO = `${AUTH_ROUTES}/update-user-info`;   
export const UPLOAD_PROFILE_IMAGE = `${AUTH_ROUTES}/upload-profile-image`;
export const REMOVE_PROFILEIMAGE = `${AUTH_ROUTES}/remove-profile-image`

export const CONTACT_ROUTES = "api/contact"
export const SEARCH_CONTACTS = `${CONTACT_ROUTES}/search`
export const GET_CONTACTS_DMS = `${CONTACT_ROUTES}/get-contacts-for-dm-list`
export const GET_ALL_CONTACTS = `${CONTACT_ROUTES}/get-all-contacts`
export const ADD_CONTACTS = `${CONTACT_ROUTES}/add-new-contact`

export const MSG_ROUTES = "api/messages"
export const GET_MSG = `${MSG_ROUTES}/get-messages`
export const UPLOAD_FILE = `${MSG_ROUTES}/upload-file`

export const GROUP_ROUTES = "api/group"
export const CREATE_NEW_GROUP = `${GROUP_ROUTES}/create-group`
export const GET_USER_GROUPS = `${GROUP_ROUTES}/get-user-groups`
export const GET_ALL_MSG_GROUP = `${GROUP_ROUTES}/get-group-messages`