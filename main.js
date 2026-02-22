/**
 * NoteLang.js - Game Engine Edition
 * GitHub: https://rok8ray.github.io/notelang/main.js
 */

window.NoteLang = {
  variables: {},
  updatables: [], // Functions that run every frame

  // --- COMMAND METHODS ---

  print: function(value) {
    console.log("%c[NoteLang]:", "color: #00dbde; font-weight: bold;", this.resolvePath(value));
  },

  set: function(varName, value) {
    this.variables[varName] = this.resolvePath(value);
  },

  // Optimized Create: Supports arguments like "create THREE.BoxGeometry 1 1 1 as geo"
  create: function(className, ...args) {
    const varName = args.pop(); // Last item is the 'as name'
    if (args[0] === 'as') args.shift(); // Remove 'as' if present

    const Constructor = this.resolvePath(className);
    if (typeof Constructor === 'function') {
      // Convert string args to numbers if they are numeric
      const finalArgs = args.map(a => !isNaN(a) ? Number(a) : this.resolvePath(a));
      this.variables[varName] = new Constructor(...finalArgs);
      return this.variables[varName];
    }
  },

  call: function(methodPath, ...args) {
    const func = this.resolvePath(methodPath);
    if (typeof func === 'function') {
      const parts = methodPath.split('.');
      const context = parts.length > 1 ? this.resolvePath(parts.slice(0, -1).join('.')) : window;
      const resolvedArgs = args.map(a => this.resolvePath(a));
      return func.apply(context, resolvedArgs);
    }
  },

  // --- GAME ENGINE METHODS ---

  onUpdate: function(fnName) {
    const fn = this.resolvePath(fnName);
    if (typeof fn === 'function') this.updatables.push(fn);
  },

  startLoop: function() {
    const { renderer, scene, camera } = this.variables;

    if (renderer) {
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);
    }
    if (camera) camera.position.set(0, 2, 5);

    const animate = () => {
      requestAnimationFrame(animate);
      
      // Run game logic
      this.updatables.forEach(fn => fn());

      // Render the 3D frame
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    animate();
    this.print("Engine Heartbeat Started");
  },

  // --- CORE SYSTEM ---

  lexer: function(code) {
    // Regex updated to handle arguments and spaces better
    const regex = /([a-zA-Z0-9_.]+)|(\()|(\))|(".*?")|(\+|-|\*|\/|=)/g;
    return code.match(regex) || [];
  },

  resolvePath: function(path) {
    if (path === undefined || path === null) return null;
    if (typeof path !== 'string') return path;
    if (path.startsWith('"')) return path.substring(1, path.length - 1);
    if (path !== "" && !isNaN(path)) return Number(path);
    if (this.variables[path] !== undefined) return this.variables[path];

    let current = window;
    for (const part of path.split('.')) {
      if (current[part] !== undefined) current = current[part];
      else return path;
    }
    return current;
  },

  interpret: function(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];

      if (token === 'print') this.print(tokens[++i]);
      else if (token === 'set') {
        let name = tokens[++i]; i++; // skip =
        this.set(name, tokens[++i]);
      }
      else if (token === 'create') {
        let cls = tokens[++i];
        let args = [];
        while (tokens[i+1] !== 'as' && i + 1 < tokens.length) {
          args.push(tokens[++i]);
        }
        i++; // skip 'as'
        let name = tokens[++i];
        this.create(cls, ...args, name);
      }
      else if (token === 'call') {
        let method = tokens[++i];
        let arg = tokens[++i];
        this.call(method, arg);
      }
    }
  },

  run: function(code) {
    this.interpret(this.lexer(code));
  },

  init: function() {
    document.querySelectorAll('script[type="text/mylang"]').forEach(s => {
      this.run(s.textContent.trim());
    });
  }
};

window.addEventListener('DOMContentLoaded', () => NoteLang.init());
