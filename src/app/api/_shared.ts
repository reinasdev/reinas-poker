import { NextResponse } from "next/server";
import { DomainError } from "@/domain/errors";
import { ZodError } from "zod";
import { env } from "@/infrastructure/config/env";
import { logRequestError } from "@/infrastructure/observability/logger";
export function assertSameOrigin(request:Request){const origin=request.headers.get("origin");if(origin&&origin!==new URL(env.APP_URL).origin)throw new DomainError("INVALID_ORIGIN","Origem inválida",403)}
export function apiError(error:unknown){if(error instanceof ZodError)return NextResponse.json({error:"VALIDATION_ERROR",message:error.issues[0]?.message},{status:400});if(error instanceof DomainError)return NextResponse.json({error:error.code,message:error.message},{status:error.status});if(error instanceof Error&&error.message==="RATE_LIMITED")return NextResponse.json({error:"RATE_LIMITED",message:"Muitas tentativas. Aguarde."},{status:429});logRequestError(error);return NextResponse.json({error:"INTERNAL_ERROR",message:"Não foi possível concluir a operação"},{status:500})}
