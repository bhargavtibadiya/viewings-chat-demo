import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveCanonicalIntent } from '../../../../services/ai/helpers/routing/intentRouting.js';

describe('intentRouting', () => {
  it('maps buy a bed to furnishing, not bedrooms', () => {
    const route = resolveCanonicalIntent('Do I need to buy a bed?');
    assert.ok(route);
    assert.equal(route?.intentId, 'furnishing_bed');
    assert.ok(route?.attributes.includes('furnishing'));
    assert.ok(!route?.attributes.includes('bedrooms'));
  });

  it('maps dog play outside to outdoor + fencing + pets', () => {
    const route = resolveCanonicalIntent('Can my dog play outside?');
    assert.ok(route);
    assert.equal(route?.intentId, 'dog_outdoor');
    assert.deepEqual(
      ['outdoor_space', 'fencing', 'pets_policy'].every((key) => route?.attributes.includes(key)),
      true,
    );
  });

  it('maps bedroom-bathroom connect to ensuite', () => {
    const route = resolveCanonicalIntent('Does the bedroom connect to the bathroom?');
    assert.ok(route);
    assert.equal(route?.intentId, 'ensuite_layout');
    assert.ok(route?.attributes.includes('ensuite'));
  });

  it('maps stay warm to heating not cooling', () => {
    const route = resolveCanonicalIntent('Does it stay warm?');
    assert.ok(route);
    assert.equal(route?.intentId, 'heating_warm');
    assert.ok(route?.attributes.includes('heating'));
    assert.ok(!route?.attributes.includes('cooling'));
  });

  it('maps wheelchair visit to accessibility and suppresses viewing CTA', () => {
    const route = resolveCanonicalIntent('My father uses a wheelchair. Can he visit?');
    assert.ok(route);
    assert.equal(route?.intentId, 'accessibility');
    assert.equal(route?.suppressViewingCta, true);
  });

  it('maps pet-friendly phrasing to pets attributes', () => {
    const route = resolveCanonicalIntent("I don't like pets - is it pet-friendly?");
    assert.ok(route);
    assert.ok(route?.attributes.includes('pets_policy') || route?.attributes.includes('body_corporate_pets'));
  });
});
