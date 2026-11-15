'use client';
import {Package,ShoppingBag,MessageCircle,SlidersHorizontal,ChevronRight,Camera} from 'lucide-react';
import {ProductCover} from './product-gallery';
const money=cents=>'NZ$'+(cents/100).toFixed(2);
export function OwnerProductCards({products,selected,setSelected,edit}) {
  return <div className="owner-product-cards">{products.map(p=><article className="owner-product-card" key={p.id}><div className="owner-card-picture"><ProductCover product={p} fallback={<Package size={30}/>}/><label className="card-selection"><input type="checkbox" aria-label={'选择手机商品 '+p.name} checked={selected.includes(p.id)} onChange={e=>setSelected(e.target.checked?[...selected,p.id]:selected.filter(id=>id!==p.id))}/></label></div><div className="owner-card-content"><div><span className={'pill '+(p.enabled?'green':'')}>{p.enabled?'已上架':'草稿'}</span><small>{p.media?.length||0} 个媒体</small></div><h3>{p.name}</h3><strong>{p.price_cents===null?'待设置价格':money(p.price_cents)}</strong><p>可用 {p.stock-p.reserved} / 总库存 {p.stock}</p><button type="button" onClick={()=>edit({...p,enabled:!!p.enabled,negotiable:!!p.negotiable})}>编辑商品 <ChevronRight size={17}/></button></div></article>)}</div>;
}
export function OwnerOrderCards({orders,statuses,open}) {
  return <div className="owner-order-cards">{orders.map(o=><button className="owner-order-card" key={o.id} onClick={()=>open(o)}><div><strong>订单 {o.id.slice(0,8)}</strong><span className={'pill '+(['paid','fulfilled'].includes(o.state)?'green':'')}>{statuses[o.state]||o.state}</span></div><p>{o.fulfilment==='pickup'?'自取':'邮寄'} · {new Date(o.created_at).toLocaleString('zh-CN',{timeZone:'Pacific/Auckland'})}</p><div><strong>{money(o.total_cents)}</strong><span>查看订单 <ChevronRight size={16}/></span></div></button>)}</div>;
}
export function OwnerBottomNav({tab,setTab,pending}) {
  return <nav className="mobile-owner-nav" aria-label="手机店主管理导航">{[['products','商品',Package],['orders','订单',ShoppingBag],['inbox','咨询',MessageCircle],['settings','设置',SlidersHorizontal]].map(([key,label,Icon])=><button key={key} className={tab===key?'active':''} aria-current={tab===key?'page':undefined} onClick={()=>setTab(key)}><span><Icon size={22}/>{key==='inbox'&&pending>0&&<i>{pending}</i>}</span>{label}</button>)}</nav>;
}
