import { pathStage } from './path-types.ts';
import type { LearningPath } from './path-types.ts';

const docker='https://docs.docker.com/';
const kube='https://kubernetes.io/docs/';
const git='https://git-scm.com/docs/';
export const toolPaths:LearningPath[]=[{
  id:'docker',name:{en:'Docker',zh:'Docker'},mark:'DK',category:'tools',mode:'topics',source:docker,
  description:{en:'Package applications reproducibly and operate containers with clear resource and data boundaries.',zh:'可复现地打包应用，明确容器的资源与数据边界。'},
  prerequisite:{en:'Basic shell commands, processes, HTTP, and application dependencies.',zh:'了解基本命令行、进程、HTTP 与应用依赖。'},stages:[
    pathStage('docker','foundation',{en:'Describe and containerize a small HTTP service with persistent data.',zh:'为小型 HTTP 服务编写容器配置，并保留持久数据。'},docker,[
      ['images','Images & containers','镜像与容器','Distinguish immutable image layers from container writable state.','区分不可变镜像层与容器可写状态。','Does deleting a container delete its source image?','删除容器会删除来源镜像吗？',docker+'get-started/docker-concepts/the-basics/'],
      ['lifecycle','Container lifecycle','容器生命周期','Distinguish creating, starting, stopping, and removing a container.','区分创建、启动、停止与删除容器。','Does docker run reuse a stopped container automatically?','docker run 会自动复用已停止的容器吗？',docker+'reference/cli/docker/container/'],
      ['dockerfile','Dockerfile instructions','Dockerfile 指令','Separate build-time instructions from startup behavior.','区分构建时指令与启动行为。','When do RUN and CMD execute?','RUN 与 CMD 分别何时执行？',docker+'reference/dockerfile/'],
      ['context','Build context & ignore rules','构建上下文与忽略规则','Limit files sent to a build using .dockerignore.','通过 .dockerignore 限制构建输入文件。','Can COPY read a file outside the build context?','COPY 能读取构建上下文之外的文件吗？',docker+'build/concepts/context/'],
      ['ports','Published ports & listeners','端口发布与监听','Map host ports and distinguish host from container loopback.','映射主机端口，并区分主机与容器的回环地址。','Why can publishing a port fail when the app listens only on container localhost?','应用只监听容器 localhost 时，为什么发布端口仍可能无法访问？',docker+'get-started/docker-concepts/running-containers/publishing-ports/'],
      ['volumes','Volumes & bind mounts','卷与绑定挂载','Choose storage by ownership and persistence requirements.','根据归属与持久化需求选择存储。','What data survives container removal when stored in a named volume?','命名卷中的哪些数据会在删除容器后保留？',docker+'engine/storage/'],
      ['configuration','Environment & configuration','环境变量与配置','Pass runtime configuration without baking secrets into images.','传入运行时配置，避免将秘密写入镜像。','Does an environment variable make a secret inaccessible to container inspection?','使用环境变量能让秘密无法被容器检查读取吗？',docker+'reference/cli/docker/container/run/'],
      ['diagnostics','Logs & process diagnostics','日志与进程诊断','Use logs, inspection, and exit status to explain failures.','通过日志、检查信息与退出状态解释失败。','Which evidence distinguishes a crashed process from a port mapping problem?','哪些证据能区分进程崩溃与端口映射问题？',docker+'reference/cli/docker/container/']
    ]),
    pathStage('docker','practice',{en:'Design a Compose application with an API, database, health checks, and reproducible builds.',zh:'设计包含 API、数据库、健康检查与可复现构建的 Compose 应用。'},docker,[
      ['compose','Compose services','Compose 服务','Define services, networks, and volumes declaratively.','以声明方式定义服务、网络与卷。','How do services and containers differ when scaling a service?','扩容服务时，服务与容器有什么区别？',docker+'compose/intro/compose-application-model/'],
      ['networking','Service networking & DNS','服务网络与 DNS','Connect services using network-scoped names and container ports.','使用网络作用域中的名称和容器端口连接服务。','Why does localhost inside the API not refer to its database service?','API 内的 localhost 为什么不是数据库服务？',docker+'compose/how-tos/networking/'],
      ['health','Health checks & readiness','健康检查与就绪','Separate process startup, health status, and application retries.','区分进程启动、健康状态与应用重试。','Does starting the database container prove it accepts connections?','数据库容器启动就证明能接受连接了吗？',docker+'compose/how-tos/startup-order/'],
      ['multi-stage','Multi-stage builds','多阶段构建','Copy only required runtime artifacts from build stages.','从构建阶段只复制运行时所需产物。','Why can a runtime image omit the compiler?','运行时镜像为什么可以不包含编译器？',docker+'build/building/multi-stage/'],
      ['cache','Layer cache & dependency order','层缓存与依赖顺序','Order build inputs to reuse expensive dependency layers.','合理排列构建输入，以复用高成本依赖层。','Why copy dependency manifests before frequently changing source files?','为什么先复制依赖清单，再复制经常变化的源文件？',docker+'build/cache/optimize/'],
      ['identity','Non-root users & permissions','非 root 用户与权限','Match runtime user permissions to mounted storage.','让运行用户权限匹配挂载存储。','Why can switching USER make a mounted directory unwritable?','切换 USER 为什么可能使挂载目录无法写入？',docker+'build/building/best-practices/'],
      ['signals','Entrypoints & shutdown signals','入口点与停机信号','Use exec-form startup and propagate termination to the app.','使用 exec 形式启动，并将终止信号传递给应用。','How can a shell wrapper prevent graceful shutdown?','Shell 包装脚本如何阻碍优雅停机？',docker+'reference/dockerfile/'],
      ['registries','Registries, tags & digests','镜像仓库、标签与摘要','Distinguish mutable tags from content-addressed image identity.','区分可变标签与基于内容的镜像身份。','Can the same image tag resolve to different bytes tomorrow?','同一镜像标签明天能指向不同内容吗？',docker+'get-started/docker-concepts/the-basics/what-is-a-registry/']
    ]),
    pathStage('docker','advanced',{en:'Review a container release for reproducibility, isolation, resource limits, and data recovery.',zh:'评审容器交付的可复现性、隔离、资源限制与数据恢复。'},docker,[
      ['resources','CPU & memory limits','CPU 与内存限制','Bound resources and diagnose memory-related termination.','限制资源，并诊断内存相关终止。','Why can a container be killed without an application exception?','容器为什么可能在没有应用异常时被终止？',docker+'engine/containers/resource_constraints/'],
      ['build-secrets','Build secrets','构建秘密','Use secret mounts without persisting credentials in layers.','通过秘密挂载传入凭据，避免持久化到镜像层。','Does deleting a copied secret in a later layer remove it from earlier layers?','后续层删除复制过的秘密，会清除早期层中的秘密吗？',docker+'build/building/secrets/'],
      ['supply-chain','Build provenance & verification','构建来源与验证','Review artifact provenance alongside dependency and vulnerability evidence.','结合依赖和漏洞证据检查产物来源。','Does a pinned digest alone prove an image is trustworthy?','固定摘要本身能证明镜像可信吗？',docker+'build/metadata/attestations/'],
      ['platforms','Multi-platform builds','多平台构建','Match target architecture to dependencies and runtime images.','让目标架构匹配依赖和运行时镜像。','Why can an amd64 binary fail inside an arm64 image?','amd64 二进制文件为什么可能在 arm64 镜像中失败？',docker+'build/building/multi-platform/'],
      ['isolation','Capabilities & daemon access','权限能力与守护进程访问','Reduce capabilities and recognize privileged daemon interfaces.','收缩能力权限，并识别高权限守护进程接口。','Why is mounting the Docker socket a major privilege grant?','挂载 Docker socket 为什么会授予高权限？',docker+'engine/security/'],
      ['recovery','Volume backup & restore','卷备份与恢复','Plan consistent backups and verify restored application data.','规划一致性备份，并验证恢复后的应用数据。','Why may copying live database files produce an unusable backup?','复制运行中的数据库文件为什么可能生成不可用备份？',docker+'engine/storage/volumes/'],
      ['cleanup','Disk usage & cleanup scope','磁盘用量与清理范围','Inspect unused resources before choosing a scoped cleanup.','先检查未用资源，再选择限定范围的清理。','What data could a volume-pruning command remove?','卷清理命令可能删除什么数据？',docker+'engine/manage-resources/pruning/'],
      ['delivery','CI builds & release checks','CI 构建与发布验证','Build once and promote verified artifacts with explicit rollback references.','构建一次，推广已验证产物，并明确回滚引用。','Why rebuilds per environment weaken artifact identity?','为各环境重新构建为什么削弱产物一致性？',docker+'build/ci/']
    ])
  ]
},{
  id:'kubernetes',name:{en:'Kubernetes',zh:'Kubernetes'},mark:'K8S',category:'tools',mode:'topics',source:kube,
  description:{en:'Model, deliver, and diagnose declarative workloads with networking, storage, and access controls.',zh:'通过声明式配置建模、交付与诊断工作负载，掌握网络、存储和访问控制。'},
  prerequisite:{en:'Container images, basic YAML, networking, and Linux process concepts.',zh:'了解容器镜像、基本 YAML、网络与 Linux 进程概念。'},stages:[
    pathStage('kubernetes','foundation',{en:'Describe a replicated HTTP application with a Service and external configuration.',zh:'为多副本 HTTP 应用编写 Service 和外部配置。'},kube,[
      ['architecture','Control plane & reconciliation','控制平面与协调','Distinguish desired state from controller-observed state.','区分期望状态与控制器观察到的状态。','Does an accepted manifest prove all Pods are running?','清单被接受就证明所有 Pod 已运行了吗？',kube+'concepts/architecture/'],
      ['pods','Pods & container lifecycle','Pod 与容器生命周期','Treat Pods as replaceable units with shared networking.','将 Pod 视为共享网络的可替换单元。','Can a replacement Pod receive a different IP?','替换后的 Pod 能获得不同的 IP 吗？',kube+'concepts/workloads/pods/'],
      ['deployments','Deployments & replicas','Deployment 与副本','Use a Deployment to reconcile replicated stateless workloads.','用 Deployment 协调多副本无状态负载。','What recreates a Pod deleted from a managed Deployment?','受 Deployment 管理的 Pod 删除后，由什么补建？',kube+'concepts/workloads/controllers/deployment/'],
      ['selectors','Labels & selectors','标签与选择器','Keep workload and Service selectors aligned with Pod labels.','让工作负载和 Service 选择器匹配 Pod 标签。','Why can a Service have no endpoints despite running Pods?','Pod 在运行，为什么 Service 仍可能没有端点？',kube+'concepts/overview/working-with-objects/labels/'],
      ['services','Services & cluster DNS','Service 与集群 DNS','Expose replaceable Pods through stable service discovery.','通过稳定的服务发现访问可替换 Pod。','How do port and targetPort differ?','port 与 targetPort 有什么区别？',kube+'concepts/services-networking/service/'],
      ['configuration','ConfigMaps & Secrets','ConfigMap 与 Secret','Separate configuration and sensitive values from image content.','将配置和敏感值与镜像内容分离。','Does base64 encoding encrypt Secret data?','Base64 编码会加密 Secret 数据吗？',kube+'concepts/configuration/'],
      ['namespaces','Namespaces & contexts','命名空间与上下文','Resolve the cluster and namespace targeted by a command.','确定命令指向的集群与命名空间。','Why verify context before applying a manifest?','应用清单前为什么检查上下文？',kube+'concepts/overview/working-with-objects/namespaces/'],
      ['inspection','Status, events & logs','状态、事件与日志','Combine status, events, and container logs to locate failures.','结合状态、事件和容器日志定位失败。','What evidence helps distinguish ImagePullBackOff from an application crash?','哪些证据能区分 ImagePullBackOff 与应用崩溃？',kube+'tasks/debug/debug-application/']
    ]),
    pathStage('kubernetes','practice',{en:'Design a resilient rollout with probes, resource budgets, storage, and scoped access.',zh:'设计包含探针、资源预算、存储与限定权限的可靠发布。'},kube,[
      ['probes','Startup, readiness & liveness','启动、就绪与存活探针','Assign probes distinct startup, traffic, and restart responsibilities.','区分探针的启动、流量和重启职责。','Does a failed readiness probe restart the container?','就绪探针失败会重启容器吗？',kube+'concepts/configuration/liveness-readiness-startup-probes/'],
      ['resources','Requests & limits','资源请求与限制','Relate scheduling reservations to runtime resource enforcement.','关联调度预留与运行时资源约束。','How does a memory request differ from a memory limit?','内存 request 与 limit 有什么区别？',kube+'concepts/configuration/manage-resources-containers/'],
      ['rollouts','Rolling updates & rollback','滚动更新与回滚','Balance surge, availability, and observed rollout progress.','协调额外副本、可用性与发布进度。','Can a Deployment rollback reverse a database migration?','Deployment 回滚能撤销数据库迁移吗？',kube+'concepts/workloads/controllers/deployment/'],
      ['storage','Persistent volumes & claims','持久卷与申领','Match claims, storage classes, and lifecycle expectations.','匹配申领、存储类与生命周期预期。','Why can a Pod remain Pending while its PVC is unbound?','PVC 未绑定时，Pod 为什么可能一直 Pending？',kube+'concepts/storage/persistent-volumes/'],
      ['jobs','Jobs & CronJobs','Job 与 CronJob','Make scheduled work retryable and tolerate duplicate execution.','让定时任务可重试，并容忍重复执行。','Why should a scheduled billing job be idempotent?','定时计费任务为什么应具备幂等性？',kube+'concepts/workloads/controllers/cron-jobs/'],
      ['rbac','ServiceAccounts & RBAC','服务账号与 RBAC','Grant specific verbs on resources to the intended identity.','向指定身份授予资源上的具体操作权限。','How do Role and RoleBinding divide permissions and subjects?','Role 与 RoleBinding 如何分别定义权限与主体？',kube+'reference/access-authn-authz/rbac/'],
      ['network-policy','Network policies','网络策略','Define allowed traffic with selectors and explicit plugin assumptions.','通过选择器定义允许流量，并明确网络插件假设。','Does creating a NetworkPolicy work without an enforcing network plugin?','没有执行策略的网络插件时，创建 NetworkPolicy 会生效吗？',kube+'concepts/services-networking/network-policies/'],
      ['ingress','Ingress & external traffic','Ingress 与外部流量','Separate routing resources from the controller implementing them.','区分路由资源与实现路由的控制器。','Does an Ingress object alone install a traffic controller?','仅创建 Ingress 对象就会安装流量控制器吗？',kube+'concepts/services-networking/ingress/']
    ]),
    pathStage('kubernetes','advanced',{en:'Review a production workload for scaling, disruption, security, and recovery.',zh:'评审生产负载的扩缩容、中断、安全与恢复能力。'},kube,[
      ['autoscaling','Horizontal autoscaling','水平自动扩缩容','Connect metrics and requests to replica decisions.','关联指标、资源请求与副本决策。','What happens to CPU utilization scaling when required requests are missing?','缺少所需资源请求时，CPU 利用率扩缩容会怎样？',kube+'tasks/run-application/horizontal-pod-autoscale/'],
      ['disruption','Disruption budgets','中断预算','Bound voluntary disruption without assuming protection from every failure.','限制主动中断，避免假设能防御所有故障。','Does a PodDisruptionBudget prevent a node hardware failure?','PodDisruptionBudget 能阻止节点硬件故障吗？',kube+'concepts/workloads/pods/disruptions/'],
      ['scheduling','Affinity, taints & topology','亲和性、污点与拓扑','Combine placement constraints with realistic node capacity.','结合放置约束与真实节点容量。','Does a toleration force placement onto a tainted node?','容忍度会强制将 Pod 放到带污点节点吗？',kube+'concepts/scheduling-eviction/'],
      ['stateful','StatefulSets & identity','StatefulSet 与身份','Preserve workload identity while separately planning storage recovery.','保留负载身份，并独立规划存储恢复。','Does StatefulSet automatically back up database data?','StatefulSet 会自动备份数据库数据吗？',kube+'concepts/workloads/controllers/statefulset/'],
      ['security','Pod security & credentials','Pod 安全与凭据','Reduce privileges and mount only necessary credentials.','收缩权限，只挂载必需凭据。','Why disable automatic ServiceAccount token mounting when unused?','不使用服务账号令牌时，为什么禁用自动挂载？',kube+'concepts/security/'],
      ['observability','Workload observability','负载可观测性','Correlate metrics, events, logs, and rollout changes.','关联指标、事件、日志与发布变更。','How would you distinguish scheduling failure from slow application startup?','如何区分调度失败与应用启动缓慢？',kube+'concepts/cluster-administration/observability/'],
      ['api-evolution','API versions & declarative ownership','API 版本与声明式归属','Review API compatibility and field ownership before applying changes.','应用变更前审查 API 兼容性与字段归属。','Why can two field managers conflict under server-side apply?','服务端应用配置时，两个字段管理者为什么会冲突？',kube+'reference/using-api/server-side-apply/'],
      ['recovery','Release & disaster recovery','发布与灾难恢复','Verify workload manifests and persistent data through restore exercises.','通过恢复演练验证负载清单与持久数据。','Why is restoring manifests insufficient after losing a database volume?','数据库卷丢失后，为什么只恢复清单不够？',kube+'tasks/administer-cluster/']
    ])
  ]
},{
  id:'git',name:{en:'Git',zh:'Git'},mark:'GIT',category:'tools',mode:'topics',source:git,
  description:{en:'Understand snapshots, collaborate through branches, and recover changes with evidence.',zh:'理解快照，通过分支协作，并有依据地恢复变更。'},
  prerequisite:{en:'Basic files, directories, command-line navigation, and a text editor.',zh:'了解文件、目录、命令行导航与文本编辑器。'},stages:[
    pathStage('git','foundation',{en:'Record a small project with focused commits and explain each diff.',zh:'为小项目创建范围明确的提交，并解释每次差异。'},git,[
      ['snapshots','Snapshots & repository structure','快照与仓库结构','Distinguish repository history from working files.','区分仓库历史与工作文件。','Does saving a file in an editor create a commit?','编辑器保存文件会创建提交吗？',git+'gittutorial'],
      ['configuration','Identity & configuration scope','身份与配置作用域','Resolve local and global settings without confusing identity with authentication.','区分局部与全局设置，以及提交身份与登录认证。','Does user.email authenticate a push?','user.email 会为推送提供认证吗？',git+'git-config'],
      ['staging','Working tree, index & HEAD','工作区、暂存区与 HEAD','Track content across the three states used in a commit.','追踪提交涉及的三种内容状态。','What is committed if a staged file is edited again without git add?','暂存后再次修改文件却不再 git add，会提交什么？',git+'git-add'],
      ['diff','Status & diffs','状态与差异','Separate unstaged, staged, and committed differences.','区分未暂存、已暂存与已提交的差异。','How does git diff --cached differ from git diff?','git diff --cached 与 git diff 有什么区别？',git+'git-diff'],
      ['commits','Focused commits','范围明确的提交','Review staged content and write messages explaining intent.','审查暂存内容，并用提交说明表达目的。','Why inspect the staged diff before committing?','提交前为什么检查暂存差异？',git+'git-commit'],
      ['ignore','Ignore rules & tracked files','忽略规则与已跟踪文件','Use ignore patterns while distinguishing tracking from exclusion.','使用忽略模式，并区分跟踪状态与排除规则。','Does adding a tracked file to .gitignore stop tracking it?','将已跟踪文件加入 .gitignore 会停止跟踪吗？',git+'gitignore'],
      ['history','History & revisions','历史与修订引用','Read commit graphs and inspect named revisions.','阅读提交图，并检查指定修订。','How does HEAD~2 identify an ancestor?','HEAD~2 如何指定祖先提交？',git+'gitrevisions'],
      ['restore','Restoring & unstaging','恢复文件与取消暂存','Choose a source and target before restoring content.','恢复内容前确定来源与目标。','Does git restore --staged normally discard working-tree edits?','git restore --staged 通常会丢弃工作区修改吗？',git+'git-restore']
    ]),
    pathStage('git','practice',{en:'Collaborate on two feature branches and resolve a supplied conflict without losing changes.',zh:'在两个功能分支上协作，解决给定冲突并保留所需变更。'},git,[
      ['branches','Branches & switching','分支与切换','Model branches as movable commit references.','将分支理解为可移动的提交引用。','Does creating a branch duplicate every project file in history?','创建分支会复制历史中的每个项目文件吗？',git+'git-branch'],
      ['merge','Merges & ancestry','合并与祖先关系','Distinguish fast-forward updates from merge commits.','区分快进更新与合并提交。','When can a merge fast-forward without a new commit?','什么情况下合并可以快进而不新建提交？',git+'git-merge'],
      ['conflicts','Conflict resolution','冲突解决','Resolve file content, stage resolutions, and complete or abort the operation.','解决文件内容冲突，暂存结果，并完成或中止操作。','Why is deleting conflict markers alone insufficient evidence of correctness?','为什么只删除冲突标记不足以证明解决正确？',git+'git-merge'],
      ['remotes','Remotes & fetch','远端与获取','Separate remote-tracking references from local branches.','区分远端跟踪引用与本地分支。','Does git fetch normally merge changes into the current branch?','git fetch 通常会将变更合入当前分支吗？',git+'git-fetch'],
      ['sync','Pull, push & upstreams','拉取、推送与上游','Choose integration behavior and inspect divergence before pushing.','选择集成方式，推送前检查分叉。','Why can a push be rejected as non-fast-forward?','推送为什么会因非快进而被拒绝？',git+'git-pull'],
      ['stash','Stashing partial work','暂存未完成工作','Save temporary changes while distinguishing tracked and untracked content.','保存临时修改，并区分已跟踪与未跟踪内容。','Does a default stash include untracked files?','默认 stash 会包含未跟踪文件吗？',git+'git-stash'],
      ['rebase','Rebase & rewritten commits','变基与改写提交','Replay local commits while recognizing changed commit identities.','重放本地提交，并识别提交身份变化。','Why can rebasing a shared branch disrupt collaborators?','对共享分支变基为什么可能干扰协作者？',git+'git-rebase'],
      ['review','Reviewing branch changes','分支变更评审','Compare branches using the intended merge base and scope.','按预期合并基点与范围比较分支。','How does a three-dot diff differ from comparing two branch tips?','三点差异与直接比较两个分支尖端有什么区别？',git+'git-diff']
    ]),
    pathStage('git','advanced',{en:'Diagnose a regression and plan a recoverable release using a supplied commit graph.',zh:'依据给定提交图定位回归，并规划可恢复的发布。'},git,[
      ['revert-reset','Revert & reset boundaries','撤销与重置边界','Choose additive undo versus reference movement with explicit data-loss scope.','明确数据丢失范围，选择新增撤销提交或移动引用。','Why prefer revert for undoing a published commit?','撤销已发布提交时，为什么通常选择 revert？',git+'git-revert'],
      ['reflog','Reflogs & recovery limits','引用日志与恢复限制','Recover reachable local history while accounting for expiry.','恢复仍可查找的本地历史，并考虑过期限制。','Can reflog recover arbitrary uncommitted file content?','reflog 能恢复任意未提交文件内容吗？',git+'git-reflog'],
      ['bisect','Regression bisection','回归二分定位','Use deterministic good and bad evidence to narrow a commit range.','用确定性的正常与异常证据缩小提交范围。','How can a flaky test mislead git bisect?','不稳定测试如何误导 git bisect？',git+'git-bisect'],
      ['cherry-pick','Cherry-picking & backports','挑选提交与回移','Apply a focused change while checking dependencies and conflicts.','应用限定范围的变更，并检查依赖与冲突。','Why can a clean cherry-pick still fail behaviorally?','cherry-pick 没有冲突，为什么行为仍可能失败？',git+'git-cherry-pick'],
      ['tags','Tags & release identity','标签与发布身份','Distinguish annotated release metadata from branch movement.','区分带注释的发布元数据与分支移动。','Does creating a local tag automatically publish it?','创建本地标签会自动发布吗？',git+'git-tag'],
      ['worktrees','Worktrees & parallel changes','工作树与并行修改','Use separate working directories while understanding shared repository state.','使用独立工作目录，同时理解共享仓库状态。','What is shared between linked worktrees?','关联工作树之间共享什么？',git+'git-worktree'],
      ['attributes','Attributes & line endings','属性与换行符','Define repository-level text normalization and inspect resulting diffs.','定义仓库级文本规范化规则，并检查差异。','Why can line-ending changes make every line appear modified?','换行符变化为什么可能让每一行都显示修改？',git+'gitattributes'],
      ['safe-publishing','Safe history publishing','安全发布历史','Coordinate history rewrites and verify the expected remote reference.','协调历史改写，并校验预期远端引用。','What concurrent update does an explicit force-with-lease expectation protect?','显式 force-with-lease 预期值能保护哪种并发更新？',git+'git-push']
    ])
  ]
}];
