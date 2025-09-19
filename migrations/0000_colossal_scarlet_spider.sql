CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'published');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('order', 'message', 'system', 'promotion', 'security');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('native', 'affiliate', 'dropship', 'multivendor');--> statement-breakpoint
CREATE TYPE "public"."source_platform" AS ENUM('aveenix', 'amazon', 'aliexpress', 'walmart', 'woocommerce');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'admin', 'manager', 'support', 'vendor');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('pending', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"company" text,
	"address1" text NOT NULL,
	"address2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"country" text NOT NULL,
	"phone" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text NOT NULL,
	"is_hot" boolean DEFAULT false,
	"parent_id" integer,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"product_count" integer DEFAULT 0,
	"platform_mapping" jsonb,
	"is_auto_created" boolean DEFAULT false,
	"description" text,
	"meta_title" text,
	"meta_description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "category_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"aveenix_category_id" integer NOT NULL,
	"source_platform" "source_platform" NOT NULL,
	"external_category_id" text NOT NULL,
	"external_category_name" text NOT NULL,
	"confidence" numeric(3, 2) DEFAULT '1.0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "challenge_participation" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"challenge_id" varchar NOT NULL,
	"submission_id" varchar,
	"rank" integer,
	"prize_amount" numeric DEFAULT '0',
	"status" varchar DEFAULT 'participating',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_activities" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"activity_type" varchar NOT NULL,
	"target_id" varchar,
	"points" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_answers" (
	"id" varchar PRIMARY KEY NOT NULL,
	"question_id" varchar NOT NULL,
	"answer_text" text NOT NULL,
	"answer_summary" varchar(500),
	"platform" varchar(20) NOT NULL,
	"author_name" varchar(100),
	"author_handle" varchar(100),
	"author_reputation" integer,
	"external_content" jsonb NOT NULL,
	"upvotes" integer DEFAULT 0,
	"downvotes" integer DEFAULT 0,
	"engagement_score" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"is_best_answer" boolean DEFAULT false,
	"answer_type" varchar(20) NOT NULL,
	"technical_level" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_questions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"question_text" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"subcategory" varchar(50),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"problem_solving_score" integer NOT NULL,
	"business_value" integer NOT NULL,
	"community_impact" integer NOT NULL,
	"searchability" integer NOT NULL,
	"complexity" varchar(20) NOT NULL,
	"storage_level" varchar(20) NOT NULL,
	"retention_days" integer NOT NULL,
	"index_priority" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_solved" boolean DEFAULT false,
	"solved_at" timestamp,
	"best_answer_id" varchar,
	"external_links" jsonb DEFAULT '{}'::jsonb,
	"platform_posts" jsonb DEFAULT '{}'::jsonb,
	"total_responses" integer DEFAULT 0,
	"total_views" integer DEFAULT 0,
	"total_engagement" integer DEFAULT 0,
	"quality_rating" numeric(3, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "community_rewards" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"reward_type" varchar NOT NULL,
	"amount" numeric NOT NULL,
	"credits" integer DEFAULT 0,
	"source_id" varchar,
	"description" text,
	"status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creator_profiles" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"bio" text,
	"profile_image_url" varchar,
	"total_solutions" integer DEFAULT 0,
	"total_views" integer DEFAULT 0,
	"total_earnings" numeric(10, 2) DEFAULT '0.00',
	"average_rating" numeric(3, 2) DEFAULT '0.00',
	"creator_level" varchar(20) DEFAULT 'rookie',
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"expertise_tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creator_solutions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"question_id" varchar NOT NULL,
	"creator_id" varchar NOT NULL,
	"solution_title" varchar(200) NOT NULL,
	"solution_content" text NOT NULL,
	"solution_type" varchar(30) NOT NULL,
	"media_urls" jsonb DEFAULT '{}'::jsonb,
	"monetization_links" jsonb DEFAULT '{}'::jsonb,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"saves" integer DEFAULT 0,
	"click_throughs" integer DEFAULT 0,
	"revenue" numeric(10, 2) DEFAULT '0.00',
	"rating" numeric(3, 2),
	"rating_count" integer DEFAULT 0,
	"is_verified_solution" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "import_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_platform" "source_platform" NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_products" integer DEFAULT 0,
	"processed_products" integer DEFAULT 0,
	"successful_imports" integer DEFAULT 0,
	"failed_imports" integer DEFAULT 0,
	"error_log" jsonb,
	"import_config" jsonb,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" varchar PRIMARY KEY NOT NULL,
	"question_id" varchar NOT NULL,
	"title" varchar(200) NOT NULL,
	"processed_answer" text NOT NULL,
	"quick_solution" varchar(300),
	"search_keywords" jsonb NOT NULL,
	"related_questions" jsonb DEFAULT '[]'::jsonb,
	"difficulty_level" varchar(20),
	"time_to_implement" varchar(50),
	"required_skills" jsonb DEFAULT '[]'::jsonb,
	"confidence_score" numeric(5, 2),
	"usage_count" integer DEFAULT 0,
	"success_rate" numeric(5, 2),
	"full_content_links" jsonb NOT NULL,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"type" "notification_type" NOT NULL,
	"priority" "notification_priority" DEFAULT 'medium',
	"title" text NOT NULL,
	"message" text NOT NULL,
	"icon" text,
	"action_url" text,
	"is_read" boolean DEFAULT false,
	"is_global" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"product_name" text NOT NULL,
	"product_image" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"user_id" integer NOT NULL,
	"status" "order_status" DEFAULT 'pending',
	"payment_status" "payment_status" DEFAULT 'pending',
	"subtotal" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"shipping_amount" numeric(10, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) NOT NULL,
	"shipping_address_id" integer NOT NULL,
	"billing_address_id" integer NOT NULL,
	"shipping_method" text,
	"tracking_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "platform_sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"source_platform" "source_platform" NOT NULL,
	"sync_type" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"status" text NOT NULL,
	"error_message" text,
	"synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"original_price" numeric(10, 2),
	"category" text NOT NULL,
	"brand" text,
	"image_url" text NOT NULL,
	"rating" numeric(2, 1) DEFAULT '0',
	"review_count" integer DEFAULT 0,
	"is_new" boolean DEFAULT false,
	"is_bestseller" boolean DEFAULT false,
	"is_on_sale" boolean DEFAULT false,
	"discount_percentage" integer DEFAULT 0,
	"source_platform" "source_platform" DEFAULT 'aveenix',
	"product_type" "product_type" DEFAULT 'native',
	"external_id" text,
	"affiliate_url" text,
	"category_mapping" jsonb,
	"platform_specific_data" jsonb,
	"stock_quantity" integer DEFAULT 0,
	"is_in_stock" boolean DEFAULT true,
	"last_synced_at" timestamp,
	"sync_status" text DEFAULT 'active',
	"original_currency" text DEFAULT 'USD',
	"exchange_rate" numeric(10, 6) DEFAULT '1.0',
	"vendor_id" integer,
	"creator_id" integer,
	"commission_rate" numeric(5, 2) DEFAULT '0',
	"approval_status" "approval_status" DEFAULT 'pending',
	"approved_by" integer,
	"approved_at" timestamp,
	"rejection_reason" text,
	"rejection_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"minimum_amount" numeric(10, 2),
	"max_uses" integer,
	"current_uses" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_tracking" (
	"id" varchar PRIMARY KEY NOT NULL,
	"referrer_id" varchar NOT NULL,
	"referred_id" varchar NOT NULL,
	"referral_code" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"total_earnings" numeric DEFAULT '0',
	"commissions_earned" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"is_verified_purchase" boolean DEFAULT false,
	"is_approved" boolean DEFAULT false,
	"helpful_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "search_analytics" (
	"id" varchar PRIMARY KEY NOT NULL,
	"search_query" varchar(500) NOT NULL,
	"results_found" integer NOT NULL,
	"clicked_result" varchar,
	"user_satisfaction" integer,
	"search_date" timestamp DEFAULT now(),
	"user_id" varchar
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" DEFAULT 'customer',
	"first_name" text,
	"last_name" text,
	"phone" text,
	"is_active" boolean DEFAULT true,
	"preferred_country" text DEFAULT 'US',
	"preferred_language" text DEFAULT 'en',
	"preferred_currency" text DEFAULT 'USD',
	"timezone" text DEFAULT 'America/New_York',
	"theme" text DEFAULT 'light',
	"color_theme" text DEFAULT 'yellow',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"business_name" text NOT NULL,
	"business_type" text NOT NULL,
	"business_description" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"country" text NOT NULL,
	"tax_id" text NOT NULL,
	"website" text,
	"status" "vendor_status" DEFAULT 'pending',
	"commission_rate" numeric(5, 2) DEFAULT '15.00',
	"total_sales" numeric(15, 2) DEFAULT '0.00',
	"total_orders" integer DEFAULT 0,
	"rating" numeric(2, 1) DEFAULT '0.0',
	"review_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wishlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_id_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "category_mappings_platform_category_idx" ON "category_mappings" USING btree ("source_platform","external_category_id");--> statement-breakpoint
CREATE INDEX "category_mappings_aveenix_category_idx" ON "category_mappings" USING btree ("aveenix_category_id");--> statement-breakpoint
CREATE INDEX "idx_question_quality" ON "community_answers" USING btree ("question_id","engagement_score");--> statement-breakpoint
CREATE INDEX "idx_best_answers" ON "community_answers" USING btree ("is_best_answer","is_verified");--> statement-breakpoint
CREATE INDEX "idx_platform" ON "community_answers" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "idx_category_score" ON "community_questions" USING btree ("category","problem_solving_score");--> statement-breakpoint
CREATE INDEX "idx_storage_level" ON "community_questions" USING btree ("storage_level","is_active");--> statement-breakpoint
CREATE INDEX "idx_expiry" ON "community_questions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_tags" ON "community_questions" USING btree ("tags");--> statement-breakpoint
CREATE INDEX "idx_creator_level" ON "creator_profiles" USING btree ("creator_level");--> statement-breakpoint
CREATE INDEX "idx_verified" ON "creator_profiles" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "idx_expertise" ON "creator_profiles" USING btree ("expertise_tags");--> statement-breakpoint
CREATE INDEX "idx_question_creator" ON "creator_solutions" USING btree ("question_id","creator_id");--> statement-breakpoint
CREATE INDEX "idx_solution_type" ON "creator_solutions" USING btree ("solution_type");--> statement-breakpoint
CREATE INDEX "idx_performance" ON "creator_solutions" USING btree ("views","revenue");--> statement-breakpoint
CREATE INDEX "idx_status" ON "creator_solutions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_search_keywords" ON "knowledge_base" USING btree ("search_keywords");--> statement-breakpoint
CREATE INDEX "idx_confidence" ON "knowledge_base" USING btree ("confidence_score");--> statement-breakpoint
CREATE INDEX "idx_usage" ON "knowledge_base" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX "idx_user_unread" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_type_priority" ON "notifications" USING btree ("type","priority");--> statement-breakpoint
CREATE INDEX "products_source_platform_idx" ON "products" USING btree ("source_platform");--> statement-breakpoint
CREATE INDEX "products_product_type_idx" ON "products" USING btree ("product_type");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_external_id_idx" ON "products" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "products_vendor_id_idx" ON "products" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "products_approval_status_idx" ON "products" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "products_approved_by_idx" ON "products" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "idx_search_query" ON "search_analytics" USING btree ("search_query");--> statement-breakpoint
CREATE INDEX "idx_search_date" ON "search_analytics" USING btree ("search_date");