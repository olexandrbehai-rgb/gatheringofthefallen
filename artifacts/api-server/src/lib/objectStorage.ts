import { randomUUID } from "crypto";
import { Readable } from "stream";
import { File, Storage } from "@google-cloud/storage";
import {
  canAccessObject,
  getObjectAclPolicy,
  type ObjectAclPolicy,
  type ObjectPermission,
  setObjectAclPolicy,
} from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  getPublicObjectSearchPaths() {
    const paths = Array.from(new Set(
      (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "")
        .split(",")
        .map((path) => path.trim())
        .filter((path) => path.length > 0),
    ));
    if (paths.length === 0) throw new Error("PUBLIC_OBJECT_SEARCH_PATHS is not configured");
    return paths;
  }

  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) throw new Error("PRIVATE_OBJECT_DIR is not configured");
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const { bucketName, objectName } = parseObjectPath(`${searchPath}/${filePath}`);
      const file = objectStorageClient.bucket(bucketName).file(objectName);
      const [exists] = await file.exists();
      if (exists) return file;
    }
    return null;
  }

  async downloadObject(file: File, cacheTtlSec = 3600): Promise<Response> {
    const [metadata] = await file.getMetadata();
    const aclPolicy = await getObjectAclPolicy(file);
    const nodeStream = file.createReadStream();
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    const headers: Record<string, string> = {
      "Content-Type": String(metadata.contentType || "application/octet-stream"),
      "Cache-Control": `${aclPolicy?.visibility === "public" ? "public" : "private"}, max-age=${cacheTtlSec}`,
    };
    if (metadata.size) headers["Content-Length"] = String(metadata.size);
    return new Response(webStream, { headers });
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const fullPath = `${this.getPrivateObjectDir()}/uploads/${randomUUID()}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({ bucketName, objectName, method: "PUT", ttlSec: 900 });
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) throw new ObjectNotFoundError();
    const entityDir = this.getPrivateObjectDir().replace(/\/$/, "");
    const { bucketName, objectName } = parseObjectPath(`${entityDir}/${parts.slice(1).join("/")}`);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError();
    return file;
  }

  normalizeObjectEntityPath(rawPath: string) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) return rawPath;
    const rawObjectPath = new URL(rawPath).pathname;
    const entityDir = `${this.getPrivateObjectDir().replace(/\/$/, "")}/`;
    if (!rawObjectPath.startsWith(entityDir)) return rawObjectPath;
    return `/objects/${rawObjectPath.slice(entityDir.length)}`;
  }

  async trySetObjectEntityAclPolicy(rawPath: string, aclPolicy: ObjectAclPolicy) {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) return normalizedPath;
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }) {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission!,
    });
  }
}

function parseObjectPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const pathParts = normalized.split("/");
  if (pathParts.length < 3) throw new Error("Invalid object storage path");
  return { bucketName: pathParts[1], objectName: pathParts.slice(2).join("/") };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}) {
  const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Failed to sign object URL (${response.status})`);
  const payload = await response.json() as { signed_url?: string };
  if (!payload.signed_url) throw new Error("Storage did not return a signed URL");
  return payload.signed_url;
}