import { writable } from 'svelte/store';

const params = new URLSearchParams(location.search);

/**
 * Current page. Initialized from URL param.
 */
export const page = writable(params.get('p'));

/**
 * Original JWT token from URL param.
 */
export const token = params.get('token');

/**
 * Data parsed from JWT token (Javascript object).
 *
 * Note: the JWT token is taken from URL and is not validated, thus its data cannot be considered as
 * safe from XSS.
 */
export const parsedToken = token ? JSON.parse(atob(token.split('.')[1])) : {};
