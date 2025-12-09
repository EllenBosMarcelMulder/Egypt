///////////////////////////////////////////////////////////////
// ASCπ OS — TRUE KERNEL IMPLEMENTATION v1.0
// Motor + GPS + Scheduler + Glyph Engine
// Author: Marcel Christian Mulder (inventor)
// Format: Pure JavaScript — no browser dependencies
///////////////////////////////////////////////////////////////

class GlobalPhaseSupervisor {
    constructor(cycle = 1000, coupling = 0.12) {
        this.cycle = cycle;
        this.coupling = coupling;
        this.phase = 0;
        this.last = Date.now();
    }

    update() {
        const now = Date.now();
        const dt = now - this.last;
        this.last = now;
    
        this.phase += dt / this.cycle;
        if (this.phase >= 1) this.phase -= 1;
    
        return this.phase;
    }
    
    align(theta) {
        let diff = this.phase - theta;
        if (diff > 0.5) diff -= 1;
        if (diff < -0.5) diff += 1;
        return theta + this.coupling * diff;
    }

}

///////////////////////////////////////////////////////////////
// GLYPH ENGINE
///////////////////////////////////////////////////////////////
class Glyph {
    constructor(type, field) {
        this.type = type;
        this.energy = 0.2 + Math.random() * 0.4;
        this.theta = field.theta;
        this.deltaPhi = field.phi;
        this.kappa = field.kappa;
    }

    evolve(gps) {
        this.theta = gps.align(this.theta);
    
        if (this.type === "implosion") {
            this.energy *= 0.99;
        } else {
            this.energy *= 1.01;
        }
    
        if (this.energy < 0.001) this.energy = 0;
    }

}

///////////////////////////////////////////////////////////////
// ASCπ TRIADIC MOTOR (I8 / E8 / S8)
///////////////////////////////////////////////////////////////
class ASCPiMotor {
    constructor() {
        this.I8 = { phi: 0.1, kappa: 0.1, theta: 0 };
        this.E8 = { phi: 0.1, kappa: 0.1, theta: 0 };
        this.S8 = { phi: 0,   kappa: 0,   theta: 0 };

        this.glyphs = [];
    }
    
    injectGlyph(type) {
        const g = new Glyph(type, this.I8);
        this.glyphs.push(g);
    }
    
    computeField() {
        if (this.glyphs.length === 0) {
            return { ...this.I8 };
        }
    
        let sumPhi = 0, sumK = 0, sumTheta = 0;
        for (const g of this.glyphs) {
            sumPhi   += g.deltaPhi;
            sumK     += g.kappa;
            sumTheta += g.theta;
        }
    
        this.I8.phi   = sumPhi / this.glyphs.length;
        this.I8.kappa = sumK   / this.glyphs.length;
        this.I8.theta = sumTheta / this.glyphs.length;
    
        this.S8 = { ...this.I8 };
    
        return { ...this.I8 };
    }

}

///////////////////////////////////////////////////////////////
// COHERENCE + SCHEDULER
///////////////////////////////////////////////////////////////
function computeCoherence(glyphs) {
    if (glyphs.length < 2) return 0;

    const avg = glyphs.reduce((a, g) => a + g.theta, 0) / glyphs.length;
    const varSum = glyphs.reduce((a, g) => a + Math.pow(g.theta - avg, 2), 0);
    const variance = varSum / glyphs.length;
    
    return Math.exp(-variance * 10);

}

class Scheduler {
    constructor() {
        this.mode = "neutral";
    }

    update(glyphs) {
        const C = computeCoherence(glyphs);
    
        if (C < 0.40) this.mode = "implosive";
        else if (C > 0.70) this.mode = "bloom";
        else this.mode = "neutral";
    
        return this.mode;
    }
    
    execute(motor, gps) {
        for (const g of motor.glyphs) {
            g.evolve(gps);
    
            if (g.energy === 0) {
                motor.glyphs = motor.glyphs.filter(x => x !== g);
            }
        }
    }

}

///////////////////////////////////////////////////////////////
// FULL ASCπ KERNEL LOOP
///////////////////////////////////////////////////////////////
class ASCPIKernel {
    constructor() {
        this.gps = new GlobalPhaseSupervisor();
        this.motor = new ASCPiMotor();
        this.scheduler = new Scheduler();
        this.running = false;
    }

    start() {
        this.running = true;
        this.loop();
    }
    
    stop() {
        this.running = false;
    }
    
    loop() {
        if (!this.running) return;
    
        const theta = this.gps.update();
        this.motor.I8.theta = theta;
    
        const mode = this.scheduler.update(this.motor.glyphs);
        this.scheduler.execute(this.motor, this.gps);
    
        const field = this.motor.computeField();
    
        this.onUpdate({
            theta,
            mode,
            field,
            glyphs: this.motor.glyphs
        });
    
        setImmediate(() => this.loop());
    }
    
    onUpdate(state) {
        // Placeholder; override from outside to integrate UI or network
    }

}

///////////////////////////////////////////////////////////////
// EXPORT MODULE
///////////////////////////////////////////////////////////////
module.exports = {
    ASCPIKernel
};
