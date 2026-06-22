import { createHmac, randomBytes, randomInt } from "node:crypto";
import argon2 from "argon2";
import { env } from "@/infrastructure/config/env";
export const opaqueToken=()=>randomBytes(32).toString("base64url");
export const magicCode=()=>randomInt(0,1_000_000).toString().padStart(6,"0");
export const keyedHash=(value:string)=>createHmac("sha256",env.AUTH_HASH_SECRET).update(value).digest("hex");
export const hashPassword=(value:string)=>argon2.hash(value,{type:argon2.argon2id});
export const verifyPassword=(hash:string,value:string)=>argon2.verify(hash,value);
