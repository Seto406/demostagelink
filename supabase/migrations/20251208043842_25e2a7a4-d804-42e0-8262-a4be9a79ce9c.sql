-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('audience', 'producer');

-- Create enum for show status
CREATE TYPE public.show_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for niche type
CREATE TYPE public.niche_type AS ENUM ('local', 'university');

-- Create profiles table for user roles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'audience',
  group_name TEXT,
  description TEXT,
  founded_year INTEGER,
  niche niche_type,
  map_screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shows table
CREATE TABLE public.shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  venue TEXT,
  ticket_link TEXT,
  poster_url TEXT,
  niche niche_type DEFAULT 'local',
  city TEXT,
  status show_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
-- Anyone can view profiles (for directory)
CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Shows RLS Policies
-- Anyone can view approved shows (public feed)
CREATE POLICY "Anyone can view approved shows"
ON public.shows
FOR SELECT
USING (status = 'approved');

-- Producers can view their own shows regardless of status
CREATE POLICY "Producers can view own shows"
ON public.shows
FOR SELECT
USING (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Producers can insert shows (will default to pending)
CREATE POLICY "Producers can insert shows"
ON public.shows
FOR INSERT
WITH CHECK (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Producers can update their own shows
CREATE POLICY "Producers can update own shows"
ON public.shows
FOR UPDATE
USING (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Producers can delete their own shows
CREATE POLICY "Producers can delete own shows"
ON public.shows
FOR DELETE
USING (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shows_updated_at
BEFORE UPDATE ON public.shows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'audience'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();