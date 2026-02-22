/**
 * NoteLang.js - Fully Globalized Edition
 */

window.NoteLang = {
  // 1. Storage for variables and instances
  variables: {},

  // --- GLOBAL COMMAND METHODS ---
  // These can be called directly: NoteLang.print("Hello")
  
  print: function(value) {
    const val = this.resolvePath(value);
    console.log("%c[NoteLang Output]:", "color: #00dbde; font-weight: bold;", val);
  },

  set: function(varName, value) {
    this.variables[varName] = this.resolvePath(value);
  },

  create: function(className, varName) {
    const Constructor = this.resolvePath(className);
    if (typeof Constructor === 'function') {
      this.variables[varName] = new Constructor();
      console.log(`NoteLang: Created instance of ${className} as ${varName}`);
    } else {
      console.error(`NoteLang: ${className} is not a valid constructor.`);
    }
  },

  call: function(methodPath, argument) {
    const func = this.resolvePath(methodPath);
    const arg = this.resolvePath(argument);
    if (typeof func === 'function') {
      // Find the 'context' (e.g., if calling console.log, context is console)
      const parts = methodPath.split('.');
      const context = parts.length > 1 ? this.resolvePath(parts.slice(0, -1).join('.')) : window;
      func.call(context, arg);
    }
  },

  // --- ENGINE CORE ---

  lexer: function(code) {
    const regex = /([a-zA-Z0-9_.]+)|(\()|(\))|(".*?")|(\+|-|\*|\/|=)/g;
    return code.match(regex) || [];
  },

  resolvePath: function(path) {
    if (path === undefined || path === null) return null;
    
    // If it's already an object or number (not a string), return it
    if (typeof path !== 'string') return path;

    // Handle Strings: "Hello"
    if (path.startsWith('"') && path.endsWith('"')) {
      return path.substring(1, path.length - 1);
    }
    
    // Handle Numbers
    if (path !== "" && !isNaN(path)) return Number(path);

    // Check internal variables
    if (this.variables[path] !== undefined) {
      return this.variables[path];
    }

    // Check Global JS Environment (window)
    let current = window;
    const parts = path.split('.');
    for (const part of parts) {
      if (current[part] !== undefined) {
        current = current[part];
      } else {
        return path; // Return as raw string if path doesn't exist
      }
    }
    return current;
  },

  interpret: function(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];

      if (token === 'print') {
        this.print(tokens[++i]);
      } 
      else if (token === 'set') {
        let varName = tokens[++i];
        i++; // skip '='
        this.set(varName, tokens[++i]);
      } 
      else if (token === 'create') {
        let className = tokens[++i];
        i++; // skip 'as'
        let varName = tokens[++i];
        this.create(className, varName);
      } 
      else if (token === 'call') {
        let method = tokens[++i];
        let arg = tokens[++i];
        this.call(method, arg);
      }
    }
  },

  // Runs raw string code
  run: function(rawCode) {
    const tokens = this.lexer(rawCode);
    this.interpret(tokens);
  },

  // Scans HTML for <script type="text/mylang">
  init: function() {
    const scripts = document.querySelectorAll('script[type="text/mylang"]');
    scripts.forEach(script => {
      this.run(script.textContent.trim());
    });
  }
};

// Auto-run when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.NoteLang.init());
} else {
  window.NoteLang.init();
}
