import {sqliteTable,text,integer,primaryKey,index} from "drizzle-orm/sqlite-core";
export const builds=sqliteTable("builds",{id:text("id").primaryKey(),ownerId:text("owner_id").notNull(),name:text("name").notNull(),notes:text("notes").notNull().default(""),state:text("state").notNull(),savedTotal:integer("saved_total").notNull(),createdAt:text("created_at").notNull(),updatedAt:text("updated_at").notNull()},t=>[index("builds_owner_updated").on(t.ownerId,t.updatedAt)]);
export const prices=sqliteTable("price_notes",{ownerId:text("owner_id").notNull(),partId:text("part_id").notNull(),priceCents:integer("price_cents").notNull(),updatedAt:text("updated_at").notNull()},t=>[primaryKey({columns:[t.ownerId,t.partId]})]);

export const drafts=sqliteTable("build_drafts",{ownerId:text("owner_id").primaryKey(),payload:text("payload").notNull(),revision:integer("revision").notNull(),updatedAt:text("updated_at").notNull()});
