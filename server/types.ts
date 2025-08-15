// Extend Express Request interface to include our validation results
declare global {
  namespace Express {
    interface Request {
      valid?: {
        body?: any;
        query?: any;
        params?: any;
      };
    }
  }
}

export {};