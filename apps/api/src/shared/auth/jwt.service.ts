import * as jose from "jose";
import { jwtConfig } from "../../config/jwt.js";
import { UserResponseDTO } from "@codesync/types";

export class JwtService {
  private getSecretKey(): Uint8Array {
    return new TextEncoder().encode(jwtConfig.accessSecret);
  }

  /**
   * Generates a signed Access Token containing subject, email, and role claims.
   * Includes standard issuer, audience, and issuedAt properties.
   */
  async generateAccessToken(user: UserResponseDTO): Promise<string> {
    const secret = this.getSecretKey();

    return await new jose.SignJWT({
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setIssuer("codesync-api")
      .setAudience("codesync-web")
      .setExpirationTime(jwtConfig.accessExpiresIn)
      .sign(secret);
  }

  /**
   * Verifies an incoming access token's signature, expiration, issuer, and audience.
   */
  async verifyAccessToken(token: string): Promise<jose.JWTPayload> {
    const secret = this.getSecretKey();

    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: "codesync-api",
      audience: "codesync-web",
    });

    return payload;
  }
}

export const jwtService = new JwtService();
