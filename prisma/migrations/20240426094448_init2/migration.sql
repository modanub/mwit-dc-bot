-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "joinToCreateChannel" TEXT NOT NULL DEFAULT 'NaN',
    "categoryId" TEXT NOT NULL DEFAULT 'NaN'
);
INSERT INTO "new_Guild" ("id", "joinToCreateChannel") SELECT "id", "joinToCreateChannel" FROM "Guild";
DROP TABLE "Guild";
ALTER TABLE "new_Guild" RENAME TO "Guild";
CREATE UNIQUE INDEX "Guild_id_key" ON "Guild"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
