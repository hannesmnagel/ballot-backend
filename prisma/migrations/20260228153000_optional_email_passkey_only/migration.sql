-- Step 1: Make email nullable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Step 2: Update existing users without displayName to have a default value
UPDATE "User" SET "displayName" = 'Anonymous User' WHERE "displayName" IS NULL;

-- Step 3: Set default for displayName
ALTER TABLE "User" ALTER COLUMN "displayName" SET DEFAULT 'Anonymous User';

-- Step 4: Make displayName NOT NULL now that all rows have a value
ALTER TABLE "User" ALTER COLUMN "displayName" SET NOT NULL;
