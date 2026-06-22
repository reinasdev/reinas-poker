export class DomainError extends Error { constructor(public code:string,message:string,public status=400){super(message)} }
export const forbidden=()=>new DomainError("FORBIDDEN","Você não tem permissão para esta ação",403);
export const unauthenticated=()=>new DomainError("UNAUTHENTICATED","Autenticação necessária",401);
