import {attemptCaptureInBattle} from './capture.js';

const clone=value=>structuredClone(value);

export const CAPTURE_PLAYER_CAPTURE_ACTION_CONTRACT=Object.freeze({
  usesAuthoritativeCaptureAttempt:true,
  readsOpponentVitals:true,
  requiresExplicitSpeciesRate:true,
  requiresExplicitOrbCoefficient:true,
  requiresExplicitLowHpMultiplierWhenNeeded:true,
  neverInventsCaptureValues:true,
  neverUsesRpgRuntime:true,
});

function opponentVitals(state){
  const opponent=state?.battle?.opponent||null;
  const current=opponent?.vitals?.currentHp ?? opponent?.creature?.currentHp;
  const max=opponent?.vitals?.maxHp ?? opponent?.creature?.maxHp;
  return {currentHp:Number(current),maxHp:Number(max)};
}

function opponentSpeciesId(state){
  return String(state?.battle?.opponent?.creature?.speciesId||state?.battle?.encounter?.speciesId||state?.encounter?.speciesId||'');
}

export function executeCapturePlayerCaptureAttempt(state,{orbId,speciesCaptureRates={},orbLibrary=[],lowHpMultiplier,rng=Math.random}={}){
  if(!state?.battle) return {ok:false,reason:'battle-missing',state};
  const speciesId=opponentSpeciesId(state);
  if(!speciesId) return {ok:false,reason:'capture-opponent-species-missing',state};
  const speciesCaptureRate=Number(speciesCaptureRates?.[speciesId]);
  if(!Number.isFinite(speciesCaptureRate)||speciesCaptureRate<0){
    return {ok:false,reason:'missing_species_capture_rate',speciesId,state};
  }
  const {currentHp,maxHp}=opponentVitals(state);
  if(!Number.isFinite(currentHp)||!Number.isFinite(maxHp)||maxHp<=0){
    return {ok:false,reason:'invalid_hp',speciesId,state};
  }
  const result=attemptCaptureInBattle(state,{
    orbId,
    speciesCaptureRate,
    currentHp,
    maxHp,
    orbLibrary:clone(Array.isArray(orbLibrary)?orbLibrary:[]),
    lowHpMultiplier,
    rng,
  });
  return {...result,speciesId};
}
