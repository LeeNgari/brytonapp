const isProd = process.env.NODE_ENV === 'production';

export default () => ({
  'strapi-v5-http-only-auth': {
    enabled: true,
    config: {
      cookieOptions: {
        secure: isProd,           
        sameSite: isProd ? 'none' : 'lax', 
        httpOnly: true,
        domain: isProd ? 'best-trust-b5c8149993.strapiapp.com' : 'localhost',
        path: '/',
        maxAge: 7 *   24 * 60 * 60 * 1000,
      },
      deleteJwtFromResponse: true,
    },
  },
});
