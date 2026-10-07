-- Fix 1: Retailer INSERT on orders — enforce retailer_id = auth.uid()
-- Previously any Retailer could insert with arbitrary retailer_id (IDOR)
DROP POLICY IF EXISTS "Retailers can insert their orders" ON orders;
CREATE POLICY "Retailers can insert their orders"
ON orders FOR INSERT
WITH CHECK (
  auth.uid() = retailer_id
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Distributor', 'Retailer'))
);

-- Fix 2: Driver UPDATE — restrict to status column only
-- Previously Drivers could update any column (total, customer_name, etc.)
DROP POLICY IF EXISTS "Drivers can update assigned orders" ON orders;

-- Revoke broad UPDATE, replace with function-scoped policy
-- PostgreSQL RLS cannot restrict to specific columns directly,
-- so we use a CHECK that ensures non-status columns remain unchanged
CREATE POLICY "Drivers can update assigned orders"
ON orders FOR UPDATE
USING (auth.uid() = driver_id)
WITH CHECK (
  auth.uid() = driver_id
  -- Ensure only status changed: all other mutable fields must stay the same
  -- This is enforced by comparing OLD vs NEW via a helper function below
);

-- Helper function: Drivers can only modify the status column
CREATE OR REPLACE FUNCTION public.driver_update_guard()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is a Driver, block changes to anything except status
  IF EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Driver') THEN
    IF NEW.order_id IS DISTINCT FROM OLD.order_id
       OR NEW.customer_name IS DISTINCT FROM OLD.customer_name
       OR NEW.date IS DISTINCT FROM OLD.date
       OR NEW.total IS DISTINCT FROM OLD.total
       OR NEW.distributor_id IS DISTINCT FROM OLD.distributor_id
       OR NEW.retailer_id IS DISTINCT FROM OLD.retailer_id
       OR NEW.driver_id IS DISTINCT FROM OLD.driver_id
    THEN
      RAISE EXCEPTION 'Drivers may only update order status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger
DROP TRIGGER IF EXISTS enforce_driver_update ON orders;
CREATE TRIGGER enforce_driver_update
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.driver_update_guard();
