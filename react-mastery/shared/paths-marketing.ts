import { pathStage } from './path-types.ts';
import type { LearningPath } from './path-types.ts';

const skillshop='https://skillshop.withgoogle.com/';
const ads='https://support.google.com/google-ads/';
const seo='https://developers.google.com/search/docs/fundamentals/seo-starter-guide';
const technical='https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers';
const ga4='https://developers.google.com/analytics/devguides/collection/ga4';
const gtm='https://developers.google.com/tag-platform/tag-manager';
const gsc='https://support.google.com/webmasters/answer/7576553';
const shopify='https://help.shopify.com/en/manual/promoting-marketing/seo';
const ai='https://developers.google.com/search/docs/appearance/ai-features';
const looker='https://docs.cloud.google.com/looker/docs/studio';

export const marketingPaths:LearningPath[]=[{
  id:'marketing-fundamentals',name:{en:'Digital Marketing Fundamentals & Metrics',zh:'数字营销基础与商业指标'},mark:'DM',category:'marketing',mode:'topics',practiceMode:'response',source:skillshop,
  description:{en:'Search Marketing 01 · Connect channels, search intent and funnels to business outcomes. Covers modules 01–02.',zh:'搜索营销 01 · 从渠道、搜索意图和漏斗入门，用商业指标判断效果；覆盖原模块 01–02。'},
  prerequisite:{en:'Start here. No marketing account or advertising spend required.',zh:'建议从这里开始；无需营销账号或广告支出。'},stages:[
    pathStage('marketing-fundamentals','foundation',{en:'Map one product, its audience and the path from a search to a sale.',zh:'为一个产品梳理受众，以及从搜索到成交的路径。'},skillshop,[
      ['ecosystem','Digital Marketing Ecosystem','数字营销生态','Connect paid, owned and earned channels to a business goal.','将付费、自有与赢得的渠道对应到商业目标。','Which channel would you test first for a new local service, and why?','新本地服务先测试哪个渠道，为什么？'],
      ['sem','Search Engine Marketing (SEM)','搜索引擎营销（SEM）','State whether SEM means paid search or the broader search discipline in a brief.','明确项目中 SEM 指付费搜索还是更广义的搜索营销。','How would you clarify an ambiguous SEM brief?','SEM 需求含糊时，你会澄清什么？'],
      ['paid-organic','Paid Search vs Organic Search','付费搜索与自然搜索','Compare cost, control, timing and ongoing effort for paid and organic search.','比较付费与自然搜索的成本、控制、见效时间和持续投入。','Can organic traffic be treated as cost-free acquisition?','自然流量能视为没有获客成本吗？'],
      ['customer-journey','Customer Journey','客户旅程','Map discovery, comparison, purchase and repeat visits across channels.','梳理发现、比较、购买和复购涉及的渠道。','Why can the final click miss an earlier useful touchpoint?','最后一次点击为什么可能漏掉之前有价值的接触？'],
      ['marketing-funnel','Marketing Funnel','营销漏斗','Match awareness, consideration and purchase objectives to useful signals.','为认知、考虑和购买目标选择合适信号。','Does increased reach alone prove more profitable sales?','覆盖人数增加能单独证明销售更赚钱吗？'],
      ['search-intent','Search Intent','搜索意图','Classify informational, navigational, commercial and transactional queries.','识别信息、导航、商业比较与交易型搜索。','Would a buying guide and a checkout page suit the same query equally?','购买指南与结账页同样适合一个查询吗？'],
      ['conversion-funnel','Conversion Funnel','转化漏斗','Define a conversion and locate drop-off between explicitly measured steps.','定义转化，并定位已测量步骤之间的流失。','What data distinguishes a traffic problem from checkout friction?','什么数据能区分流量不足与结账障碍？']
    ]),
    pathStage('marketing-fundamentals','practice',{en:'Calculate comparable acquisition metrics from a small campaign dataset.',zh:'用小型广告数据集计算可比较的获客指标。'},ads,[
      ['impressions','Impressions','展示次数','Distinguish ad displays from unique people and clicks.','区分广告展示、独立人数与点击。','Do 1,000 impressions mean 1,000 people?','1,000 次展示等于 1,000 人吗？'],
      ['clicks','Clicks','点击次数','Distinguish platform clicks, sessions and valid visits.','区分平台点击、会话与有效访问。','Why might 200 clicks produce fewer than 200 sessions?','200 次点击为什么可能少于 200 次会话？'],
      ['ctr','CTR — Click-through Rate','CTR 点击率','Calculate clicks divided by impressions over the same scope.','用同一范围内的点击数除以展示数。','What is CTR for 80 clicks from 4,000 impressions?','4,000 次展示、80 次点击的 CTR 是多少？'],
      ['cpc','CPC — Cost per Click','CPC 单次点击成本','Calculate spend divided by clicks in a stated currency.','以明确币种计算广告支出除以点击数。','Does a lower CPC always mean better customer acquisition?','CPC 更低就一定获客更好吗？'],
      ['cpm','CPM — Cost per 1,000 Impressions','CPM 千次展示成本','Calculate spend per thousand impressions and compare like-for-like audiences.','计算每千次展示的支出，并在相近受众间比较。','How does CPM differ from the cost of reaching 1,000 unique people?','CPM 与覆盖 1,000 个独立用户的成本有何不同？'],
      ['cpa','CPA — Cost per Acquisition / Action','CPA 单次获客或转化成本','Define the action before calculating spend per attributed conversion.','先定义行动，再计算每次归因转化的支出。','Can newsletter CPA be compared directly with purchase CPA?','订阅与购买的 CPA 能直接比较吗？'],
      ['cvr','CVR — Conversion Rate','CVR 转化率','State the denominator and calculate conversions per click or session.','明确分母，计算点击或会话的转化比例。','Why are click-based and session-based CVR not interchangeable?','按点击与按会话计算的 CVR 为什么不能混用？']
    ]),
    pathStage('marketing-fundamentals','advanced',{en:'Recommend a budget using revenue, margin and attribution limits.',zh:'结合收入、利润率和归因边界提出预算建议。'},skillshop,[
      ['roas','ROAS — Return on Ad Spend','ROAS 广告支出回报率','Calculate attributed revenue divided by ad spend; distinguish revenue from profit.','计算归因收入除以广告支出，区分收入与利润。','Is 4x ROAS profitable when product margin is 20% before advertising?','广告前毛利率为 20% 时，4 倍 ROAS 能赚钱吗？'],
      ['roi','ROI — Return on Investment','ROI 投资回报率','Use a stated cost scope and calculate net return divided by investment.','明确成本范围，用净回报除以投入。','Why is revenue divided by ad spend not a profit ROI?','收入除以广告支出为什么不是利润 ROI？'],
      ['cac','CAC — Customer Acquisition Cost','CAC 客户获取成本','Divide defined acquisition costs by new customers in the same cohort.','以同批新客数分摊明确范围的获客成本。','Why does CPA for all orders differ from new-customer CAC?','所有订单的 CPA 为什么不同于新客 CAC？'],
      ['ltv','LTV — Customer Lifetime Value','LTV 客户生命周期价值','State time horizon, retention and margin assumptions in a customer value estimate.','估计客户价值时明确期限、留存和利润率假设。','How does a revenue LTV overstate the amount available for acquisition?','收入型 LTV 为什么可能高估可用于获客的金额？'],
      ['attribution','Attribution Models','归因模型','Compare credit allocation with causal evidence of incremental sales.','区分转化功劳分配与增量销售的因果证据。','Does last-click attribution prove the last channel caused the sale?','末次点击归因能证明最后渠道导致成交吗？']
    ])
  ]
},{
  id:'google-ads',name:{en:'Google Ads',zh:'Google Ads 广告投放'},mark:'AD',category:'marketing',mode:'topics',practiceMode:'response',source:ads,
  description:{en:'Search Marketing 02 · Plan paid acquisition, manage budgets and optimize against measured outcomes. Covers module 03.',zh:'搜索营销 02 · 设计付费获客、管理预算，并根据测量结果优化；覆盖原模块 03。'},
  prerequisite:{en:'Marketing fundamentals and CTR, CPC, CPA, CVR and ROAS. Study alongside SEO.',zh:'先学营销基础与 CTR、CPC、CPA、CVR、ROAS；可与 SEO 并行。'},stages:[
    pathStage('google-ads','foundation',{en:'Choose campaign types and organize a fictional advertiser account.',zh:'为虚构广告主选择广告系列类型并设计账号结构。'},ads,[
      ['account','Google Ads Account Structure','Google Ads 账号结构','Separate accounts, campaigns, ad groups, ads and targeting.','区分账号、广告系列、广告组、广告和定向。','Where should two different campaign budgets be controlled?','两个独立广告预算应该在哪一层控制？'],
      ['search','Search Campaigns','搜索广告','Match queries, intent, ads and landing pages.','让查询、意图、广告和落地页对应。','Which landing page best fits a specific service query?','具体服务查询最适合哪个落地页？'],
      ['shopping','Shopping Campaigns','购物广告','Explain how product data supports Shopping ads.','解释商品数据如何支持购物广告。','Can inaccurate feed availability create a useful Shopping experience?','商品 Feed 库存不准确能带来良好购物体验吗？'],
      ['performance-max','Performance Max Campaigns','Performance Max 广告系列','Relate cross-channel automation to goals, assets and conversion quality.','把跨渠道自动化与目标、素材和转化质量联系起来。','What would you verify before optimizing for recorded conversions?','针对已记录转化优化前，先验证什么？'],
      ['display','Display Campaigns','展示广告','Match audience and creative to awareness or remarketing goals.','让受众和素材对应认知或再营销目标。','Why should display CTR not be benchmarked blindly against search?','展示广告的 CTR 为什么不能直接对标搜索广告？']
    ]),
    pathStage('google-ads','practice',{en:'Draft a search campaign with relevant targeting, bids and ad copy.',zh:'设计包含相关定向、出价与文案的搜索广告系列。'},ads,[
      ['match-types','Keyword Match Types','关键词匹配类型','Reason about match types using meaning and intent rather than literal strings only.','依据含义与意图理解匹配类型，而不只看字面。','Does exact match mean only the identical typed string can match?','完全匹配只匹配逐字相同的查询吗？'],
      ['negative-keywords','Negative Keywords','否定关键词','Exclude irrelevant queries while preserving relevant demand.','排除无关查询，同时保留相关需求。','Could a broad negative remove a valuable product query?','宽泛否定词会不会排除有价值的商品查询？'],
      ['bidding','Bidding Strategies','出价策略','Choose a bidding objective using conversion quality, value and constraints.','结合转化质量、价值和限制选择出价目标。','Would maximizing clicks alone optimize profit?','仅最大化点击能优化利润吗？'],
      ['quality-score','Quality Score','质量得分','Use Quality Score components diagnostically.','用质量得分的组成项诊断相关性和体验。','Is the displayed Quality Score itself an auction-time bidding input?','界面里的质量得分本身是实时竞价输入吗？'],
      ['ad-rank','Ad Rank','广告排名','Explain that auctions depend on more than the highest bid.','说明竞价结果不只取决于最高出价。','Can the highest bid guarantee the top ad position?','最高出价能保证广告排第一吗？'],
      ['copywriting','Ad Copywriting','广告文案','Write relevant, supportable claims with a clear next action.','撰写相关、可证实且有明确行动指引的文案。','What evidence would a claim of guaranteed results require?','保证效果的文案需要什么证据？']
    ]),
    pathStage('google-ads','advanced',{en:'Audit a campaign and propose one justified optimization.',zh:'审查广告系列，并提出一项有依据的优化。'},ads,[
      ['conversion-tracking','Conversion Tracking','转化追踪','Define meaningful conversion actions, value and duplicate controls.','定义有商业意义的转化、价值与去重。','What happens if a purchase fires twice or a page view counts as a sale?','购买触发两次或把浏览算成交会怎样？'],
      ['budget','Budget Management','预算管理','Plan spend with explicit campaign budget and monitoring assumptions.','在明确预算规则和监控假设下规划支出。','Why should an average daily budget not be treated as a strict per-day cap?','平均每日预算为什么不能视为每日硬上限？'],
      ['optimisation','Campaign Optimisation','广告优化','Prioritize search terms, tracking, value and controlled comparisons.','优先检查搜索词、追踪、价值和受控比较。','How would you avoid reacting to a single noisy day?','怎样避免根据一天的波动盲目调整？'],
      ['merchant-center','Google Merchant Center','Google Merchant Center 商品中心','Check product identifiers, price, availability and destination consistency.','核对商品标识、价格、库存和目标页面一致性。','What should be checked when a product is disapproved?','商品被拒登时应检查什么？','https://support.google.com/merchants/']
    ])
  ]
},{
  id:'seo',name:{en:'SEO, Search Console & Research Tools',zh:'SEO、GSC 与搜索研究工具'},mark:'SE',category:'marketing',mode:'topics',practiceMode:'response',source:seo,
  description:{en:'Search Marketing 03 · Build an organic search strategy using on-page, technical, local and measurement skills. Covers modules 04, 07–08.',zh:'搜索营销 03 · 结合页面、技术、本地搜索和数据证据制定自然搜索策略；覆盖原模块 04、07–08。'},
  prerequisite:{en:'Marketing fundamentals. HTML, HTTP and rendering knowledge helps with technical SEO; Google Ads can run in parallel.',zh:'先学营销基础；HTML、HTTP 和渲染知识有助于技术 SEO；可与 Google Ads 并行。'},stages:[
    pathStage('seo','foundation',{en:'Choose a search opportunity and improve one useful, clearly structured page.',zh:'选择搜索机会，优化一个有用且结构清晰的页面。'},seo,[
      ['crawl-index-rank','Crawling, Indexing and Ranking','抓取、索引与排名','Separate discovery, crawling, indexing and ranking eligibility.','区分发现、抓取、索引和排名资格。','Does successful crawling guarantee indexing or a high rank?','成功抓取能保证收录或高排名吗？'],
      ['keyword-research','Keyword Research','关键词研究','Group relevant queries by intent, demand evidence and business fit.','按意图、需求证据与商业匹配度整理查询。','Why is search volume alone insufficient to choose a keyword?','为什么不能只按搜索量选词？'],
      ['intent-analysis','Search Intent Analysis','搜索意图分析','Use a supplied query and results sample to infer likely needs.','根据查询与给定结果样本推断需求。','What page format fits a comparison query?','比较型查询适合什么页面形式？'],
      ['serp','SERP Analysis','搜索结果页分析','Inspect result types and features using a dated, localized sample.','使用标注日期与地域的样本分析结果类型和特征。','Can one search sample represent every user location?','一次搜索样本能代表所有地域用户吗？'],
      ['competitors','Competitor Analysis','竞争对手分析','Compare content gaps and search competitors with explicit evidence.','用明确证据比较内容缺口与搜索竞争对手。','Must a search competitor sell the same product?','搜索竞争对手必须销售相同产品吗？'],
      ['titles','Title Tags','标题标签','Write distinct descriptive titles aligned with page intent.','撰写与页面意图一致、有区分度的标题。','Is a supplied title guaranteed to appear unchanged in Google?','Google 一定原样显示所写的标题吗？'],
      ['meta-descriptions','Meta Descriptions','元描述','Write useful summaries without promising a fixed snippet.','撰写有用摘要，不保证固定搜索摘要。','Can Google choose page text instead of the meta description?','Google 能选择正文而不是元描述作为摘要吗？'],
      ['headings','Heading Structure','标题层级','Organize headings around readable content sections.','用标题组织便于阅读的内容分区。','Does stuffing every keyword into headings make a page useful?','在标题塞满关键词能让页面有用吗？'],
      ['internal-links','Internal Linking','内部链接','Use crawlable contextual links to connect related pages.','用可抓取的上下文链接连接相关页面。','How can an orphan page become harder to discover?','孤立页面为什么更难被发现？'],
      ['content','Content Optimisation','内容优化','Answer real user needs with original, supportable information.','用原创、可证实的信息回答真实需求。','Why is repeating a keyword not a substitute for answering the query?','为什么重复关键词不能替代回答用户问题？'],
      ['alt-text','Image Alt Text','图片替代文字','Describe meaningful images and treat decorative images appropriately.','描述有意义的图片，并正确处理装饰图片。','What should alt text communicate for a useful product image?','商品图片的 alt 应传达什么？'],
      ['urls','URL Structure','URL 结构','Design understandable stable URLs and plan changes carefully.','设计易懂稳定的 URL，并谨慎规划变更。','What can break when a URL changes without redirects?','URL 变更后没有重定向会影响什么？']
    ]),
    pathStage('seo','practice',{en:'Audit crawlability, rendering, performance and index coverage with supplied evidence.',zh:'使用给定证据审查抓取、渲染、性能与索引覆盖。'},technical,[
      ['sitemap','XML Sitemap','XML 站点地图','List intended canonical indexable URLs in a sitemap.','在站点地图中列出期望收录的规范 URL。','Does sitemap inclusion guarantee indexing?','提交站点地图能保证收录吗？','https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview'],
      ['robots','Robots.txt','Robots.txt 抓取控制','Distinguish crawling directives from indexing controls and access security.','区分抓取指令、索引控制与访问安全。','Does disallow reliably remove an already known URL from search?','disallow 能可靠地从搜索删除已知 URL 吗？','https://developers.google.com/search/docs/crawling-indexing/robots/intro'],
      ['canonical','Canonical Tags','规范链接标签','Identify duplicate URLs and provide consistent canonical signals.','识别重复 URL，并提供一致的规范化信号。','Is rel=canonical an absolute instruction or a canonicalization signal?','rel=canonical 是绝对命令还是规范化信号？','https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'],
      ['structured-data','Structured Data / Schema.org','结构化数据与 Schema.org','Describe visible content with supported structured data.','用受支持的结构化数据描述可见内容。','Does valid markup guarantee a rich result?','有效标记能保证富媒体结果吗？','https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data'],
      ['core-web-vitals','Core Web Vitals','核心网页指标','Interpret LCP, INP and CLS using field data and lab diagnostics.','结合真实用户数据与实验诊断理解 LCP、INP、CLS。','Why can field and lab results disagree?','真实用户数据与实验结果为什么会不同？','https://web.dev/articles/vitals'],
      ['page-speed','Page Speed Optimisation','页面速度优化','Prioritize a measured loading bottleneck over a score alone.','优先解决测出的加载瓶颈，而不只追分。','Would a perfect performance score guarantee first place in search?','满分性能能保证搜索第一吗？','https://web.dev/learn/performance/'],
      ['mobile','Mobile Optimisation','移动端优化','Check mobile content parity, usability and resource access.','检查移动内容一致性、可用性与资源访问。','What happens if essential content is missing on mobile?','移动端缺少主要内容会怎样？','https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing'],
      ['javascript','JavaScript SEO','JavaScript SEO','Inspect rendered content, crawlable links and rendering failures.','检查渲染内容、可抓取链接与渲染失败。','Can an empty app shell prove that the final page is indexable?','空应用壳能证明最终页面可收录吗？','https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics'],
      ['ssr-csr','SSR vs CSR','服务端与客户端渲染','Compare initial HTML, rendering dependencies and failure modes.','比较初始 HTML、渲染依赖与故障模式。','Does SSR by itself guarantee ranking?','SSR 本身能保证排名吗？','https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics'],
      ['http','Redirects and HTTP Status Codes','重定向与 HTTP 状态码','Choose permanent or temporary redirects and meaningful error responses.','选择永久或临时跳转，并返回有意义的错误状态。','Why is a missing product returning 200 a potential soft 404?','商品不存在却返回 200 为什么可能形成软 404？','https://developers.google.com/search/docs/crawling-indexing/http-network-errors'],
      ['gsc-verification','GSC Website Verification','GSC 网站验证','Choose property scope and a suitable ownership verification method.','选择资源范围与适合的所有权验证方式。','Does URL-prefix verification cover every protocol and subdomain?','URL 前缀验证涵盖所有协议和子域吗？','https://support.google.com/webmasters/answer/9008080'],
      ['gsc-performance','GSC Search Performance Reports','GSC 搜索表现报告','Read comparable date, page, device and country slices.','比较一致的日期、页面、设备和国家维度。','What must match before comparing two performance periods?','比较两个时期的表现前，哪些范围必须一致？',gsc],
      ['gsc-queries','GSC Search Queries','GSC 搜索查询','Use query samples while acknowledging omitted or anonymized data.','使用查询样本，同时承认缺失或匿名化数据。','Should visible query rows always sum to the chart total?','可见查询行一定加总等于图表总量吗？',gsc],
      ['gsc-ctr','GSC Impressions and CTR Analysis','GSC 展示与点击率分析','Separate position, intent and query mix when diagnosing CTR.','诊断 CTR 时区分排名、意图与查询组合变化。','Can a CTR fall be explained by a changed query mix?','查询组合变化能导致 CTR 下降吗？',gsc],
      ['gsc-position','GSC Average Search Position','GSC 平均搜索排名','Interpret position as an aggregate with explicit dimensions.','在明确维度下理解平均排名。','Does average position describe a fixed ranking for every search?','平均排名代表每次搜索的固定名次吗？',gsc],
      ['gsc-inspection','GSC URL Inspection','GSC URL 检查','Separate indexed results from a current live-page test.','区分索引结果与当前实时测试。','Does a successful live test prove that Google has indexed the page?','实时测试成功能证明页面已收录吗？','https://support.google.com/webmasters/answer/9012289'],
      ['gsc-indexing','GSC Page Indexing','GSC 网页索引','Compare intended indexed URLs with exclusion reasons.','比较期望收录 URL 与排除原因。','Must every excluded URL be fixed?','每一个被排除的 URL 都需要修复吗？','https://support.google.com/webmasters/answer/7440203'],
      ['gsc-sitemaps','GSC Sitemap Submission','GSC 站点地图提交','Check sitemap processing and included URL consistency.','检查站点地图处理和 URL 一致性。','Does a processed sitemap mean every listed page is indexed?','站点地图处理成功意味着每页已收录吗？','https://support.google.com/webmasters/answer/7451001'],
      ['gsc-vitals','GSC Core Web Vitals Reports','GSC 核心网页指标报告','Read field-data URL groups and distinguish missing data from passing.','读取真实用户 URL 分组，区分无数据与通过。','Does no field data mean the page has passed Core Web Vitals?','没有真实用户数据意味着通过核心网页指标吗？','https://support.google.com/webmasters/answer/9205520'],
      ['gsc-troubleshooting','GSC Indexing Issue Troubleshooting','GSC 索引问题排查','Prioritize robots, status, canonical and content evidence.','根据 robots、状态、规范链接和内容证据排查。','What would you check before repeatedly requesting indexing?','反复请求编入索引前应该先检查什么？','https://support.google.com/webmasters/answer/7440203']
    ]),
    pathStage('seo','advanced',{en:'Use research tools and local signals to write an evidence-based SEO plan.',zh:'结合研究工具和本地信号，编写有证据支持的 SEO 计划。'},seo,[
      ['backlinks','Backlink Analysis','外链分析','Evaluate relevance, context and data coverage rather than raw counts.','评估相关性、上下文与数据覆盖，而不只数外链。','Do two tools necessarily discover the same backlink set?','两个工具必然发现相同外链吗？'],
      ['link-building','Link Building','外链建设','Plan useful link-worthy resources without link manipulation.','规划值得引用的有用资源，避免操纵链接。','Why can buying ranking links create a search policy problem?','购买用于排名的链接为什么可能违反搜索政策？','https://developers.google.com/search/docs/essentials/spam-policies'],
      ['digital-pr','Digital PR','数字公关','Pitch verifiable stories and measure relevant coverage.','推介可核实的内容，并衡量相关报道。','What evidence supports a newsworthy claim?','什么证据能支持具有新闻价值的主张？'],
      ['local-seo','Local SEO','本地搜索优化','Align local relevance, business information and useful location pages.','让本地相关性、商家信息与地点页面一致。','Can distance be changed merely by repeating a city name?','反复写城市名能改变商家距离吗？','https://support.google.com/business/answer/7091'],
      ['business-profile','Google Business Profile','Google 商家资料','Maintain accurate eligible business details and handle reviews honestly.','维护符合资格的准确商家信息，并诚实处理评价。','Should an online-only brand create a fictitious storefront?','纯线上品牌应该创建虚假实体门店吗？','https://support.google.com/business/'],
      ['semrush','Semrush','Semrush 研究工具','Interpret keyword and competitor estimates with scope and date limits.','结合范围与日期理解关键词和竞品估计值。','Is estimated competitor traffic equivalent to its analytics?','估计的竞品流量等于其真实分析数据吗？','https://www.semrush.com/academy/'],
      ['ahrefs','Ahrefs','Ahrefs 研究工具','Use keyword, content and backlink research as directional evidence.','把关键词、内容和外链研究作为方向性证据。','Can a proprietary authority score guarantee Google ranking?','工具的权威分数能保证 Google 排名吗？','https://ahrefs.com/academy'],
      ['screaming-frog','Screaming Frog SEO Spider','Screaming Frog 网站抓取工具','Read a supplied crawl export and prioritize status, metadata and link issues.','读取给定抓取导出，按优先级处理状态、元数据和链接问题。','Why might a crawler export miss JavaScript-rendered content?','抓取导出为什么可能遗漏 JavaScript 渲染的内容？','https://www.screamingfrog.co.uk/seo-spider/user-guide/'],
      ['keyword-planner','Google Keyword Planner','Google 关键词规划师','Use scoped keyword estimates without treating forecasts as guaranteed demand.','使用明确范围的关键词估计，不把预测当保证。','Can forecast clicks be promised as next month’s actual result?','预测点击能承诺为下个月真实结果吗？','https://support.google.com/google-ads/answer/7337243'],
      ['trends','Google Trends','Google 趋势','Interpret normalized relative interest with region and time settings.','结合地域与时间理解标准化的相对兴趣。','Does a Trends value of 100 mean 100 searches?','Trends 数值 100 代表 100 次搜索吗？','https://support.google.com/trends/answer/4365533'],
      ['pagespeed-insights','PageSpeed Insights','PageSpeed Insights 性能分析','Separate field measurements, lab results and suggested diagnostics.','区分真实用户测量、实验结果与诊断建议。','Which result helps explain a controlled lab run versus real visitors?','哪些结果反映受控测试，哪些反映真实访客？','https://developers.google.com/speed/docs/insights/v5/about'],
      ['lighthouse','Lighthouse','Lighthouse 审查工具','Use repeatable lab audits as diagnostics with stated conditions.','在明确条件下用可复现的实验审查诊断问题。','Does a Lighthouse SEO score certify complete SEO success?','Lighthouse SEO 分数能认证完整 SEO 成功吗？','https://developer.chrome.com/docs/lighthouse/overview/']
    ])
  ]
},{
  id:'marketing-analytics',name:{en:'GA4 & GTM — Measurement and Tracking',zh:'GA4 与 GTM 数据分析与追踪'},mark:'GA',category:'marketing',mode:'topics',practiceMode:'response',source:ga4,
  description:{en:'Search Marketing 04 · Define events, collect reliable data and analyze acquisition and revenue. Covers modules 05–06.',zh:'搜索营销 04 · 定义事件、采集可靠数据，分析获客与收入；覆盖原模块 05–06。'},
  prerequisite:{en:'Marketing metrics and a basic funnel; HTML and JavaScript help with tagging. Learn after starting Ads and SEO.',zh:'先理解营销指标与基本漏斗；HTML 和 JavaScript 有助于埋点；在开始 Ads、SEO 后学习。'},stages:[
    pathStage('marketing-analytics','foundation',{en:'Write a measurement plan with explicit events, parameters and acquisition tags.',zh:'编写包含事件、参数与获客标记的测量计划。'},ga4,[
      ['setup','GA4 Account Setup','GA4 账号设置','Separate account, property and data stream responsibilities.','区分账号、媒体资源和数据流的职责。','Which property settings affect comparable daily revenue reports?','哪些资源设置会影响每日收入报表的可比性？'],
      ['events','Events and Parameters','事件与参数','Define event names and parameters without personal identifiers.','定义事件和参数，避免个人身份信息。','Is a button click the same business event as a completed purchase?','点击按钮与完成购买是同一个商业事件吗？'],
      ['key-events','Key Events','关键事件','Mark meaningful success events and distinguish Ads conversions.','标记有意义的关键事件，并区分 Ads 转化。','Should every page view be marked as a purchase success?','每次页面浏览都应该标记为购买成功吗？'],
      ['user-acquisition','User Acquisition','用户获取','Interpret first-user acquisition dimensions.','理解首次用户获取维度。','How can a first-user source differ from the current session source?','首次用户来源为什么可能不同于当前会话来源？'],
      ['traffic-acquisition','Traffic Acquisition','流量获取','Interpret session-scoped acquisition dimensions.','理解会话范围的流量获取维度。','Why must user and session acquisition reports be compared carefully?','用户与会话获取报表为什么要谨慎比较？'],
      ['engagement','User Engagement','用户参与度','Relate engagement metrics to an explicitly stated business goal.','把参与度指标对应到明确商业目标。','Does longer engagement time always mean a better purchase experience?','参与时间更长一定代表购买体验更好吗？'],
      ['utm','UTM Parameters','UTM 营销参数','Use consistent source, medium and campaign values on external campaigns.','在外部营销链接使用一致的来源、媒介和广告系列值。','Why can adding campaign UTMs to internal links distort analysis?','内部链接添加营销 UTM 为什么可能扭曲分析？']
    ]),
    pathStage('marketing-analytics','practice',{en:'Design a GTM implementation and a preview-based verification plan.',zh:'设计 GTM 实施方案与基于预览的验证计划。'},gtm,[
      ['tags','GTM Tags','GTM 标签','Choose what data a destination tag sends and when.','明确目标标签发送哪些数据、何时发送。','What is a tag responsible for compared with a trigger?','标签与触发器各负责什么？'],
      ['triggers','GTM Triggers','GTM 触发器','Define precise event conditions and avoid duplicate firing.','定义准确的事件条件，避免重复触发。','Why can both page-load and click triggers double-count an event?','页面加载与点击触发为什么可能重复计数？'],
      ['variables','GTM Variables','GTM 变量','Resolve event data with explicit types and missing-value handling.','以明确类型和缺失值处理读取事件数据。','What should happen when a purchase value variable is undefined?','购买金额变量未定义时应该怎样处理？'],
      ['data-layer','Data Layer','数据层','Define a stable event contract with value, currency and transaction identity.','定义稳定的事件协议，包含金额、币种与交易标识。','How can stale data-layer values corrupt a later event?','数据层旧值如何污染后续事件？'],
      ['custom-events','Custom Events','自定义事件','Connect a documented application event to a GTM custom-event trigger.','把明确的应用事件连接到 GTM 自定义事件触发器。','Why must pushed and triggered event names agree?','推送与触发事件名称为什么必须一致？'],
      ['ga4-integration','GA4 Integration','GA4 集成','Map data-layer parameters to GA4 events and verify the destination.','映射数据层参数到 GA4，并验证目标资源。','How would you detect an event sent to the wrong property?','怎样发现事件发送到了错误资源？'],
      ['ads-tracking','Google Ads Conversion Tracking','Google Ads 转化追踪','Document event sources and prevent duplicate primary conversion counting.','记录事件来源，防止主要转化被重复计数。','What should be checked before importing the same purchase alongside a native Ads tag?','同一购买既有 Ads 标签又要导入时，先检查什么？'],
      ['debugging','Debugging and Testing','调试与测试','Plan checks using GTM Preview, event payloads and destination debugging.','用 GTM 预览、事件载荷与目标调试工具制定验证步骤。','Does a fired tag alone prove the destination recorded correct revenue?','标签触发能单独证明目标端记录了正确收入吗？']
    ]),
    pathStage('marketing-analytics','advanced',{en:'Analyze revenue and funnels, then review consent and server-side measurement assumptions.',zh:'分析收入与漏斗，再审查同意设置和服务端测量假设。'},ga4,[
      ['funnel-exploration','Funnel Exploration','漏斗探索','Specify step definitions, ordering and open or closed funnel assumptions.','明确步骤、顺序与开放或封闭漏斗假设。','How does changing funnel entry rules change the denominator?','改变漏斗进入规则如何改变分母？'],
      ['path-exploration','Path Exploration','路径探索','Describe observed navigation without inventing causal motives.','描述观察到的路径，不编造因果动机。','Does a frequent exit path prove why people left?','常见离开路径能证明用户为什么离开吗？'],
      ['audiences','Audience Segmentation','受众细分','Define comparable groups using explicit inclusion and time rules.','用明确纳入条件和时间规则定义可比较群体。','Can a cohort change explain a conversion-rate change?','群体组成变化能解释转化率变化吗？'],
      ['ecommerce','Ecommerce Tracking','电商追踪','Specify item data, transaction identity, value, currency and refunds.','定义商品数据、交易标识、金额、币种与退款。','Why does a thank-you page reload need duplicate controls?','感谢页刷新为什么需要去重？','https://developers.google.com/analytics/devguides/collection/ga4/ecommerce'],
      ['revenue','Revenue Analysis','收入分析','Reconcile supplied order, tax, shipping and refund definitions.','核对订单、税、运费和退款的给定口径。','Why might analytics revenue differ from the finance report?','分析收入为什么可能不同于财务报表？'],
      ['attribution','Attribution Analysis','归因分析','Specify scope, model and lookback assumptions before comparing channel credit.','比较渠道功劳前明确范围、模型和回溯假设。','Does changing attribution create additional sales?','改变归因会产生额外销售吗？'],
      ['enhanced-conversions','Enhanced Conversions','增强型转化','Explain permitted first-party data matching and hashing limits.','解释合适的一方数据匹配与哈希的边界。','Does hashing remove all consent and data-use responsibilities?','哈希后就没有同意和数据使用责任了吗？','https://support.google.com/google-ads/answer/9888656'],
      ['consent','Consent Mode','同意模式','Separate user choice, tag behavior and measurement modeling.','区分用户选择、标签行为与建模数据。','Is Consent Mode itself a consent banner or a legal compliance guarantee?','同意模式本身是同意弹窗或合规保证吗？','https://developers.google.com/tag-platform/security/concepts/consent-mode'],
      ['server-side','Server-side Tagging','服务端标签管理','Explain browser, server container and destination boundaries.','解释浏览器、服务端容器与目标服务的边界。','Does moving tags server-side make collection automatically private or accurate?','把标签移到服务端就自动保证隐私与准确吗？','https://developers.google.com/tag-platform/tag-manager/server-side']
    ])
  ]
},{
  id:'ecommerce-marketing',name:{en:'Ecommerce Marketing & CRO',zh:'电商营销与转化优化'},mark:'EC',category:'marketing',mode:'topics',practiceMode:'response',source:shopify,
  description:{en:'Search Marketing 05 · Apply Ads, SEO and measurement to product discovery, checkout and revenue. Covers module 09.',zh:'搜索营销 05 · 把广告、SEO 和测量用于商品发现、结账与收入；覆盖原模块 09。'},
  prerequisite:{en:'Ads, SEO and measurement basics. The separate Shopify route covers platform development.',zh:'先学广告、SEO 与数据测量基础；Shopify 平台开发另有原路线。'},stages:[
    pathStage('ecommerce-marketing','foundation',{en:'Connect a product catalog, its feed and relevant search landing pages.',zh:'连接商品目录、Feed 与相关搜索落地页。'},shopify,[
      ['shopify-seo','Shopify SEO','Shopify 搜索优化','Review collections, product content, navigation and canonical URLs.','检查集合页、商品内容、导航与规范 URL。','How can overlapping collections create duplicate discovery paths?','重叠集合如何产生重复发现路径？'],
      ['product-feeds','Product Feed Optimisation','商品 Feed 优化','Align product IDs, titles, price and availability with landing pages.','使商品 ID、标题、价格与库存对应落地页。','What should change when feed stock disagrees with the store?','Feed 库存与商城不一致时应调整什么？','https://support.google.com/merchants/answer/7052112'],
      ['shopping','Google Shopping Optimisation','Google 购物广告优化','Compare product-level value, margins and feed eligibility.','比较商品价值、利润率与 Feed 资格。','Should every product receive the same acquisition target?','所有商品都应使用同一个获客目标吗？','https://support.google.com/merchants/'],
      ['product-pages','Product Page Optimisation','商品页面优化','Present useful product facts, price, availability and purchase conditions.','清晰呈现商品信息、价格、库存与购买条件。','What missing information could prevent a confident purchase?','哪些缺失信息会阻碍放心购买？']
    ]),
    pathStage('ecommerce-marketing','practice',{en:'Propose one landing-page change and a measurable conversion experiment.',zh:'提出一项落地页改动与可测量的转化实验。'},shopify,[
      ['landing-pages','Landing Page Optimisation','落地页优化','Align the page promise and next action with the incoming intent.','使页面承诺与下一步操作对应访问意图。','Why can a relevant ad fail on an unrelated homepage?','相关广告为什么会在无关首页上失败？'],
      ['cro','Conversion Rate Optimisation (CRO)','转化率优化（CRO）','Use funnel evidence to choose one testable friction hypothesis.','根据漏斗证据选择一个可测试的阻碍假设。','Can a higher conversion rate hide a lower profit per visitor?','转化率上升能掩盖每位访客利润下降吗？'],
      ['ab-testing','A/B Testing','A/B 测试','Define random assignment, success metrics, guardrails and a stopping plan.','定义随机分组、成功指标、保护指标与停止计划。','Why is checking daily and stopping at the first apparent win risky?','每天查看并在首次表面胜出时停止有什么问题？','https://firebase.google.com/docs/ab-testing/ab-concepts']
    ]),
    pathStage('ecommerce-marketing','advanced',{en:'Diagnose abandonment and recommend profitable retention or acquisition changes.',zh:'诊断弃购，提出有利润依据的留存或获客调整。'},shopify,[
      ['remarketing','Remarketing','再营销','Define relevant eligible audiences, exclusions and frequency assumptions.','定义相关且符合条件的受众、排除项和频次假设。','Why should recent purchasers sometimes be excluded?','为什么有时应排除近期购买者？','https://support.google.com/google-ads/'],
      ['abandonment','Cart Abandonment Analysis','购物车弃购分析','Compare cart, checkout and purchase steps with device and cohort context.','结合设备与群体比较购物车、结账和购买步骤。','Does an abandoned cart prove that the price was too high?','弃购能证明价格太高吗？'],
      ['revenue','Ecommerce Revenue Analysis','电商收入分析','Relate orders, average order value, refunds, margin and new customers.','结合订单、客单价、退款、利润率与新客分析。','Would more revenue always justify greater acquisition spend?','收入更多就一定应增加获客支出吗？']
    ])
  ]
},{
  id:'ai-search-reporting',name:{en:'AI Search & Marketing Reporting',zh:'AI 搜索与营销报告'},mark:'AI',category:'marketing',mode:'topics',practiceMode:'response',source:ai,
  description:{en:'Search Marketing 06 · Evaluate emerging AI search practices and communicate evidence-based recommendations. Covers module 10.',zh:'搜索营销 06 · 判断新兴 AI 搜索方法，并用证据沟通营销建议；覆盖原模块 10。'},
  prerequisite:{en:'SEO, marketing metrics and measurement. Study last; GEO/AIO/AEO terminology varies across the industry.',zh:'先学 SEO、商业指标和测量；建议最后学习，GEO／AIO／AEO 的行业用法并不统一。'},stages:[
    pathStage('ai-search-reporting','foundation',{en:'Separate AI search terminology from documented search eligibility and useful content.',zh:'区分 AI 搜索术语、官方收录条件与有用内容。'},ai,[
      ['geo','Generative Engine Optimisation (GEO)','生成式引擎优化（GEO）','State the operational definition and evaluate visibility claims against evidence.','明确所用定义，用证据判断可见性主张。','Does labeling content GEO guarantee that an AI system cites it?','标记为 GEO 的内容能保证被 AI 引用吗？'],
      ['aio','AI Optimisation (AIO)','AI 优化（AIO）','Clarify whether AIO refers to search visibility, workflow or another explicit goal.','明确 AIO 指搜索可见性、工作流程还是其他具体目标。','What must be clarified before agreeing to an AIO project?','接受 AIO 项目前必须澄清什么？'],
      ['aeo','Answer Engine Optimisation (AEO)','答案引擎优化（AEO）','Create clear supported answers without promising answer-engine inclusion.','提供清晰有依据的回答，不保证进入答案引擎。','Can special answer formatting guarantee inclusion?','特殊回答格式能保证被收录吗？'],
      ['ai-overviews','Google AI Overviews','Google AI 搜索概览','Apply documented Search eligibility and distinguish special-markup claims.','应用官方搜索资格要求，判断特殊标记的主张。','Does Google require special AI schema to qualify for its AI features?','Google AI 功能要求特殊 AI Schema 吗？'],
      ['visibility','AI Search Visibility','AI 搜索可见性','Define a dated prompt sample, geography, model and observed citations.','定义带日期的问题样本、地域、模型与实际引用。','Can one cited answer prove stable visibility across AI search?','一次回答被引用能证明 AI 搜索长期可见吗？']
    ]),
    pathStage('ai-search-reporting','practice',{en:'Build a report specification with consistent definitions and honest charts.',zh:'编写口径一致、图表诚实的报告说明。'},looker,[
      ['looker','Looker Studio','Looker Studio 报表工具','Specify data sources, joins, aggregation and freshness.','明确数据源、连接、聚合与刷新时间。','How could joining one spend row to several order rows inflate cost?','把一条支出连接到多条订单为什么会放大成本？'],
      ['dashboards','Marketing Dashboards','营销仪表盘','Choose metrics tied to a decision, with explicit scope and owners.','选择能支持决策的指标，明确范围与责任人。','What decision does a dashboard metric help someone make?','一个仪表盘指标帮助谁做什么决定？'],
      ['reporting','Performance Reporting','效果报告','Compare consistent periods, goals and data-quality limitations.','以一致时期、目标和数据质量边界比较表现。','What must be stated when tracking changed between periods?','两个时期追踪方式变化时应说明什么？'],
      ['visualisation','Data Visualisation','数据可视化','Choose readable charts with denominators, units and nonmisleading scales.','选择易读图表，标明分母、单位并避免误导刻度。','How could a truncated axis exaggerate a small change?','截断坐标轴怎样夸大小变化？']
    ]),
    pathStage('ai-search-reporting','advanced',{en:'Present an integrated search plan with priorities, uncertainty and a testable next step.',zh:'呈现综合搜索计划，说明优先级、不确定性与可测试的下一步。'},looker,[
      ['communication','Client Communication','客户沟通','Explain a result, its business implication and an honest next action.','解释结果、商业含义与诚实的下一步行动。','How would you explain falling traffic alongside rising profit?','流量下降但利润增加时，你会怎样解释？'],
      ['strategy','Marketing Strategy and Recommendations','营销策略与建议','Prioritize Ads, SEO and measurement using impact, effort and evidence.','结合影响、投入和证据安排广告、SEO 与测量优先级。','Which recommendation would change if margin or tracking reliability changed?','利润率或追踪可靠性变化时，哪项建议应调整？']
    ])
  ]
}];

// Order is intentional: shared fundamentals, parallel acquisition channels, measurement,
// ecommerce application, then emerging search practices and client reporting.
export const searchMarketingPathIds=marketingPaths.map(path=>path.id);
export function isMarketingTopic(topicId:string):boolean {
  return searchMarketingPathIds.some(id=>topicId.startsWith(`${id}.`));
}
