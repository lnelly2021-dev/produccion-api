import { Request, Response, NextFunction } from "express";
import * as authService from "../../services/auth.service";
import { ok, created } from "../../utils/response.util";

const REFRESH_COOKIE = "refreshToken";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as
    | "none"
    | "lax",
  maxAge: authService.REFRESH_COOKIE_MAX_AGE,
  path: "/",
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken, ...data } = await authService.register(req.body);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    created(res, data);
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken, ...data } = await authService.login(req.body);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      res.status(401).json({ ok: false, error: "Refresh token required" });
      return;
    }
    const data = await authService.refresh(token);
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.userId) {
      await authService.logout(req.user.userId);
    }
    res.clearCookie(REFRESH_COOKIE, { path: "/" });
    ok(res, { message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await authService.getProfile(req.user!.userId);
    ok(res, data);
  } catch (err) {
    next(err);
  }
};
