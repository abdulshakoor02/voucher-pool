type Env = {
  server: {
    port: number;
  };
  database: {
    dbName: string;
    dbUser: string;
    dbPassword: string;
    dbPort: number;
    host: string;
    max: number;
    min: number;
    idle: number;
  };
};

export { Env };
