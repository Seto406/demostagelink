-- Ensure dependent social rows are deleted automatically when a post is deleted.
-- This fixes production environments where the post_likes/post_comments foreign keys
-- were created without ON DELETE CASCADE.
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'post_likes'
      AND con.contype = 'f'
      AND att.attname = 'post_id'
  LOOP
    EXECUTE format('ALTER TABLE public.post_likes DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.post_likes
  ADD CONSTRAINT post_likes_post_id_fkey
  FOREIGN KEY (post_id)
  REFERENCES public.posts(id)
  ON DELETE CASCADE;

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'post_comments'
      AND con.contype = 'f'
      AND att.attname = 'post_id'
  LOOP
    EXECUTE format('ALTER TABLE public.post_comments DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.post_comments
  ADD CONSTRAINT post_comments_post_id_fkey
  FOREIGN KEY (post_id)
  REFERENCES public.posts(id)
  ON DELETE CASCADE;
