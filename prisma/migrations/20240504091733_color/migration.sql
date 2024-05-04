-- CreateTable
CREATE TABLE "ColorRole" (
    "guildId" TEXT NOT NULL,
    "color" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    CONSTRAINT "ColorRole_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameRole" (
    "guildId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "game" TEXT NOT NULL PRIMARY KEY,
    CONSTRAINT "GameRole_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ColorRole_color_key" ON "ColorRole"("color");

-- CreateIndex
CREATE UNIQUE INDEX "GameRole_game_key" ON "GameRole"("game");
