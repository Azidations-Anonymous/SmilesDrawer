#!/usr/bin/env node

/**
 * Tests for ArrayHelper iteration utilities.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const ArrayHelper = require('../src/utils/ArrayHelper.js');

describe('ArrayHelper core utilities', () => {
    it('clone should deep-copy plain arrays and objects', () => {
        const source = [{ value: 1 }, { value: 2, nested: { prop: 3 } }];
        const clone = ArrayHelper.clone(source);

        assert.deepEqual(clone, source);
        assert.notStrictEqual(clone, source);
        assert.notStrictEqual(clone[0], source[0]);
        assert.notStrictEqual(clone[1].nested, source[1].nested);
    });

    it('clone should respect custom clone methods', () => {
        class Custom {
            constructor(value) {
                this.value = value;
            }
            clone() {
                return new Custom(this.value * 2);
            }
        }
        const source = [new Custom(5)];
        const clone = ArrayHelper.clone(source);
        assert.ok(clone[0] instanceof Custom);
        assert.equal(clone[0].value, 10);
    });

    it('equals should check unordered equality', () => {
        assert.equal(ArrayHelper.equals([1, 2, 3], [3, 2, 1]), true);
        assert.equal(ArrayHelper.equals([1, 2], [1, 2, 3]), false);
    });

    it('print should prefer element id if available', () => {
        const output = ArrayHelper.print([{ id: 1 }, { id: 2 }]);
        assert.equal(output, '(1, 2)');
        assert.equal(ArrayHelper.print(['a', 'b']), '(a, b)');
    });

    it('each should iterate over elements', () => {
        const collected = [];
        ArrayHelper.each([1, 2, 3], (n) => collected.push(n * 2));
        assert.deepEqual(collected, [2, 4, 6]);
    });

    it('get should retrieve object by property', () => {
        const arr = [{ id: 1 }, { id: 2 }];
        assert.deepEqual(ArrayHelper.get(arr, 'id', 2), { id: 2 });
        assert.equal(ArrayHelper.get(arr, 'id', 3), undefined);
    });

    it('contains should find values with direct, property, and predicate comparisons', () => {
        const arr = [{ id: 1 }, { id: 2 }];
        assert.equal(ArrayHelper.contains([1, 2, 3], { value: 2 }), true);
        assert.equal(ArrayHelper.contains(arr, { property: 'id', value: 2 }), true);
        assert.equal(ArrayHelper.contains(arr, { func: (el) => el.id === 3 }), false);
    });

    it('intersection should return shared elements', () => {
        assert.deepEqual(ArrayHelper.intersection([1, 2, 3], [2, 3, 4]), [2, 3]);
    });

    it('unique should remove duplicates', () => {
        assert.deepEqual(ArrayHelper.unique([1, 1, 2, 3, 3]), [1, 2, 3]);
    });

    it('count should tally occurrences', () => {
        assert.equal(ArrayHelper.count([1, 2, 2, 3], 2), 2);
    });

    it('toggle should add or remove values', () => {
        assert.deepEqual(ArrayHelper.toggle([1, 2], 3), [1, 2, 3]);
        assert.deepEqual(ArrayHelper.toggle([1, 2], 1), [2]);
    });

    it('remove should remove values without mutating original', () => {
        const original = [1, 2, 3];
        const result = ArrayHelper.remove(original, 2);
        assert.deepEqual(result, [1, 3]);
        assert.deepEqual(original, [1, 2, 3]);
    });

    it('removeUnique should mutate array and remove value', () => {
        const arr = [1, 2, 3];
        ArrayHelper.removeUnique(arr, 2);
        assert.deepEqual(arr, [1, 3]);
    });

    it('removeAll should filter out provided values', () => {
        assert.deepEqual(ArrayHelper.removeAll([1, 2, 3, 4], [2, 4]), [1, 3]);
    });

    it('merge should concatenate arrays', () => {
        assert.deepEqual(ArrayHelper.merge([1, 2], ['a']), [1, 2, 'a']);
    });

    it('containsAll should verify all elements are present', () => {
        assert.equal(ArrayHelper.containsAll([1, 2, 3], [1, 3]), true);
        assert.equal(ArrayHelper.containsAll([1, 2], [1, 2, 3]), false);
    });

    it('sortByAtomicNumberDesc should order by dotted weights', () => {
        const input = [
            { vertexId: 1, atomicNumber: '6.2' },
            { vertexId: 2, atomicNumber: '6.10' },
            { vertexId: 3, atomicNumber: '6' }
        ];
        const sorted = ArrayHelper.sortByAtomicNumberDesc(input);
        assert.deepEqual(sorted.map((e) => e.vertexId), [2, 1, 3]);
    });

    it('deepCopy should recursively copy nested arrays', () => {
        const original = [[1, 2], [3, [4]]];
        const copy = ArrayHelper.deepCopy(original);
        assert.deepEqual(copy, original);
        assert.notStrictEqual(copy, original);
        assert.notStrictEqual(copy[1], original[1]);
        assert.notStrictEqual(copy[1][1], original[1][1]);
    });
});

describe('ArrayHelper iteration utilities', () => {
    it('forEachIndex should iterate forward through indices', () => {
        const visited = [];
        ArrayHelper.forEachIndex(4, (idx) => visited.push(idx));
        assert.deepEqual(visited, [0, 1, 2, 3]);
    });

    it('forEachIndexReverse should iterate backward through indices', () => {
        const visited = [];
        ArrayHelper.forEachIndexReverse(4, (idx) => visited.push(idx));
        assert.deepEqual(visited, [3, 2, 1, 0]);
    });

    it('forEach should iterate multiple heterogeneous arrays in lockstep', () => {
        const numbers = [1, 2, 3];
        const letters = ['a', 'b', 'c'];
        const flags = [true, false, true];

        const tuples = [];
        ArrayHelper.forEach([numbers, letters, flags], (n, l, f, idx) => {
            tuples.push([n, l, f, idx]);
        });

        assert.deepEqual(tuples, [
            [1, 'a', true, 0],
            [2, 'b', false, 1],
            [3, 'c', true, 2]
        ]);
    });

    it('forEachReverse should iterate multiple arrays in reverse lockstep', () => {
        const numbers = [1, 2, 3];
        const letters = ['a', 'b', 'c'];

        const tuples = [];
        ArrayHelper.forEachReverse([numbers, letters], (n, l, idx) => {
            tuples.push([n, l, idx]);
        });

        assert.deepEqual(tuples, [
            [3, 'c', 2],
            [2, 'b', 1],
            [1, 'a', 0]
        ]);
    });
});
