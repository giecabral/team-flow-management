import { jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { validateBody } from './validate.js';

function makeReq(body: Record<string, unknown>): Request {
  return { body } as Request;
}

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as unknown as Response;
}

describe('validateBody middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = jest.fn();
  });

  describe('required fields', () => {
    const middleware = validateBody({ name: { required: true, type: 'string' } });

    it('calls next when required field is present', () => {
      const res = makeRes();
      middleware(makeReq({ name: 'Alice' }), res, next);
      expect(next).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('returns 400 when required field is missing', () => {
      const res = makeRes();
      middleware(makeReq({}), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when required field is empty string', () => {
      const res = makeRes();
      middleware(makeReq({ name: '' }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('type: email', () => {
    const middleware = validateBody({ email: { required: true, type: 'email' } });

    it('passes a valid email', () => {
      const res = makeRes();
      middleware(makeReq({ email: 'user@example.com' }), res, next);
      expect(next).toHaveBeenCalled();
    });

    it('rejects an email without @', () => {
      const res = makeRes();
      middleware(makeReq({ email: 'notanemail' }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects an email without domain', () => {
      const res = makeRes();
      middleware(makeReq({ email: 'user@' }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('minLength / maxLength', () => {
    const middleware = validateBody({
      password: { required: true, type: 'string', minLength: 8, maxLength: 20 },
    });

    it('passes when string is within bounds', () => {
      const res = makeRes();
      middleware(makeReq({ password: 'validpass' }), res, next);
      expect(next).toHaveBeenCalled();
    });

    it('rejects a string shorter than minLength', () => {
      const res = makeRes();
      middleware(makeReq({ password: 'short' }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects a string longer than maxLength', () => {
      const res = makeRes();
      middleware(makeReq({ password: 'a'.repeat(21) }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('type: string', () => {
    const middleware = validateBody({ count: { required: true, type: 'string' } });

    it('rejects a non-string value', () => {
      const res = makeRes();
      middleware(makeReq({ count: 42 }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('multiple fields', () => {
    const middleware = validateBody({
      firstName: { required: true, type: 'string', minLength: 1 },
      email: { required: true, type: 'email' },
    });

    it('collects errors from multiple invalid fields', () => {
      const res = makeRes();
      middleware(makeReq({ firstName: '', email: 'bad' }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      const body = (res.json as jest.Mock).mock.calls[0][0] as { error: { details: Record<string, string[]> } };
      expect(body.error.details).toHaveProperty('firstName');
      expect(body.error.details).toHaveProperty('email');
    });

    it('calls next when all fields are valid', () => {
      const res = makeRes();
      middleware(makeReq({ firstName: 'Alice', email: 'alice@example.com' }), res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
