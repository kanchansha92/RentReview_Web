import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getMyReviews as apiGetMyReviews, getProperties as apiGetProperties } from '../services/reviewService';
import { logoutSuccess } from './authSlice';

// Async thunk to fetch the logged-in user's reviews
export const fetchMyReviews = createAsyncThunk(
    'review/fetchMyReviews',
    async (_, { rejectWithValue }) => {
        try {
            const data = await apiGetMyReviews();
            return data.reviews || [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchProperties = createAsyncThunk(
    'review/fetchProperties',
    async (params, { rejectWithValue }) => {
        try {
            const data = await apiGetProperties(params);
            return {
                properties: data.properties || [],
                // Present once the backend paginates; undefined on older deploys.
                total: typeof data.total === 'number' ? data.total : null,
                totalPages: typeof data.totalPages === 'number' ? data.totalPages : null,
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    myReviews: [],
    properties: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,

    propertiesStatus: 'idle',
    propertiesError: null,

    
    propertiesTotal: null,
    propertiesTotalPages: null,
};

const reviewSlice = createSlice({
    name: 'review',
    initialState,
    reducers: {
        // Optimistic update for my reviews (e.g. after editing/deleting)
        removeMyReview(state, action) {
            const idToRemove = action.payload;
            state.myReviews = state.myReviews.filter((r) => r._id !== idToRemove);
        },
        clearReviewData(state) {
            state.myReviews = [];
            state.properties = [];
            state.status = 'idle';
            state.propertiesStatus = 'idle';
            state.error = null;
            state.propertiesError = null;
            state.propertiesTotal = null;
            state.propertiesTotalPages = null;
        },
        invalidateProperties(state) {
            state.propertiesStatus = 'idle';
        }
    },
    extraReducers: (builder) => {
        builder
            // Handle fetchMyReviews
            // NOTE: `error` is cleared on pending AND fulfilled — a stale string
            // otherwise keeps rendering an error state over healthy data.
            .addCase(fetchMyReviews.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchMyReviews.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.myReviews = action.payload;
                state.error = null;
            })
            .addCase(fetchMyReviews.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            // Handle fetchProperties
            .addCase(fetchProperties.pending, (state) => {
                state.propertiesStatus = 'loading';
                state.propertiesError = null;
            })
            .addCase(fetchProperties.fulfilled, (state, action) => {
                state.propertiesStatus = 'succeeded';
                state.properties = action.payload.properties;
                state.propertiesTotal = action.payload.total;
                state.propertiesTotalPages = action.payload.totalPages;
                state.propertiesError = null;
            })
            .addCase(fetchProperties.rejected, (state, action) => {
                state.propertiesStatus = 'failed';
                state.propertiesError = action.payload;
            })

       
            .addCase(logoutSuccess, () => initialState);
    },
});

export const { removeMyReview, clearReviewData, invalidateProperties } = reviewSlice.actions;

// Selectors
export const selectMyReviews = (state) => state.review.myReviews;
export const selectMyReviewsStatus = (state) => state.review.status;
export const selectMyReviewsError = (state) => state.review.error;

export const selectProperties = (state) => state.review.properties;
export const selectPropertiesStatus = (state) => state.review.propertiesStatus;
export const selectPropertiesError = (state) => state.review.propertiesError;
// Server-side match count — null when the backend didn't report one.
export const selectPropertiesTotal = (state) => state.review.propertiesTotal;
export const selectPropertiesTotalPages = (state) => state.review.propertiesTotalPages;

export default reviewSlice.reducer;
