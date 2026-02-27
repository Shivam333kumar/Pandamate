
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../state';

interface PandaMascotProps {
  size?: 'small' | 'large';
  staticPosition?: boolean;
}

type Expression = 'HAPPY' | 'BLINK' | 'WINK' | 'OOH' | 'SMILE' | 'DIZZY' | 'SHOCKED' | 'SLEEPY' | 'HIDING';
type ExerciseType = 'LIFT' | 'STRETCH' | 'JOG';

const PandaMascot: React.FC<PandaMascotProps> = ({ size = 'small', staticPosition = false }) => {
  const { tasks, pandaState, setPandaState } = useApp();
  const [pos, setPos] = useState({ x: 80, y: 80 });
  const [isWalking, setIsWalking] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isFallen, setIsFallen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [targetPos, setTargetPos] = useState({ x: 80, y: 80 });
  const [facingLeft, setFacingLeft] = useState(false);
  const [userPlaced, setUserPlaced] = useState(false);
  const [expression, setExpression] = useState<Expression>('HAPPY');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('LIFT');

  const isMoving = isWalking || isRunning;

  const currentTask = useMemo(() => {
    const now = new Date();
    return tasks.find(t => {
      const start = new Date(t.startTime);
      const end = new Date(start.getTime() + t.durationMinutes * 60000);
      return now >= start && now <= end && t.startTime.startsWith(now.toISOString().split('T')[0]);
    });
  }, [tasks]);

  useEffect(() => {
    if (isFallen || isRunning || isDragging) return;
    if (currentTask) {
      const cat = currentTask.category;
      if (cat === 'Mind') setPandaState('MEDITATING');
      else if (cat === 'Body') setPandaState('EXERCISING');
      else if (cat === 'Study') setPandaState('READING');
      else if (cat === 'Sleep') setPandaState('SLEEPING');
      else setPandaState('IDLE');
    } else if (!isWalking && pandaState !== 'PLAYING' && pandaState !== 'SHOCKED' && pandaState !== 'HIDING') {
      setPandaState('IDLE');
    }
  }, [currentTask, isWalking, isDragging, isFallen, isRunning, setPandaState, pandaState]);

  useEffect(() => {
    if (currentTask && isFallen) {
      setIsFallen(false);
      setExpression('HAPPY');
      setPos(p => ({ ...p, y: 80 }));
    }
  }, [currentTask, isFallen]);

  useEffect(() => {
    if (pandaState !== 'EXERCISING' || isFallen || isRunning) return;
    const types: ExerciseType[] = ['LIFT', 'STRETCH', 'JOG'];
    let idx = types.indexOf(exerciseType);
    const interval = setInterval(() => {
      idx = (idx + 1) % types.length;
      setExerciseType(types[idx]);
    }, 10000);
    return () => clearInterval(interval);
  }, [pandaState, exerciseType, isFallen, isRunning]);

  useEffect(() => {
    if (isFallen) { setExpression('DIZZY'); return; }
    if (pandaState === 'SLEEPING') { setExpression('SLEEPY'); return; }
    
    const expressions: Expression[] = ['HAPPY', 'BLINK', 'WINK', 'OOH', 'SMILE'];
    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        const randomExpr = expressions[Math.floor(Math.random() * expressions.length)];
        setExpression(randomExpr);
        setTimeout(() => setExpression('HAPPY'), 1500);
      }
    }, 5000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [isFallen, pandaState]);

  useEffect(() => {
    if (staticPosition || isDragging || isFallen || isRunning || pandaState === 'SLEEPING' || userPlaced || pandaState !== 'IDLE') return;
    const wander = () => {
      const newX = Math.max(15, Math.min(85, pos.x + (Math.random() * 30 - 15)));
      const newY = Math.max(30, Math.min(80, pos.y + (Math.random() * 15 - 7.5)));
      setTargetPos({ x: newX, y: newY });
      setIsWalking(true);
      setFacingLeft(newX < pos.x);
    };
    const interval = setInterval(wander, 7000);
    return () => clearInterval(interval);
  }, [staticPosition, pos.x, pos.y, pandaState, isDragging, userPlaced, isFallen, isRunning]);

  useEffect(() => {
    if ((!isWalking && !isRunning) || isDragging || isFallen) return;
    const speed = isRunning ? 0.08 : 0.02;
    const moveTimer = setInterval(() => {
      setPos(current => {
        const dx = targetPos.x - current.x;
        const dy = targetPos.y - current.y;
        if (Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) {
          if (isRunning) {
            setIsRunning(false);
            setIsFallen(true);
            return { x: current.x, y: 92 }; 
          }
          setIsWalking(false);
          return current;
        }
        return { x: current.x + dx * speed, y: current.y + dy * speed };
      });
    }, 16);
    return () => clearInterval(moveTimer);
  }, [isWalking, isRunning, targetPos, isDragging, isFallen]);

  const handlePandaClick = () => {
    if (isFallen || isRunning || isDragging || staticPosition) return;
    setIsRunning(true);
    setIsWalking(false);
    const nearestX = pos.x < 50 ? 8 : 92;
    setFacingLeft(nearestX < pos.x);
    setTargetPos({ x: nearestX, y: pos.y });
    setTimeout(() => {
      if (!currentTask) {
        setIsFallen(false);
        setExpression('HAPPY');
        setPos(p => ({ ...p, y: 80 }));
      }
    }, 8000);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (staticPosition || isFallen || isRunning) return;
    setIsDragging(true);
    setIsWalking(false);
    setUserPlaced(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    setPos({ x, y });
    setTargetPos({ x, y });
  };

  const pandaSize = size === 'small' ? 'w-24 h-24' : 'w-64 h-64';

  const renderPandaSVG = () => {
    const limbL = isRunning ? 'ani-run-l' : (isWalking ? 'ani-walk-l' : '');
    const limbR = isRunning ? 'ani-run-r' : (isWalking ? 'ani-walk-r' : '');

    const Ears = ({ scale = 1 }) => (
      <g transform={`scale(${scale})`}>
        <g className="ani-ear" style={{ transformOrigin: '-55px -35px' }}>
          <circle cx="-55" cy="-35" r="28" fill="#1C1B1F" />
        </g>
        <g className="ani-ear" style={{ transformOrigin: '55px -35px', animationDelay: '1s' }}>
          <circle cx="55" cy="-35" r="28" fill="#1C1B1F" />
        </g>
      </g>
    );

    return (
      <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
        <style>
          {`
            @keyframes idle-sway { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-3px) rotate(1deg); } }
            @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
            @keyframes limb-swing-l { 0%, 100% { transform: rotate(-25deg); } 50% { transform: rotate(15deg); } }
            @keyframes limb-swing-r { 0%, 100% { transform: rotate(15deg); } 50% { transform: rotate(-25deg); } }
            @keyframes run-swing-l { 0%, 100% { transform: rotate(-60deg); } 50% { transform: rotate(45deg); } }
            @keyframes run-swing-r { 0%, 100% { transform: rotate(45deg); } 50% { transform: rotate(-60deg); } }
            @keyframes lift-up { 0%, 100% { transform: translateY(20px); } 50% { transform: translateY(-40px); } }
            @keyframes stretch { 0%, 100% { transform: rotate(-12deg); } 50% { transform: rotate(12deg); } }
            @keyframes jog-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
            @keyframes zzz-float { 0% { transform: translate(0,0) scale(0.6); opacity: 0; } 50% { opacity: 1; } 100% { transform: translate(35px, -70px) scale(1.3); opacity: 0; } }
            @keyframes head-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes star-orbit { 0% { transform: rotate(0deg) translateX(50px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(50px) rotate(-360deg); } }
            @keyframes ear-wiggle { 0%, 90%, 100% { transform: rotate(0); } 95% { transform: rotate(-8deg); } }
            
            .ani-idle { animation: idle-sway 4s infinite ease-in-out; }
            .ani-breathe { animation: breathe 3s infinite ease-in-out; transform-origin: center; }
            .ani-walk-l { animation: limb-swing-l 0.6s infinite ease-in-out; transform-origin: top center; }
            .ani-walk-r { animation: limb-swing-r 0.6s infinite ease-in-out; transform-origin: top center; }
            .ani-run-l { animation: run-swing-l 0.3s infinite ease-in-out; transform-origin: top center; }
            .ani-run-r { animation: run-swing-r 0.3s infinite ease-in-out; transform-origin: top center; }
            .ani-lift { animation: lift-up 0.8s infinite ease-in-out; }
            .ani-stretch { animation: stretch 2s infinite ease-in-out; transform-origin: bottom center; }
            .ani-jog { animation: jog-bounce 0.4s infinite ease-in-out; }
            .ani-zzz { animation: zzz-float 4s infinite linear; }
            .ani-spin { animation: head-spin 1.2s infinite linear; }
            .ani-star { animation: star-orbit 2s infinite linear; }
            .ani-ear { animation: ear-wiggle 6s infinite ease-in-out; }
          `}
        </style>

        {isFallen ? (
          <g transform="translate(200, 250)">
            <g className="ani-star"><path d="M 0,-10 L 3,-3 L 10,-3 L 4,2 L 6,10 L 0,5 L -6,10 L -4,2 L -10,-3 L -3,-3 Z" fill="#FFD700" transform="translate(0, -140)"/></g>
            <g className="ani-star" style={{animationDelay: '-1s'}}><path d="M 0,-10 L 3,-3 L 10,-3 L 4,2 L 6,10 L 0,5 L -6,10 L -4,2 L -10,-3 L -3,-3 Z" fill="#FFD700" transform="translate(0, -140)"/></g>
            <ellipse cx="0" cy="20" rx="120" ry="45" fill="#FFFFFF" stroke="#1C1B1F" strokeWidth="7" />
            <ThickPaw cx="-95" cy="40" rotation={-100} />
            <ThickPaw cx="95" cy="40" rotation={100} />
            <ThickPaw cx="-35" cy="-15" rotation={180} />
            <ThickPaw cx="35" cy="-15" rotation={180} />
            <g className="ani-spin" style={{transformOrigin: '0px -65px'}}>
              <g transform="translate(0, -65)">
                <Ears scale={1} />
                <circle cx="0" cy="0" r="75" fill="#FFFFFF" stroke="#1C1B1F" strokeWidth="7" />
                <Face expression="DIZZY" offset={0} />
              </g>
            </g>
          </g>
        ) : (
          <g transform="translate(200, 150)" className={isMoving ? '' : 'ani-idle'}>
            <g className="ani-breathe">
              <ellipse cx="0" cy="35" rx="85" ry="95" fill="#FFFFFF" stroke="#1C1B1F" strokeWidth="7" />
              {pandaState === 'MEDITATING' ? (
                <g>
                   <ThickPaw cx="-75" cy="90" rotation={90} />
                   <ThickPaw cx="75" cy="90" rotation={-90} />
                   <ThickPaw cx="-95" cy="45" rotation={-45} />
                   <ThickPaw cx="95" cy="45" rotation={45} />
                </g>
              ) : pandaState === 'EXERCISING' ? (
                <g className={exerciseType === 'JOG' ? 'ani-jog' : ''}>
                  {exerciseType === 'LIFT' ? (
                    <g className="ani-lift">
                      <rect x="-140" y="-35" width="280" height="22" fill="#333" rx="7" stroke="#1C1B1F" strokeWidth="4" />
                      <circle cx="-140" cy="-24" r="38" fill="#111" />
                      <circle cx="140" cy="-24" r="38" fill="#111" />
                      <ThickPaw cx="-100" cy="-5" />
                      <ThickPaw cx="100" cy="-5" />
                    </g>
                  ) : exerciseType === 'STRETCH' ? (
                    <g className="ani-stretch">
                       <ThickPaw cx="-110" cy="35" rotation={-55} />
                       <ThickPaw cx="110" cy="35" rotation={55} />
                    </g>
                  ) : (
                    <g>
                       <ThickPaw cx="-55" cy="100" aniClass="ani-walk-l" />
                       <ThickPaw cx="55" cy="100" aniClass="ani-walk-r" />
                       <ThickPaw cx="-95" cy="55" aniClass="ani-walk-r" />
                       <ThickPaw cx="95" cy="55" aniClass="ani-walk-l" />
                    </g>
                  )}
                  {exerciseType !== 'JOG' && (
                    <g>
                       <ThickPaw cx="-55" cy="100" />
                       <ThickPaw cx="55" cy="100" />
                    </g>
                  )}
                </g>
              ) : pandaState === 'SLEEPING' ? (
                <g>
                   <ThickPaw cx="-55" cy="105" />
                   <ThickPaw cx="55" cy="105" />
                   <ThickPaw cx="-70" cy="65" rotation={25} />
                   <ThickPaw cx="70" cy="65" rotation={-25} />
                   <text x="50" y="-90" fontSize="35" fontWeight="900" fill="#4299E1" className="ani-zzz">Z</text>
                   <text x="75" y="-120" fontSize="25" fontWeight="900" fill="#4299E1" className="ani-zzz" style={{animationDelay: '1.5s'}}>Z</text>
                </g>
              ) : pandaState === 'READING' ? (
                <g>
                   <ThickPaw cx="-55" cy="100" />
                   <ThickPaw cx="55" cy="100" />
                   <rect x="-65" y="50" width="130" height="75" fill="#8B4513" stroke="#1C1B1F" strokeWidth="5" rx="7" />
                   <line x1="0" y1="50" x2="0" y2="125" stroke="#1C1B1F" strokeWidth="4" />
                   <ThickPaw cx="-75" cy="75" rotation={40} />
                   <ThickPaw cx="75" cy="75" rotation={-40} />
                </g>
              ) : (
                <g>
                   <ThickPaw cx="-55" cy="100" aniClass={limbL} />
                   <ThickPaw cx="55" cy="100" aniClass={limbR} />
                   <ThickPaw cx="-95" cy="55" aniClass={limbR} />
                   <ThickPaw cx="95" cy="55" aniClass={limbL} />
                </g>
              )}
            </g>

            <g transform="translate(0, -60)">
              <Ears />
              <circle cx="0" cy="0" r="75" fill="#FFFFFF" stroke="#1C1B1F" strokeWidth="7" />
              <Face expression={expression} offset={0} />
            </g>
          </g>
        )}
      </svg>
    );
  };

  return (
    <div 
      onClick={handlePandaClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => setIsDragging(false)}
      className={`fixed z-[100] flex flex-col items-center select-none transition-all duration-1000 ease-linear cursor-pointer`}
      style={staticPosition ? { position: 'relative' } : {
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: `translate(-50%, -100%) scale(${facingLeft ? -1 : 1}, 1)`,
        touchAction: 'none'
      }}
    >
      <div className={`mb-4 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl border border-white text-[14px] font-black text-indigo-900 animate-bounce transition-opacity duration-700 pointer-events-none ${pandaState === 'IDLE' && size === 'small' && !isMoving && !isFallen && !isDragging ? 'opacity-0' : 'opacity-100'}`}>
        {isFallen ? 'Ugh... stars... dizzy! 💫' : (isRunning ? 'WAAAAAA! 🏃' : (pandaState === 'SLEEPING' ? 'Zzz...' : (pandaState === 'EXERCISING' ? `Routine: ${exerciseType}! 💪` : 'Hi there!')))}
      </div>
      <div className={`${pandaSize} pointer-events-none`}>
        {renderPandaSVG()}
      </div>
    </div>
  );
};

const ThickPaw = ({ cx, cy, rotation = 0, aniClass = '' }: any) => (
  <g transform={`translate(${cx}, ${cy}) rotate(${rotation})`} className={aniClass}>
    <ellipse cx="0" cy="0" rx="26" ry="34" fill="#1C1B1F" />
    <circle cx="-18" cy="-26" r="9" fill="#1C1B1F" />
    <circle cx="0" cy="-32" r="9" fill="#1C1B1F" />
    <circle cx="18" cy="-26" r="9" fill="#1C1B1F" />
    <ellipse cx="0" cy="7" rx="15" ry="20" fill="#3D3D3D" opacity="0.4" />
  </g>
);

const Face = ({ expression, offset = 0 }: { expression: Expression, offset?: number }) => {
  return (
    <g transform={`translate(0, ${5 + offset})`}>
      {expression === 'DIZZY' || expression === 'SHOCKED' ? (
         <g transform="translate(0, -5)">
            <path d="M -25,-12 L -10,2 M -25,2 L -10,-12" stroke="#1C1B1F" strokeWidth="5" strokeLinecap="round" />
            <path d="M 10,-12 L 25,2 M 10,2 L 25,-12" stroke="#1C1B1F" strokeWidth="5" strokeLinecap="round" />
            {expression === 'SHOCKED' ? (
              <circle cx="0" cy="28" r="16" fill="#1C1B1F" />
            ) : (
              <circle cx="0" cy="22" r="9" fill="none" stroke="#1C1B1F" strokeWidth="4" />
            )}
         </g>
      ) : expression === 'SLEEPY' ? (
         <g transform="translate(0, -5)">
            <path d="M -35,-8 Q -20,8 -10,-8" fill="none" stroke="#1C1B1F" strokeWidth="5" strokeLinecap="round" />
            <path d="M 10,-8 Q 20,8 35,-8" fill="none" stroke="#1C1B1F" strokeWidth="5" strokeLinecap="round" />
            <path d="M -18,22 Q 0,32 18,22" fill="none" stroke="#1C1B1F" strokeWidth="4" opacity="0.4" />
         </g>
      ) : (
         <g transform="translate(0, -5)">
            {expression === 'BLINK' ? (
              <><line x1="-35" y1="-5" x2="-15" y2="-5" stroke="#1C1B1F" strokeWidth="6" strokeLinecap="round" /><line x1="15" y1="-5" x2="35" y2="-5" stroke="#1C1B1F" strokeWidth="6" strokeLinecap="round" /></>
            ) : (
              <><circle cx="-25" cy="-5" r="14" fill="#1C1B1F" /><circle cx="-23" cy="-12" r="6" fill="#FFFFFF" /><circle cx="25" cy="-5" r="14" fill="#1C1B1F" /><circle cx="27" cy="-12" r="6" fill="#FFFFFF" /></>
            )}
            <g transform="translate(0, 25)">
              <ellipse cx="0" cy="0" rx="10" ry="9" fill="#1C1B1F" />
              <path d="M -20,12 Q 0,26 20,12" fill="none" stroke="#1C1B1F" strokeWidth="5" strokeLinecap="round" />
            </g>
         </g>
      )}
    </g>
  );
};

export default PandaMascot;
