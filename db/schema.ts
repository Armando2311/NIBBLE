import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
};

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  color: text("color"),
  description: text("description"),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  ...timestamps,
}, (table) => [uniqueIndex("customers_code_unique").on(table.code)]);

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description"),
  phase: text("phase").notNull().default("intake"),
  health: text("health").notNull().default("on_track"),
  status: text("status").notNull().default("active"),
  targetDate: integer("target_date", { mode: "timestamp_ms" }),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  ...timestamps,
}, (table) => [uniqueIndex("projects_code_unique").on(table.code), index("projects_customer_idx").on(table.customerId)]);

export const folders = sqliteTable("folders", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  parentId: text("parent_id"),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  ...timestamps,
}, (table) => [index("folders_project_parent_idx").on(table.projectId, table.parentId)]);

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  folderId: text("folder_id").notNull().references(() => folders.id),
  displayName: text("display_name").notNull(),
  kind: text("kind").notNull(),
  description: text("description"),
  documentNumber: text("document_number"),
  lifecycleStatus: text("lifecycle_status").notNull().default("draft"),
  currentVersionId: text("current_version_id"),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  ...timestamps,
}, (table) => [index("files_project_folder_idx").on(table.projectId, table.folderId), index("files_document_number_idx").on(table.documentNumber)]);

export const fileVersions = sqliteTable("file_versions", {
  id: text("id").primaryKey(),
  fileId: text("file_id").notNull().references(() => files.id),
  versionNumber: integer("version_number").notNull(),
  revisionLabel: text("revision_label"),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  sha256: text("sha256").notNull(),
  r2Key: text("r2_key").notNull(),
  changeSummary: text("change_summary"),
  extractionStatus: text("extraction_status").notNull().default("queued"),
  previewStatus: text("preview_status").notNull().default("queued"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("file_versions_number_unique").on(table.fileId, table.versionNumber), index("file_versions_hash_idx").on(table.sha256)]);

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  payloadJson: text("payload_json"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("activities_project_date_idx").on(table.projectId, table.createdAt)]);

export const searchDocuments = sqliteTable("search_documents", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  customerId: text("customer_id"),
  projectId: text("project_id"),
  folderId: text("folder_id"),
  title: text("title").notNull(),
  breadcrumb: text("breadcrumb").notNull(),
  metadataText: text("metadata_text").notNull().default(""),
  contentText: text("content_text").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("search_entity_unique").on(table.entityType, table.entityId), index("search_scope_idx").on(table.customerId, table.projectId, table.folderId)]);
