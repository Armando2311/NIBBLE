CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`payload_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activities_project_date_idx` ON `activities` (`project_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`color` text,
	`description` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_code_unique` ON `customers` (`code`);--> statement-breakpoint
CREATE TABLE `file_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`revision_label` text,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`r2_key` text NOT NULL,
	`change_summary` text,
	`extraction_status` text DEFAULT 'queued' NOT NULL,
	`preview_status` text DEFAULT 'queued' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `file_versions_number_unique` ON `file_versions` (`file_id`,`version_number`);--> statement-breakpoint
CREATE INDEX `file_versions_hash_idx` ON `file_versions` (`sha256`);--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`folder_id` text NOT NULL,
	`display_name` text NOT NULL,
	`kind` text NOT NULL,
	`description` text,
	`document_number` text,
	`lifecycle_status` text DEFAULT 'draft' NOT NULL,
	`current_version_id` text,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `files_project_folder_idx` ON `files` (`project_id`,`folder_id`);--> statement-breakpoint
CREATE INDEX `files_document_number_idx` ON `files` (`document_number`);--> statement-breakpoint
CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `folders_project_parent_idx` ON `folders` (`project_id`,`parent_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`phase` text DEFAULT 'intake' NOT NULL,
	`health` text DEFAULT 'on_track' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`target_date` integer,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_code_unique` ON `projects` (`code`);--> statement-breakpoint
CREATE INDEX `projects_customer_idx` ON `projects` (`customer_id`);--> statement-breakpoint
CREATE TABLE `search_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`customer_id` text,
	`project_id` text,
	`folder_id` text,
	`title` text NOT NULL,
	`breadcrumb` text NOT NULL,
	`metadata_text` text DEFAULT '' NOT NULL,
	`content_text` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `search_entity_unique` ON `search_documents` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `search_scope_idx` ON `search_documents` (`customer_id`,`project_id`,`folder_id`);