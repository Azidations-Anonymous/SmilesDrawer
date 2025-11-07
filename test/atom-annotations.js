#!/usr/bin/env node

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseHTML } = require('linkedom');

const Parser = require('../src/parsing/Parser.js');
const Drawer = require('../src/drawing/Drawer.js');

function ensureDom() {
    if (typeof global.window !== 'undefined' && typeof global.document !== 'undefined') {
        return;
    }

    const { window } = parseHTML('<!DOCTYPE html><html><body></body></html>');
    global.window = window;
    global.document = window.document;
    global.navigator = window.navigator;
    global.HTMLElement = window.HTMLElement;
    global.SVGElement = window.SVGElement;
    global.HTMLCanvasElement = window.HTMLCanvasElement;
    global.HTMLImageElement = window.HTMLImageElement;
    global.Element = window.Element;
    global.Node = window.Node;
    global.DOMParser = window.DOMParser;
    global.XMLSerializer = window.XMLSerializer;
}

class AnnotationCaptureRenderer {
    constructor() {
        this.annotations = [];
        this.bounds = {
            minX: 0,
            minY: 0,
            maxX: 0,
            maxY: 0,
            width: 0,
            height: 0,
        };
    }

    determineDimensions(vertices) {
        if (!vertices || vertices.length === 0) {
            return;
        }

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const vertex of vertices) {
            if (!vertex.value.isDrawn) {
                continue;
            }
            minX = Math.min(minX, vertex.position.x);
            minY = Math.min(minY, vertex.position.y);
            maxX = Math.max(maxX, vertex.position.x);
            maxY = Math.max(maxY, vertex.position.y);
        }

        this.bounds = {
            minX,
            minY,
            maxX,
            maxY,
            width: maxX - minX,
            height: maxY - minY,
        };
    }

    getBounds() {
        return this.bounds;
    }

    drawLine() { }
    drawWedge() { }
    drawDashedWedge() { }
    drawRing() { }
    drawAtomHighlight() { }
    drawBall() { }
    drawPoint() { }
    drawDebugPoint() { }
    drawDebugText() { }
    drawText() { }
    addLayer() { }
    finalize() { }
    toCanvas() { }

    drawAnnotation(x, y, text, _options = {}) {
        this.annotations.push({ x, y, text });
    }
}

describe('Atom annotation rendering', () => {
    it('renders annotations with the default formatter when enabled', () => {
        ensureDom();

        const drawer = new Drawer({ showAtomAnnotations: true });
        drawer.registerAtomAnnotation('label', 'Hello');
        const renderer = new AnnotationCaptureRenderer();
        drawer.svgDrawer.renderer = renderer;

        const tree = Parser.parse('C', {});
        drawer.svgDrawer.draw(tree, null, 'light');

        assert.equal(renderer.annotations.length, 1);
        assert.equal(renderer.annotations[0].text, 'label: Hello');
    });

    it('respects custom annotation formatters', () => {
        ensureDom();

        const drawer = new Drawer({
            showAtomAnnotations: true,
            atomAnnotationFormatter: ({ annotations }) => annotations.tag ? `@${annotations.tag}` : null
        });

        drawer.registerAtomAnnotation('tag', 'custom');
        const renderer = new AnnotationCaptureRenderer();
        drawer.svgDrawer.renderer = renderer;

        const tree = Parser.parse('C', {});
        drawer.svgDrawer.draw(tree, null, 'light');

        assert.equal(renderer.annotations.length, 1);
        assert.equal(renderer.annotations[0].text, '@custom');
    });
});
