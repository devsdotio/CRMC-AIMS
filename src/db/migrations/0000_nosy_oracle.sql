CREATE TYPE "public"."asset_status" AS ENUM('available', 'borrowed', 'under_repair');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"condition" text NOT NULL,
	"status" "asset_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_code_unique" UNIQUE("code")
);
