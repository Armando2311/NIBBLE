CREATE TABLE `upload_parts` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`part_number` integer NOT NULL,
	`etag` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `upload_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `upload_parts_session_number_unique` ON `upload_parts` (`session_id`,`part_number`);--> statement-breakpoint
CREATE TABLE `upload_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`folder_id` text NOT NULL,
	`file_id` text,
	`reserved_file_id` text NOT NULL,
	`reserved_version_id` text NOT NULL,
	`upload_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`expected_size_bytes` integer NOT NULL,
	`part_size_bytes` integer NOT NULL,
	`status` text DEFAULT 'initiated' NOT NULL,
	`change_summary` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `upload_sessions_status_expiry_idx` ON `upload_sessions` (`status`,`expires_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_file_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`revision_label` text,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`sha256` text,
	`r2_key` text NOT NULL,
	`r2_etag` text,
	`change_summary` text,
	`extraction_status` text DEFAULT 'queued' NOT NULL,
	`preview_status` text DEFAULT 'queued' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_file_versions`("id", "file_id", "version_number", "revision_label", "original_name", "mime_type", "size_bytes", "sha256", "r2_key", "r2_etag", "change_summary", "extraction_status", "preview_status", "created_at") SELECT "id", "file_id", "version_number", "revision_label", "original_name", "mime_type", "size_bytes", "sha256", "r2_key", NULL, "change_summary", "extraction_status", "preview_status", "created_at" FROM `file_versions`;--> statement-breakpoint
DROP TABLE `file_versions`;--> statement-breakpoint
ALTER TABLE `__new_file_versions` RENAME TO `file_versions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `file_versions_number_unique` ON `file_versions` (`file_id`,`version_number`);--> statement-breakpoint
CREATE INDEX `file_versions_hash_idx` ON `file_versions` (`sha256`);--> statement-breakpoint
ALTER TABLE `projects` ADD `project_type` text DEFAULT 'defined' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `next_milestone` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `current_blocker` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `current_build` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `system_revision` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `favorite` integer DEFAULT false NOT NULL;
