CREATE OR REPLACE FUNCTION public.create_order_with_stock_lock(
  p_order_code TEXT,
  p_order_type TEXT,
  p_preorder_date_id UUID,
  p_fulfillment_method TEXT,
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_address TEXT,
  p_city TEXT,
  p_district TEXT,
  p_ward TEXT,
  p_note TEXT,
  p_subtotal NUMERIC,
  p_shipping_fee NUMERIC,
  p_total NUMERIC,
  p_payment_method TEXT,
  p_items JSONB,
  p_business_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;

  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;

  v_remaining INTEGER;
  v_new_remaining INTEGER;
  v_inventory_status inventory_status;
  v_schedule_status BOOLEAN;
BEGIN

  /*
   * ============================================================
   * 0.1 VALIDATE PREORDER SCHEDULE
   * ============================================================
   */
  IF p_order_type = 'preorder' THEN

    IF p_preorder_date_id IS NULL THEN
      RAISE EXCEPTION
        'Preorder date ID is required for preorder order';
    END IF;

    SELECT status
    INTO v_schedule_status
    FROM public.preorder_schedules
    WHERE id = p_preorder_date_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'Preorder schedule not found: %',
        p_preorder_date_id;
    END IF;

    IF v_schedule_status IS NOT TRUE THEN
      RAISE EXCEPTION
        'Preorder schedule is closed';
    END IF;

  END IF;

  /*
   * ============================================================
   * 1. LOCK + CHECK + DECREMENT STOCK
   * ============================================================
   */
  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_items)
    ORDER BY value->>'product_id'
  LOOP

    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;

    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'Product ID is required';
    END IF;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION
        'Invalid quantity for product %: %',
        v_product_id,
        v_quantity;
    END IF;


    /*
     * AVAILABLE ORDER
     */
    IF p_order_type = 'available' THEN

      SELECT remaining_quantity
      INTO v_remaining
      FROM public.daily_inventories
      WHERE product_id = v_product_id
        AND business_date = p_business_date
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION
          'Inventory not found for product: %',
          v_product_id;
      END IF;

      IF v_remaining < v_quantity THEN
        RAISE EXCEPTION
          'Insufficient inventory for product %. Available: %, Required: %',
          v_product_id,
          v_remaining,
          v_quantity;
      END IF;

      v_new_remaining := v_remaining - v_quantity;

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
      WHERE product_id = v_product_id
        AND business_date = p_business_date;


    /*
     * PREORDER ORDER
     */
    ELSIF p_order_type = 'preorder' THEN

      SELECT remaining_quantity
      INTO v_remaining
      FROM public.preorder_items
      WHERE schedule_id = p_preorder_date_id
        AND product_id = v_product_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION
          'Preorder item not found for product: %',
          v_product_id;
      END IF;

      IF v_remaining < v_quantity THEN
        RAISE EXCEPTION
          'Insufficient preorder quantity for product %. Available: %, Required: %',
          v_product_id,
          v_remaining,
          v_quantity;
      END IF;

      v_new_remaining := v_remaining - v_quantity;

      UPDATE public.preorder_items
      SET
        remaining_quantity = v_new_remaining,
        updated_at = NOW()
      WHERE schedule_id = p_preorder_date_id
        AND product_id = v_product_id;

    END IF;

  END LOOP;


  /*
   * ============================================================
   * 2. CREATE ORDER
   * ============================================================
   */
  INSERT INTO public.orders (
    order_code,
    status,
    payment_status,
    order_type,
    fulfillment_method,
    preorder_date_id,
    name,
    phone,
    email,
    address,
    city,
    district,
    ward,
    note,
    subtotal,
    shipping_fee,
    total,
    payment_method
  )
  VALUES (
    p_order_code,
    'pending',
    'unpaid',
    p_order_type,
    p_fulfillment_method::public.fulfillment_method,
    CASE
      WHEN p_order_type = 'preorder'
      THEN p_preorder_date_id
      ELSE NULL
    END,
    p_name,
    p_phone,
    p_email,
    p_address,
    p_city,
    p_district,
    p_ward,
    p_note,
    p_subtotal,
    p_shipping_fee,
    p_total,
    p_payment_method
  )
  RETURNING id INTO v_order_id;


  /*
   * ============================================================
   * 3. CREATE ORDER ITEMS
   * ============================================================
   */
  INSERT INTO public.order_items (
    order_id,
    product_id,
    product_name,
    unit_price,
    quantity,
    subtotal
  )
  SELECT
    v_order_id,
    (item->>'product_id')::UUID,
    item->>'product_name',
    (item->>'unit_price')::NUMERIC,
    (item->>'quantity')::INTEGER,
    (item->>'subtotal')::NUMERIC
  FROM jsonb_array_elements(p_items) AS item;


  /*
   * ============================================================
   * 4. CREATE PAYMENT
   * ============================================================
   */
  INSERT INTO public.payments (
    order_id,
    method,
    amount
  )
  VALUES (
    v_order_id,
    p_payment_method,
    p_total
  );


  /*
   * ============================================================
   * 5. RETURN ORDER DATA
   * ============================================================
   */
  RETURN jsonb_build_object(
    'success', true,
    'order', jsonb_build_object(
      'id', v_order_id,
      'order_code', p_order_code,
      'order_type', p_order_type,
      'fulfillment_method', p_fulfillment_method,
      'preorder_date_id', p_preorder_date_id,
      'subtotal', p_subtotal,
      'shipping_fee', p_shipping_fee,
      'total', p_total,
      'payment_method', p_payment_method
    )
  );

END;
$$;