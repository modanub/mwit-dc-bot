-- CreateTable
CREATE TABLE "VoiceChannel" (
    "guildId" TEXT NOT NULL,
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'NaN',
    "blacklist" TEXT NOT NULL DEFAULT '[]',
    "whitelist" TEXT NOT NULL DEFAULT '[]',
    "public" BOOLEAN NOT NULL DEFAULT false,
    "maxUsers" INTEGER NOT NULL,
    CONSTRAINT "VoiceChannel_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "joinToCreateChannel" TEXT NOT NULL DEFAULT 'NaN'
);

-- CreateIndex
CREATE UNIQUE INDEX "VoiceChannel_id_key" ON "VoiceChannel"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Guild_id_key" ON "Guild"("id");
