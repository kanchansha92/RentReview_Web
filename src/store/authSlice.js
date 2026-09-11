import { createSlice } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '../config/api';

export const USER_KEY = STORAGE_KEYS.USER;

// The session is an HttpOnly cookie the page cannot read, so there is no token
// in this store any more. `isAuthenticated` here means "render as signed in";
// the server is the only thing that can actually confirm a session, which
// getMe() does on boot. A forged rr_user therefore buys nothing: every
// protected request still fails without the cookie.
const LOGGED_OUT = { user: null, isAuthenticated: false };

const clearStoredAuth = () => {
    try {
        localStorage.removeItem(USER_KEY);
    } catch {
        // storage unavailable nothing to clear
    }
};

const loadInitialState = () => {
    try {
        const raw = localStorage.getItem(USER_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        // Guard against `"null"`, `"123"` and other non-object payloads.
        const user = parsed && typeof parsed === 'object' ? parsed : null;
        if (!user) {
            clearStoredAuth();
            return { ...LOGGED_OUT };
        }
        return { user, isAuthenticated: true };
    } catch {
        return { ...LOGGED_OUT };
    }
};

const authSlice = createSlice({
    name: 'auth',
    initialState: loadInitialState(),
    reducers: {
        /**
         * Call after a successful login / register / OAuth exchange.
         * Payload: { user } a bare user object is also accepted, since the
         * server no longer returns a token to pair it with.
         */
        loginSuccess(state, action) {
            const payload = action.payload || {};
            const user = payload.user !== undefined ? payload.user : payload;

            if (!user || typeof user !== 'object' || !Object.keys(user).length) {
                state.user = null;
                state.isAuthenticated = false;
                return;
            }
            state.user = user;
            state.isAuthenticated = true;
        },

        updateUser(state, action) {
            const changes = action.payload;
            if (!changes || typeof changes !== 'object') return;
            if (!state.user) return;
            state.user = { ...state.user, ...changes };
        },

        /** Clear all auth state (sign-out). */
        logoutSuccess(state) {
            state.user = null;
            state.isAuthenticated = false;
        },
    },
});

export const { loginSuccess, updateUser, logoutSuccess } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;
