CREATE OR REPLACE FUNCTION public.process_successful_payment(
  p_order_id UUID,
  p_reference TEXT,
  p_gateway_response JSONB,
  p_business_date DATE
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

  v_payment_updated INTEGER;
BEGIN

  -- =========================================================
  -- 1. LOCK ORDER
  -- =========================================================
  SELECT
    id,
    order_code,
    order_type,
    preorder_date_id,
    payment_status
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;


  -- =========================================================
  -- 2. IDEMPOTENCY
  -- =========================================================

  -- Webhook có thể được PayOS gửi lại nhiều lần.
  -- Nếu order đã paid thì không xử lý inventory lần nữa.
  IF v_order.payment_status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'order_id', v_order.id,
      'order_code', v_order.order_code
    );
  END IF;


  -- =========================================================
  -- 3. PROCESS INVENTORY
  -- =========================================================

  -- =========================================================
  -- 3.1 AVAILABLE ORDER
  -- =========================================================
  IF v_order.order_type = 'available' THEN

    FOR v_item IN
      SELECT
        product_id,
        quantity
      FROM public.order_items
      WHERE order_id = v_order.id
      ORDER BY product_id
    LOOP

      -- -----------------------------------------------------
      -- Lock daily inventory row
      -- -----------------------------------------------------
      SELECT
        remaining_quantity
      INTO v_remaining
      FROM public.daily_inventories
      WHERE product_id = v_item.product_id
        AND business_date = p_business_date
      FOR UPDATE;


      IF NOT FOUND THEN
        RAISE EXCEPTION
          'Inventory not found for product: %',
          v_item.product_id;
      END IF;


      -- -----------------------------------------------------
      -- Check quantity
      -- -----------------------------------------------------
      IF v_remaining < v_item.quantity THEN
        RAISE EXCEPTION
          'Insufficient inventory for product %. Available: %, Required: %',
          v_item.product_id,
          v_remaining,
          v_item.quantity;
      END IF;


      -- -----------------------------------------------------
      -- Calculate new quantity
      -- -----------------------------------------------------
      v_new_remaining := v_remaining - v_item.quantity;


      -- -----------------------------------------------------
      -- Calculate inventory status
      -- -----------------------------------------------------
      IF v_new_remaining = 0 THEN
        v_inventory_status := 'out_of_stock';

      ELSIF v_new_remaining <= 10 THEN
        v_inventory_status := 'low_stock';

      ELSE
        v_inventory_status := 'available';
      END IF;


      -- -----------------------------------------------------
      -- Update inventory
      -- -----------------------------------------------------
      UPDATE public.daily_inventories
      SET
        remaining_quantity = v_new_remaining,
        status = v_inventory_status,
        updated_at = NOW()
      WHERE product_id = v_item.product_id
        AND business_date = p_business_date;

    END LOOP;


  -- =========================================================
  -- 3.2 PREORDER ORDER
  -- =========================================================
  ELSIF v_order.order_type = 'preorder' THEN

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

      -- -----------------------------------------------------
      -- Lock preorder item
      -- -----------------------------------------------------
      SELECT
        remaining_quantity
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


      -- -----------------------------------------------------
      -- Check quantity
      -- -----------------------------------------------------
      IF v_remaining < v_item.quantity THEN
        RAISE EXCEPTION
          'Insufficient preorder quantity for product %. Available: %, Required: %',
          v_item.product_id,
          v_remaining,
          v_item.quantity;
      END IF;


      -- -----------------------------------------------------
      -- Calculate new quantity
      -- -----------------------------------------------------
      v_new_remaining := v_remaining - v_item.quantity;

      -- -----------------------------------------------------
      -- Update preorder inventory
      -- -----------------------------------------------------
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


  -- =========================================================
  -- 4. UPDATE ORDER
  -- =========================================================
  UPDATE public.orders
  SET
    payment_status = 'paid',
    status = 'confirmed',
    confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_order.id;


  -- =========================================================
  -- 5. UPDATE PAYMENT
  -- =========================================================
  UPDATE public.payments
  SET
    status = 'paid',
    transaction_id = p_reference,
    gateway_response = p_gateway_response,
    updated_at = NOW()
  WHERE order_id = v_order.id;

  GET DIAGNOSTICS v_payment_updated = ROW_COUNT;


  IF v_payment_updated = 0 THEN
    RAISE EXCEPTION
      'Payment not found for order: %',
      v_order.id;
  END IF;


  -- =========================================================
  -- 6. RETURN RESULT
  -- =========================================================
  RETURN jsonb_build_object(
    'success', true,
    'already_processed', false,
    'order_id', v_order.id,
    'order_code', v_order.order_code,
    'order_type', v_order.order_type
  );

END;
$$;