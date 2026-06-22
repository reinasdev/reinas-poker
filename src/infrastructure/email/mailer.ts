import nodemailer from "nodemailer";
import { env } from "@/infrastructure/config/env";
const transport=nodemailer.createTransport({host:env.SMTP_HOST,port:env.SMTP_PORT,secure:false});
export async function sendMagicCode(email:string,code:string){
 await transport.sendMail({from:env.SMTP_FROM,to:email,subject:"Seu código do Planning Poker",text:`Seu código é ${code}. Ele expira em 10 minutos.`,html:`<p>Seu código é <strong>${code}</strong>.</p><p>Ele expira em 10 minutos.</p>`});
}
