import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  findSimilarOpenQuestion,
  inferTopicAttributes,
  questionsAreSimilar,
  tokenSimilarity,
} from './openListerQuestions.js';

describe('openListerQuestions', () => {
  it('matches exact question text case-insensitively', () => {
    const open = [
      {
        id: 'q1',
        questionText: 'Can someone in a wheelchair visit comfortably?',
      },
    ];

    const match = findSimilarOpenQuestion(open, {
      questionText: 'can someone in a wheelchair visit comfortably?',
    });

    assert.equal(match?.id, 'q1');
  });

  it('matches wheelchair / accessibility variants via topic attributes', () => {
    assert.ok(
      inferTopicAttributes('My father uses a wheelchair. Can he visit?').includes('accessibility'),
    );

    assert.ok(
      questionsAreSimilar(
        { questionText: 'Is step-free access available for a wheelchair visitor?' },
        {
          id: 'q1',
          questionText: 'My father uses a wheelchair. Can he visit?',
          canonicalAttributes: ['accessibility'],
        },
      ),
    );
  });

  it('matches overlapping canonical attributes', () => {
    assert.ok(
      questionsAreSimilar(
        {
          questionText: 'Any update on access?',
          canonicalAttributes: ['step_free_access'],
        },
        {
          id: 'q1',
          questionText: 'Wheelchair access for visitors?',
          canonicalAttributes: ['accessibility', 'step_free_access'],
        },
      ),
    );
  });

  it('does not match unrelated topics', () => {
    assert.equal(
      findSimilarOpenQuestion(
        [
          {
            id: 'q1',
            questionText: 'Are pets allowed under the body corporate rules?',
            canonicalAttributes: ['pets_policy'],
          },
        ],
        { questionText: 'How many bedrooms does this place have?' },
      ),
      null,
    );
  });

  it('matches near-paraphrases via topic keywords even when token Jaccard is modest', () => {
    const a = 'Why are pets not allowed at this property?';
    const b = 'Why are pets not allowed under the body corporate rules for this property?';
    const score = tokenSimilarity(a, b);
    assert.ok(score > 0 && score < 0.45, `expected modest token score, got ${score}`);
    assert.ok(
      questionsAreSimilar({ questionText: a }, { id: 'q1', questionText: b }),
      'topic keywords should still match pets paraphrases',
    );
  });

  it('matches fuzzy paraphrases with high token overlap', () => {
    assert.ok(
      questionsAreSimilar(
        { questionText: 'Is heating included in this rental?' },
        { id: 'q1', questionText: 'Is heating included for this rental property?' },
      ),
    );
  });
});
