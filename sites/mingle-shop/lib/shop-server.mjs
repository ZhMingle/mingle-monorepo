import { categories, defaults, ShopError, integer, textValue, validateProduct, validateSettings, readiness, publicProduct, unitPrice, parseCart, answerQuestion, hash, verifyWebhook } from './commerce.mjs';
import { productMediaMap, validateMediaIds, uploadMedia, serveMedia, generateProductCopy } from './product-media.mjs';

const uuid = () => crypto.randomUUID();
const all = async (db, sql, args = []) => (await db.prepare(sql).bind(...args).all()).results;
const first = (db, sql, args = []) => db.prepare(sql).bind(...args).first();
const run = (db, sql, args = []) => db.prepare(sql).bind(...args).run();
const settingsFor = async db => ({ ...defaults, ...JSON.parse((await first(db, 'SELECT payload FROM shop_settings WHERE id=1'))?.payload || '{}') });
const audit = (db, action, detail) => run(db, 'INSERT INTO shop_audit VALUES(?,?,?,?)', [uuid(), action, JSON.stringify(detail), Date.now()]);
const owner = (request, env, dev) => !!request.headers.get('oai-authenticated-user-id') && !!env.OWNER_EMAIL && request.headers.get('oai-authenticated-user-email')?.toLowerCase() === env.OWNER_EMAIL.toLowerCase() || (dev && ['127.0.0.1', 'localhost'].includes(new URL(request.url).hostname) && request.headers.get('oai-authenticated-user-id') === 'local_seedy');
async function limited(db, request, visitor, action, maximum) {
  const key = await hash((request.headers.get('cf-connecting-ip') || visitor) + ':' + action + ':' + Math.floor(Date.now() / 60000));
  const row = await db.prepare('INSERT INTO rate_limits VALUES(?,1) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(key).first();
  if (row.count > maximum) throw new ShopError('操作较频繁，请稍后再试。', 429);
}
async function stripe(env, path, params, idempotency, fetcher) {
  const response = await fetcher('https://api.stripe.com/v1/' + path, { method: params ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'Stripe-Version': '2026-10-28.endive', ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}), ...(idempotency ? { 'Idempotency-Key': idempotency } : {}) }, ...(params ? { body: params.toString() } : {}) });
  const data = await response.json();
  if (!response.ok) { const error = new ShopError('Stripe 暂时无法建立付款，请重试同一笔结账或联系店主。', 502); error.definitive = response.status >= 400 && response.status < 500 && ![409, 429].includes(response.status); throw error; }
  return data;
}
async function pricedCart(db, input, visitor) {
  const cart = parseCart(input.items);
  const quote = input.quoteId ? await first(db, 'SELECT * FROM quotes WHERE id=? AND visitor=?', [textValue(input.quoteId, 100, '报价编号'), visitor]) : null;
  if (input.quoteId && (!quote || quote.expires_at < Date.now())) throw new ShopError('客服报价已失效，请重新询价。', 409);
  const items = [];
  for (const line of cart) {
    const p = await first(db, 'SELECT * FROM products WHERE id=?', [line.id]);
    if (!p?.enabled || p.price_cents === null) throw new ShopError('购物车有商品已下架，请刷新。', 409);
    if (p.stock - p.reserved < line.quantity) throw new ShopError(p.name + ' 库存不足，请调整数量。', 409);
    let amount = unitPrice(p, line.quantity);
    if (quote?.product_id === p.id) {
      if (quote.quantity !== line.quantity || quote.revision !== p.revision) throw new ShopError('数量或商品价格已变化，请重新询价。', 409);
      amount = Math.min(amount, quote.unit_cents);
    }
    items.push({ ...line, name: p.name, unitCents: amount, revision: p.revision });
  }
  if (quote && !items.some(p => p.id === quote.product_id)) throw new ShopError('报价商品不在购物车中。');
  return items;
}
async function settle(db, session, eventId, env) {
  const order = await first(db, 'SELECT * FROM orders WHERE id=?', [session.metadata?.order_id || '']);
  if (!order) return;
  if (order.session_id && order.session_id !== session.id) throw new ShopError('付款会话不匹配。');
  if (session.currency !== 'nzd' || session.amount_total !== order.total_cents || session.livemode !== env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) throw new ShopError('付款金额、币种或运行模式不匹配。');
  let state;
  if (session.payment_status === 'paid') state = ['creating', 'awaiting_payment', 'paid', 'fulfilled'].includes(order.state) ? (order.state === 'fulfilled' ? 'fulfilled' : 'paid') : 'review';
  else if (session.status === 'expired' && ['creating', 'awaiting_payment'].includes(order.state)) state = 'expired';
  if (!state) return;
  await db.batch([
    db.prepare('INSERT OR IGNORE INTO payment_events VALUES(?,?)').bind(eventId, Date.now()),
    db.prepare("UPDATE orders SET state=?,session_id=?,customer=? WHERE id=? AND state=?").bind(state, session.id, JSON.stringify({ contact: session.customer_details || {}, shipping: session.collected_information?.shipping_details || session.shipping_details || null }), order.id, order.state),
  ]);
}
export async function handleShopRequest(request, env, { dev = false, stripeFetch = fetch, visionFetch = fetch } = {}) {
  let newCookie = '';
  const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(newCookie ? { 'Set-Cookie': newCookie } : {}) } });
  try {
    const db = env.DB;
    if (!db) throw new ShopError('店铺数据库尚未连接。', 503);
    const url = new URL(request.url), path = url.pathname.replace(/^\/api\/?/, '');
    if (path.startsWith('media/') && ['GET','HEAD'].includes(request.method)) return await serveMedia(request, env, textValue(path.slice(6),100,'媒体编号',true), owner(request,env,dev));
    if (path === 'stripe/webhook' && request.method === 'POST') {
      const raw = await request.text();
      if (raw.length > 1000000 || !await verifyWebhook(raw, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET)) throw new ShopError('无效的支付签名。', 401);
      const event = JSON.parse(raw);
      if (['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired'].includes(event.type)) await settle(db, event.data.object, event.id, env);
      return json({ received: true });
    }
    let token = request.headers.get('cookie')?.match(/(?:^|;\s*)mc_visitor=([a-zA-Z0-9-]{36,100})(?:;|$)/)?.[1];
    if (!token) { token = uuid() + uuid(); newCookie = 'mc_visitor=' + token + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000' + (url.protocol === 'https:' ? '; Secure' : ''); }
    const visitor = await hash(token);
    const isOwner = owner(request, env, dev);
    if (path.startsWith('admin') && !isOwner) throw new ShopError('请使用店主账号登录。', 403);
    if (request.method === 'GET') {
      if (path === 'bootstrap') {
        const settings = await settingsFor(db);
        const media = await productMediaMap(db);
        return json({ settings: { ...settings, checkoutEnabled: settings.checkoutEnabled && readiness(settings, env).ready }, products: (await all(db, 'SELECT * FROM products WHERE enabled=1 ORDER BY updated_at DESC')).map(p=>({...publicProduct(p),media:media.get(p.id)||[]})), categories, isOwner });
      }
      if (path === 'admin') {
        const media = await productMediaMap(db);
        return json({ settings: await settingsFor(db), products: (await all(db, 'SELECT * FROM products ORDER BY updated_at DESC')).map(p=>({...p,media:media.get(p.id)||[]})), orders: await all(db, 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 100'), orderItems: await all(db, 'SELECT * FROM order_items WHERE order_id IN (SELECT id FROM orders ORDER BY created_at DESC LIMIT 100)'), messages: await all(db, 'SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 300'), payment: readiness(await settingsFor(db), env), capabilities:{mediaUpload:!!env.BUCKET,photoGeneration:!!env.OPENAI_API_KEY} });
      }
      if (path === 'chat') return json({ messages: await all(db, 'SELECT * FROM (SELECT direction,text,created_at FROM chat_messages WHERE visitor=? ORDER BY created_at DESC LIMIT 100) ORDER BY created_at', [visitor]) });
      if (path === 'order') {
        let order = await first(db, 'SELECT * FROM orders WHERE id=? AND visitor=?', [url.searchParams.get('id') || '', visitor]);
        if (!order) throw new ShopError('未找到当前浏览器的订单。', 404);
        if (order.session_id && ['creating', 'awaiting_payment'].includes(order.state) && env.STRIPE_SECRET_KEY) {
          const session = await stripe(env, 'checkout/sessions/' + encodeURIComponent(order.session_id), null, null, stripeFetch);
          await settle(db, session, 'sync:' + session.id + ':' + session.status + ':' + session.payment_status, env);
          order = await first(db, 'SELECT * FROM orders WHERE id=? AND visitor=?', [order.id, visitor]);
        }
        return json({ id: order.id, state: order.state, totalCents: order.total_cents, fulfilment: order.fulfilment, tracking: order.tracking });
      }
      throw new ShopError('未找到此页面。', 404);
    }
    if (request.method !== 'POST') throw new ShopError('不支持的请求方式。', 405);
    if (path === 'admin/upload') {
      if (request.headers.get('origin') !== url.origin) throw new ShopError('请从店铺页面上传。',403);
      await limited(db,request,visitor,'upload',30);
      return json({media:await uploadMedia(request,env)});
    }
    if (request.headers.get('origin') !== url.origin || !request.headers.get('content-type')?.startsWith('application/json')) throw new ShopError('请从店铺页面提交。', 403);
    const raw = await request.text(); if (raw.length > 32000) throw new ShopError('提交内容过长。', 413);
    const input = JSON.parse(raw);
    if (path === 'admin/generate') {
      await limited(db,request,visitor,'generate',6);
      const draft=await generateProductCopy(env,input,visionFetch);
      await audit(db,'product_copy_generated',{images:input.mediaIds.length,language:draft.language});
      return json({draft});
    }
    if (path === 'admin/seed') {
      const count = await first(db, 'SELECT COUNT(*) AS total FROM products');
      if (count.total) throw new ShopError('已有商品，不会重复导入品类。');
      await db.batch(categories.map(name => db.prepare('INSERT INTO products(id,name,category,updated_at) VALUES(?,?,?,?)').bind(uuid(), name, name, Date.now())));
      return json({ saved: true });
    }
    if (path === 'admin/product') {
      const p = validateProduct(input);
      const mediaIds = input.mediaIds === undefined ? null : await validateMediaIds(db,input.mediaIds);
      const productId = input.id ? textValue(input.id,100,'商品编号',true) : uuid();
      if (input.id) {
        const result = await run(db, 'UPDATE products SET name=?,category=?,description=?,image_url=?,price_cents=?,minimum_cents=?,stock=?,enabled=?,negotiable=?,bulk_qty=?,bulk_percent=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?', [...Object.values(p), Date.now(), textValue(input.id, 100, '商品编号'), integer(input.revision, 1, 1000000000, '版本')]);
        if (!result.meta.changes) throw new ShopError('商品已被修改，请刷新后再试。', 409);
      } else await run(db, 'INSERT INTO products(id,name,category,description,image_url,price_cents,minimum_cents,stock,enabled,negotiable,bulk_qty,bulk_percent,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)', [productId, ...Object.values(p), Date.now()]);
      if(mediaIds !== null) await db.batch([db.prepare('DELETE FROM product_media WHERE product_id=?').bind(productId),...mediaIds.map((id,index)=>db.prepare('INSERT INTO product_media VALUES(?,?,?)').bind(productId,id,index))]);
      await audit(db, 'product_saved', { id: productId, name: p.name }); return json({ saved: true, id:productId });
    }
    if (path === 'admin/bulk') {
      if (!Array.isArray(input.ids) || !input.ids.length || input.ids.length > 100) throw new ShopError('请选择最多 100 件商品。');
      const ids = input.ids.map(id => textValue(id, 100, '商品编号', true));
      const percent = integer(input.percent, -80, 500, '调价比例');
      try { await run(db, 'UPDATE products SET price_cents=round(price_cents*(100+?)/100),revision=revision+1,updated_at=? WHERE price_cents IS NOT NULL AND id IN (' + ids.map(() => '?').join(',') + ')', [percent, Date.now(), ...ids]); } catch { throw new ShopError('批量调价未保存：请检查是否低于最低价。'); }
      await audit(db, 'bulk_price', { ids, percent }); return json({ saved: true });
    }
    if (path === 'admin/settings') {
      const settings = validateSettings(input);
      if (settings.checkoutEnabled && !readiness(settings, env).ready) throw new ShopError('请先完成支付接入、配送和店铺说明。');
      await run(db, 'INSERT INTO shop_settings VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload', [JSON.stringify(settings)]);
      await audit(db, 'settings_saved', {}); return json({ saved: true });
    }
    if (path === 'admin/fulfil') {
      const result = await run(db, "UPDATE orders SET state='fulfilled',tracking=? WHERE id=? AND state='paid'", [textValue(input.tracking, 500, '发货或自取记录'), textValue(input.id, 100, '订单编号')]);
      if (!result.meta.changes) throw new ShopError('只有已付款订单可以标记完成。');
      await audit(db, 'fulfilled', { id: input.id }); return json({ saved: true });
    }
    if (path === 'admin/reconcile') {
      const order = await first(db, 'SELECT * FROM orders WHERE id=?', [textValue(input.id, 100, '订单编号')]);
      if (!order || !['creating', 'awaiting_payment'].includes(order.state)) throw new ShopError('此订单不需要同步。');
      if (!env.STRIPE_SECRET_KEY) throw new ShopError('Stripe 尚未连接。');
      let session;
      if (order.session_id) session = await stripe(env, 'checkout/sessions/' + encodeURIComponent(order.session_id), null, null, stripeFetch);
      else if (order.checkout_params) {
        session = await stripe(env, 'checkout/sessions', new URLSearchParams(order.checkout_params), order.id, stripeFetch);
        await run(db, "UPDATE orders SET session_id=?,session_url=?,state=CASE WHEN state='creating' THEN 'awaiting_payment' ELSE state END WHERE id=?", [session.id, session.url, order.id]);
      } else throw new ShopError('付款请求尚未建立，请让客户重试原结账。');
      await settle(db, session, 'owner-sync:' + session.id + ':' + session.status + ':' + session.payment_status, env);
      await audit(db, 'payment_reconciled', { id: order.id });
      return json({ saved: true });
    }
    if (path === 'admin/reply') {
      const customer = textValue(input.visitor, 100, '对话编号', true);
      if (!await first(db, 'SELECT id FROM chat_messages WHERE visitor=? LIMIT 1', [customer])) throw new ShopError('对话不存在。');
      await db.batch([db.prepare('INSERT INTO chat_messages(id,visitor,direction,text,created_at) VALUES(?,?,?,?,?)').bind(uuid(), customer, 'owner', textValue(input.text, 3000, '回复', true), Date.now()), db.prepare('UPDATE chat_messages SET resolved=1 WHERE visitor=?').bind(customer)]);
      return json({ saved: true });
    }
    if (path === 'chat') {
      await limited(db, request, visitor, 'chat', 30);
      const text = textValue(input.text, 2000, '问题', true);
      const quantity = integer(input.quantity ?? 1, 1, 99, '数量');
      const product = input.productId ? await first(db, 'SELECT * FROM products WHERE id=? AND enabled=1', [textValue(input.productId, 100, '商品编号')]) : null;
      const contact = textValue(input.contact || '', 200, '联系邮箱');
      if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) throw new ShopError('联系邮箱格式不正确。');
      const answer = answerQuestion(text, product, await settingsFor(db), quantity, input.offerCents ?? null);
      let quote = null;
      if (answer.acceptedCents !== null) {
        quote = { id: uuid(), productId: product.id, quantity, unitCents: answer.acceptedCents, expiresAt: Date.now() + 900000 };
        await run(db, 'INSERT INTO quotes VALUES(?,?,?,?,?,?,?)', [quote.id, visitor, product.id, quantity, quote.unitCents, product.revision, quote.expiresAt]);
      }
      await db.batch([
        db.prepare('INSERT INTO chat_messages(id,visitor,direction,text,contact,needs_owner,created_at) VALUES(?,?,?,?,?,?,?)').bind(uuid(), visitor, 'customer', text, contact, +answer.needsOwner, Date.now()),
        db.prepare('INSERT INTO chat_messages(id,visitor,direction,text,needs_owner,created_at) VALUES(?,?,?,?,?,?)').bind(uuid(), visitor, 'assistant', answer.reply, +answer.needsOwner, Date.now() + 1),
      ]);
      return json({ ...answer, quote });
    }
    if (path === 'quote') {
      const settings = await settingsFor(db), items = await pricedCart(db, input, visitor);
      const fulfilment = input.fulfilment;
      if (fulfilment !== 'pickup' && fulfilment !== 'shipping') throw new ShopError('请选择取货方式。');
      if (fulfilment === 'pickup' ? !settings.pickupEnabled : !settings.shippingEnabled) throw new ShopError('此取货方式暂未开放。');
      const shippingCents = fulfilment === 'shipping' ? settings.shippingCents : 0;
      return json({ items, shippingCents, totalCents: items.reduce((sum, p) => sum + p.unitCents * p.quantity, shippingCents), checkoutAvailable: settings.checkoutEnabled && readiness(settings, env).ready });
    }
    if (path === 'checkout') {
      await limited(db, request, visitor, 'checkout', 10);
      const settings = await settingsFor(db);
      if (!settings.checkoutEnabled || !readiness(settings, env).ready) throw new ShopError('店铺暂未开放在线付款。', 503);
      const attempt = visitor + ':' + textValue(input.attempt, 100, '结账编号', true);
      const fingerprint = await hash(JSON.stringify({ items: parseCart(input.items), fulfilment: input.fulfilment, quoteId: input.quoteId || null }));
      let order = await first(db, 'SELECT * FROM orders WHERE attempt=?', [attempt]);
      if (order && order.fingerprint !== fingerprint) throw new ShopError('购物车已改变，请重新开始结账。', 409);
      if (order && ['paid', 'fulfilled'].includes(order.state)) return json({ orderId: order.id, paid: true });
      if (order && !['creating', 'awaiting_payment'].includes(order.state)) throw new ShopError('此结账已结束，请重新开始。', 409);
      if (order?.session_url) return json({ url: order.session_url, orderId: order.id });
      if (!order) {
        const items = await pricedCart(db, input, visitor), fulfilment = input.fulfilment;
        if (fulfilment !== 'pickup' && fulfilment !== 'shipping' || (fulfilment === 'pickup' ? !settings.pickupEnabled : !settings.shippingEnabled)) throw new ShopError('请选择已开放的取货方式。');
        const shippingCents = fulfilment === 'shipping' ? settings.shippingCents : 0;
        const id = uuid(), total = items.reduce((sum, p) => sum + p.unitCents * p.quantity, shippingCents);
        try {
          await db.batch([db.prepare('INSERT INTO orders(id,attempt,visitor,fingerprint,total_cents,shipping_cents,fulfilment,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id, attempt, visitor, fingerprint, total, shippingCents, fulfilment, Date.now()), ...items.map(p => db.prepare('INSERT INTO order_items VALUES(?,?,?,?,?,?)').bind(id, p.id, p.name, p.quantity, p.unitCents, p.revision))]);
        } catch {
          order = await first(db, 'SELECT * FROM orders WHERE attempt=?', [attempt]);
          if (!order) throw new ShopError('商品库存或价格发生变化，请刷新购物车。', 409);
        }
        order ??= await first(db, 'SELECT * FROM orders WHERE id=?', [id]);
      }
      const items = await all(db, 'SELECT * FROM order_items WHERE order_id=? ORDER BY product_id', [order.id]);
      const origin = dev ? url.origin : env.STORE_ORIGIN;
      if (!origin || !/^https:\/\//.test(origin) && !dev) throw new ShopError('店铺支付地址尚未配置。', 503);
      const params = new URLSearchParams({ mode: 'payment', success_url: origin + '/?order=' + order.id, cancel_url: origin + '/?cancelled=' + order.id, client_reference_id: order.id, 'metadata[order_id]': order.id, 'payment_method_types[0]': 'card', expires_at: String(Math.floor(order.created_at / 1000) + 3600) });
      for (let i = 0; i < items.length; i++) {
        const p = items[i]; params.set('line_items[' + i + '][price_data][currency]', 'nzd'); params.set('line_items[' + i + '][price_data][product_data][name]', p.name); params.set('line_items[' + i + '][price_data][unit_amount]', String(p.unit_cents)); params.set('line_items[' + i + '][quantity]', String(p.quantity));
      }
      if (order.shipping_cents) { params.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount'); params.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(order.shipping_cents)); params.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'nzd'); params.set('shipping_options[0][shipping_rate_data][display_name]', 'Shipping'); }
      if (order.fulfilment === 'shipping') params.set('shipping_address_collection[allowed_countries][0]', settings.shippingCountry);
      else params.set('custom_text[submit][message]', 'Pickup: ' + settings.pickupDetails.slice(0, 1000));
      const persisted = await db.prepare('UPDATE orders SET checkout_params=COALESCE(checkout_params,?) WHERE id=? RETURNING checkout_params').bind(params.toString(), order.id).first();
      let session;
      try { session = await stripe(env, 'checkout/sessions', new URLSearchParams(persisted.checkout_params), order.id, stripeFetch); } catch (error) { if (error.definitive) await run(db, "UPDATE orders SET state='failed' WHERE id=? AND state='creating'", [order.id]); throw error; }
      if (!session.id || !session.url?.startsWith('https://checkout.stripe.com/')) throw new ShopError('支付服务返回异常，请重试同一笔结账。', 502);
      await run(db, "UPDATE orders SET session_id=?,session_url=?,state=CASE WHEN state='creating' THEN 'awaiting_payment' ELSE state END WHERE id=?", [session.id, session.url, order.id]);
      return json({ url: session.url, orderId: order.id });
    }
    throw new ShopError('未找到此操作。', 404);
  } catch (error) {
    if (error instanceof ShopError) return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ error: '提交内容格式不正确。' }, 400);
    console.error('Shop request failed:', error?.name, error?.message?.includes('constraint') ? 'database constraint' : 'internal error');
    return json({ error: '暂时无法完成操作，请稍后再试。' }, 500);
  }
}
