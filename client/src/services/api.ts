import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000/api',
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        'hangover_token'
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    /*
     * IMPORTANT:
     *
     * Do NOT manually set
     * Content-Type for FormData.
     *
     * The browser/Axios will automatically
     * create:
     *
     * multipart/form-data;
     * boundary=----------------...
     */
    if (
      typeof FormData !== 'undefined' &&
      config.data instanceof FormData
    ) {
      delete config.headers[
        'Content-Type'
      ];
    } else {
      config.headers[
        'Content-Type'
      ] = 'application/json';
    }

    return config;
  },
  (error) =>
    Promise.reject(error)
);

export default api;