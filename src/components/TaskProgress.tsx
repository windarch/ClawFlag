import './TaskProgress.css';

export interface TaskStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  duration?: number; // ms
}

interface TaskProgressProps {
  steps: TaskStep[];
  title?: string;
}

const statusIcon: Record<string, string> = {
  pending: '○',
  running: '◐',
  done: '✓',
  error: '✕',
};

export default function TaskProgress({ steps, title }: TaskProgressProps) {
  const currentStep = steps.findIndex(s => s.status === 'running') + 1;
  const totalSteps = steps.length;

  return (
    <div className="task-progress">
      {title && (
        <div className="progress-header">
          <span className="progress-title">{title}</span>
          <span className="progress-count">第 {currentStep || totalSteps}/{totalSteps} 步</span>
        </div>
      )}
      <div className="progress-steps">
        {steps.map((step, i) => (
          <div key={step.id} className={`step step-${step.status}`}>
            <div className="step-indicator">
              <span className="step-icon">{statusIcon[step.status]}</span>
              {i < steps.length - 1 && <div className={`step-line ${steps[i + 1].status !== 'pending' ? 'active' : ''}`} />}
            </div>
            <div className="step-content">
              <span className="step-label">{step.label}</span>
              {step.duration && step.status === 'done' && (
                <span className="step-duration">{(step.duration / 1000).toFixed(1)}s</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
