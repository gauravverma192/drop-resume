import { createId } from "@paralleldrive/cuid2";

/**
 * Submission ids are minted here, not by the database, because the storage
 * path embeds the id and the upload happens before the row insert.
 */
export { createId };
