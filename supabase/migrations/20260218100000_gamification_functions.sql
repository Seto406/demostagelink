-- Function to add XP and update rank
CREATE OR REPLACE FUNCTION public.add_xp(amount INTEGER)
RETURNS VOID AS $$
DECLARE
  current_xp INTEGER;
  new_xp INTEGER;
  new_rank TEXT;
BEGIN
  -- Get current XP of the user
  SELECT xp INTO current_xp FROM public.profiles WHERE user_id = auth.uid();

  -- Handle null case
  IF current_xp IS NULL THEN
    current_xp := 0;
  END IF;

  new_xp := current_xp + amount;

  -- Determine Rank
  IF new_xp < 100 THEN
    new_rank := 'Newbie';
  ELSIF new_xp < 500 THEN
    new_rank := 'Regular';
  ELSE
    new_rank := 'Veteran';
  END IF;

  -- Update Profile
  UPDATE public.profiles
  SET xp = new_xp, rank = new_rank
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award a badge
CREATE OR REPLACE FUNCTION public.award_badge(badge_slug TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_badge_id UUID;
  user_badge_exists BOOLEAN;
BEGIN
  -- Get badge ID from slug
  SELECT id INTO target_badge_id FROM public.badges WHERE slug = badge_slug;

  IF target_badge_id IS NULL THEN
    RETURN FALSE; -- Badge not found
  END IF;

  -- Check if user already has the badge
  SELECT EXISTS(
    SELECT 1 FROM public.user_badges
    WHERE user_id = auth.uid() AND badge_id = target_badge_id
  ) INTO user_badge_exists;

  IF user_badge_exists THEN
    RETURN FALSE; -- Already has badge
  END IF;

  -- Award Badge
  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (auth.uid(), target_badge_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
