ALTER TABLE `orders` ADD `checkout_params` text;
--> statement-breakpoint
CREATE TRIGGER validate_reservation BEFORE INSERT ON order_items
BEGIN
  SELECT CASE WHEN NEW.quantity <= 0 OR NOT EXISTS (
    SELECT 1 FROM products WHERE id=NEW.product_id AND enabled=1 AND price_cents IS NOT NULL
    AND revision=NEW.revision AND stock-reserved>=NEW.quantity
  ) THEN RAISE(ABORT,'inventory_changed') END;
END;
--> statement-breakpoint
CREATE TRIGGER reserve_inventory AFTER INSERT ON order_items
BEGIN
  UPDATE products SET reserved=reserved+NEW.quantity WHERE id=NEW.product_id;
END;
--> statement-breakpoint
CREATE TRIGGER commit_inventory AFTER UPDATE OF state ON orders
WHEN OLD.state IN ('creating','awaiting_payment') AND NEW.state='paid'
BEGIN
  UPDATE products SET
    stock=stock-(SELECT quantity FROM order_items WHERE order_id=NEW.id AND product_id=products.id),
    reserved=reserved-(SELECT quantity FROM order_items WHERE order_id=NEW.id AND product_id=products.id)
  WHERE id IN (SELECT product_id FROM order_items WHERE order_id=NEW.id);
END;
--> statement-breakpoint
CREATE TRIGGER release_inventory AFTER UPDATE OF state ON orders
WHEN OLD.state IN ('creating','awaiting_payment') AND NEW.state IN ('failed','expired')
BEGIN
  UPDATE products SET reserved=reserved-(SELECT quantity FROM order_items WHERE order_id=NEW.id AND product_id=products.id)
  WHERE id IN (SELECT product_id FROM order_items WHERE order_id=NEW.id);
END;
--> statement-breakpoint
CREATE INDEX chat_visitor_time ON chat_messages(visitor,created_at);
--> statement-breakpoint
CREATE INDEX orders_state_time ON orders(state,created_at);
