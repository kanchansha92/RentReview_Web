import { configureStore } from '@reduxjs/toolkit';
import authReducer, { TOKEN_KEY, USER_KEY } from './authSlice';
import reviewReducer from './reviewSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        review: reviewReducer,
    },
});

// ─── Auth persistence ─────────────────────────────────────────────────────────
// The auth reducers are pure; localStorage is written here instead, from a
// single subscriber. Only runs when the auth slice actually changes.
let lastAuth = store.getState().auth;

const persistAuth = ({ token, user }) => {
    try {
        // Never persist `undefined` — localStorage.setItem coerces it to the
        // string "undefined", which then reads back as a truthy token forever.
        const hasToken =
            typeof token === 'string' && token.length > 0 && token !== 'undefined' && token !== 'null';

        if (hasToken && user && typeof user === 'object') {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
            // Half a session is no session — keep both keys in agreement.
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        }
    } catch {
        // storage unavailable (private mode / quota) — state stays in memory only
    }
};

store.subscribe(() => {
    const auth = store.getState().auth;
    if (auth === lastAuth) return;
    lastAuth = auth;
    persistAuth(auth);
});

export default store;
