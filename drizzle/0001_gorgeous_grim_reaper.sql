CREATE TYPE "public"."status_chamado" AS ENUM('aberto', 'em_andamento', 'fechado');--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text NOT NULL,
	"status" "status_chamado" DEFAULT 'aberto' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;