import './ProgressSteps.css';

export interface StepInfo {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

interface ProgressStepsProps {
  steps: StepInfo[];
  currentStep: number;
}

const statusIcon: Record<string, string> = {
  pending: '○',
  active: '◐',
  done: '✓',
  error: '✕',
};

export default function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="progress-steps">
      <div className="steps-header">
        <span className="steps-label">进度</span>
        <span className="steps-count">第 {currentStep + 1}/{steps.length} 步</span>
      </div>
      <div className="steps-track">
        {steps.map((step, i) => (
          <div key={i} className={`step step-${step.status}`}>
            <div className="step-indicator">
              <span className="step-icon">{statusIcon[step.status]}</span>
            </div>
            <span className="step-label">{step.label}</span>
            {i < steps.length - 1 && <div className={`step-line ${steps[i + 1].status !== 'pending' ? 'line-active' : ''}`} />}
          </div>
        ))}
      </div>
    </div>
  );
}
