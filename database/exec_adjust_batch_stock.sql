-- Atomic increment/decrement with non-negative check
CREATE OR REPLACE FUNCTION public.exec_adjust_batch_stock(
    p_product_id UUID,
    p_branch_id UUID,
    p_batch_id UUID,
    p_delta INTEGER
) RETURNS void AS $$
DECLARE
    v_new_qty INTEGER;
BEGIN
    UPDATE public.product_branch_batch_stocks
    SET quantity = quantity + p_delta,
        updated_at = NOW()
    WHERE product_id = p_product_id
      AND branch_id = p_branch_id
      AND batch_id = p_batch_id
      AND (quantity + p_delta) >= 0
    RETURNING quantity INTO v_new_qty;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product %, branch %, batch %', p_product_id, p_branch_id, p_batch_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

