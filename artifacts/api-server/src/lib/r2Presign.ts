import crypto from "node:crypto";

/**
 * Minimal AWS Signature V4 query presigning for a GET on Cloudflare R2 (S3-compatible),
 * so the API does not need the AWS SDK. Path-style URL:
 *   https://<accountId>.r2.cloudflarestorage.com/<bucket>/<key>?X-Amz-...
 */

function rfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

const hmac = (key: crypto.BinaryLike, data: string) => crypto.createHmac("sha256", key).update(data).digest();
const sha256 = (data: string) => crypto.createHash("sha256").update(data).digest("hex");

export interface PresignOptions {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  key: string;
  expiresIn: number; // seconds, max 604800
  responseContentDisposition?: string;
  now?: Date;
  region?: string;
  extraQuery?: Record<string, string>;
}

export function presignR2GetUrl(o: PresignOptions): string {
  const region = o.region ?? "auto";
  const host = `${o.accountId}.r2.cloudflarestorage.com`;
  const amzDate = (o.now ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = amzDate.slice(0, 8);
  const scope = `${day}/${region}/s3/aws4_request`;
  const path = `/${[o.bucket, ...o.key.split("/")].map(rfc3986).join("/")}`;

  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
    "X-Amz-Credential": `${o.accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(o.expiresIn),
    "X-Amz-SignedHeaders": "host",
  };
  if (o.responseContentDisposition) params["response-content-disposition"] = o.responseContentDisposition;
  Object.assign(params, o.extraQuery);
  const query = Object.keys(params)
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(params[k])}`)
    .join("&");

  const canonicalRequest = ["GET", path, query, `host:${host}`, "", "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const kDate = hmac(`AWS4${o.secretAccessKey}`, day);
  const kSigning = hmac(hmac(hmac(kDate, region), "s3"), "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  return `https://${host}${path}?${query}&X-Amz-Signature=${signature}`;
}
