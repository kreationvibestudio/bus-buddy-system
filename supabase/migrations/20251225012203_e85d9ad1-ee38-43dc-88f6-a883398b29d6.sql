-- Add new status 'admin_approved' to the stock_request_status enum
ALTER TYPE public.stock_request_status ADD VALUE IF NOT EXISTS 'admin_approved' AFTER 'approved';

-- Rename 'approved' to be used for backward compatibility, we'll use 'admin_approved' for the new workflow
-- The flow is: pending → admin_approved → fulfilled (or rejected at any point)