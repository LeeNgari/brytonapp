export default ({ env }) => ({
  'strapi-v5-http-only-auth': {
    enabled: true,
    config: {
      cookieOptions: {
        secure: env('NODE_ENV') === 'production', 
        httpOnly: true,
        sameSite: env('NODE_ENV') === 'production' ? 'none' : 'lax',
        domain:
          env('NODE_ENV') === 'production'
            ? '.strapiapp.com' 
            : 'localhost',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      },
      deleteJwtFromResponse: true,
    },
  },
});
