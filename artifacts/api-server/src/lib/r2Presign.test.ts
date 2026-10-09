import { describe, expect, it } from "vitest";
import { presignR2GetUrl } from "./r2Presign";

describe("presignR2GetUrl", () => {
  it("produces the same SigV4 signature as @aws-sdk/s3-request-presigner", () => {
    // Expected value captured from @aws-sdk/client-s3 getSignedUrl() with forcePathStyle and the same inputs.
    const url = presignR2GetUrl({
      accountId: "acc123",
      accessKeyId: "AKIDEXAMPLE",
      secretAccessKey: "secretEXAMPLE/abc+def",
      bucket: "gotf-bucket",
      key: "builds/GOTF LIVE-AI-Setup.exe",
      expiresIn: 3600,
      now: new Date("2026-10-09T04:50:00Z"),
      responseContentDisposition: 'attachment; filename="GOTF-LIVE-AI-Setup.exe"',
      extraQuery: { "x-amz-checksum-mode": "ENABLED", "x-id": "GetObject" },
    });
    const parsed = new URL(url);
    expect(parsed.host).toBe("acc123.r2.cloudflarestorage.com");
    expect(parsed.pathname).toBe("/gotf-bucket/builds/GOTF%20LIVE-AI-Setup.exe");
    expect(parsed.searchParams.get("X-Amz-Expires")).toBe("3600");
    expect(parsed.searchParams.get("X-Amz-Signature")).toBe(
      "c8709a55b594bda500b7a6d7c07c549512760091e767db2f46fe79f955f72a44",
    );
  });
});
