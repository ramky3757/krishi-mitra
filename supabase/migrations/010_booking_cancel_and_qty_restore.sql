-- 1. Allow consumers to delete their own pending bookings
DROP POLICY IF EXISTS "Consumers can delete their own pending bookings" ON public.bookings;
CREATE POLICY "Consumers can delete their own pending bookings"
  ON public.bookings FOR DELETE TO authenticated
  USING (consumer_id = auth.uid() AND status = 'pending');

-- 2. Allow consumers to update (cancel) their own bookings
DROP POLICY IF EXISTS "Consumers can confirm their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Consumers can update their own bookings" ON public.bookings;
CREATE POLICY "Consumers can update their own bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (consumer_id = auth.uid());

-- 3. Trigger: restore booked_qty_kg on crop_listing when a booking is
--    cancelled (status → 'cancelled') or deleted.
CREATE OR REPLACE FUNCTION public.restore_listing_qty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On DELETE: restore the full qty
  IF TG_OP = 'DELETE' THEN
    UPDATE public.crop_listings
    SET
      booked_qty_kg = GREATEST(0, COALESCE(booked_qty_kg, 0) - OLD.qty_kg)
    WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;

  -- On UPDATE: only act when status flips TO 'cancelled'
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.crop_listings
    SET booked_qty_kg = GREATEST(0, COALESCE(booked_qty_kg, 0) - OLD.qty_kg)
    WHERE id = OLD.listing_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_qty_restore ON public.bookings;
CREATE TRIGGER booking_qty_restore
  AFTER UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.restore_listing_qty();
