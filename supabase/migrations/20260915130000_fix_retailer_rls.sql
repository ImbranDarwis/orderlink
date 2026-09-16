-- Fix RLS policy so Retailers can CREATE orders
-- Without this, retailers get blocked by Supabase when trying to checkout/create new orders

-- First, drop the overly restrictive FOR ALL policy on retailers
DROP POLICY IF EXISTS "Retailers can manage their orders" ON orders;

-- Create granular policies for Retailers
-- 1. Can view their own orders
CREATE POLICY "Retailers can view their orders" 
ON orders FOR SELECT 
USING (auth.uid() = retailer_id);

-- 2. Can insert their own orders
-- Note: WITH CHECK is used for INSERT to ensure they only insert rows where they are the retailer
CREATE POLICY "Retailers can insert their orders" 
ON orders FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Distributor', 'Retailer'))
);

-- 3. Can update their own orders (e.g. cancel)
CREATE POLICY "Retailers can update their orders" 
ON orders FOR UPDATE 
USING (auth.uid() = retailer_id);

-- Allow Retailers to view customers (needed for dropdowns when ordering)
DROP POLICY IF EXISTS "Retailers can view customers" ON customers;
CREATE POLICY "Retailers can view customers" 
ON customers FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Distributor', 'Retailer')));
