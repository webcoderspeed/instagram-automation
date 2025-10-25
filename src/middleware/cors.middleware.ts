export function getCorsOptions(ORIGINS: string) {
  return {
    origin: (ORIGINS ?? '')?.split(','),
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Access-Control-Allow-Headers',
      'App',
      'X-Trace-Id',
      'X-Api-Key',
    ],
  };
}