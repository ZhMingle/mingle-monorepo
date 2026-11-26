import type { StudyLesson } from '../shared/study.ts';

// Synthetic regression material, never presented as a generated lesson or real campaign.
export const marketingLesson:StudyLesson={
  overview:'ROAS compares attributed revenue with advertising spend; profit also depends on costs.',
  example:'A fictional campaign spends NZD 100 and attributes NZD 400 in revenue: ROAS is 4x.',
  pitfall:'Revenue is not profit.',keywords:[],
  choice:{scenario:'A fictional campaign spends NZD 100 and records NZD 400 in attributed revenue.',code:'',question:'What is its ROAS?',options:['4x','25%','NZD 300 profit'],correct:0,explanation:'4x equals 400 divided by 100. The data do not establish profit.'},
  coding:{language:'Plain text',format:'response',scenario:'Assess a fictional campaign using the supplied revenue, spend and margin.',starter:'Primary calculation: [your answer]\nChanged margin: [your answer]',
    requirements:['Use NZD 1,000 attributed revenue, NZD 200 ad spend and a 30% pre-ad contribution margin; there are no other costs in this simplified case.','Calculate ROAS and contribution after advertising.','Transfer: keep revenue and spend fixed but lower the pre-ad margin to 15%; calculate the new contribution and adapt the recommendation.'],
    reference:'ROAS = 1,000 / 200 = 5x. At 30% margin the contribution after ads is 1,000 × 0.30 − 200 = NZD 100. At 15% it is 1,000 × 0.15 − 200 = −NZD 50. ROAS stays 5x; do not scale solely on ROAS, investigate margin and incremental value first.',
    rubric:['Calculates 5x ROAS and NZD 100 contribution in the primary case.','Calculates −NZD 50 at the changed margin and adjusts the recommendation without inventing extra sales.'],
    cases:[{id:'c1',input:'Revenue NZD 1,000; ad spend NZD 200; pre-ad margin 30%; no other costs.',expected:'5x ROAS and NZD 100 contribution after ads.'},{id:'c2',input:'Same revenue and spend; pre-ad margin falls to 15%.',expected:'ROAS stays 5x; contribution after ads is −NZD 50; avoid scaling on ROAS alone.'}],
    fixtures:{correct:'ROAS is 5x. At 30% margin contribution after ads is NZD 100. At 15% margin contribution is minus NZD 50 while ROAS stays 5x. I would check margin and incremental sales before scaling.',incorrect:'ROAS is 5x, so profit is NZD 800 in both cases. Scale the budget because high revenue proves the campaign is profitable.'}
  }
};
