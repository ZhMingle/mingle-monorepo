'use client';
import {useI18n} from './shop-language';
import {Package,ShoppingBag,MessageCircle,SlidersHorizontal,ChevronRight,Camera} from 'lucide-react';
import {ProductCover} from './product-gallery';
const money=cents=>'NZ$'+(cents/100).toFixed(2);
export function OwnerProductCards({products,selected,setSelected,edit}) {
  const {t}=useI18n();
  return <div className="owner-product-cards">{products.map(p=><article className="owner-product-card" key={p.id}><div className="owner-card-picture"><ProductCover product={p} fallback={<Package size={30}/>}/><label className="card-selection"><input type="checkbox" aria-label={t('选择手机商品 '+p.name)} checked={selected.includes(p.id)} onChange={e=>setSelected(e.target.checked?[...selected,p.id]:selected.filter(id=>id!==p.id))}/></label></div><div className="owner-card-content"><div><span className={'pill '+(p.enabled?'green':'')}>{t(p.enabled?'已上架':'草稿')}</span><small>{t(p.media?.length||0)} {t(" 个媒体")}</small></div><h3>{t(p.name)}</h3><strong>{t(p.price_cents===null?'待设置价格':money(p.price_cents))}</strong><p>{t("可用 ")}{t(p.stock-p.reserved)} {t(" / 总库存 ")}{t(p.stock)}</p><button type="button" onClick={()=>edit({...p,enabled:!!p.enabled,negotiable:!!p.negotiable})}>{t("编辑商品 ")}<ChevronRight size={17}/></button></div></article>)}</div>;
}
export function OwnerOrderCards({orders,statuses,open}) {
  const {t,lang}=useI18n();
  return <div className="owner-order-cards">{orders.map(o=><button className="owner-order-card" key={o.id} onClick={()=>open(o)}><div><strong>{t("订单 ")}{t(o.id.slice(0,8))}</strong><span className={'pill '+(['paid','fulfilled'].includes(o.state)?'green':'')}>{t(statuses[o.state]||o.state)}</span></div><p>{t(o.fulfilment==='pickup'?'自取':'邮寄')} · {t(new Date(o.created_at).toLocaleString(lang==='en'?'en-NZ':'zh-CN',{timeZone:'Pacific/Auckland'}))}</p><div><strong>{t(money(o.total_cents))}</strong><span>{t("查看订单 ")}<ChevronRight size={16}/></span></div></button>)}</div>;
}
export function OwnerBottomNav({tab,setTab,pending}) {
  const {t}=useI18n();
  return <nav className="mobile-owner-nav" aria-label={t("手机店主管理导航")}>{[['products','商品',Package],['orders','订单',ShoppingBag],['inbox','咨询',MessageCircle],['settings','设置',SlidersHorizontal]].map(([key,label,Icon])=><button key={key} className={tab===key?'active':''} aria-current={tab===key?'page':undefined} onClick={()=>setTab(key)}><span><Icon size={22}/>{key==='inbox'&&pending>0&&<i>{t(pending)}</i>}</span>{t(label)}</button>)}</nav>;
}
