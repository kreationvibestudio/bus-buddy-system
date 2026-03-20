-- Add job_card_id column to work_orders table to link work orders to job cards
ALTER TABLE public.work_orders
ADD COLUMN job_card_id uuid REFERENCES public.job_cards(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_work_orders_job_card_id ON public.work_orders(job_card_id);