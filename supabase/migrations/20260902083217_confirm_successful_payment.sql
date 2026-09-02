CREATE OR REPLACE FUNCTION public.confirm_successful_payment(
  p_order_id UUID,
  p_reference TEXT,
  p_gateway_response JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Lock order để chống race condition
  SELECT
    id,
    order_code,
    payment_status,
    status
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Webhook bị gửi lại
  IF v_order.payment_status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'order_id', v_order.id,
      'order_code', v_order.order_code
    );
  END IF;

  -- Nếu order đã cancelled thì không tự động mark paid
  IF v_order.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'order_cancelled', true,
      'order_id', v_order.id,
      'order_code', v_order.order_code
    );
  END IF;

  -- Confirm order
  UPDATE public.orders
  SET
    payment_status = 'paid',
    status = 'confirmed',
    confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_order.id;

  -- Update payment
  UPDATE public.payments
  SET
    status = 'paid',
    transaction_id = p_reference,
    gateway_response = p_gateway_response,
    updated_at = NOW()
  WHERE order_id = v_order.id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found for order: %', v_order.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_processed', false,
    'order_id', v_order.id,
    'order_code', v_order.order_code
  );
END;
$$;