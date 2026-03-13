import React, { useState, useEffect } from 'react';
import './AsyncVisualizer.css';

interface Frame {
  callStack: string[];
  webApi: string[];
  microtaskQueue: string[];
  taskQueue: string[];
  outputLog: string[];
  description: string;
  activeCodeLine?: number;
  eventLoopStatus: 'idle' | 'stack' | 'microtasks' | 'tasks';
}

interface Scenario {
  name: string;
  code: string;
  frames: Frame[];
}

const SCENARIOS: Scenario[] = [
  {
    name: 'Promise vs Timeout (The Classic)',
    code: `console.log('Start');

setTimeout(() => {
  console.log('Timeout (Task)');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise (Microtask)');
});

console.log('End');`,
    frames: [
      {
        callStack: [],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: [],
        description: 'Ready to start.',
        activeCodeLine: 0,
        eventLoopStatus: 'idle',
      },
      {
        callStack: ["console.log('Start')"],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: [],
        description: 'Executing synchronous console.log.',
        activeCodeLine: 1,
        eventLoopStatus: 'stack',
      },
      {
        callStack: [],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: ['Start'],
        description: "'Start' is printed.",
        activeCodeLine: 1,
        eventLoopStatus: 'stack',
      },
      {
        callStack: ['setTimeout(...)'],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: ['Start'],
        description: 'Calling setTimeout. This is a Web API.',
        activeCodeLine: 3,
        eventLoopStatus: 'stack',
      },
      {
        callStack: [],
        webApi: ['Timer (0ms)'],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: ['Start'],
        description: 'setTimeout is moved to Web APIs to handle the timer.',
        activeCodeLine: 3,
        eventLoopStatus: 'stack',
      },
      {
        callStack: [],
        webApi: [],
        microtaskQueue: [],
        taskQueue: ["() => console.log('Timeout')"],
        outputLog: ['Start'],
        description: 'Timer finished! Web API moves the callback to the Task Queue.',
        activeCodeLine: 5,
        eventLoopStatus: 'stack',
      },
      {
        callStack: ['Promise.resolve().then(...)'],
        webApi: [],
        microtaskQueue: [],
        taskQueue: ["() => console.log('Timeout')"],
        outputLog: ['Start'],
        description: 'Registering Promise handler.',
        activeCodeLine: 7,
        eventLoopStatus: 'stack',
      },
      {
        callStack: [],
        webApi: ['Promise Resolution'],
        microtaskQueue: [],
        taskQueue: ["() => console.log('Timeout')"],
        outputLog: ['Start'],
        description: 'Promises are also handled by the environment.',
        activeCodeLine: 7,
        eventLoopStatus: 'stack',
      },
      {
        callStack: [],
        webApi: [],
        microtaskQueue: ["() => console.log('Promise')"],
        taskQueue: ["() => console.log('Timeout')"],
        outputLog: ['Start'],
        description: 'Once resolved, the handler moves to the Microtask Queue.',
        activeCodeLine: 9,
        eventLoopStatus: 'stack',
      },
      {
        callStack: ["console.log('End')"],
        webApi: [],
        microtaskQueue: ["() => console.log('Promise')"],
        taskQueue: ["() => console.log('Timeout')"],
        outputLog: ['Start'],
        description: 'Executing synchronous console.log.',
        activeCodeLine: 11,
        eventLoopStatus: 'stack',
      },
      {
        callStack: [],
        webApi: [],
        microtaskQueue: ["() => console.log('Promise')"],
        taskQueue: ["() => console.log('Timeout')"],
        outputLog: ['Start', 'End'],
        description: "'End' is printed. Call Stack is empty.",
        activeCodeLine: 11,
        eventLoopStatus: 'idle',
      },
      {
        callStack: [],
        webApi: [],
        microtaskQueue: ["() => console.log('Promise')"],
        taskQueue: ["() => console.log('Timeout')"],
        outputLog: ['Start', 'End'],
        description: 'Event Loop checks Microtask Queue (Microtasks > Tasks).',
        activeCodeLine: 11,
        eventLoopStatus: 'microtasks',
      },
      {
        callStack: ["() => console.log('Promise')"],
        webApi: [],
        microtaskQueue: [],
        taskQueue: ["() => console.log('Timeout')"],
        outputLog: ['Start', 'End'],
        description: 'Moving Microtask to Call Stack.',
        activeCodeLine: 8,
        eventLoopStatus: 'stack',
      },
      {
        callStack: [],
        webApi: [],
        microtaskQueue: [],
        taskQueue: ["() => console.log('Timeout')"],
        outputLog: ['Start', 'End', 'Promise (Microtask)'],
        description: "'Promise' is printed.",
        activeCodeLine: 8,
        eventLoopStatus: 'idle',
      },
      {
        callStack: [],
        webApi: [],
        microtaskQueue: [],
        taskQueue: ["() => console.log('Timeout')"],
        outputLog: ['Start', 'End', 'Promise (Microtask)'],
        description: 'Microtask Queue empty. Event Loop checks Task Queue.',
        activeCodeLine: 8,
        eventLoopStatus: 'tasks',
      },
      {
        callStack: ["() => console.log('Timeout')"],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: ['Start', 'End', 'Promise (Microtask)'],
        description: 'Moving Task to Call Stack.',
        activeCodeLine: 4,
        eventLoopStatus: 'stack',
      },
      {
        callStack: [],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: ['Start', 'End', 'Promise (Microtask)', 'Timeout (Task)'],
        description: "'Timeout' is printed. All done!",
        activeCodeLine: 4,
        eventLoopStatus: 'idle',
      },
    ],
  },
  {
    name: 'Async/Await Flow',
    code: `async function myAsync() {
  console.log('Async Start');
  await Promise.resolve();
  console.log('Async After Await');
}

console.log('Before');
myAsync();
console.log('After');`,
    frames: [
      {
        callStack: [],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: [],
        description: 'Ready to start.',
        activeCodeLine: 0,
        eventLoopStatus: 'idle',
      },
      {
        callStack: ["console.log('Before')"],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: [],
        description: 'Executing synchronous code.',
        activeCodeLine: 7,
        eventLoopStatus: 'stack',
      },
      {
        callStack: [],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: ['Before'],
        description: "'Before' is printed.",
        activeCodeLine: 7,
        eventLoopStatus: 'stack',
      },
      {
        callStack: ['myAsync()'],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: ['Before'],
        description: 'Calling myAsync function.',
        activeCodeLine: 8,
        eventLoopStatus: 'stack',
      },
      {
        callStack: ['myAsync()', "console.log('Async Start')"],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: ['Before'],
        description: 'Inside myAsync, executing synchronously until await.',
        activeCodeLine: 2,
        eventLoopStatus: 'stack',
      },
      {
        callStack: ['myAsync()'],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: ['Before', 'Async Start'],
        description: "'Async Start' is printed.",
        activeCodeLine: 2,
        eventLoopStatus: 'stack',
      },
      {
        callStack: ['myAsync()', 'await Promise.resolve()'],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: ['Before', 'Async Start'],
        description: "Encountering 'await'.",
        activeCodeLine: 3,
        eventLoopStatus: 'stack',
      },
      {
        callStack: [],
        webApi: ['Await Resolution'],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: ['Before', 'Async Start'],
        description: "'await' pauses the function and hands over the promise to the environment.",
        activeCodeLine: 3,
        eventLoopStatus: 'stack',
      },
      {
        callStack: [],
        webApi: [],
        microtaskQueue: ['(Resume myAsync)'],
        taskQueue: [],
        outputLog: ['Before', 'Async Start'],
        description:
          "The rest of the async function is scheduled as a Microtask.",
        activeCodeLine: 3,
        eventLoopStatus: 'stack',
      },
      {
        callStack: ["console.log('After')"],
        webApi: [],
        microtaskQueue: ['(Resume myAsync)'],
        taskQueue: [],
        outputLog: ['Before', 'Async Start'],
        description: 'Call stack is free, so we continue with synchronous code.',
        activeCodeLine: 9,
        eventLoopStatus: 'stack',
      },
      {
        callStack: [],
        webApi: [],
        microtaskQueue: ['(Resume myAsync)'],
        taskQueue: [],
        outputLog: ['Before', 'Async Start', 'After'],
        description: "'After' is printed. Call Stack empty.",
        activeCodeLine: 9,
        eventLoopStatus: 'idle',
      },
      {
        callStack: [],
        webApi: [],
        microtaskQueue: ['(Resume myAsync)'],
        taskQueue: [],
        outputLog: ['Before', 'Async Start', 'After'],
        description:
          "Event Loop checks Microtask Queue and picks up 'Resume myAsync'.",
        activeCodeLine: 4,
        eventLoopStatus: 'microtasks',
      },
      {
        callStack: ['(Resume myAsync)', "console.log('Async After Await')"],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: ['Before', 'Async Start', 'After'],
        description: 'Executing the rest of the async function.',
        activeCodeLine: 4,
        eventLoopStatus: 'stack',
      },
      {
        callStack: [],
        webApi: [],
        microtaskQueue: [],
        taskQueue: [],
        outputLog: ['Before', 'Async Start', 'After', 'Async After Await'],
        description: "'Async After Await' printed. Done!",
        activeCodeLine: 4,
        eventLoopStatus: 'idle',
      },
    ],
  },
];

const AsyncVisualizer: React.FC = () => {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [frameIdx, setFrameIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const scenario = SCENARIOS[scenarioIdx];
  const frame = scenario.frames[frameIdx];

  useEffect(() => {
    let timer: number;
    if (autoPlay && frameIdx < scenario.frames.length - 1) {
      timer = window.setTimeout(() => {
        setFrameIdx((f) => f + 1);
      }, 1200);
    } else if (frameIdx === scenario.frames.length - 1) {
      setAutoPlay(false);
    }
    return () => clearTimeout(timer);
  }, [autoPlay, frameIdx, scenario.frames.length]);

  const handleNext = () => {
    if (frameIdx < scenario.frames.length - 1) {
      setFrameIdx((f) => f + 1);
    }
  };

  const handleReset = () => {
    setFrameIdx(0);
    setAutoPlay(false);
  };

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScenarioIdx(Number(e.target.value));
    setFrameIdx(0);
    setAutoPlay(false);
  };

  return (
    <div className="visualizer-container">
      <header className="visualizer-header">
        <h1>JS Asynchronous Loop Visualizer</h1>
        <p>눈으로 확인하는 자바스크립트 비동기 동작 원리 (Stack, Web APIs, Queues)</p>
      </header>

      <div className="controls">
        <select onChange={handleScenarioChange} value={scenarioIdx}>
          {SCENARIOS.map((s, idx) => (
            <option key={idx} value={idx}>
              {s.name}
            </option>
          ))}
        </select>
        <button onClick={() => setAutoPlay(!autoPlay)}>
          {autoPlay ? 'Pause' : 'Auto Play'}
        </button>
        <button
          onClick={handleNext}
          disabled={frameIdx === scenario.frames.length - 1}
        >
          Next Step
        </button>
        <button onClick={handleReset}>Reset</button>
      </div>

      <div className="main-grid">
        <div className="code-section card">
          <h3>Source Code</h3>
          <pre className="code-block">
            {scenario.code.split('\n').map((line, i) => (
              <div
                key={i}
                className={`code-line ${
                  frame.activeCodeLine === i + 1 ? 'active' : ''
                }`}
              >
                <span className="line-num">{i + 1}</span>
                {line}
              </div>
            ))}
          </pre>
          <div className="description-box">
            <strong>Step Description:</strong> {frame.description}
          </div>
        </div>
        <div className="visual-section">
          <div className="event-loop-container">
            <div className={`event-loop-wheel ${frame.eventLoopStatus}`}>
              <div className="event-loop-label">Event Loop</div>
              <div className="event-loop-status">{frame.eventLoopStatus.toUpperCase()}</div>
            </div>
            <div className="event-loop-arrows">
              <div className={`arrow to-stack ${frame.eventLoopStatus === 'stack' ? 'active' : ''}`}>↑ Call Stack</div>
              <div className={`arrow from-microtask ${frame.eventLoopStatus === 'microtasks' ? 'active' : ''}`}>← Microtasks</div>
              <div className={`arrow from-task ${frame.eventLoopStatus === 'tasks' ? 'active' : ''}`}>↓ Tasks</div>
            </div>
          </div>

          <div className="top-visuals">
            <div className="stack-area card">
              <h3>Call Stack</h3>
              <div className="stack-container">
                {frame.callStack.length === 0 && (
                  <div className="empty-label">Empty</div>
                )}
                {[...frame.callStack].reverse().map((item, i) => (
                  <div key={i} className="stack-item">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="web-api-area card">
              <h3>Web APIs</h3>
              <div className="web-api-container">
                {frame.webApi.length === 0 && (
                  <div className="empty-label">Idle</div>
                )}
                {frame.webApi.map((item, i) => (
                  <div key={i} className="web-api-item">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="queues-area">
            <div className="queue-box card microtask">
              <h3>Microtask Queue (Promises)</h3>
              <div className="queue-container">
                {frame.microtaskQueue.length === 0 && (
                  <span className="empty-label">Empty</span>
                )}
                {frame.microtaskQueue.map((item, i) => (
                  <div key={i} className="queue-item microtask-item">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="queue-box card task">
              <h3>Task Queue (setTimeout)</h3>
              <div className="queue-container">
                {frame.taskQueue.length === 0 && (
                  <span className="empty-label">Empty</span>
                )}
                {frame.taskQueue.map((item, i) => (
                  <div key={i} className="queue-item task-item">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="output-section card">
          <h3>Console Output</h3>
          <div className="output-log">
            {frame.outputLog.map((log, i) => (
              <div key={i} className="log-line">
                {'>'} {log}
              </div>
            ))}
            <div className="cursor">_</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsyncVisualizer;
