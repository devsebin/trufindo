import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { EncryptedCookieService } from "@/utils/helpers/crypto.helper";
import {
  COOKIE_NAME,
  COOKIE_MAX_AGE,
  COOKIE_HTTP_ONLY,
  COOKIE_SECURE,
  COOKIE_SAME_SITE,
} from "@/utils/validate-env";

const cookieService = new EncryptedCookieService();

export interface GeoData {
  country: string;
  regionName: string;
  city: string;
  query: string; // IP
  [key: string]: any;
}

export const geoMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rawCookie = req.cookies[COOKIE_NAME];
    let geoData: GeoData | null = null;

    if (rawCookie) {
      try {
        const decrypted = cookieService.decrypt(rawCookie);
        geoData = JSON.parse(decrypted);
      } catch (e) {
        console.warn("Invalid or tampered geo cookie.");
      }
    }

    const ip = req.ip != "::1" ? req.ip : "121.98.12.250";

    // Fetch new geo data if cookie missing or IP changed
    if (!geoData || geoData.query !== ip) {
      const { data } = await axios.get<GeoData>(`http://ip-api.com/json/${ip}`);

      if (data.status !== "fail") {
        const encrypted = cookieService.encrypt(JSON.stringify(data));

        res.cookie(COOKIE_NAME, encrypted, {
          maxAge: COOKIE_MAX_AGE,
          httpOnly: COOKIE_HTTP_ONLY,
          secure: COOKIE_SECURE,
          sameSite: "lax",
        });

        geoData = data;
      } else {
        console.warn(`IP-API lookup failed for IP: ${ip}`);
        geoData = null;
      }
    }

    (req as any).geoData = geoData;
  } catch (err) {
    console.error("geoMiddleware error:", err);
    (req as any).geoData = null;
  }

  next();
};
