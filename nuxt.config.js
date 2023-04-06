export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    titleTemplate: "%s",
    title: "OSPA",
    htmlAttrs: {
      lang: "en",
    },
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "" },
      { name: "format-detection", content: "telephone=no" },
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    link: [
      {
        rel: "stylesheet",
        href: "https://unpkg.com/leaflet@1.6.0/dist/leaflet.css",
      },
    ],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: ["leaflet/dist/leaflet.css"],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [{ src: "~/plugins/vue2-leaflet.js", mode: "client" }],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/vuetify
    "@nuxtjs/vuetify"
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    "@nuxtjs/axios",
    "@nuxtjs/auth-next",
    'nuxt-leaflet',
    "~/api/setup.js",
  ],

  auth: {
    strategies: {
      local: {
        scheme: "refresh",
        token: {
          property: "access_token",
          maxAge: 1800,
          global: true,
          // type: 'Bearer'
        },
        refreshToken: {
          property: "refresh_token",
          data: "refresh_token",
          maxAge: 60 * 60 * 24 * 30,
        },
        user: {
          property: "user",
          // autoFetch: true
        },
        endpoints: {
          login: { url: "/auth/login", method: "post" },
          refresh: { url: "/auth/refresh", method: "post" },
          user: { url: "/user", method: "get" },
          logout: { url: "/auth/logout", method: "post" },
        },
        autoLogout: false,
      },
    },
    redirect: {
      login: "/auth/login",
      logout: "/auth/logout",
    },
  },

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    customVariables: ["~/assets/variables.scss"],
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},

  publicRuntimeConfig: {
    REALM_APP_ID: process.env.REALM_APP_ID,
    REALM_API_KEY: process.env.REALM_API_KEY,
    UNPROTECTED_ROUTES: ["index", "sign-up", "sign-up-type"],
    ASSET_DIRECTORY: process.env.ASSET_DIRECTORY,
    DO_SPACES_LINK: process.env.DO_SPACES_LINK,
  },

  router: {
    middleware: ["authentication"],
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: `${process.env.API}/api`,
  },

  serverMiddleware: ["~/api/routes/index.js"],

  server: {
    port: process.env.PORT || 3002,
  },
};
