import LearningText from './LearningText.tsx';

export default function OptionContent({text,pathId=''}:{text:string;pathId?:string}) {
  return <div className="option-content"><LearningText text={text} pathId={pathId}/></div>;
}
