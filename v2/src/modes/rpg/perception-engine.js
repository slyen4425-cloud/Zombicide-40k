import { shortestPathDistance, getActorPosition } from './spatial-engine.js';
import { hasRoomLineOfSight } from './room-tactical-bridge.js';

function numericStat(actor, statId, fallback = 0) {
  if (!statId) return Number(fallback) || 0;
  const value = Number(actor?.state?.stats?.[statId]);
  return Number.isFinite(value) ? value : (Number(fallback) || 0);
}

export function normalizePerceptionConfig(config = {}) {
  return {
    enabled: config.enabled !== false,
    visionStatId: config.visionStatId || null,
    stealthStatId: config.stealthStatId || null,
    defaultVisionRange: Math.max(0, Number(config.defaultVisionRange ?? 6) || 0),
    defaultStealth: Number(config.defaultStealth ?? 0) || 0,
    distancePenaltyPerUnit: Math.max(0, Number(config.distancePenaltyPerUnit ?? 1) || 0),
    requireSameZone: config.requireSameZone !== false,
    blockedLineOfSightStopsDetection: config.blockedLineOfSightStopsDetection !== false,
  };
}

export function actorVisionRange(actor = {}, config = {}) {
  const c = normalizePerceptionConfig(config);
  return Math.max(0, numericStat(actor, c.visionStatId, c.defaultVisionRange));
}

export function actorStealthValue(actor = {}, config = {}) {
  const c = normalizePerceptionConfig(config);
  return numericStat(actor, c.stealthStatId, c.defaultStealth);
}

export function canDetectActor(spatial, observerId, targetId, actors = {}, config = {}) {
  const c = normalizePerceptionConfig(config);
  if (!c.enabled) return { detected: true, reason: 'disabled', distance: 0, score: Infinity, threshold: 0 };
  const observerPos = getActorPosition(spatial, observerId);
  const targetPos = getActorPosition(spatial, targetId);
  if (!observerPos || !targetPos) return { detected: false, reason: 'missing-position', distance: Infinity, score: -Infinity, threshold: Infinity };
  if (c.requireSameZone && String(observerPos.zoneId) !== String(targetPos.zoneId)) return { detected: false, reason: 'different-zone', distance: Infinity, score: -Infinity, threshold: Infinity };

  const observer = actors[String(observerId)] || {};
  const target = actors[String(targetId)] || {};
  const vision = actorVisionRange(observer, c);
  const distance = shortestPathDistance(spatial, observerPos, targetPos, { diagonal: Boolean(config.diagonal), maxDistance: vision });
  if (!Number.isFinite(distance) || distance > vision) return { detected: false, reason: 'out-of-vision', distance, vision, score: -Infinity, threshold: actorStealthValue(target, c) };

  if (c.blockedLineOfSightStopsDetection && config.roomLayout && !hasRoomLineOfSight(config.roomLayout, observerPos, targetPos)) {
    return {
      detected: false,
      reason: 'line-of-sight-blocked',
      distance,
      vision,
      score: -Infinity,
      threshold: actorStealthValue(target, c),
    };
  }

  const perceptionScore = vision - distance * c.distancePenaltyPerUnit;
  const stealth = actorStealthValue(target, c);
  return {
    detected: perceptionScore >= stealth,
    reason: perceptionScore >= stealth ? 'detected' : 'stealth-wins',
    distance,
    vision,
    score: perceptionScore,
    threshold: stealth,
  };
}
