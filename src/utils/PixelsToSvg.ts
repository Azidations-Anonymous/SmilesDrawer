// Adapted from https://codepen.io/shshaw/pen/XbxvNj by

type ColorMap = Record<string, [number, number][]>;

function convertImage(img: ImageData): SVGElement {
    "use strict";

    function each<T>(obj: T[] | Record<string, T>, fn: (this: T, key: number | string, value: T) => void | boolean): void {
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                if (fn.call(obj[i], i, obj[i]) === false) { break; }
            }
        } else {
            for (let key in obj) {
                if (fn.call(obj[key], key, obj[key]) === false) { break; }
            }
        }
    }

    function componentToHex(c: string | number): string {
        var hex = parseInt(c.toString()).toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function getColor(r: string | number, g: string | number, b: string | number, a: string | number): string | false {
        let alpha = parseInt(a.toString());
        if (alpha === undefined || alpha === 255) { return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b); }
        if (alpha === 0) { return false; }
        return 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha / 255) + ')';
    }

    // Optimized for horizontal lines
    function makePathData(x: number, y: number, w: number): string { return ('M' + x + ' ' + y + 'h' + w + ''); }
    function makePath(color: string, data: string): string { return '<path stroke="' + color + '" d="' + data + '" />\n'; }

    function colorsToPaths(colors: ColorMap): string {

        var output = "";

        // Loop through each color to build paths
        each(colors, function (this: [number, number][], color: string, values: [number, number][]) {
            var orig = color;
            var colorResult = getColor.apply(null, color.split(',') as [string, string, string, string]);

            if (colorResult === false) { return; }

            var paths = [];
            var curPath: [number, number] | undefined;
            var w = 1;

            // Loops through each color's pixels to optimize paths
            each(values, function (this: [number, number]) {

                if (curPath && this[1] === curPath[1] && this[0] === (curPath[0] + w)) {
                    w++;
                } else {
                    if (curPath) {
                        paths.push(makePathData(curPath[0], curPath[1], w));
                        w = 1;
                    }
                    curPath = this;
                }

            });

            if (curPath) {
                paths.push(makePathData(curPath[0], curPath[1], w)); // Finish last path
            }
            output += makePath(colorResult, paths.join(''));
        });

        return output;
    }

    var getColors = function (img: ImageData): ColorMap {
        var colors: ColorMap = {},
            data = img.data,
            len = data.length,
            w = img.width,
            h = img.height,
            x = 0,
            y = 0,
            i = 0,
            color;

        for (; i < len; i += 4) {
            if (data[i + 3] > 0) {
                color = data[i] + ',' + data[i + 1] + ',' + data[i + 2] + ',' + data[i + 3];
                colors[color] = colors[color] || [];
                x = (i / 4) % w;
                y = Math.floor((i / 4) / w);
                colors[color].push([x, y]);
            }
        }

        return colors;
    }

    let colors = getColors(img);
    let paths = colorsToPaths(colors);
    let output = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -0.5 ' + img.width + ' ' + img.height + '" shape-rendering="crispEdges"><g shape-rendering="crispEdges">' + paths + '</g></svg>';

    var dummyDiv = document.createElement('div');
    dummyDiv.innerHTML = output;

    return dummyDiv.firstChild as SVGElement;

}

export = convertImage