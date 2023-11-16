/**
 * flocking logic for the birds
 * has the capacity to rest 
 * @see https://threejs.org/examples/webgl_gpgpu_birds.html
 */

import * as THREE from 'three';

export class Flock {
    constructor() {
        this.vector = new THREE.Vector3();
        this._neighborhoodRadius = 200;
        this._maxSpeed = 5;
        this._maxSteerForce = .1;
        this._avoidWalls = true;
        this.setWorldSize(500, 500, 400);
        this.repulse_distance = 300; // was 150 used in clicking
        this.resting = false;

        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this._acceleration = new THREE.Vector3();
        this.position.x = Math.random() * 1 - .5;
        this.position.y = Math.random() * 1 - .5;
        this.position.z = Math.random() * 1 - .5;
        this.velocity.x = Math.random() * 2 - 1;
        this.velocity.y = Math.random() * 2 - 1;
        this.velocity.z = Math.random() * 2 - 1;
    }

    setAvoidWalls(value) {
        this._avoidWalls = value;
    }
    setResting(value) {
        this.resting = value;
    }

    setWorldSize(width, height, depth) {
        this._width = width;
        this._height = height;
        this._depth = depth;
    }

    run(flocks) {
        if (this._avoidWalls) {
            let scalarmultiplier = 5; // was 5
            this.vector.set(-this._width, this.position.y, this.position.z);
            this.vector = this.avoid(this.vector);
            this.vector.multiplyScalar(scalarmultiplier);
            this._acceleration.add(this.vector);

            this.vector.set(this._width, this.position.y, this.position.z);
            this.vector = this.avoid(this.vector);
            this.vector.multiplyScalar(scalarmultiplier);
            this._acceleration.add(this.vector);

            this.vector.set(this.position.x, -this._height, this.position.z);
            this.vector = this.avoid(this.vector);
            this.vector.multiplyScalar(scalarmultiplier);
            this._acceleration.add(this.vector);

            this.vector.set(this.position.x, this._height, this.position.z);
            this.vector = this.avoid(this.vector);
            this.vector.multiplyScalar(scalarmultiplier);
            this._acceleration.add(this.vector);

            this.vector.set(this.position.x, this.position.y, -this._depth);
            this.vector = this.avoid(this.vector);
            this.vector.multiplyScalar(scalarmultiplier);
            this._acceleration.add(this.vector);

            this.vector.set(this.position.x, this.position.y, this._depth);
            this.vector = this.avoid(this.vector);
            this.vector.multiplyScalar(scalarmultiplier);
            this._acceleration.add(this.vector);
        }

        if (Math.random() > 0.5) {
            this.flock(flocks);
        }

        if (!this.resting) {
            this.move();
        }
    }


    flock(flocks) {
        if (this.resting) {
            return;
        }
        this._acceleration.add(this.alignment(flocks));
        this._acceleration.add(this.cohesion(flocks));
        this._acceleration.add(this.separation(flocks));
    };

    move() {
        this.velocity.add(this._acceleration);

        var l = this.velocity.length();

        if (l > this._maxSpeed) {
            this.velocity.divideScalar(l / this._maxSpeed);
        }

        this.position.add(this.velocity);
        this._acceleration.set(0, 0, 0);
    };

    avoid(target) {
        var steer = new THREE.Vector3();

        steer.copy(this.position);
        steer.sub(target);

        steer.multiplyScalar(1 / this.position.distanceToSquared(target));

        return steer;
    };

    // on mouse move
    repulse(target) {
        var distance = this.position.distanceTo(target);

        if (distance < this.repulse_distance) {
            var steer = new THREE.Vector3();
            steer.subVectors(this.position, target);

            steer.multiplyScalar(3 / distance); // was .1

            this._acceleration.add(steer);
            return true;
        }
        return false;
    };

    // don't intersect the skull
    repulse_skull(target) {
        var distance = this.position.distanceTo(target);
        if (distance < 340) {
            var steer = new THREE.Vector3();
            steer.subVectors(this.position, target);
            steer.multiplyScalar(3 / distance);
            this._acceleration.add(steer);
        }
    };

    // attact flock towards target
    attract(target) {
        var distance = this.position.distanceTo(target);

        if (distance < 700) {
            var steer = new THREE.Vector3();
            steer.subVectors(this.position, target);

            steer.multiplyScalar(-(.1 / distance)); // was .1

            this._acceleration.add(steer);
        }
    };

    alignment(flocks) {
        var flock,
            velSum = new THREE.Vector3(),
            count = 0;

        for (var i = 0, il = flocks.length; i < il; i++) {
            if (Math.random() > 0.6) continue;

            flock = flocks[i];

            var distance = flock.position.distanceTo(this.position);

            if (distance > 0 && distance <= this._neighborhoodRadius) {
                velSum.add(flock.velocity);
                count++;
            }
        }

        if (count > 0) {
            velSum.divideScalar(count);

            var l = velSum.length();

            if (l > this._maxSteerForce) {
                velSum.divideScalar(l / this._maxSteerForce);
            }
        }

        return velSum;
    };

    cohesion(flocks) {
        var flock,
            distance,
            posSum = new THREE.Vector3(),
            steer = new THREE.Vector3(),
            count = 0;

        for (var i = 0, il = flocks.length; i < il; i++) {
            if (Math.random() > 0.6) continue;

            flock = flocks[i];
            distance = flock.position.distanceTo(this.position);

            if (distance > 0 && distance <= this._neighborhoodRadius) {
                posSum.add(flock.position);
                count++;
            }
        }

        if (count > 0) {
            posSum.divideScalar(count);
        }

        steer.subVectors(posSum, this.position);

        var l = steer.length();

        if (l > this._maxSteerForce) {
            steer.divideScalar(l / this._maxSteerForce);
        }

        return steer;
    };

    separation(flocks) {
        var flock,
            distance,
            posSum = new THREE.Vector3(),
            repulse = new THREE.Vector3();

        for (var i = 0, il = flocks.length; i < il; i++) {
            if (Math.random() > 0.6) continue;

            flock = flocks[i];
            distance = flock.position.distanceTo(this.position);

            if (distance > 0 && distance <= this._neighborhoodRadius) {
                repulse.subVectors(this.position, flock.position);
                repulse.normalize();
                repulse.divideScalar(distance);
                posSum.add(repulse);
            }
        }

        return posSum;
    };
}

export default Flock;