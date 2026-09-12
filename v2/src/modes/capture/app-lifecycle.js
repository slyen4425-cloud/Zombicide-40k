const clone=value=>structuredClone(value);

export const CAPTURE_APP_LIFECYCLE_CONTRACT=Object.freeze({
  startsDriverWithBattle:true,
  pausesDriverForBlockingUi:true,
  resumesDriverAfterBlockingUi:true,
  stopsDriverWhenBattleEnds:true,
  ownsRealtimeLoop:false,
  fixedRealtimeCadence:false,
  isolatedFromRpg:true,
});

export function createCaptureAppSession({state,scheduler,driver}={}){
  return {
    state,
    scheduler:clone(scheduler),
    driver:clone(driver),
    blocking:false,
  };
}

export function beginCaptureBattleSession(session,battleOptions,{startBattle,startDriver}={}){
  if(typeof startBattle!=='function'||typeof startDriver!=='function') return {ok:false,reason:'capture-lifecycle-dependency-missing',session};
  const started=startBattle(session.state,battleOptions||{});
  if(!started.ok) return {...started,session};
  return {
    ok:true,
    battle:started.battle,
    session:{
      ...session,
      state:started.state,
      driver:startDriver(session.driver),
      blocking:false,
    },
  };
}

export function setCaptureBattleBlocking(session,blocking,{pauseDriver,resumeDriver}={}){
  const blocked=!!blocking;
  if(!session?.state?.battle){
    return {ok:false,reason:'battle-missing',session};
  }
  const driver=blocked
    ? (typeof pauseDriver==='function'?pauseDriver(session.driver):session.driver)
    : (typeof resumeDriver==='function'?resumeDriver(session.driver):session.driver);
  return {ok:true,session:{...session,blocking:blocked,driver}};
}

export function advanceCaptureBattleSession(session,{delta=0,driverOptions={},advanceDriver,stopDriver}={}){
  if(typeof advanceDriver!=='function'||typeof stopDriver!=='function') return {ok:false,reason:'capture-lifecycle-dependency-missing',session};
  if(!session?.state?.battle){
    return {ok:false,reason:'battle-missing',session:{...session,driver:stopDriver(session.driver)}};
  }
  const advanced=advanceDriver(session.state,session.scheduler,session.driver,{...driverOptions,delta});
  if(!advanced.ok) return {...advanced,session};
  const battleEnded=!advanced.state?.battle||advanced.results?.some(entry=>entry?.ended);
  const nextSession={
    ...session,
    state:advanced.state,
    scheduler:advanced.scheduler,
    driver:battleEnded?stopDriver(advanced.driver):advanced.driver,
    blocking:battleEnded?false:session.blocking,
  };
  return {...advanced,battleEnded,session:nextSession};
}

export function finishCaptureBattleSession(session,reason,{finishBattle,stopDriver}={}){
  if(typeof finishBattle!=='function'||typeof stopDriver!=='function') return {ok:false,reason:'capture-lifecycle-dependency-missing',session};
  if(!session?.state?.battle){
    return {ok:false,reason:'battle-missing',session:{...session,driver:stopDriver(session.driver),blocking:false}};
  }
  const finished=finishBattle(session.state,reason);
  if(!finished.ok) return {...finished,session};
  return {
    ...finished,
    session:{
      ...session,
      state:finished.state,
      driver:stopDriver(session.driver),
      blocking:false,
    },
  };
}
