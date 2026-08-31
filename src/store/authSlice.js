import { createSlice } from '@reduxjs/toolkit';

export const TOKEN_KEY = 'rr_token';
export const USER_KEY = 'rr_user';

const LOGGED_OUT = { token: null, user: null, isAuthenticated: false };

const isUsableToken = (t) =>
    typeof t === 'string' && t.length > 0 && t !== 'undefined' && t !== 'null';

const clearStoredAuth = () => {
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    } catch {
        // storage unavailable — nothing to clear
    }
};


const loadInitialState = () => {
    let token = null;
    let user = null;

    try {
        const rawToken = localStorage.getItem(TOKEN_KEY);
        token = isUsableToken(rawToken) ? rawToken : null;
    } catch {
        return { ...LOGGED_OUT };
    }

    try {
        const raw = localStorage.getItem(USER_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        // Guard against `"null"`, `"123"` and other non-object payloads
        user = parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        user = null;
    }

   
    if (!token || !user) {
        clearStoredAuth();
        return { ...LOGGED_OUT };
    }

    return { token, user, isAuthenticated: true };
};

const authSlice = createSlice({
    name: 'auth',
    initialState: loadInitialState(),
    reducers: {
        /**
         * Call after a successful login / register / OAuth.
         * Payload: { token: string, user: object }
         */
        loginSuccess(state, action) {
            const { token, user } = action.payload || {};
            // Both halves are required — a token with no user is not a session.
            if (!isUsableToken(token) || !user || typeof user !== 'object') {
                state.token = null;
                state.user = null;
                state.isAuthenticated = false;
                return;
            }
            state.token = token;
            state.user = user;
            state.isAuthenticated = true;
        },

      
        updateUser(state, action) {
            const changes = action.payload;
            if (!changes || typeof changes !== 'object') return;
            if (!state.user) return;
            state.user = { ...state.user, ...changes };
        },

        /**
         * Clear all auth state (sign-out).
         */
        logoutSuccess(state) {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
        },
    },
});

export const { loginSuccess, updateUser, logoutSuccess } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;
