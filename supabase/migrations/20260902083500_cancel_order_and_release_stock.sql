CREATE OR REPLACE FUNCTION public.cancel_order_and_release_stock(
  p_order_id UUID,
  p_business_date DATE,
  p_reason TEXT DEFAULT NULL,
  p_gateway_response JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;

  v_remaining INTEGER;
  v_new_remaining INTEGER;
  v_inventory_status inventory_status;
BEGIN

  -- ==========================================
  -- 1. LOCK ORDER
  -- ==========================================
  SELECT
    id,
    order_code,
    order_type,
    preorder_date_id,
    payment_status,
    status
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;


  -- ==========================================
  -- 2. ALREADY PAID
  -- ==========================================
  IF v_order.payment_status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_paid', true,
      'already_cancelled', false,
      'order_id', v_order.id,
      'order_code', v_order.order_code
    );
  END IF;


  -- ==========================================
  -- 3. ALREADY CANCELLED
  -- ==========================================
  IF v_order.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_paid', false,
      'already_cancelled', true,
      'order_id', v_order.id,
      'order_code', v_order.order_code
    );
  END IF;


  -- ==========================================
  -- 4. RELEASE STOCK
  -- ==========================================
  IF v_order.order_type = 'available' THEN
    -- ------------------------------------------
    -- AVAILABLE ORDER
    -- ------------------------------------------
    FOR v_item IN
      SELECT
        product_id,
        quantity
      FROM public.order_items
      WHERE order_id = v_order.id
      ORDER BY product_id
    LOOP

      -- Lock inventory row
      SELECT remaining_quantity
      INTO v_remaining
      FROM public.daily_inventories
      WHERE product_id = v_item.product_id
        AND business_date = p_business_date
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION
          'Inventory not found for product % on business date %',
          v_item.product_id,
          p_business_date;
      END IF;


      -- Restore stock
      v_new_remaining := v_remaining + v_item.quantity;


      -- Update inventory status
      IF v_new_remaining = 0 THEN
        v_inventory_status := 'out_of_stock';

      ELSIF v_new_remaining <= 10 THEN
        v_inventory_status := 'low_stock';

      ELSE
        v_inventory_status := 'available';
      END IF;


      UPDATE public.daily_inventories
      SET
        remaining_quantity = v_new_remaining,
        status = v_inventory_status,
        updated_at = NOW()
      WHERE product_id = v_item.product_id
        AND business_date = p_business_date;

    END LOOP;


  ELSIF v_order.order_type = 'preorder' THEN
    -- ------------------------------------------
    -- PREORDER
    -- ------------------------------------------
    IF v_order.preorder_date_id IS NULL THEN
      RAISE EXCEPTION
        'Preorder order % has no preorder_date_id',
        v_order.id;
    END IF;


    FOR v_item IN
      SELECT
        product_id,
        quantity
      FROM public.order_items
      WHERE order_id = v_order.id
      ORDER BY product_id
    LOOP

      -- Lock preorder stock
      SELECT remaining_quantity
      INTO v_remaining
      FROM public.preorder_items
      WHERE schedule_id = v_order.preorder_date_id
        AND product_id = v_item.product_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION
          'Preorder item not found for product % and schedule %',
          v_item.product_id,
          v_order.preorder_date_id;
      END IF;


      -- Restore preorder quantity
      v_new_remaining := v_remaining + v_item.quantity;


      UPDATE public.preorder_items
      SET
        remaining_quantity = v_new_remaining,
        updated_at = NOW()
      WHERE schedule_id = v_order.preorder_date_id
        AND product_id = v_item.product_id;

    END LOOP;

  ELSE

    RAISE EXCEPTION
      'Invalid order type: %',
      v_order.order_type;

  END IF;


  -- ==========================================
  -- 5. CANCEL ORDER
  -- ==========================================
  UPDATE public.orders
  SET
    status = 'cancelled',
    payment_status = 'failed',
    cancelled_at = NOW(),

    note = CASE
      WHEN p_reason IS NOT NULL THEN
        CASE
          WHEN note IS NOT NULL AND note <> ''
            THEN note || ' | ' || p_reason
          ELSE
            p_reason
        END
      ELSE
        note
    END,

    updated_at = NOW()

  WHERE id = v_order.id;


  -- ==========================================
  -- 6. UPDATE PAYMENT
  -- ==========================================
  UPDATE public.payments
  SET
    status = 'failed',
    gateway_response = COALESCE(
      p_gateway_response,
      gateway_response
    ),
    updated_at = NOW()
  WHERE order_id = v_order.id;


  -- ==========================================
  -- 7. RETURN
  -- ==========================================
  RETURN jsonb_build_object(
    'success', true,
    'already_paid', false,
    'already_cancelled', false,
    'order_id', v_order.id,
    'order_code', v_order.order_code,
    'order_type', v_order.order_type
  );

END;
$$;