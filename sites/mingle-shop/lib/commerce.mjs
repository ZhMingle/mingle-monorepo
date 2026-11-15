export const categories = ['手机支架', '台灯', '感应灯', '键盘', '鼠标', '音响'];
export const defaults = { name: "Mingle's Choice", currency: 'NZD', contactEmail: '', pickupEnabled: false, pickupDetails: '', shippingEnabled: false, shippingCountry: 'NZ', shippingCents: null, returnPolicy: '', privacyPolicy: '', checkoutEnabled: false };
export class ShopError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
export const money = cents => `NZ$${(cents / 100).toFixed(2)}`;
export function integer(value, min, max, label) { if (!Number.isSafeInteger(value) || value < min || value > max) throw new ShopError(`${label}格式不正确。`); return value; }
export function textValue(value, max, label, required = false) { if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new ShopError(`请检查${label}。`); return value.trim(); }
export function validateProduct(input) {
  const price = input.price_cents === null ? null : integer(input.price_cents, 1, 100000000, '售价');
  const minimum = input.minimum_cents === null ? null : integer(input.minimum_cents, 1, 100000000, '最低价');
  if (minimum !== null && (price === null || minimum > price)) throw new ShopError('最低价不能高于售价。');
  const image = textValue(input.image_url, 2000, '图片地址');
  if (image && !/^https:\/\//i.test(image)) throw new ShopError('图片请使用 HTTPS 地址。');
  for (const key of ['enabled', 'negotiable']) if (typeof input[key] !== 'boolean') throw new ShopError('商品状态格式不正确。');
  if (input.enabled && price === null) throw new ShopError('填写售价后才能上架。');
  if (input.negotiable && minimum === null) throw new ShopError('接受议价时请设置最低价。');
  const bulkPercent = integer(input.bulk_percent, 0, 80, '数量优惠');
  if (minimum !== null && Math.round(price * (100 - bulkPercent) / 100) < minimum) throw new ShopError('数量优惠后的单价不能低于最低价。');
  return { name: textValue(input.name, 120, '商品名称', true), category: textValue(input.category, 60, '分类', true), description: textValue(input.description, 3000, '商品介绍'), image_url: image, price_cents: price, minimum_cents: minimum, stock: integer(input.stock, 0, 1000000, '库存'), enabled: +input.enabled, negotiable: +input.negotiable, bulk_qty: integer(input.bulk_qty, 2, 99, '优惠起购数量'), bulk_percent: bulkPercent };
}
export function validateSettings(input) {
  const next = { ...defaults };
  for (const [key, max] of [['name', 100], ['contactEmail', 200], ['pickupDetails', 2000], ['returnPolicy', 6000], ['privacyPolicy', 6000]]) next[key] = textValue(input[key], max, key, key === 'name');
  if (next.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.contactEmail)) throw new ShopError('联系邮箱格式不正确。');
  for (const key of ['pickupEnabled', 'shippingEnabled', 'checkoutEnabled']) { if (typeof input[key] !== 'boolean') throw new ShopError('店铺设置格式不正确。'); next[key] = input[key]; }
  next.shippingCountry = textValue(input.shippingCountry, 2, '配送国家').toUpperCase();
  next.shippingCents = input.shippingCents === null ? null : integer(input.shippingCents, 0, 1000000, '邮费');
  if (next.shippingEnabled && (!/^[A-Z]{2}$/.test(next.shippingCountry) || next.shippingCents === null)) throw new ShopError('开启邮寄前请设置国家和邮费。');
  if (next.pickupEnabled && !next.pickupDetails) throw new ShopError('开启自取前请填写自取说明。');
  return next;
}
export function readiness(settings, env) {
  const missing = [];
  if (!/^sk_(test|live)_/.test(env.STRIPE_SECRET_KEY || '')) missing.push('Stripe 服务端密钥');
  if (!/^whsec_/.test(env.STRIPE_WEBHOOK_SECRET || '')) missing.push('Stripe Webhook 签名密钥');
  if (!settings.contactEmail) missing.push('联系邮箱');
  if (!settings.returnPolicy || !settings.privacyPolicy) missing.push('退换与隐私说明');
  if (!settings.pickupEnabled && !settings.shippingEnabled) missing.push('自取或配送方式');
  return { ready: missing.length === 0, missing, mode: env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test' };
}
export function publicProduct(p) { const { minimum_cents, negotiable, bulk_percent, revision, reserved, ...safe } = p; return { ...safe, available: Math.max(0, p.stock - p.reserved), quantityOffer: p.bulk_percent > 0 }; }
export function unitPrice(p, quantity) { const discounted = quantity >= p.bulk_qty ? Math.round(p.price_cents * (100 - p.bulk_percent) / 100) : p.price_cents; return Math.max(discounted, p.minimum_cents || 1); }
export function parseCart(input) {
  if (!Array.isArray(input) || !input.length || input.length > 20) throw new ShopError('购物车应包含 1–20 种商品。');
  const seen = new Set();
  return input.map(item => { const id = textValue(item.id, 100, '商品编号', true); if (seen.has(id)) throw new ShopError('购物车有重复商品。'); seen.add(id); return { id, quantity: integer(item.quantity, 1, 99, '数量') }; }).sort((a, b) => a.id.localeCompare(b.id));
}
export function answerQuestion(text, product, settings, quantity = 1, explicitOffer = null, language) {
  const en = language==='en'||language!=='zh'&&!/[\u3400-\u9fff]/.test(text);
  const reply = (zh, english, needsOwner = false, acceptedCents = null) => ({ reply: en ? english : zh, needsOwner, acceptedCents });
  if (/退款|退货|投诉|损坏|取消|refund|return|complain|broken|cancel/i.test(text)) return reply(settings.returnPolicy || '我已记录你的售后问题，需要店主确认。可以留下联系邮箱。', settings.returnPolicy || 'I have noted your request for the shop owner. You can leave a contact email.', true);
  if (/人工|店主|human|owner|person/i.test(text)) return reply('已记录，请留下问题和联系邮箱，店主可在这里接着回复。', 'Please leave your question and contact email. The owner can continue this chat here.', true);
  if (/邮费|配送|邮寄|shipping|deliver|postage/i.test(text)) return settings.shippingEnabled ? reply(`目前支持寄往 ${settings.shippingCountry}，每单邮费 ${money(settings.shippingCents)}。`, `Shipping to ${settings.shippingCountry} is ${money(settings.shippingCents)} per order.`) : reply('邮费和配送范围尚未确认，需要店主确认。', 'Shipping rates and coverage need confirmation from the owner.', true);
  if (/自取|地址|pickup|pick up|address/i.test(text)) return settings.pickupEnabled ? reply(settings.pickupDetails, settings.pickupDetails) : reply('自取安排尚未填写，需要店主确认。', 'Pickup arrangements need confirmation from the owner.', true);
  if (/付款|支付|payment|pay\b/i.test(text)) return settings.checkoutEnabled ? reply('将商品加入购物车后，可以前往 Stripe 收银台用 NZD 付款。付款状态以支付确认结果为准。', 'Add items to your bag and continue to Stripe Checkout to pay in NZD.') : reply('店铺暂未开放在线付款。', 'Online checkout is not open yet.');
  if (/你好|您好|hello|\bhi\b|hey/i.test(text)) return reply('你好！可以问我商品价格、库存、优惠、自取和邮寄。', 'Hi! Ask me about prices, stock, offers, pickup or shipping.');
  if (!product || !product.enabled || product.price_cents === null) return reply('请先选择一件已上架商品。尚未上架的商品价格和库存需要店主确认。', 'Please select a listed product. Prices and stock for unlisted items need owner confirmation.', true);
  const available = product.stock - product.reserved;
  if (available < quantity) return reply(`“${product.name}”目前可购买数量为 ${available} 件，无法确认更多库存。`, `${product.name} currently has ${available} available.`, available === 0);
  const standard = unitPrice(product, quantity);
  const bargaining = explicitOffer !== null || /便宜|优惠|还价|砍价|最低|折扣|discount|cheaper|lowest|deal|offer|negotia/i.test(text);
  if (bargaining) {
    if (!product.negotiable) return reply(`“${product.name}”按当前规则单价为 ${money(standard)}${quantity >= product.bulk_qty && product.bulk_percent ? '（已含数量优惠）' : ''}，不接受额外议价。`, `${product.name} is ${money(standard)} each under the current rules. Additional bargaining is not available.`);
    const offered = explicitOffer ?? (() => { const m = text.match(/(?:NZ\$|\$|\bNZD\s*)\s*(\d+(?:\.\d{1,2})?)/i); return m ? Math.round(Number(m[1]) * 100) : null; })();
    if (offered === null) return reply('可以提交你期望的单价和数量，我会按店铺规则确认。', 'Enter your proposed unit price and quantity and I will check the shop rules.');
    integer(offered, 1, 100000000, '期望单价');
    const accepted = Math.min(standard, Math.max(offered, product.minimum_cents));
    return reply(`${offered < product.minimum_cents ? '这个报价暂时无法接受。' : ''}${quantity} 件可以按每件 ${money(accepted)} 结算；此报价 15 分钟内有效，库存以结账时为准。`, `${quantity} item(s) can be offered at ${money(accepted)} each for 15 minutes, subject to stock at checkout.`, false, accepted);
  }
  if (/价格|多少钱|价|库存|还有|有货|price|cost|stock|available/i.test(text)) return reply(`“${product.name}”单价 ${money(standard)}，当前可购买 ${available} 件。`, `${product.name} is ${money(standard)} each. ${available} are currently available.`);
  return reply(product.description ? `商品介绍：${product.description}。如果需要更多细节，我可以把问题留给店主。` : '这部分信息还需要店主确认。请留下具体问题和联系邮箱。', product.description || 'The owner needs to confirm that detail. Please leave your question and contact email.', true);
}
export async function hash(value) { const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return [...new Uint8Array(data)].map(x => x.toString(16).padStart(2, '0')).join(''); }
export async function verifyWebhook(raw, header, secret, now = Date.now()) {
  if (!secret || !header) return false;
  const fields = header.split(',').map(x => x.split('=')); const timestamp = fields.find(x => x[0] === 't')?.[1];
  if (!/^\d+$/.test(timestamp || '') || Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  const signatures = fields.filter(x => x[0] === 'v1' && /^[a-f0-9]{64}$/i.test(x[1] || '')).map(x => Uint8Array.from(x[1].match(/../g), b => parseInt(b, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  for (const signature of signatures) if (await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(`${timestamp}.${raw}`))) return true;
  return false;
}
