import { configureStore } from '@reduxjs/toolkit';
import authReducer, { USER_KEY } from './authSlice';
import reviewReducer from './reviewSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        review: reviewReducer,
    },
});

// ─── Auth persistence ─────────────────────────────────────────────────────────
// The auth reducers are pure; localStorage is written here instead, from a
// single subscriber. Only the user OBJECT is persisted the session itself is
// an HttpOnly cookie the page cannot see, so there is no credential here to
// leak. This cache exists so the UI can render before /auth/me answers.
let lastAuth = store.getState().auth;

const persistAuth = ({ user }) => {
    try {
        if (user && typeof user === 'object') {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(USER_KEY);
        }
    } catch {
        // storage unavailable (private mode / quota) state stays in memory only
    }
};

store.subscribe(() => {
    const auth = store.getState().auth;
    if (auth === lastAuth) return;
    lastAuth = auth;
    persistAuth(auth);
});

export default store;
