-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create household role enum
CREATE TYPE public.household_role AS ENUM ('owner', 'admin', 'member');

-- Create item category enum
CREATE TYPE public.item_category AS ENUM ('food', 'beverages', 'cleaning', 'personal', 'medicine', 'electronics', 'documents', 'other');

-- Create transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('purchase', 'use', 'adjust', 'expire');

-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM ('low_stock', 'expiry', 'warranty', 'system');

-- User roles table for app-wide permissions
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Households table
CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Household members table
CREATE TABLE public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role household_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (household_id, user_id)
);

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category item_category NOT NULL DEFAULT 'other',
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  location TEXT,
  purchase_date DATE,
  expiry_date DATE,
  price NUMERIC,
  barcode TEXT,
  notes TEXT,
  image_url TEXT,
  low_stock_threshold INTEGER DEFAULT 2,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  delta NUMERIC NOT NULL,
  type transaction_type NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User settings table
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  low_stock_alerts BOOLEAN DEFAULT true,
  expiry_alerts BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Security definer function to check app role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check household membership
CREATE OR REPLACE FUNCTION public.is_household_member(_user_id UUID, _household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE user_id = _user_id
      AND household_id = _household_id
  )
$$;

-- Function to get household role
CREATE OR REPLACE FUNCTION public.get_household_role(_user_id UUID, _household_id UUID)
RETURNS household_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.household_members
  WHERE user_id = _user_id
    AND household_id = _household_id
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for households
CREATE POLICY "Users can view households they belong to"
  ON public.households FOR SELECT
  USING (public.is_household_member(auth.uid(), id) OR owner_id = auth.uid());

CREATE POLICY "Users can create households"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their households"
  ON public.households FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their households"
  ON public.households FOR DELETE
  USING (owner_id = auth.uid());

-- RLS Policies for household_members
CREATE POLICY "Members can view household members"
  ON public.household_members FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Owners and admins can manage members"
  ON public.household_members FOR INSERT
  WITH CHECK (
    public.get_household_role(auth.uid(), household_id) IN ('owner', 'admin')
    OR (auth.uid() = user_id AND role = 'owner')
  );

CREATE POLICY "Owners and admins can update members"
  ON public.household_members FOR UPDATE
  USING (public.get_household_role(auth.uid(), household_id) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can remove members"
  ON public.household_members FOR DELETE
  USING (public.get_household_role(auth.uid(), household_id) IN ('owner', 'admin') OR auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Users can view categories"
  ON public.categories FOR SELECT
  USING (is_default = true OR public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Members can create categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- RLS Policies for items
CREATE POLICY "Members can view items"
  ON public.items FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Members can create items"
  ON public.items FOR INSERT
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Members can update items"
  ON public.items FOR UPDATE
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Owners and admins can delete items"
  ON public.items FOR DELETE
  USING (public.get_household_role(auth.uid(), household_id) IN ('owner', 'admin') OR created_by = auth.uid());

-- RLS Policies for transactions
CREATE POLICY "Members can view transactions"
  ON public.transactions FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Members can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view their settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create default household
  INSERT INTO public.households (name, owner_id, description)
  VALUES ('My Home', NEW.id, 'Your personal household inventory')
  RETURNING id INTO new_household_id;
  
  -- Add user as owner of the household
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (new_household_id, NEW.id, 'owner');
  
  -- Create default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  -- Create welcome notification
  INSERT INTO public.notifications (user_id, household_id, type, title, message)
  VALUES (NEW.id, new_household_id, 'system', 'Welcome to Home Inventory!', 'Start by adding your first item to your inventory.');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notification for low stock items
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity <= NEW.low_stock_threshold AND (OLD IS NULL OR OLD.quantity > OLD.low_stock_threshold) THEN
    INSERT INTO public.notifications (user_id, household_id, item_id, type, title, message, action_url)
    SELECT 
      hm.user_id,
      NEW.household_id,
      NEW.id,
      'low_stock',
      'Low Stock Alert',
      format('%s is running low (%s %s remaining)', NEW.name, NEW.quantity, NEW.unit),
      '/inventory'
    FROM public.household_members hm
    WHERE hm.household_id = NEW.household_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_item_low_stock
  AFTER INSERT OR UPDATE OF quantity ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.check_low_stock();

-- Function to check expiring items (to be called by cron)
CREATE OR REPLACE FUNCTION public.check_expiring_items()
RETURNS void AS $$
BEGIN
  -- Insert notifications for items expiring within 7 days
  INSERT INTO public.notifications (user_id, household_id, item_id, type, title, message, action_url)
  SELECT DISTINCT
    hm.user_id,
    i.household_id,
    i.id,
    'expiry',
    'Expiry Alert',
    format('%s expires on %s', i.name, to_char(i.expiry_date, 'Mon DD, YYYY')),
    '/inventory'
  FROM public.items i
  JOIN public.household_members hm ON hm.household_id = i.household_id
  WHERE i.expiry_date IS NOT NULL
    AND i.expiry_date <= CURRENT_DATE + INTERVAL '7 days'
    AND i.expiry_date >= CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.item_id = i.id
        AND n.type = 'expiry'
        AND n.created_at >= CURRENT_DATE - INTERVAL '1 day'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;