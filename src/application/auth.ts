import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/infrastructure/db/client";
import { magicCodes,sessions,users } from "@/infrastructure/db/schema";
import { emailSchema,magicCodeSchema,nameSchema } from "@/domain/validation";
import { DomainError, unauthenticated } from "@/domain/errors";
import { env } from "@/infrastructure/config/env";
import { keyedHash,magicCode,opaqueToken } from "@/infrastructure/security/crypto";
import { sendMagicCode } from "@/infrastructure/email/mailer";

const addMinutes=(n:number)=>new Date(Date.now()+n*60_000), addDays=(n:number)=>new Date(Date.now()+n*86_400_000);
export async function requestMagicCode(rawEmail:string){
 const email=emailSchema.parse(rawEmail);const cutoff=new Date(Date.now()-env.MAGIC_CODE_COOLDOWN_SECONDS*1000);
 const [recent]=await db.select().from(magicCodes).where(and(eq(magicCodes.email,email),isNull(magicCodes.consumedAt),gt(magicCodes.createdAt,cutoff))).orderBy(desc(magicCodes.createdAt)).limit(1);
 if(recent)return {message:"Se o email for válido, um código será enviado."};
 const code=magicCode();await db.insert(magicCodes).values({email,codeHash:keyedHash(`${email}:${code}`),expiresAt:addMinutes(env.MAGIC_CODE_TTL_MINUTES)});
 await sendMagicCode(email,code);return {message:"Se o email for válido, um código será enviado."};
}
export async function verifyMagicCode(rawEmail:string,rawCode:string){
 const email=emailSchema.parse(rawEmail),code=magicCodeSchema.parse(rawCode);
 const result=await db.transaction(async tx=>{
   const rows=await tx.execute(sql`select * from magic_codes where email=${email} and consumed_at is null order by created_at desc limit 1 for update`);
   const record=rows.rows[0] as {id:string;code_hash:string;attempts:number;expires_at:Date}|undefined;
   if(!record||new Date(record.expires_at)<=new Date()||record.attempts>=env.MAGIC_CODE_MAX_ATTEMPTS)return {invalid:true as const};
   if(record.code_hash!==keyedHash(`${email}:${code}`)){await tx.update(magicCodes).set({attempts:record.attempts+1}).where(eq(magicCodes.id,record.id));return {invalid:true as const}}
   await tx.update(magicCodes).set({consumedAt:new Date()}).where(and(eq(magicCodes.id,record.id),isNull(magicCodes.consumedAt)));
   let [user]=await tx.select().from(users).where(sql`lower(${users.email})=${email}`).limit(1);
   if(!user)[user]=await tx.insert(users).values({email}).returning();
   const token=opaqueToken();await tx.insert(sessions).values({userId:user.id,tokenHash:keyedHash(token),expiresAt:addDays(env.SESSION_TTL_DAYS)});
   return {invalid:false as const,user,token};
 });
 if(result.invalid)throw new DomainError("INVALID_CODE","Código inválido ou expirado",400);
 const jar=await cookies();jar.set(env.SESSION_COOKIE_NAME,result.token,{httpOnly:true,sameSite:"lax",secure:env.NODE_ENV==="production",path:"/",maxAge:env.SESSION_TTL_DAYS*86400});
 return result.user;
}
export async function getCurrentUser(){
 const token=(await cookies()).get(env.SESSION_COOKIE_NAME)?.value;if(!token)return null;
 const [row]=await db.select({user:users}).from(sessions).innerJoin(users,eq(users.id,sessions.userId)).where(and(eq(sessions.tokenHash,keyedHash(token)),gt(sessions.expiresAt,new Date()))).limit(1);
 return row?.user??null;
}
export async function requireUser({complete=true}:{complete?:boolean}={}){const user=await getCurrentUser();if(!user)throw unauthenticated();if(complete&&!user.name)throw new DomainError("PROFILE_INCOMPLETE","Complete seu perfil",403);return user}
export async function saveProfile(rawName:string){const user=await requireUser({complete:false});const name=nameSchema.parse(rawName);const [updated]=await db.update(users).set({name,updatedAt:new Date()}).where(eq(users.id,user.id)).returning();return updated}
export async function logout(){const jar=await cookies();const token=jar.get(env.SESSION_COOKIE_NAME)?.value;if(token)await db.delete(sessions).where(eq(sessions.tokenHash,keyedHash(token)));jar.delete(env.SESSION_COOKIE_NAME)}
