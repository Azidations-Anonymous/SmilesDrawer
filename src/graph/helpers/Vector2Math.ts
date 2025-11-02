import Vector2 = require('../Vector2');

class Vector2Math {


    /**
     * Adds two vectors and returns the result as a new vector.
     *
     * @static
     * @param {Vector2} vecA A summand.
     * @param {Vector2} vecB A summand.
     * @returns {Vector2} Returns the sum of two vectors.
     */
    static add(vecA: Vector2, vecB: Vector2): Vector2 {
        return new Vector2(vecA.x + vecB.x, vecA.y + vecB.y);
    }



    /**
     * Subtracts one vector from another and returns the result as a new vector.
     *
     * @static
     * @param {Vector2} vecA The minuend.
     * @param {Vector2} vecB The subtrahend.
     * @returns {Vector2} Returns the difference of two vectors.
     */
    static subtract(vecA: Vector2, vecB: Vector2): Vector2 {
        return new Vector2(vecA.x - vecB.x, vecA.y - vecB.y);
    }



    /**
     * Multiplies two vectors (value by value) and returns the result.
     *
     * @static
     * @param {Vector2} vecA A vector.
     * @param {Vector2} vecB A vector.
     * @returns {Vector2} Returns the product of two vectors.
     */
    static multiply(vecA: Vector2, vecB: Vector2): Vector2 {
        return new Vector2(vecA.x * vecB.x, vecA.y * vecB.y);
    }



    /**
     * Multiplies two vectors (value by value) and returns the result.
     *
     * @static
     * @param {Vector2} vec A vector.
     * @param {Number} scalar A scalar.
     * @returns {Vector2} Returns the product of two vectors.
     */
    static multiplyScalar(vec: Vector2, scalar: number): Vector2 {
        return new Vector2(vec.x, vec.y).multiplyScalar(scalar);
    }



    /**
     * Returns the midpoint of a line spanned by two vectors.
     *
     * @static
     * @param {Vector2} vecA A vector spanning the line.
     * @param {Vector2} vecB A vector spanning the line.
     * @returns {Vector2} The midpoint of the line spanned by two vectors.
     */
    static midpoint(vecA: Vector2, vecB: Vector2): Vector2 {
        return new Vector2((vecA.x + vecB.x) / 2, (vecA.y + vecB.y) / 2);
    }



    /**
     * Returns the normals of a line spanned by two vectors.
     *
     * @static
     * @param {Vector2} vecA A vector spanning the line.
     * @param {Vector2} vecB A vector spanning the line.
     * @returns {Vector2[]} An array containing the two normals, each represented by a vector.
     */
    static normals(vecA: Vector2, vecB: Vector2): Vector2[] {
        let delta = Vector2.subtract(vecB, vecA);

        return [
            new Vector2(-delta.y, delta.x),
            new Vector2(delta.y, -delta.x)
        ];
    }



    /**
     * Returns the unit (normalized normal) vectors of a line spanned by two vectors.
     *
     * @static
     * @param {Vector2} vecA A vector spanning the line.
     * @param {Vector2} vecB A vector spanning the line.
     * @returns {Vector2[]} An array containing the two unit vectors.
     */
    static units(vecA: Vector2, vecB: Vector2): Vector2[] {
        let delta = Vector2.subtract(vecB, vecA);

        return [
            (new Vector2(-delta.y, delta.x)).normalize(),
            (new Vector2(delta.y, -delta.x)).normalize()
        ];
    }



    /**
     * Divides a vector by another vector and returns the result as new vector.
     *
     * @static
     * @param {Vector2} vecA The dividend.
     * @param {Vector2} vecB The divisor.
     * @returns {Vector2} The fraction of the two vectors.
     */
    static divide(vecA: Vector2, vecB: Vector2): Vector2 {
      return new Vector2(vecA.x / vecB.x, vecA.y / vecB.y);
    }



    /**
     * Divides a vector by a scalar and returns the result as new vector.
     *
     * @static
     * @param {Vector2} vecA The dividend.
     * @param {Number} s The scalar.
     * @returns {Vector2} The fraction of the two vectors.
     */
    static divideScalar(vecA: Vector2, s: number): Vector2 {
        return new Vector2(vecA.x / s, vecA.y / s);
    }



    /**
     * Returns the dot product of two vectors.
     *
     * @static
     * @param {Vector2} vecA A vector.
     * @param {Vector2} vecB A vector.
     * @returns {Number} The dot product of two vectors.
     */
    static dot(vecA: Vector2, vecB: Vector2): number {
        return vecA.x * vecB.x + vecA.y * vecB.y;
    }



    /**
     * Returns the angle between two vectors.
     *
     * @static
     * @param {Vector2} vecA A vector.
     * @param {Vector2} vecB A vector.
     * @returns {Number} The angle between two vectors in radians.
     */
    static angle(vecA: Vector2, vecB: Vector2): number {
        let dot = Vector2.dot(vecA, vecB);

        return Math.acos(dot / (vecA.length() * vecB.length()));
    }



    /**
     * Returns the angle between two vectors based on a third vector in between.
     *
     * @static
     * @param {Vector2} vecA A vector.
     * @param {Vector2} vecB A (central) vector.
     * @param {Vector2} vecC A vector.
     * @returns {Number} The angle in radians.
     */
    static threePointangle(vecA: Vector2, vecB: Vector2, vecC: Vector2): number {
        let ab = Vector2.subtract(vecB, vecA);
        let bc = Vector2.subtract(vecC, vecB);
        let abLength = vecA.distance(vecB);
        let bcLength = vecB.distance(vecC);

        return Math.acos(Vector2.dot(ab, bc) / (abLength * bcLength));
    }



    /**
     * Returns the scalar projection of a vector on another vector.
     *
     * @static
     * @param {Vector2} vecA The vector to be projected.
     * @param {Vector2} vecB The vector to be projection upon.
     * @returns {Number} The scalar component.
     */
    static scalarProjection(vecA: Vector2, vecB: Vector2): number {
        let unit = vecB.normalized();

        return Vector2.dot(vecA, unit);
    }



     /**
     * Returns the average vector (normalized) of the input vectors.
     *
     * @static
     * @param {Array} vecs An array containing vectors.
     * @returns {Vector2} The resulting vector (normalized).
     */
    static averageDirection(vecs: Vector2[]): Vector2 {
        let avg = new Vector2(0.0, 0.0);

        for (var i = 0; i < vecs.length; i++) {
          let vec = vecs[i];
          avg.add(vec);
        }

        return avg.normalize();
    }
}

export = Vector2Math;
