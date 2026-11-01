import { pathStage } from './path-types.ts';
import type { LearningPath } from './path-types.ts';

const shopify='https://shopify.dev/docs/storefronts/themes';
const wordpress='https://developer.wordpress.org/';
const native='https://reactnative.dev/docs/getting-started';

export const platformPaths:LearningPath[]=[
  {id:'shopify',name:{en:'Shopify',zh:'Shopify'},mark:'SH',category:'frontend',mode:'topics',source:shopify,
    description:{en:'Build merchant-editable storefronts with Liquid, themes, and commerce APIs.',zh:'学习 Liquid、主题与电商 API，构建商家可编辑的店铺。'},
    prerequisite:{en:'HTML, CSS, and JavaScript fundamentals.',zh:'具备 HTML、CSS 和 JavaScript 基础。'},stages:[
      pathStage('shopify','foundation',{en:'Build a product template in a development store.',zh:'在开发店铺中搭建商品模板。'},shopify,[
        ['architecture','Theme architecture','主题结构','Connect layouts, templates, sections, and snippets.','理解布局、模板、区块与片段的关系。','Which part should hold reusable markup shared by two sections?','两个区块共用的标记应放在哪里？'],
        ['liquid','Liquid objects & filters','Liquid 对象与过滤器','Render objects with loops, conditions, and filters.','通过循环、条件与过滤器渲染对象。','How do you handle a missing product value without broken output?','如何处理缺失的商品字段，避免输出异常？','https://shopify.dev/docs/api/liquid'],
        ['products','Products & variants','商品与变体','Distinguish products, options, variants, and availability.','区分商品、选项、变体与可售状态。','Why must adding to a cart identify the selected variant?','为什么加入购物车需要选中的变体标识？'],
        ['schema','Section schema & settings','区块配置与设置','Expose useful settings to the theme editor.','向主题编辑器提供实用配置。','How can a merchant change a heading without editing Liquid?','商家如何无需修改 Liquid 就能更换标题？']
      ]),
      pathStage('shopify','practice',{en:'Create a configurable collection page and cart interaction.',zh:'制作可配置的集合页与购物车交互。'},shopify,[
        ['collections','Collections & pagination','集合与分页','Render collections without assuming all products fit one page.','展示集合，不假定全部商品都在一页。','What fails if a collection listing ignores pagination?','集合列表忽略分页会遗漏什么？'],
        ['cart','Ajax cart & errors','Ajax 购物车与错误','Handle cart mutations and visible failure states.','处理购物车变更与可见的失败状态。','How should the UI respond when a cart request is rejected?','购物车请求被拒绝时，界面应如何响应？','https://shopify.dev/docs/api/ajax'],
        ['metafields','Metafields & dynamic content','元字段与动态内容','Model product-specific content outside hardcoded templates.','将商品特有内容存入元字段，避免模板硬编码。','Where should a product-specific care instruction live?','商品专属的养护说明应存在哪里？'],
        ['accessibility','Accessible storefront interactions','店铺交互的可访问性','Preserve keyboard focus and announce cart updates.','保留键盘焦点，并传达购物车更新。','After closing a cart drawer, where should focus return?','关闭购物车抽屉后，焦点应回到哪里？']
      ]),
      pathStage('shopify','advanced',{en:'Audit a theme and design a safe headless storefront boundary.',zh:'审核主题，并设计安全的无头店铺接口边界。'},shopify,[
        ['performance','Theme performance','主题性能','Measure image loading and JavaScript costs.','测量图片加载与 JavaScript 开销。','Why can lazy-loading the main product image delay visible content?','为什么懒加载主商品图可能拖慢首屏？'],
        ['localization','Markets & localization','市场与本地化','Use platform localization and money formatting.','使用平台本地化与金额格式化能力。','Why is changing a currency symbol insufficient for localization?','为什么只替换货币符号不足以完成本地化？'],
        ['storefront-api','Storefront API boundaries','Storefront API 边界','Separate storefront access from privileged administration.','区分店铺访问与高权限后台管理。','Why must an Admin API secret never be shipped in browser code?','为什么不能将 Admin API 密钥放入浏览器代码？','https://shopify.dev/docs/api/storefront'],
        ['delivery','Theme validation & delivery','主题验证与交付','Validate changes in a preview before publishing.','发布前在预览中验证变更。','What should you verify before replacing a live theme?','替换线上主题前需要验证哪些内容？']
      ])]},
  {id:'wordpress',name:{en:'WordPress',zh:'WordPress'},mark:'WP',category:'frontend',mode:'topics',source:wordpress,
    description:{en:'Develop maintainable themes, blocks, plugins, and secure content APIs.',zh:'开发易维护的主题、区块、插件与安全内容接口。'},
    prerequisite:{en:'HTML, CSS, JavaScript, and basic PHP syntax.',zh:'具备 HTML、CSS、JavaScript 与 PHP 基础语法知识。'},stages:[
      pathStage('wordpress','foundation',{en:'Create a local content site with a small block theme.',zh:'在本地用小型区块主题搭建内容站点。'},wordpress,[
        ['content','Content model','内容模型','Distinguish posts, pages, taxonomies, and metadata.','区分文章、页面、分类体系与元数据。','When is a category more suitable than a custom field?','什么时候分类比自定义字段更合适？'],
        ['themes','Templates & theme hierarchy','模板与主题层级','Choose templates through the template hierarchy.','通过模板层级选择合适模板。','How do you customize one content type without changing every page?','如何只调整一种内容类型，而不影响所有页面？','https://developer.wordpress.org/themes/'],
        ['blocks','Blocks & site editing','区块与站点编辑','Compose reusable content with blocks and patterns.','用区块与样板组合可复用内容。','How does a reusable pattern differ from a page template?','可复用样板与页面模板有什么区别？','https://developer.wordpress.org/block-editor/'],
        ['hooks','Actions & filters','动作与过滤器','Extend behavior through hooks instead of editing core.','通过钩子扩展行为，避免修改核心。','When should a filter return a value rather than print it?','过滤器什么时候应返回值，而非直接输出？','https://developer.wordpress.org/plugins/hooks/']
      ]),
      pathStage('wordpress','practice',{en:'Build a plugin for a custom content type and its editor.',zh:'为自定义内容类型与编辑界面编写插件。'},wordpress,[
        ['plugins','Plugin lifecycle','插件生命周期','Separate activation setup from normal request handling.','区分激活初始化与日常请求处理。','Why should permanent setup not run on every request?','为什么持久化初始化不应在每次请求时执行？','https://developer.wordpress.org/plugins/'],
        ['custom-content','Custom post types & metadata','自定义文章类型与元数据','Register content contracts and validate stored fields.','注册内容约束，并校验存储字段。','What must be checked before saving a submitted custom field?','保存提交的自定义字段前应检查什么？'],
        ['assets','Script & style loading','脚本与样式加载','Enqueue assets with explicit dependencies.','声明依赖并通过队列加载资源。','Why can directly inserting script tags break dependency order?','直接插入 script 标签为什么可能破坏依赖顺序？'],
        ['rest','REST API integration','REST API 集成','Expose content with explicit permissions and pagination.','通过明确权限与分页提供内容接口。','Why does a custom write endpoint need a permission callback?','为什么自定义写入端点需要权限回调？','https://developer.wordpress.org/rest-api/']
      ]),
      pathStage('wordpress','advanced',{en:'Harden and deliver a plugin with a tested migration plan.',zh:'加固插件，并制定经过验证的迁移交付方案。'},wordpress,[
        ['security','Capabilities, nonces & escaping','权限、nonce 与转义','Combine capability checks, CSRF protection, and contextual escaping.','结合权限检查、CSRF 防护与按输出上下文转义。','Does a valid nonce prove a user can edit any post?','有效 nonce 能证明用户有权编辑任意文章吗？','https://developer.wordpress.org/plugins/security/'],
        ['queries','Queries & database safety','查询与数据库安全','Use query APIs and prepared SQL where needed.','优先使用查询 API，必要时使用预处理 SQL。','Why is concatenating user input into SQL unsafe?','将用户输入直接拼入 SQL 为什么不安全？'],
        ['caching','Caching & invalidation','缓存与失效','Cache expensive reads and invalidate on relevant writes.','缓存高成本读取，并在相关写入时失效。','How can a cached listing remain stale after publishing?','发布后缓存列表为什么可能仍显示旧内容？'],
        ['maintenance','Updates, backups & migrations','更新、备份与迁移','Verify backups and rehearse updates in staging.','验证备份，并在预发布环境演练更新。','What evidence shows that a backup can actually restore the site?','什么证据能说明备份确实可以恢复站点？']
      ])]},
  {id:'react-native',name:{en:'React Native',zh:'React Native'},mark:'RN',category:'frontend',mode:'topics',source:native,
    description:{en:'Build accessible mobile interfaces and reliable native app workflows.',zh:'构建可访问的移动界面与可靠的原生应用流程。'},
    prerequisite:{en:'JavaScript or TypeScript, React components, and state.',zh:'具备 JavaScript 或 TypeScript、React 组件与状态基础。'},stages:[
      pathStage('react-native','foundation',{en:'Build a mobile profile screen with editable fields.',zh:'构建带可编辑字段的移动个人资料页。'},native,[
        ['components','Native core components','原生核心组件','Use View, Text, Image, and Pressable appropriately.','合理使用 View、Text、Image 与 Pressable。','Why can a web div not replace a View in a native screen?','为什么原生页面不能直接用网页 div 替换 View？'],
        ['layout','StyleSheet & Flexbox','StyleSheet 与 Flexbox','Build adaptive layouts using native styling rules.','使用原生样式规则搭建自适应布局。','Which direction does a native flex container use by default?','原生 flex 容器默认沿哪个方向排列？','https://reactnative.dev/docs/flexbox'],
        ['input','Controlled input & keyboard','受控输入与键盘','Coordinate TextInput state and keyboard behavior.','协调 TextInput 状态与键盘行为。','How does onChangeText differ from reading a browser input event?','onChangeText 与读取浏览器输入事件有什么区别？','https://reactnative.dev/docs/handling-text-input'],
        ['platforms','Platform-specific behavior','平台差异','Choose shared logic and explicit platform adaptations.','区分共享逻辑与显式平台适配。','When should platform-specific files replace a conditional branch?','什么时候应使用平台专属文件替代条件分支？','https://reactnative.dev/docs/platform-specific-code']
      ]),
      pathStage('react-native','practice',{en:'Build a searchable list with details and a resilient data flow.',zh:'构建带详情页与可靠数据流程的可搜索列表。'},native,[
        ['lists','FlatList & stable identity','FlatList 与稳定身份','Render long lists with stable keys and explicit state.','使用稳定键与明确状态渲染长列表。','Why can index keys break row state after reordering?','为什么使用索引作键可能在重排后破坏行状态？','https://reactnative.dev/docs/using-a-listview'],
        ['network','Networking & request lifecycle','网络请求与生命周期','Handle loading, errors, and stale responses.','处理加载、错误与过期响应。','How can a slower old request overwrite a newer search result?','较慢的旧请求如何覆盖新的搜索结果？','https://reactnative.dev/docs/network'],
        ['navigation','Navigation & screen state','导航与页面状态','Model routes, back behavior, and screen ownership.','建模路由、返回行为与页面状态归属。','What should happen to unsaved input when a user goes back?','用户返回上一页时，未保存输入应如何处理？','https://reactnative.dev/docs/navigation'],
        ['accessibility','Mobile accessibility','移动端可访问性','Provide labels and verify screen-reader focus.','提供可访问标签，并验证读屏焦点。','How will a screen reader identify an icon-only action?','读屏如何识别只有图标的操作？','https://reactnative.dev/docs/accessibility']
      ]),
      pathStage('react-native','advanced',{en:'Prepare and validate a mobile app for release on real devices.',zh:'在真实设备上验证移动应用，并准备发布。'},native,[
        ['performance','Release performance profiling','发布版本性能分析','Measure list rendering and JS work in release-like builds.','在接近发布的构建中测量列表渲染与 JS 工作量。','Why can development-mode timing misrepresent release performance?','为什么开发模式的耗时不能代表发布性能？','https://reactnative.dev/docs/performance'],
        ['native-boundaries','Native modules & permissions','原生模块与权限','Respect native permission and module boundaries.','遵守原生权限与模块边界。','How should a feature behave when permission is permanently denied?','权限被永久拒绝时，功能应如何表现？'],
        ['testing','Component & device testing','组件与设备测试','Combine logic tests with device-level interaction checks.','结合逻辑测试与设备交互验证。','What can a component test miss about the on-screen keyboard?','组件测试可能遗漏屏幕键盘的哪些行为？','https://reactnative.dev/docs/testing-overview'],
        ['release','Build, signing & release','构建、签名与发布','Separate development settings from signed release builds.','区分开发配置与已签名的发布构建。','What should you verify on a clean installation of a release build?','全新安装发布构建后应验证哪些内容？','https://reactnative.dev/docs/running-on-device']
      ])]}
];
