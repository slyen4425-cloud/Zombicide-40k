/* GenSrpG Phase 4 — pure dice primitives.
   Explicit RNG injection; no gameplay or presentation ownership. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";

function finite(value,name){
  const n=Number(value);
  if(!Number.isFinite(n))throw new TypeError(name+" must be finite");
  return n;
}

function sidesValue(value){
  const sides=finite(value,"sides");
  if(!Number.isInteger(sides)||sides<2)throw new RangeError("sides must be an integer >= 2");
  return sides;
}

function rngValue(rng){
  const source=rng===undefined?Math.random:rng;
  if(typeof source!=="function")throw new TypeError("rng must be a function");
  const value=Number(source());
  if(!Number.isFinite(value)||value<0||value>=1){
    throw new RangeError("rng must return a finite value in [0, 1)");
  }
  return value;
}

function chanceBounds(bounds){
  const input=bounds==null?{min:1,max:100}:bounds;
  if(typeof input!=="object")throw new TypeError("bounds must be an object");
  const min=finite(input.min,"bounds.min");
  const max=finite(input.max,"bounds.max");
  if(min<0||max>100||min>max)throw new RangeError("bounds must satisfy 0 <= min <= max <= 100");
  return {min,max};
}

function normalizedChance(chance,bounds){
  const value=finite(chance,"chance");
  const {min,max}=chanceBounds(bounds);
  return Math.min(max,Math.max(min,value));
}

function roll(sides,rng){
  const faces=sidesValue(sides);
  return Math.floor(rngValue(rng)*faces)+1;
}

function thresholdFromChance(chance,bounds){
  return 101-normalizedChance(chance,bounds);
}

function rollChanceHigh(chance,bounds,rng){
  const normalized=normalizedChance(chance,bounds);
  const threshold=101-normalized;
  const value=roll(100,rng);
  return Object.freeze({
    roll:value,
    chance:normalized,
    threshold,
    success:value>=threshold
  });
}

function rollCheck(options){
  if(!options||typeof options!=="object")throw new TypeError("rollCheck options are required");
  const sides=sidesValue(options.sides);
  const modifier=options.modifier===undefined?0:finite(options.modifier,"modifier");
  const difficulty=finite(options.difficulty,"difficulty");
  const value=roll(sides,options.rng);
  const total=value+modifier;
  return Object.freeze({
    roll:value,
    modifier,
    total,
    difficulty,
    success:total>=difficulty
  });
}

ROOT.GensDiceV1=Object.freeze({
  VERSION,
  roll,
  thresholdFromChance,
  rollChanceHigh,
  rollCheck
});

})(typeof window!=="undefined"?window:globalThis);
