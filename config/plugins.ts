// config/plugins.ts

export default () => ({
  'strapi-v5-http-only-auth': {
    enabled: true,
    config: {
      cookieOptions: {
        secure: false,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        domain: 'localhost',
        path: '/',
      },
      deleteJwtFromResponse: true,
    },
  },
});
