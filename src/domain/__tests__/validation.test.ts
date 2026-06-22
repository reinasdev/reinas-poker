import { describe,expect,it } from "vitest";
import { createRoomSchema,emailSchema,magicCodeSchema,nameSchema,roomPasswordSchema,slugSchema,taskUrlSchema } from "../validation";

describe("domain validation",()=>{
 it("normalizes email",()=>expect(emailSchema.parse(" USER@Example.COM ")).toBe("user@example.com"));
 it.each(["12345","1234567","abcdef"])("rejects invalid magic code %s",v=>expect(()=>magicCodeSchema.parse(v)).toThrow());
 it("accepts a valid name",()=>expect(nameSchema.parse(" Reinaldo ")).toBe("Reinaldo"));
 it.each(["abcdefg","bad_slug","á"])("rejects invalid slug %s",v=>expect(()=>slugSchema.parse(v)).toThrow());
 it.each(["123","12345","abcd"])("rejects invalid room password %s",v=>expect(()=>roomPasswordSchema.parse(v)).toThrow());
 it("validates task URL",()=>{expect(taskUrlSchema.parse("https://example.com/task/1")).toContain("example.com");expect(()=>taskUrlSchema.parse("not-a-url")).toThrow()});
 it("validates room payload",()=>expect(createRoomSchema.parse({name:"Sprint",slug:"sp01",password:"1234",style:"SCRUM"}).style).toBe("SCRUM"));
});
