-- Secondary indexes for hot query paths (feeds, following, counts, profiles, search).
-- Prisma auto-indexes only @id/@unique/@@unique; FK lookup columns need explicit @@index.

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Post_communityId_createdAt_idx" ON "Post"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_postId_createdAt_idx" ON "Comment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE INDEX "Observation_userId_idx" ON "Observation"("userId");

-- Enable trigram search so ILIKE '%term%' scans become index lookups.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "Post_title_trgm_idx" ON "Post" USING gin ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Post_content_trgm_idx" ON "Post" USING gin ("content" gin_trgm_ops);
