-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix search_path for check_low_stock function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix search_path for check_expiring_items function
CREATE OR REPLACE FUNCTION public.check_expiring_items()
RETURNS void AS $$
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;