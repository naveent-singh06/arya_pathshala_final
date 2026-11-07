const test = require('node:test');
const assert = require('node:assert');
const { build } = require('../../scripts/demo-content');

test('demo content is labelled, published and internally consistent', () => {
  const docs = build();
  const byCol = (c) => docs.filter((d) => d.collection === c);
  const ids = new Set(docs.map((d) => `${d.collection}/${d.id}`));
  assert.equal(ids.size, docs.length, 'ids are unique, so seeding twice is idempotent');
  docs.forEach((d) => {
    assert.equal(d.data.status, 'published');
    assert.equal(d.data.demo, true);
    assert.ok(!JSON.stringify(d.data).match(/youtube|drive\.google|https?:\/\//i), 'no invented links');
  });
  ['subjects', 'batches'].forEach((c) => byCol(c).forEach((d) => assert.match(d.data.name, /\(Demo\)/)));
  byCol('chapters').concat(byCol('topics')).forEach((d) => assert.match(d.data.title, /\(Demo\)/));
  const has = (c, id) => byCol(c).some((d) => d.id === id);
  byCol('chapters').forEach((d) => assert.ok(has('subjects', d.data.subjectId)));
  byCol('topics').forEach((d) => assert.ok(has('chapters', d.data.chapterId)));
  byCol('questions').forEach((d) => { assert.ok(has('topics', d.data.topicId)); assert.equal(d.data.options.length, 4); });
  byCol('batches').forEach((d) => d.data.subjectIds.forEach((s) => assert.ok(has('subjects', s))));
  assert.deepEqual(byCol('batches').map((b) => b.data.classId).sort(), ['class-10', 'class-9', 'neet']);
  assert.ok(has('topics', 'demo-class-10-mathematics-ch1-t1'), 'Class 10 Mathematics Chapter 1 exists');
});
