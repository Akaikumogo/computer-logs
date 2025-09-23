export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  database: {
    uri:
      process.env.MONGODB_URI ||
      'mongodb+srv://sarvarbekred147:s43ZsDNTkFBQhEOW@cluster0.b5jq0aw.mongodb.net/computer_logs?retryWrites=true&w=majority&appName=Cluster0',
  },
  snapshot: {
    apiUrl: process.env.SNAPSHOT_API_URL || 'http://0.0.0.0:8000',
  },
  environment: process.env.NODE_ENV || 'development',
});
