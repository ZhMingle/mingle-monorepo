import type { StudyLesson } from '../shared/study.ts';

export const responseLesson:StudyLesson={
  overview:'Explain your contribution using a true example. A disappointing outcome can still show responsible action.',
  example:'Fictional example: A school team lost its meeting notes. One member asked everyone to reconstruct decisions, then introduced a shared checklist.',
  pitfall:'Saying only “we worked hard” leaves your personal action unclear.',keywords:[],
  choice:{scenario:'A team missed a handoff. Which answer states a specific personal action?',code:'',question:'Which response identifies what the speaker did?',options:['We all tried very hard.','I asked each teammate to confirm their owner and added the missing handoff to our checklist.','Everyone else caused the delay.'],correct:1,explanation:'The second response names an action by the speaker rather than effort or blame.'},
  coding:{scenario:'Describe a real time you repaired a difficult handoff.',language:'Plain text',starter:'Situation: [true context]\nMy action: [what I did]\nResult: [what I observed]\nFollow-up: [what I cannot measure]',
    requirements:['Use a real work, school, volunteer or personal-project example.','Name your own action and observed result.','Follow-up: if no numerical outcome was recorded, state that limitation without inventing a number.'],
    reference:'Fill-in scaffold: In [true situation], I [specific action]. I observed [actual outcome]. We did not record [unknown measurement], so I cannot claim a percentage.',
    rubric:['Names a relevant situation and specific personal action.','States an observed result and acknowledges the missing measurement.'],
    cases:[{id:'c1',input:'Primary answer: describe the handoff and your contribution.',expected:'Identifies a personal action and observed outcome.'},{id:'c2',input:'Follow-up: no reliable percentage was recorded.',expected:'Acknowledges uncertainty without inventing a percentage.'}],
    fixtures:{correct:'Fictional sample: In a school project I asked each member to confirm an owner and added a handoff checklist. The next handoff included all notes. We did not record time savings, so I cannot give a percentage.',incorrect:'We were great and achieved 90% improvement. I do not know what I did or how we measured it.'}
  }
};
