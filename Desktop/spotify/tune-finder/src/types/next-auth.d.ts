// File: src/types/next-auth.d.ts

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth, { DefaultSession } from "next-auth";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Session object ko extend karke humara custom data add karein.
   */
  interface Session {
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * JWT token ko extend karke humara custom data add karein.
   */
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
  }
}