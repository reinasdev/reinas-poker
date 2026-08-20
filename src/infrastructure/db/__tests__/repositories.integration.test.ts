import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "../client";
import { repositories } from "../repositories";
import { userFactory } from "../test-factories";
import { users } from "../schema";

describe.skipIf(process.env.RUN_DB_TESTS !== "1")(
  "transactional repositories and factories",
  () => {
    it("rolls back aggregate writes when a transaction fails", async () => {
      const email = `rollback-${crypto.randomUUID()}@example.test`;
      await expect(
        repositories.transaction(async (tx) => {
          await userFactory(tx, { email });
          throw new Error("ROLLBACK_TEST");
        }),
      ).rejects.toThrow("ROLLBACK_TEST");

      const persisted = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      expect(persisted).toHaveLength(0);
    });
  },
);
