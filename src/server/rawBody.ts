import { IncomingMessage, ServerResponse } from "node:http";

type NextFunction = (err?: unknown) => void;

export interface RawBodyRequest extends IncomingMessage {
  rawBody?: Buffer;
}

type Middleware = (req: RawBodyRequest, res: ServerResponse, next: NextFunction) => void;

export function rawBodyCollector(): Middleware {
  return function collect(req, _res, next) {
    if (req.rawBody) {
      next();
      return;
    }
    const chunks: Buffer[] = [];
    req.on("data", chunk => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => {
      req.rawBody = Buffer.concat(chunks);
      next();
    });
    req.on("error", err => {
      next(err);
    });
  };
}
