export type TopicImportance={stars:1|2|3|4|5;why:string;uses:string[]};
type Entry={stars:TopicImportance['stars'];zh:[string,string[]];en:[string,string[]]};
const entries:Record<string,Entry>={
  'html-css.box-model':{stars:5,zh:['页面里的文字、按钮、图片都要占空间。弄清宽度、内外间距怎么算，才能避免布局挤在一起或超出屏幕。',['调整按钮、输入框和卡片的大小。','排查“明明设了宽度，怎么还是放不下”的问题。']],en:['Every element takes up space. Understanding its size and spacing prevents overlapping content and overflow.',['Size buttons, inputs and cards.','Find why an element is wider than expected.']]},
  'html-css.flexbox':{stars:5,zh:['把几个元素排成一行、对齐或分配空余位置，是写页面时经常要做的事。Flex 能让这些布局更容易适应不同屏幕。',['把导航文字、图标和按钮排成一行。','让卡片里的内容对齐，空间不够时缩小或换行。']],en:['Rows, alignment and sharing available space are everyday layout tasks. Flex helps them adapt to different screen sizes.',['Arrange navigation links, icons and buttons in a row.','Align card content and handle shrinking or wrapping.']]},
  'html-css.grid':{stars:5,zh:['页面经常需要同时安排多行、多列。Grid 让每一块内容放在哪里、占多大空间都更容易控制。',['制作商品列表和图片墙。','安排侧边栏与正文，让页面适应宽窄屏幕。']],en:['Many pages need rows and columns together. Grid lets you control where content goes and how much space it takes.',['Build product lists and image galleries.','Lay out sidebars and main content across screen sizes.']]},
  'sql.joins':{stars:5,zh:['实际数据通常分开放在几张表里。能把它们正确地查出来、拼在一起，才能回答业务上的问题，也能避免重复计算或漏掉记录。',['把订单和客户资料一起查出来。','找出还没有下过订单的客户。']],en:['Real data usually lives in several tables. Combining it correctly avoids missing records and counting the same thing twice.',['Read orders together with customer details.','Find customers who have not placed an order.']]},
  'sql.constraints':{stars:5,zh:['只靠页面检查，挡不住所有错误数据。让数据库也检查重复值、缺失值和记录之间的关系，数据才更可靠。',['防止两个人注册同一个账号。','避免订单指向不存在的客户，正确处理还没填写的信息。']],en:['Page validation cannot catch every bad write. Database rules protect uniqueness, required values and relationships.',['Prevent duplicate account names.','Keep orders linked to real customers and handle missing values.']]},
  'sql.transactions':{stars:5,zh:['有些操作必须一起成功，失败时也要一起撤回。否则可能出现钱扣了、订单却没创建这样的不一致。',['创建订单时一起扣库存、保存订单。','处理转账中一边扣款、一边入账的操作。']],en:['Some changes must succeed or fail together. Otherwise one part may be saved while another is missing.',['Save an order and reduce stock together.','Keep both sides of a transfer consistent.']]},
  'sql.indexes':{stars:5,zh:['数据多了以后，查找方式会明显影响等待时间。学会索引，才能让常用查询更容易找到目标，也知道它会增加写入时的工作。',['加快按账号、订单号查找记录。','优化按日期查最近记录的页面。']],en:['With more data, how records are found affects waiting time. Indexes can help common lookups, but also add work when data changes.',['Speed up account or order-number lookups.','Support pages that retrieve recent records by date.']]},
  'sql.aggregation':{stars:5,zh:['工作中常常不只要看一条记录，还要数数量、算金额或比较排名。这些操作决定了统计结果是否正确。',['计算每天的销售额和订单数。','找出每位客户最近的一笔订单。']],en:['Work often requires counts, totals and rankings rather than individual records. These operations determine whether reports are correct.',['Calculate daily sales and order counts.','Find each customer’s most recent order.']]},
  'sql.plans':{stars:4,zh:['查询变慢时，只改写法往往是在猜。看数据库怎么查找、排序和筛选，才能更有依据地找出慢在哪里。',['检查查询是否用上了合适的索引。','排查报表或列表加载慢的原因。']],en:['When a query slows down, rewriting it blindly is guesswork. Seeing how records are found, sorted and filtered helps locate the work.',['Check whether a suitable index is used.','Investigate slow reports and list pages.']]},
};
export function authoredImportance(topicId:string,language:'zh'|'en'):TopicImportance|null{
  const [path,key]=topicId.split('.');
  const entry=entries[topicId]??(['mysql','sqlserver','postgresql'].includes(path)?entries[`sql.${key}`]:undefined);
  if(!entry)return null;
  const [why,uses]=entry[language];return {stars:entry.stars,why,uses:[...uses]};
}
export function validateImportance(raw:unknown):TopicImportance{
  const value=raw as TopicImportance;
  if(!value||!Number.isInteger(value.stars)||value.stars<1||value.stars>5||typeof value.why!=='string'||!value.why.trim()||value.why.length>600||!Array.isArray(value.uses)||value.uses.length<1||value.uses.length>3||value.uses.some(s=>typeof s!=='string'||!s.trim()||s.length>300))throw new Error('Invalid topic importance response. Please retry.');
  return {stars:value.stars,why:value.why,uses:value.uses};
}
