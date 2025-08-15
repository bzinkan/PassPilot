import { ZodSchema, ZodError } from "zod";
import type { Request, Response, NextFunction } from "express";
import "./types"; // Import type extensions
import { err } from "./utils";

export function validate(opts: {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
  params?: ZodSchema<any>;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.valid = {
        body: opts.body ? opts.body.parse(req.body) : undefined,
        query: opts.query ? opts.query.parse(req.query) : undefined,
        params: opts.params ? opts.params.parse(req.params) : undefined,
      };
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code
        }));
        res.status(400).json({
          ok: false,
          error: "Invalid request",
          details: validationErrors
        });
      } else {
        res.status(400).json(err("Invalid request", 400));
      }
    }
  };
}