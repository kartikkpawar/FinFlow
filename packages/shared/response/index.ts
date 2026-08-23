import type { Response } from "express";

export function successResponse(
  res: Response,
  data: unknown,
  statusCode = 200,
) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function failedResponse(res: Response, data: unknown, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    data,
  });
}

export function formatResponse(
  data: Record<string, any>,
  keysToRemove: string[],
  replaceKeys?: Record<string, string>, // { originalKey: keyToReplace }
) {
  for (const key of keysToRemove) {
    if (data.hasOwnProperty(key)) {
      delete data[key];
    }
  }

  for (const originalKey in replaceKeys) {
    const replaceKey = replaceKeys[originalKey] as string;

    if (data.hasOwnProperty(originalKey)) {
      const value = data[originalKey] as string;
      delete data[originalKey];
      data[replaceKey] = value;
    }
  }
  return data;
}
