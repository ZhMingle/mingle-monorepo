import { pathStage } from './path-types.ts';
import type { LearningPath } from './path-types.ts';

const prep='https://amazon.jobs/content/en/faq/interview-prep';
const careers='https://careers.microsoft.com/v2/global/en/hiring-tips';
export const careerPaths:LearningPath[]=[{
  id:'behavioral-interviews',name:{en:'Behavioral Interviews',zh:'行为面试（Behavioral Questions）'},mark:'BQ',category:'career',mode:'topics',practiceMode:'response',source:prep,
  description:{en:'Practice nontechnical interview questions with real stories, clear personal actions and honest reflection.',zh:'用真实经历练习非技术面试题，讲清个人行动、结果与反思。'},
  prerequisite:{en:'Bring examples from work, study, volunteering or personal projects. No management experience or coding required.',zh:'准备工作、学习、志愿活动或个人项目中的经历；无需管理经验或编程。'},stages:[
    pathStage('behavioral-interviews','foundation',{en:'Build a small bank of true stories and prepare concise answers without inventing outcomes.',zh:'整理一组真实故事，准备简洁回答，不编造结果。'},prep,[
      ['intent','Understand the question','理解题目考察什么','Identify the behavior and constraints before choosing a relevant example.','先辨认要考察的行为和条件，再选择相关经历。','When asked about conflict, why is a story with no disagreement a weak fit?','被问到冲突时，为什么完全没有分歧的故事不合适？'],
      ['story-bank','Build a true story bank','整理真实故事库','Map genuine work, school and volunteer experiences to several competencies.','把真实工作、学校和志愿经历对应到不同能力。','Which real example could show how you helped someone else succeed?','哪个真实例子能说明你如何帮助别人成功？'],
      ['star','STAR answer structure','STAR 回答结构','Give enough situation and task context, then focus on actions and results.','简要交代背景和任务，把重点放在行动与结果。','Tell me about a time you solved a difficult problem.','讲一次你解决困难问题的经历。'],
      ['ownership','Personal contribution','讲清个人贡献','Separate your own decisions and actions from the team effort.','区分你自己的决定、行动与团队共同完成的工作。','What did you personally do in a successful team project?','一次成功的团队项目中，你个人具体做了什么？'],
      ['evidence','Results without invented numbers','用真实证据说明结果','Use observed outcomes and name uncertainty instead of inventing metrics.','使用观察到的结果，说明不确定之处，不编造数字。','How would you explain impact when no reliable percentage was recorded?','没有记录可靠百分比时，你会怎样说明影响？'],
      ['introduction','Tell me about yourself','自我介绍','Connect a short introduction to the role using relevant experience.','用相关经历把简短介绍与目标岗位联系起来。','Tell me about yourself and the experience relevant to this role.','介绍一下你自己，以及与这个岗位相关的经历。',careers],
      ['strengths','Strengths & development areas','优势与待提升之处','Support a strength with evidence and describe a real improvement habit.','用证据支持优势，并说明真实的改进习惯。','What is one skill you are actively improving, and how?','你正在主动提升哪项能力，具体怎样做？',careers],
      ['motivation','Role motivation & fit','求职动机与岗位匹配','Explain interest using stated role information and your own goals.','根据已知岗位信息和个人目标解释兴趣。','Why does this role interest you beyond its title?','除了职位名称，这个岗位还有什么吸引你？',careers]
    ]),
    pathStage('behavioral-interviews','practice',{en:'Practice collaboration, setbacks and priorities with a first answer and one changed follow-up.',zh:'练习协作、挫折与优先级，回答首问，再应对条件变化的追问。'},prep,[
      ['teamwork','Teamwork & collaboration','团队协作','Describe how you shared context, clarified responsibilities and supported delivery.','说明怎样共享信息、明确责任并支持交付。','Tell me about a time your team worked through a difficult handoff.','讲一次团队克服困难交接的经历。',careers],
      ['conflict','Disagreement & conflict','分歧与冲突','Explain the disagreement, listening, decision and working relationship respectfully.','尊重地说明分歧、倾听、决定和后续合作。','Tell me about a time you disagreed with a teammate.','讲一次你与队友意见不一致的经历。'],
      ['feedback','Giving & receiving feedback','给予和接受反馈','Use a concrete example of feedback, your response and a later adjustment.','用具体例子说明反馈、你的回应和后续调整。','Tell me about difficult feedback that changed how you worked.','讲一次让你改变工作方式的困难反馈。',careers],
      ['mistake','Mistakes & accountability','错误与责任担当','Own your part, contain harm and describe what changed afterward.','承认自己的责任、控制影响，并说明后续改变。','Tell me about a mistake you made and how you handled it.','讲一次你犯下的错误，以及你怎样处理。'],
      ['deadlines','Missed deadlines & early communication','延期与提前沟通','Explain early warning, scope decisions and recovery without hiding a missed commitment.','说明预警、范围取舍和补救，不隐瞒未履约。','Tell me about a time a deadline was at risk.','讲一次截止日期面临风险的经历。'],
      ['priorities','Competing priorities','多项任务的优先级','Compare impact, urgency and dependencies and communicate the trade-off.','比较影响、紧急程度与依赖，并沟通取舍。','Tell me about a time you had more important tasks than time.','讲一次重要任务太多、时间不够的经历。'],
      ['ambiguity','Ambiguity & asking for clarity','信息不全与澄清','Identify unknowns, ask focused questions and make a reversible next step.','识别未知信息、提出具体问题，并选择可调整的下一步。','Tell me about a time you started with unclear requirements.','讲一次你在要求不清楚时开始工作的经历。'],
      ['customer','Customer needs & service','用户需求与服务','Show how you checked the actual need and followed up on the outcome.','说明怎样确认真实需求，并跟进结果。','Tell me about a time you helped a frustrated customer or user.','讲一次你帮助失望客户或用户的经历。']
    ]),
    pathStage('behavioral-interviews','advanced',{en:'Run a mock interview with follow-ups, honest limits and a personal revision plan.',zh:'完成带追问的模拟面试，说明真实边界，并整理个人改进计划。'},careers,[
      ['influence','Influence without authority','没有职权时推动合作','Explain how evidence, listening and shared goals helped others choose an action.','说明怎样通过证据、倾听和共同目标推动行动。','Tell me about a time you persuaded someone you did not manage.','讲一次你说服不归你管理的人的经历。'],
      ['mentoring','Leadership & mentoring','领导力与辅导','Show how you enabled another person without taking credit for their work.','说明怎样帮助别人，并保留对方应得的功劳。','Tell me about a time you helped someone learn or become independent.','讲一次你帮助别人学习或独立完成工作的经历。'],
      ['stakeholders','Difficult stakeholder conversations','困难的相关方沟通','Describe competing needs, respectful boundaries and a clear agreed next step.','说明不同诉求、尊重的边界和约定的下一步。','Tell me about a time you had to say no to an important request.','讲一次你必须拒绝重要请求的经历。'],
      ['change','Adapting to change','适应变化','Explain how you changed the plan, learned what was needed and checked the result.','说明怎样调整计划、补充学习并检查结果。','Tell me about a time a major change disrupted your plan.','讲一次重大变化打乱原计划的经历。'],
      ['integrity','Integrity & difficult decisions','诚信与困难决定','Protect confidentiality and explain a principled decision with real trade-offs.','保护保密信息，并说明有实际取舍的原则性决定。','Tell me about a time doing the right thing was inconvenient.','讲一次坚持正确做法会带来不便的经历。'],
      ['failure','Failure & lessons applied','失败与落实改进','Distinguish an unsuccessful outcome from what you changed in a later attempt.','区分失败结果与后来一次尝试中落实的改进。','Tell me about a failure and what you did differently afterward.','讲一次失败，以及之后你做出了什么不同改变。'],
      ['follow-ups','Follow-ups & honest uncertainty','追问与诚实说明未知','Keep details consistent and acknowledge missing knowledge instead of fabricating facts.','保持细节一致，承认未知，不编造事实。','What would you do differently, and how do you know your action helped?','你会做出什么不同选择？你怎样知道行动有效？',prep],
      ['mock-interview','Mock interview & self-review','模拟面试与自我复盘','Answer a fresh question, handle a changed follow-up and choose one concrete revision.','回答新问题、应对变化追问，并选定一项具体改进。','Which detail in your answer best proves your personal action, and what is still missing?','回答中哪个细节最能证明你的个人行动？还缺什么？',prep]
    ])
  ]
}];
