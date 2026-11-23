"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  BookOpen,
  LibraryBig,
  Star,
  Clock3,
  Headphones,
  Keyboard,
  House,
  Camera,
  Box,
  Plus,
  Search,
  X,
  Upload,
  ScanText,
  ShieldCheck,
  FileImage,
  Bluetooth,
  RotateCcw,
  Radio,
  SlidersHorizontal,
  Download,
  Check,
  Pencil,
  Trash2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  Sparkles,
  CircleHelp,
  LoaderCircle,
  LogIn,
  Menu,
} from "lucide-react";
import {
  categories,
  type Category,
  type Library,
  type ManualPage,
  type Procedure,
  type Product,
} from "../lib/manual-types";
import { searchLibrary, MAX_IMAGE_BYTES } from "../lib/manual-core";

const EMPTY: Library = { products: [], pages: [], aiEnabled: false };
const icons = {
  音频设备: Headphones,
  键盘与外设: Keyboard,
  智能家居: House,
  影像设备: Camera,
  其他设备: Box,
};
const kinds = {
  bluetooth: { name: "蓝牙连接", icon: Bluetooth },
  reset: { name: "恢复出厂", icon: RotateCcw },
  stereo: { name: "音响串联", icon: Radio },
  mode: { name: "切换模式", icon: SlidersHorizontal },
  other: { name: "其他操作", icon: BookOpen },
};
const date = (value: string) =>
  new Date(value).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
const original = (page: ManualPage) =>
  page.id.startsWith("demo-")
    ? demoImage(page)
    : `/api/pages/${page.id}/original`;
async function request<T = { ok: boolean }>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers:
      options.body instanceof FormData
        ? options.headers
        : { "Content-Type": "application/json", ...options.headers },
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "操作未完成，请重试");
  return body as T;
}

function Modal({
  title,
  children,
  close,
  wide = false,
  locked = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
  locked?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el?.close();
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        if (!locked) close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !locked) close();
      }}
      aria-label={title}
    >
      <div className="modal-content">
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="关闭窗口"
            onClick={close}
            disabled={locked}
          >
            <X size={21} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export default function ManualApp({ signedIn }: { signedIn: boolean }) {
  const [library, setLibrary] = useState<Library>(EMPTY),
    [loading, setLoading] = useState(signedIn),
    [error, setError] = useState("");
  const [demo, setDemo] = useState(false),
    [view, setView] = useState("all"),
    [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null),
    [tab, setTab] = useState("guides"),
    [photoId, setPhotoId] = useState<string | null>(null);
  const [form, setForm] = useState<Product | "new" | null>(null),
    [help, setHelp] = useState(false),
    [mobileMenu, setMobileMenu] = useState(false);
  const [busy, setBusy] = useState(""),
    [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  async function refresh() {
    const data = await request<Library>("/api/library");
    setLibrary(data);
    return data;
  }
  useEffect(() => {
    if (signedIn)
      refresh()
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
  }, [signedIn]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        ) &&
        !document.querySelector("dialog[open]")
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  const data = demo ? demoLibrary : library;
  const active = data.products.find((p) => p.id === selected),
    activePages = data.pages.filter((p) => p.productId === selected);
  const pending = data.pages.filter((p) => !p.reviewed).length;
  const filtered = data.products.filter(
    (p) =>
      view === "all" ||
      (view === "favorites"
        ? p.favorite
        : view === "pending"
          ? data.pages.some((page) => page.productId === p.id && !page.reviewed)
          : p.category === view),
  );
  const sorted = [...filtered].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  const results = searchLibrary(query, filtered, data.pages);
  const page = data.pages.find((p) => p.id === photoId);
  const title =
    view === "all"
      ? "我的设备"
      : view === "favorites"
        ? "常用收藏"
        : view === "pending"
          ? "待核对说明书"
          : view;
  function navigate(next: string) {
    setView(next);
    setSelected(null);
    setQuery("");
    setMobileMenu(false);
  }
  function ensureWrite() {
    if (demo) {
      setNotice("当前为示例预览，退出示例后即可添加你的设备");
      return false;
    }
    return true;
  }
  async function favorite(p: Product) {
    if (!ensureWrite()) return;
    try {
      await request(`/api/products/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ favorite: !p.favorite }),
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function analyze(ids: string[], fromText = false) {
    if (!ensureWrite()) return;
    let failures = 0;
    const errors: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      setBusy(`正在整理第 ${i + 1} / ${ids.length} 页…`);
      try {
        await request(
          `/api/pages/${ids[i]}/analyze${fromText ? "?source=text" : ""}`,
          { method: "POST" },
        );
        await refresh();
      } catch (e) {
        failures++;
        errors.push((e as Error).message);
      }
    }
    setBusy("");
    if (failures) setError(`${failures} 页未完成整理。${errors[0]}`);
    else setNotice("整理完成，打开原图核对后可标记确认");
  }
  async function upload(p: Product, files: File[], auto: boolean) {
    const saved: string[] = [];
    const failures: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setBusy(`正在保存原图 ${i + 1} / ${files.length}…`);
      try {
        const body = new FormData();
        body.append("file", files[i]);
        const photo = await request<ManualPage>(`/api/products/${p.id}/pages`, {
          method: "POST",
          body,
        });
        saved.push(photo.id);
      } catch (e) {
        failures.push(`${files[i].name}：${(e as Error).message}`);
      }
    }
    setBusy("");
    await refresh();
    if (failures.length)
      setError(
        `有 ${failures.length} 张照片上传失败。${failures[0]}。已成功上传的原图仍然保留。`,
      );
    if (auto && saved.length) await analyze(saved);
    else if (saved.length) setNotice(`已保存 ${saved.length} 张原图`);
  }
  async function removeProduct(p: Product) {
    if (
      !ensureWrite() ||
      !confirm(`删除「${p.name}」及全部原图和整理结果？此操作无法撤销。`)
    )
      return;
    try {
      await request(`/api/products/${p.id}`, { method: "DELETE" });
      setSelected(null);
      await refresh();
      setNotice("设备已删除");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "is-open" : ""}`}>
        <a className="brand" href="/" aria-label="知物首页">
          <span className="brand-mark">
            <BookOpen size={23} />
          </span>
          <span>
            知物<small>说明书管家</small>
          </span>
        </a>
        <button
          className="icon-button mobile-close"
          onClick={() => setMobileMenu(false)}
          aria-label="关闭导航"
        >
          <X />
        </button>
        <div className="nav-label">我的资料库</div>
        <nav aria-label="资料库导航">
          {[
            {
              id: "all",
              label: "全部设备",
              icon: LibraryBig,
              count: data.products.length,
            },
            {
              id: "favorites",
              label: "常用收藏",
              icon: Star,
              count: data.products.filter((p) => p.favorite).length,
            },
            { id: "pending", label: "待核对", icon: Clock3, count: pending },
          ].map((n) => (
            <button
              key={n.id}
              className={`nav-item ${view === n.id ? "active" : ""}`}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              <span className="nav-count">{n.count}</span>
            </button>
          ))}
        </nav>
        <div className="nav-label category-label">设备分类</div>
        <nav aria-label="设备分类">
          {categories.map((category) => {
            const Icon = icons[category];
            return (
              <button
                key={category}
                className={`nav-item ${view === category ? "active" : ""}`}
                onClick={() => navigate(category)}
              >
                <Icon size={18} />
                <span>{category}</span>
                <span className="nav-count">
                  {data.products.filter((p) => p.category === category).length}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="source-note">
            <ShieldCheck size={22} />
            <strong>答案有出处，用着更安心</strong>
            <p>保留每一页原图，随时核对操作细节。</p>
          </div>
          <button className="help-button" onClick={() => setHelp(true)}>
            <CircleHelp size={18} /> 使用指南
          </button>
          <div className="account">
            <span className="avatar">物</span>
            <span>
              我的个人资料库<small>私有空间 · 云端保存</small>
            </span>
            <ShieldCheck size={17} />
          </div>
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="nav-scrim"
          aria-label="关闭导航"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-location">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileMenu(true)}
              aria-label="打开导航"
            >
              <Menu size={22} />
            </button>
            <BookOpen size={17} />
            <span>个人资料库</span>
            <span className="slash">/</span>
            <strong>{active ? active.name : title}</strong>
          </div>
          <button
            className="topbar-help"
            aria-label="使用指南"
            onClick={() => setHelp(true)}
          >
            <CircleHelp size={17} />
            <span>使用指南</span>
          </button>
        </header>
        <main>
          {demo && (
            <div className="demo-banner">
              <span>
                <Sparkles size={16} /> 示例预览 · 以下设备和说明书均为虚构演示
              </span>
              <button
                onClick={() => {
                  setDemo(false);
                  setSelected(null);
                  setPhotoId(null);
                  setQuery("");
                }}
              >
                退出示例
              </button>
            </div>
          )}
          {error && (
            <div role="alert" className="error-banner">
              <span>{error}</span>
              <button
                className="icon-button"
                aria-label="关闭错误提示"
                onClick={() => setError("")}
              >
                <X size={18} />
              </button>
            </div>
          )}
          {busy && (
            <div className="progress-banner" role="status">
              <LoaderCircle className="spin" size={17} />
              {busy}
              <span>原图已保存，整理结果会自动更新</span>
            </div>
          )}
          {!active ? (
            <>
              <section className="hero">
                <div>
                  <div className="eyebrow">
                    <span /> A LITTLE ORDER, EVERYDAY
                  </div>
                  <h1>
                    设备的每一种用法，
                    <br />
                    都在这里。
                  </h1>
                  <p>
                    说明书好好收，使用时不用愁。
                    <br className="mobile-break" />
                    从一张照片开始，建立你的设备知识库。
                  </p>
                  <div className="hero-benefits">
                    <span>
                      <FileImage size={16} /> 原图完整保留
                    </span>
                    <span>
                      <ScanText size={16} /> AI 整理要点
                    </span>
                    <span>
                      <ShieldCheck size={16} /> 每一步有来源
                    </span>
                  </div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="paper back-paper" />
                  <div className="paper front-paper">
                    <span className="paper-logo">
                      <BookOpen size={21} />
                    </span>
                    <span className="paper-title">使用说明书</span>
                    <span className="paper-rule" />
                    <span className="paper-rule short" />
                    <div className="paper-device">
                      <Headphones size={64} strokeWidth={1.2} />
                    </div>
                    <span className="paper-rule" />
                    <span className="paper-rule short" />
                  </div>
                  <span className="art-badge">
                    <Check size={17} /> 已妥善收好
                  </span>
                  <span className="art-spark">✧</span>
                </div>
              </section>
              <section className="search-section" aria-label="搜索说明书">
                <div className="search-box">
                  <Search size={22} />
                  <input
                    ref={searchRef}
                    aria-label="搜索产品、型号或操作"
                    placeholder="找一件设备，或搜搜「怎么连蓝牙」…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query ? (
                    <button
                      className="icon-button"
                      aria-label="清空搜索"
                      onClick={() => setQuery("")}
                    >
                      <X size={18} />
                    </button>
                  ) : (
                    <kbd>/</kbd>
                  )}
                </div>
                <div className="quick-search">
                  <span>快速查找</span>
                  {Object.entries(kinds)
                    .filter(([key]) => key !== "other")
                    .map(([key, value]) => (
                      <button key={key} onClick={() => setQuery(value.name)}>
                        <value.icon size={14} />
                        {value.name}
                      </button>
                    ))}
                </div>
              </section>
              <section className="library-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      {query.trim() ? "搜索结果" : title}
                      <span>
                        {query.trim() ? results.length : sorted.length}
                      </span>
                    </h2>
                    <p>
                      {query.trim()
                        ? `在${title}中查找「${query}」`
                        : view === "pending"
                          ? "AI 整理完成后，记得对照原图确认一下。"
                          : "收好说明书，把精力留给使用。"}
                    </p>
                  </div>
                  {signedIn && !demo ? (
                    <button
                      className="primary-button"
                      onClick={() => setForm("new")}
                      disabled={Boolean(busy)}
                    >
                      <Plus size={18} />
                      添加设备
                    </button>
                  ) : !demo ? (
                    <a
                      className="primary-button"
                      href="/signin-with-chatgpt?return_to=%2F"
                      target="_top"
                    >
                      <LogIn size={18} />
                      登录并添加设备
                    </a>
                  ) : null}
                </div>
                {loading && !demo ? (
                  <div className="empty-state">
                    <LoaderCircle className="spin" />
                    <h3>正在打开你的资料库</h3>
                  </div>
                ) : query.trim() ? (
                  results.length ? (
                    <div className="search-results">
                      {results.map((result) => (
                        <div className="result-card" key={result.product.id}>
                          <button
                            className="result-product"
                            onClick={() => {
                              setSelected(result.product.id);
                              setTab("guides");
                            }}
                          >
                            <DeviceArt
                              category={result.product.category}
                              small
                            />
                            <span>
                              <strong>{result.product.name}</strong>
                              <small>
                                {result.product.brand} {result.product.model}
                              </small>
                            </span>
                            <span className="badge">
                              {result.guides.length
                                ? `${result.guides.length} 项相关操作`
                                : "原文中有匹配"}
                            </span>
                          </button>
                          {result.guides.map(({ page, procedure }, i) => (
                            <Guide
                              key={`${page.id}-${i}`}
                              procedure={procedure}
                              page={page}
                              open={() => setPhotoId(page.id)}
                            />
                          ))}
                          {!result.guides.length && (
                            <p className="result-hint">
                              匹配到设备资料或识别原文，打开设备查看详细说明。
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      icon={<Search />}
                      title="说明书里暂时没找到"
                      text="试试产品名称、型号，或更短的关键词。未上传、未识别的照片暂时不会出现在原文搜索中。"
                    />
                  )
                ) : sorted.length ? (
                  <div className="device-grid">
                    {sorted.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        pages={data.pages.filter(
                          (page) => page.productId === p.id,
                        )}
                        open={() => {
                          setSelected(p.id);
                          setTab("guides");
                        }}
                        favorite={() => favorite(p)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state welcome-empty">
                    <span className="empty-icon">
                      <LibraryBig size={32} />
                    </span>
                    <h3>
                      {view === "all"
                        ? "先给一件设备安个家"
                        : view === "favorites"
                          ? "常用操作，一眼就找到"
                          : view === "pending"
                            ? "暂时没有待核对的说明书"
                            : "这个分类还没有设备"}
                    </h3>
                    <p>
                      {view === "all"
                        ? "添加产品，拍下说明书。下次忘记怎么设置，来这里找就好。"
                        : view === "favorites"
                          ? "点击设备卡片上的星标，把常用设备收在这里。"
                          : "你的说明书和操作指南会保存在这里。"}
                    </p>
                    {view === "all" && (
                      <div className="empty-actions">
                        {signedIn ? (
                          <button
                            className="primary-button"
                            onClick={() => setForm("new")}
                          >
                            <Plus size={18} />
                            添加第一件设备
                          </button>
                        ) : (
                          <a
                            className="primary-button"
                            href="/signin-with-chatgpt?return_to=%2F"
                            target="_top"
                          >
                            <LogIn size={18} />
                            登录并开始整理
                          </a>
                        )}
                        <button
                          className="secondary-button"
                          onClick={() => {
                            setDemo(true);
                            setError("");
                          }}
                        >
                          体验示例
                        </button>
                      </div>
                    )}
                    <div className="empty-steps">
                      <span>
                        <FileImage size={18} /> 拍照上传
                      </span>
                      <i />
                      <span>
                        <Sparkles size={18} /> 整理要点
                      </span>
                      <i />
                      <span>
                        <Search size={18} /> 随时查阅
                      </span>
                    </div>
                  </div>
                )}
              </section>
              <footer className="page-footer">
                <BookOpen size={15} />
                <span>好好收纳每一份说明，让设备用得更久一点。</span>
                <span>知物 · 让使用更简单</span>
              </footer>
            </>
          ) : (
            <>
              <button className="back-button" onClick={() => setSelected(null)}>
                <ChevronLeft size={18} />
                返回{title}
              </button>
              <section className="detail-heading">
                <DeviceArt category={active.category} />
                <div>
                  <span className="category-chip">{active.category}</span>
                  <h1>{active.name}</h1>
                  <p>
                    {[active.brand, active.model].filter(Boolean).join(" / ") ||
                      "型号待补充"}
                  </p>
                </div>
                <div className="detail-actions">
                  <button
                    className={`icon-button ${active.favorite ? "starred" : ""}`}
                    onClick={() => favorite(active)}
                    aria-label={active.favorite ? "取消收藏" : "收藏设备"}
                  >
                    <Star
                      size={20}
                      fill={active.favorite ? "currentColor" : "none"}
                    />
                  </button>
                  {!demo && (
                    <button
                      className="secondary-button"
                      onClick={() => setForm(active)}
                      disabled={Boolean(busy)}
                    >
                      <Pencil size={16} />
                      编辑设备
                    </button>
                  )}
                </div>
              </section>
              <div className="detail-tabs" role="tablist" aria-label="设备详情">
                {[
                  { id: "guides", text: "功能与设置" },
                  { id: "photos", text: `原始说明书 ${activePages.length}` },
                  { id: "info", text: "设备资料" },
                ].map((t) => (
                  <button
                    role="tab"
                    aria-selected={tab === t.id}
                    key={t.id}
                    className={tab === t.id ? "active" : ""}
                    onClick={() => setTab(t.id)}
                  >
                    {t.text}
                  </button>
                ))}
              </div>
              {tab === "guides" && (
                <div className="detail-content">
                  <div className="source-callout">
                    <ShieldCheck size={20} />
                    <span>
                      以下内容来自你上传的说明书。AI
                      可能识别有误，操作前请点击来源核对原图。
                    </span>
                  </div>
                  {activePages.some((p) => p.extraction) ? (
                    <>
                      {activePages
                        .filter((p) => p.extraction)
                        .map((p) => (
                          <section className="page-summary" key={p.id}>
                            <div className="summary-title">
                              <span>
                                <FileImage size={17} />
                                来源：第 {activePages.indexOf(p) + 1} 张照片
                              </span>
                              <button
                                className="text-button"
                                onClick={() => setPhotoId(p.id)}
                              >
                                查看原图
                              </button>
                            </div>
                            {p.extraction?.unreadable && (
                              <p className="warning">
                                这页有文字看不清，建议补拍清晰照片。
                              </p>
                            )}
                            {p.extraction?.summary && (
                              <p className="summary-text">
                                {p.extraction.summary}
                              </p>
                            )}
                            {Boolean(p.extraction?.features.length) && (
                              <div className="feature-list">
                                {p.extraction?.features.map((f, i) => (
                                  <button
                                    key={i}
                                    title={f.evidence}
                                    onClick={() => setPhotoId(p.id)}
                                  >
                                    <Check size={14} />
                                    {f.title}
                                  </button>
                                ))}
                              </div>
                            )}
                            {p.extraction?.procedures.map((procedure, i) => (
                              <Guide
                                key={i}
                                procedure={procedure}
                                page={p}
                                open={() => setPhotoId(p.id)}
                              />
                            ))}
                            {!p.extraction?.procedures.length && (
                              <p className="muted">
                                本页暂无完整的操作步骤。可查看原文，或补充其他说明书页。
                              </p>
                            )}
                          </section>
                        ))}
                    </>
                  ) : (
                    <Empty
                      icon={<ScanText />}
                      title="把说明书变成随手可查的指南"
                      text={
                        activePages.length
                          ? "原图已经保存。点击自动整理，提取功能、设置方法和注意事项。"
                          : "先上传说明书照片，再整理这件设备的功能和操作。"
                      }
                      action={
                        activePages.length && !demo ? (
                          <button
                            className="primary-button"
                            disabled={Boolean(busy) || !data.aiEnabled}
                            onClick={() =>
                              analyze(activePages.map((p) => p.id))
                            }
                          >
                            <Sparkles size={17} />
                            自动整理全部照片
                          </button>
                        ) : (
                          <button
                            className="secondary-button"
                            onClick={() => setTab("photos")}
                          >
                            <Upload size={17} />
                            上传说明书
                          </button>
                        )
                      }
                    />
                  )}
                  {activePages.some((p) => !p.extraction) &&
                    activePages.some((p) => p.extraction) && (
                      <div className="pending-callout">
                        <p>
                          还有 {activePages.filter((p) => !p.extraction).length}{" "}
                          页尚未整理
                        </p>
                        <button
                          className="secondary-button"
                          disabled={Boolean(busy) || !data.aiEnabled}
                          onClick={() =>
                            analyze(
                              activePages
                                .filter((p) => !p.extraction)
                                .map((p) => p.id),
                            )
                          }
                        >
                          <Sparkles size={16} />
                          整理剩余照片
                        </button>
                      </div>
                    )}
                </div>
              )}
              {tab === "photos" && (
                <div className="detail-content">
                  <div className="section-heading">
                    <div>
                      <h2>原图，始终在这里</h2>
                      <p>上传文件按原始字节保存，可查看、放大和下载。</p>
                    </div>
                    {!demo && (
                      <UploadButton
                        disabled={Boolean(busy)}
                        onFiles={(files) =>
                          upload(active, files, data.aiEnabled).catch((e) => {
                            setBusy("");
                            setError(e.message);
                          })
                        }
                      />
                    )}
                  </div>
                  {!activePages.length ? (
                    <Empty
                      icon={<FileImage />}
                      title="还没有说明书照片"
                      text="支持 JPG、PNG、WebP，每张最多 12 MB。请拍全页面、避开反光，小字也要清晰。"
                    />
                  ) : (
                    <div className="photo-grid">
                      {activePages.map((p, i) => (
                        <button
                          className="photo-card"
                          key={p.id}
                          onClick={() => setPhotoId(p.id)}
                        >
                          <div className="photo-preview">
                            <img
                              src={original(p)}
                              alt={`第 ${i + 1} 张说明书：${p.filename}`}
                              loading="lazy"
                            />
                            <span className="photo-number">第 {i + 1} 张</span>
                          </div>
                          <div>
                            <strong>{p.filename}</strong>
                            <span
                              className={`status ${p.reviewed ? "reviewed" : ""}`}
                            >
                              {p.reviewed ? (
                                <Check size={14} />
                              ) : (
                                <Clock3 size={14} />
                              )}
                              {p.reviewed
                                ? "已核对"
                                : p.extraction
                                  ? "已整理 · 待核对"
                                  : "原图已保存 · 待整理"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {tab === "info" && (
                <div className="detail-content info-panel">
                  <h2>设备资料</h2>
                  <dl>
                    {[
                      ["产品名称", active.name],
                      ["品牌", active.brand || "未填写"],
                      ["型号", active.model || "未填写"],
                      ["分类", active.category],
                      ["添加日期", date(active.createdAt)],
                      ["说明书", `${activePages.length} 张原图`],
                    ].map(([key, val]) => (
                      <div key={key}>
                        <dt>{key}</dt>
                        <dd>{val}</dd>
                      </div>
                    ))}
                  </dl>
                  <h3>我的备注</h3>
                  <p className="notes">
                    {active.notes ||
                      "还没有备注。可记录购买时间、放置位置或使用心得。"}
                  </p>
                  {!demo && (
                    <button
                      className="danger-button"
                      onClick={() => removeProduct(active)}
                      disabled={Boolean(busy)}
                    >
                      <Trash2 size={16} />
                      删除设备及说明书
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
      {form && (
        <ProductForm
          product={form === "new" ? undefined : form}
          aiEnabled={library.aiEnabled}
          close={() => setForm(null)}
          save={async (values, files, auto) => {
            const p =
              form === "new"
                ? await request<Product>("/api/products", {
                    method: "POST",
                    body: JSON.stringify(values),
                  })
                : (await request(`/api/products/${form.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(values),
                  }),
                  { ...form, ...values });
            await refresh();
            setForm(null);
            setSelected(p.id);
            setTab(files.length ? "photos" : "guides");
            if (files.length) await upload(p, files, auto);
            else setNotice("设备资料已保存");
          }}
        />
      )}
      {page && (
        <PhotoViewer
          key={page.id}
          page={page}
          demo={demo}
          busy={Boolean(busy)}
          aiEnabled={data.aiEnabled}
          close={() => setPhotoId(null)}
          analyze={(fromText) => analyze([page.id], fromText)}
          save={async (body) => {
            await request(`/api/pages/${page.id}`, {
              method: "PATCH",
              body: JSON.stringify(body),
            });
            await refresh();
            setNotice("已保存");
          }}
          remove={async () => {
            if (!confirm("删除这张原图及它的整理结果？此操作无法撤销。"))
              return;
            try {
              await request(`/api/pages/${page.id}`, { method: "DELETE" });
              setPhotoId(null);
              await refresh();
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        />
      )}
      {help && (
        <Modal title="让说明书，真正用起来" close={() => setHelp(false)}>
          <div className="help-content">
            {[
              {
                icon: Box,
                title: "添加一件设备",
                text: "填写你熟悉的名字、品牌和准确型号，避免相似设备的操作混在一起。",
              },
              {
                icon: FileImage,
                title: "拍照上传说明书",
                text: "每页单独拍清楚，按阅读顺序选择照片。原图完整保存，随时可下载。支持 JPG、PNG、WebP，每张 12 MB 以内。",
              },
              {
                icon: Sparkles,
                title: "自动整理，再核对",
                text: "照片会发送给 OpenAI，提取本页功能与操作。模型只按说明书整理，未看清或缺少步骤时会提示。打开来源核对，尤其是恢复出厂、长按时间和按键组合。",
              },
              {
                icon: Search,
                title: "想设置什么，搜一下",
                text: "支持搜索名称、型号和识别原文，也能匹配蓝牙连接、恢复出厂、音响串联和切换模式。未找到内容时，请补充说明书页。",
              },
            ].map((item) => (
              <div className="help-step" key={item.title}>
                <span>
                  <item.icon size={22} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
            <div className="source-callout">
              <ShieldCheck size={20} />
              <span>
                资料按登录账号隔离保存。AI
                整理辅助查阅，原始说明书是最终核对依据。
              </span>
            </div>
          </div>
        </Modal>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
          <button aria-label="关闭通知" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function DeviceArt({
  category,
  small = false,
}: {
  category: Category;
  small?: boolean;
}) {
  const Icon = icons[category] || Box;
  return (
    <span
      className={`device-art art-${categories.indexOf(category)} ${small ? "small" : ""}`}
    >
      <Icon size={small ? 24 : 44} strokeWidth={1.35} />
      <span />
    </span>
  );
}
function ProductCard({
  product: p,
  pages,
  open,
  favorite,
}: {
  product: Product;
  pages: ManualPage[];
  open: () => void;
  favorite: () => void;
}) {
  const procedures = pages.flatMap((page) => page.extraction?.procedures ?? []),
    summary = pages.find((page) => page.extraction?.summary)?.extraction
      ?.summary;
  return (
    <article className="device-card">
      <div className="card-top">
        <DeviceArt category={p.category} />
        <button
          className={`icon-button ${p.favorite ? "starred" : ""}`}
          aria-label={p.favorite ? `取消收藏${p.name}` : `收藏${p.name}`}
          onClick={favorite}
        >
          <Star size={19} fill={p.favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <button className="card-content" onClick={open}>
        <span className="card-category">{p.category}</span>
        <h3>{p.name}</h3>
        <p className="model">
          {[p.brand, p.model].filter(Boolean).join(" · ") ||
            "品牌 / 型号待补充"}
        </p>
        <p className="card-description">
          {summary ||
            p.notes ||
            (pages.length
              ? "原图已收好，整理后即可查看功能与设置。"
              : "上传说明书，整理这件设备的使用方法。")}
        </p>
        <div className="card-guide-tags">
          {[...new Set(procedures.map((p) => p.kind))]
            .slice(0, 3)
            .map((kind) => (
              <span key={kind}>{kinds[kind].name}</span>
            ))}
          {!procedures.length && (
            <span className="plain-tag">
              {pages.length ? "待整理操作" : "等待说明书"}
            </span>
          )}
        </div>
        <div className="card-footer">
          <span>
            <FileImage size={14} /> {pages.length} 页原图
            <span className="footer-dot">·</span>
            {procedures.length} 项操作
          </span>
          <span>{date(p.updatedAt)}</span>
        </div>
      </button>
    </article>
  );
}
function Guide({
  procedure: p,
  page,
  open,
}: {
  procedure: Procedure;
  page: ManualPage;
  open: () => void;
}) {
  const Icon = kinds[p.kind].icon;
  return (
    <article className="guide">
      <div className="guide-heading">
        <span className={`guide-icon kind-${p.kind}`}>
          <Icon size={19} />
        </span>
        <h3>{p.title}</h3>
        <span className={`badge ${page.reviewed ? "green" : ""}`}>
          {page.reviewed ? "已核对" : "待核对"}
        </span>
      </div>
      <ol>
        {p.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      {p.warning && <p className="warning">{p.warning}</p>}
      <details>
        <summary>查看引用原文</summary>
        <blockquote>{p.evidence}</blockquote>
      </details>
      <button className="source-link" onClick={open}>
        <FileImage size={15} /> 来源：{page.filename}
        <span>查看原图</span>
      </button>
    </article>
  );
}
function Empty({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function validFiles(files: File[]) {
  if (files.length > 20) throw new Error("每次最多选择 20 张照片");
  for (const f of files) {
    if (
      !/\.(jpe?g|png|webp)$/i.test(f.name) ||
      !["image/jpeg", "image/png", "image/webp", ""].includes(f.type)
    )
      throw new Error(`${f.name}：请转换成 JPG、PNG 或 WebP 后上传`);
    if (f.size > MAX_IMAGE_BYTES || f.size === 0)
      throw new Error(`${f.name}：文件为空或超过 12 MB`);
  }
  return files;
}
function UploadButton({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  disabled: boolean;
}) {
  const [error, setError] = useState("");
  return (
    <div>
      <label
        className={`primary-button upload-label ${disabled ? "disabled" : ""}`}
      >
        <Upload size={17} />
        上传照片
        <input
          type="file"
          aria-label="上传说明书照片"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={disabled}
          onChange={(e) => {
            try {
              const files = validFiles(Array.from(e.target.files ?? []));
              setError("");
              if (files.length) onFiles(files);
            } catch (error) {
              setError((error as Error).message);
            }
            e.target.value = "";
          }}
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
function ProductForm({
  product,
  close,
  save,
  aiEnabled,
}: {
  product?: Product;
  close: () => void;
  save: (
    values: ReturnType<typeof formValues>,
    files: File[],
    auto: boolean,
  ) => Promise<void>;
  aiEnabled: boolean;
}) {
  const [files, setFiles] = useState<File[]>([]),
    [auto, setAuto] = useState(aiEnabled),
    [working, setWorking] = useState(false),
    [error, setError] = useState(""),
    [drag, setDrag] = useState(false);
  function choose(selected: File[]) {
    try {
      setFiles(validFiles([...files, ...selected]));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWorking(true);
    setError("");
    try {
      await save(formValues(new FormData(e.currentTarget)), files, auto);
    } catch (error) {
      setError((error as Error).message);
      setWorking(false);
    }
  }
  return (
    <Modal
      title={product ? "编辑设备" : "给设备建一份档案"}
      close={close}
      locked={working}
    >
      <form onSubmit={submit} className="product-form">
        <p className="form-intro">记下准确型号，说明书就不会找错家。</p>
        <label>
          产品名称 <span>*</span>
          <input
            name="name"
            required
            maxLength={100}
            placeholder="例如：书桌上的蓝牙音箱"
            defaultValue={product?.name}
            autoFocus
          />
        </label>
        <div className="form-row">
          <label>
            品牌
            <input
              name="brand"
              maxLength={80}
              placeholder="例如：Sony"
              defaultValue={product?.brand}
            />
          </label>
          <label>
            型号
            <input
              name="model"
              maxLength={100}
              placeholder="查看设备标签上的型号"
              defaultValue={product?.model}
            />
          </label>
        </div>
        <label>
          设备分类
          <select
            name="category"
            defaultValue={product?.category || "其他设备"}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          我的备注
          <textarea
            name="notes"
            maxLength={4000}
            rows={2}
            placeholder="购买时间、放置位置，或其他想记下的事…"
            defaultValue={product?.notes}
          />
        </label>
        {!product && (
          <>
            <div
              className={`dropzone ${drag ? "dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                choose(Array.from(e.dataTransfer.files));
              }}
            >
              <Upload size={27} />
              <strong>把说明书照片放到这里</strong>
              <label className="text-button">
                选择照片
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    choose(Array.from(e.target.files ?? []));
                    e.target.value = "";
                  }}
                />
              </label>
              <small>JPG / PNG / WebP · 每张 12 MB · 可稍后添加</small>
            </div>
            {files.length > 0 && (
              <ul className="file-list">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`}>
                    <FileImage size={16} />
                    <span>{f.name}</span>
                    <small>{(f.size / 1024 / 1024).toFixed(1)} MB</small>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`移除${f.name}`}
                      onClick={() => setFiles(files.filter((_, j) => i !== j))}
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={auto}
                disabled={!aiEnabled}
                onChange={(e) => setAuto(e.target.checked)}
              />
              <span>
                上传后自动整理
                <small>
                  {aiEnabled
                    ? "照片将发送给 OpenAI，提取本页功能和操作步骤"
                    : "AI 尚未配置，可先保存原图"}
                </small>
              </span>
              <Sparkles size={18} />
            </label>
          </>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="form-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={close}
            disabled={working}
          >
            取消
          </button>
          <button className="primary-button" disabled={working}>
            {working ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <Check size={17} />
            )}
            {working ? "正在保存…" : product ? "保存修改" : "创建设备档案"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function formValues(data: FormData) {
  return {
    name: String(data.get("name") || ""),
    brand: String(data.get("brand") || ""),
    model: String(data.get("model") || ""),
    category: String(data.get("category")) as Category,
    notes: String(data.get("notes") || ""),
  };
}
function PhotoViewer({
  page,
  close,
  analyze,
  save,
  remove,
  demo,
  busy,
  aiEnabled,
}: {
  page: ManualPage;
  close: () => void;
  analyze: (fromText: boolean) => Promise<void>;
  save: (body: { text?: string; reviewed?: boolean }) => Promise<void>;
  remove: () => Promise<void>;
  demo: boolean;
  busy: boolean;
  aiEnabled: boolean;
}) {
  const [zoom, setZoom] = useState(100),
    [text, setText] = useState(page.extraction?.text || ""),
    [editing, setEditing] = useState(false),
    [working, setWorking] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!editing) setText(page.extraction?.text || "");
  }, [page.extraction?.text, editing]);
  async function action(run: () => Promise<void>) {
    setWorking(true);
    setError("");
    try {
      await run();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  }
  const disabled = demo || busy || working;
  return (
    <Modal title={page.filename} close={close} wide>
      <div className="viewer">
        <div className="viewer-image">
          <div className="viewer-toolbar">
            <span>{demo ? "演示文档" : "原始照片"}</span>
            <div>
              <button
                className="icon-button"
                aria-label="缩小原图"
                disabled={zoom <= 50}
                onClick={() => setZoom(Math.max(50, zoom - 25))}
              >
                <ZoomOut size={18} />
              </button>
              <span>{zoom}%</span>
              <button
                className="icon-button"
                aria-label="放大原图"
                disabled={zoom >= 300}
                onClick={() => setZoom(Math.min(300, zoom + 25))}
              >
                <ZoomIn size={18} />
              </button>
              {!demo && (
                <a
                  className="icon-button"
                  aria-label="下载原始照片"
                  href={`/api/pages/${page.id}/original?download`}
                >
                  <Download size={18} />
                </a>
              )}
            </div>
          </div>
          <div className="image-scroll">
            <img
              src={original(page)}
              alt={page.filename}
              style={{ width: `${zoom}%`, maxWidth: "none" }}
            />
          </div>
          <div className="original-meta">
            {demo
              ? "虚构示例，仅用于演示查阅流程"
              : `${(page.size / 1024 / 1024).toFixed(2)} MB · ${page.mime.replace("image/", "").toUpperCase()} · 原文件未压缩`}
          </div>
        </div>
        <div className="viewer-text">
          <div className="section-heading">
            <h3>识别原文</h3>
            <button
              className="text-button"
              disabled={disabled}
              onClick={() => setEditing(!editing)}
            >
              <Pencil size={14} />
              {editing ? "取消修改" : "补充 / 修正"}
            </button>
          </div>
          <p className="muted">
            对照左侧原图核对。修正原文会清除旧的整理结果，之后可重新整理。
          </p>
          {editing ? (
            <>
              <textarea
                aria-label="修正识别原文"
                maxLength={24000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
              />
              <button
                className="primary-button"
                disabled={disabled}
                onClick={() =>
                  action(async () => {
                    await save({ text });
                    setEditing(false);
                  })
                }
              >
                <Check size={16} />
                保存原文
              </button>
            </>
          ) : (
            <pre className="transcript">
              {page.extraction?.text ||
                "还没有识别原文。可以自动读图，也可以手动补充说明书中的文字。"}
            </pre>
          )}
          {page.extraction?.unreadable && (
            <p className="warning">这页有文字未能看清，建议补拍。</p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="viewer-actions">
            <button
              className="primary-button"
              disabled={disabled || !aiEnabled || editing}
              onClick={() => action(() => analyze(false))}
            >
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              {page.extraction ? "重新读图整理" : "自动读图整理"}
            </button>
            {page.extraction?.text && (
              <button
                className="secondary-button"
                disabled={disabled || !aiEnabled || editing}
                onClick={() => action(() => analyze(true))}
              >
                <ScanText size={16} />
                按当前原文整理
              </button>
            )}
            <button
              className="secondary-button"
              disabled={disabled || !page.extraction || editing}
              onClick={() => action(() => save({ reviewed: !page.reviewed }))}
            >
              <ShieldCheck size={17} />
              {page.reviewed ? "撤销核对标记" : "已对照原图核对"}
            </button>
            {page.reviewed && (
              <p className="review-confirmed">
                <Check size={15} />
                本页已由你核对
              </p>
            )}
            {!demo && (
              <button
                className="danger-button"
                disabled={disabled}
                onClick={() => action(remove)}
              >
                <Trash2 size={15} />
                删除这张照片
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

const demoTime = "2026-11-20T06:00:00Z";
const sampleText =
  "虚构产品 · 演示说明书\n蓝牙连接：开机后长按蓝牙键 3 秒，指示灯闪烁。在手机蓝牙列表中选择 SAMPLE-AUDIO。\n恢复出厂：开机状态下，同时按住音量加和蓝牙键 5 秒。恢复后将清除已保存的配对记录。";
const sampleKeyboard =
  "虚构产品 · 演示说明书\n模式切换：将背部开关拨至 BT，进入蓝牙模式；拨至 USB，进入有线模式。\n蓝牙配对：在 BT 模式下长按 Fn + 1 三秒，指示灯闪烁，在电脑中选择 SAMPLE-KEY。";
const demoLibrary: Library = {
  aiEnabled: false,
  products: [
    {
      id: "demo-speaker",
      name: "旅行时的便携音箱",
      brand: "虚构示例",
      model: "SAMPLE-AUDIO",
      category: "音频设备",
      notes: "随身带的那一个",
      favorite: true,
      createdAt: demoTime,
      updatedAt: demoTime,
    },
    {
      id: "demo-keyboard",
      name: "书桌上的机械键盘",
      brand: "虚构示例",
      model: "SAMPLE-KEY",
      category: "键盘与外设",
      notes: "工作 / 个人电脑之间切换",
      favorite: false,
      createdAt: demoTime,
      updatedAt: demoTime,
    },
    {
      id: "demo-home",
      name: "床头的智能台灯",
      brand: "虚构示例",
      model: "SAMPLE-LIGHT",
      category: "智能家居",
      notes: "刚收好的说明书，还没有整理。",
      favorite: false,
      createdAt: demoTime,
      updatedAt: demoTime,
    },
  ],
  pages: [
    {
      id: "demo-page-speaker",
      productId: "demo-speaker",
      filename: "便携音箱 · 演示说明书",
      mime: "image/svg+xml",
      size: 0,
      sha256: "",
      createdAt: demoTime,
      reviewed: false,
      extraction: {
        text: sampleText,
        summary: "这页介绍蓝牙配对和恢复出厂的方法。恢复出厂会清除配对记录。",
        unreadable: false,
        features: [
          {
            title: "支持蓝牙连接",
            evidence:
              "蓝牙连接：开机后长按蓝牙键 3 秒，指示灯闪烁。在手机蓝牙列表中选择 SAMPLE-AUDIO。",
          },
        ],
        procedures: [
          {
            title: "连接手机蓝牙",
            kind: "bluetooth",
            steps: [
              "开机后长按蓝牙键 3 秒，等待指示灯闪烁。",
              "在手机蓝牙列表中选择 SAMPLE-AUDIO。",
            ],
            warning: "",
            evidence:
              "蓝牙连接：开机后长按蓝牙键 3 秒，指示灯闪烁。在手机蓝牙列表中选择 SAMPLE-AUDIO。",
          },
          {
            title: "恢复出厂设置",
            kind: "reset",
            steps: ["保持开机状态。", "同时按住音量加和蓝牙键 5 秒。"],
            warning: "恢复后将清除已保存的配对记录。",
            evidence:
              "恢复出厂：开机状态下，同时按住音量加和蓝牙键 5 秒。恢复后将清除已保存的配对记录。",
          },
        ],
      },
    },
    {
      id: "demo-page-keyboard",
      productId: "demo-keyboard",
      filename: "机械键盘 · 演示说明书",
      mime: "image/svg+xml",
      size: 0,
      sha256: "",
      createdAt: demoTime,
      reviewed: true,
      extraction: {
        text: sampleKeyboard,
        summary: "背部开关切换有线 / 蓝牙模式，Fn + 1 用于蓝牙配对。",
        unreadable: false,
        features: [
          {
            title: "有线与蓝牙双模式",
            evidence:
              "模式切换：将背部开关拨至 BT，进入蓝牙模式；拨至 USB，进入有线模式。",
          },
        ],
        procedures: [
          {
            title: "切换有线 / 蓝牙模式",
            kind: "mode",
            steps: [
              "将背部开关拨至 BT，进入蓝牙模式。",
              "将背部开关拨至 USB，进入有线模式。",
            ],
            warning: "",
            evidence:
              "模式切换：将背部开关拨至 BT，进入蓝牙模式；拨至 USB，进入有线模式。",
          },
          {
            title: "配对电脑蓝牙",
            kind: "bluetooth",
            steps: [
              "在 BT 模式下长按 Fn + 1 三秒。",
              "指示灯闪烁后，在电脑中选择 SAMPLE-KEY。",
            ],
            warning: "",
            evidence:
              "蓝牙配对：在 BT 模式下长按 Fn + 1 三秒，指示灯闪烁，在电脑中选择 SAMPLE-KEY。",
          },
        ],
      },
    },
  ],
};
function demoImage(page: ManualPage) {
  const escaped = (page.extraction?.text || "虚构演示说明书")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;");
  const lines = escaped
    .split("\n")
    .flatMap((line) => line.match(/.{1,24}/g) || [""]);
  return (
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="820"><rect width="640" height="820" fill="white"/><rect x="40" y="40" width="560" height="740" rx="5" fill="none" stroke="#d7dfe0"/><text x="75" y="100" font-size="27" fill="#153c3b" font-family="sans-serif">使用说明书 / SAMPLE</text><text x="75" y="135" font-size="15" fill="#687e7c" font-family="sans-serif">演示文档，非真实产品操作依据</text>${lines.map((line, i) => `<text x="75" y="${195 + i * 35}" font-size="18" fill="#334b4b" font-family="sans-serif">${line}</text>`).join("")}<text x="75" y="740" font-size="15" fill="#7b9090" font-family="sans-serif">知物 · 示例预览</text></svg>`,
    )
  );
}
