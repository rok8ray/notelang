/**
 * NoteLang.js - Game Engine Edition 2
 * GitHub: https://rok8ray.github.io/notelang/main.js
 */

window.NoteLang = {
  variables: {},
  updatables: [],

  // --- COMMAND METHODS ---
  print: function(val) { console.log("%c[NoteLang]:", "color: #00dbde; font-weight: bold;", this.resolvePath(val)); },
  set: function(varName, val) { this.variables[varName] = this.resolvePath(val); },
  
  create: function(className, ...args) {
    // Filter out the word 'as' if it's hiding in the arguments
    const filteredArgs = args.filter(arg => arg !== 'as');
    const varName = filteredArgs.pop(); // The last remaining item is our variable name

    const Constructor = this.resolvePath(className);
    if (typeof Constructor === 'function') {
      const finalArgs = filteredArgs.map(a => this.resolvePath(a));
      this.variables[varName] = new Constructor(...finalArgs);
      console.log(`NoteLang: Created instance of ${className} as ${varName}`);
    } else {
      console.error(`NoteLang: ${className} is not a valid constructor.`);
    }
  },

  call: function(path, ...args) {
    const func = this.resolvePath(path);
    if (typeof func === 'function') {
      const parts = path.split('.');
      const ctx = parts.length > 1 ? this.resolvePath(parts.slice(0, -1).join('.')) : window;
      func.apply(ctx, args.map(a => this.resolvePath(a)));
    }
  },

  // --- ENGINE ---
  onUpdate: function(fn) { const resolved = this.resolvePath(fn); if(typeof resolved === 'function') this.updatables.push(resolved); },
  
  startLoop: function() {
    const { renderer, scene, camera } = this.variables;

    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
        // Set a background color so we know the renderer is alive
        renderer.setClearColor(0x222222); 
        document.body.appendChild(renderer.domElement);
    }

    if (camera) {
        // Move the camera back and up
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 0, 0);
    }

    const anim = () => {
        requestAnimationFrame(anim);
        this.updatables.forEach(f => f());
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    };
    anim();
    this.print("Renderer attached and loop started.");
  }

  lexer: function(code) {
    // This regex is smarter: it ignores comments starting with //
    const cleanCode = code.replace(/\/\/.*$/gm, '');
    return cleanCode.match(/([a-zA-Z0-9_.]+)|(".*?")|(\+|-|\*|\/|=)/g) || [];
  },

  resolvePath: function(p) {
    if (p === undefined || p === null) return null;
    if (typeof p !== 'string') return p;
    if (p.startsWith('"')) return p.slice(1, -1);
    if (p !== "" && !isNaN(p)) return Number(p);
    if (this.variables[p] !== undefined) return this.variables[p];
    let cur = window;
    for (const part of p.split('.')) {
      if (cur[part] !== undefined) cur = cur[part];
      else return p;
    }
    return cur;
  },

  interpret: function(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === 'print') this.print(tokens[++i]);
      else if (t === 'set') { let n = tokens[++i]; i++; this.set(n, tokens[++i]); }
      else if (t === 'create') {
        let cls = tokens[++i];
        let args = [];
        // Keep grabbing tokens until we hit 'as'
        while (i + 1 < tokens.length && tokens[i+1] !== 'as') { args.push(tokens[++i]); }
        if (tokens[i+1] === 'as') i++; // Skip the 'as' token itself
        let name = tokens[++i];
        this.create(cls, ...args, name);
      }
      else if (t === 'call') {
        let m = tokens[++i];
        let a = tokens[++i];
        this.call(m, a);
      }
    }
  },

  run: function(c) { this.interpret(this.lexer(c)); },
  init: function() { document.querySelectorAll('script[type="text/mylang"]').forEach(s => this.run(s.textContent.trim())); }
};
window.addEventListener('DOMContentLoaded', () => NoteLang.init());
