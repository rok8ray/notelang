window.NoteLang = {
  // 1. Storage for variables and instances
  variables: {},

  // 2. The Lexer: Converts raw text into a list of usable tokens
  // This regex handles words, dots (for THREE.js), numbers, quotes, and symbols.
  lexer: function(code) {
    const regex = /([a-zA-Z0-9_.]+)|(\()|(\))|(".*?")|(\+|-|\*|\/|=)/g;
    return code.match(regex) || [];
  },

  // 3. The Path Resolver: Finds values from variables, strings, numbers, or window (JS)
  resolvePath: function(path) {
    if (path === undefined) return null;
    
    // Handle Strings: "Hello" -> Hello
    if (path.startsWith('"') && path.endsWith('"')) {
      return path.substring(1, path.length - 1);
    }
    
    // Handle Numbers
    if (!isNaN(path)) return Number(path);

    // Check internal variables first (set x = 10)
    if (this.variables[path] !== undefined) {
      return this.variables[path];
    }

    // Check Global JavaScript Environment (window.THREE, window.console, etc.)
    let current = window;
    const parts = path.split('.');
    for (const part of parts) {
      if (current[part] !== undefined) {
        current = current[part];
      } else {
        // If it's not a JS object and not a variable, return as a raw string
        return path;
      }
    }
    return current;
  },

  // 4. The Interpreter: Loops through tokens and executes logic
  interpret: function(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];

      // COMMAND: print [value]
      if (token === 'print') {
        let val = this.resolvePath(tokens[++i]);
        console.log("%c[MyLang Output]:", "color: #00dbde; font-weight: bold;", val);
      }

      // COMMAND: set [var] = [value]
      else if (token === 'set') {
        let varName = tokens[++i];
        i++; // skip '='
        let val = this.resolvePath(tokens[++i]);
        this.variables[varName] = val;
      }

      // COMMAND: create [JS_Class] as [var_name]
      // Example: create THREE.Scene as myScene
      else if (token === 'create') {
        let className = tokens[++i];
        i++; // skip 'as'
        let varName = tokens[++i];
        
        const Constructor = this.resolvePath(className);
        if (typeof Constructor === 'function') {
          this.variables[varName] = new Constructor();
        } else {
          console.error(`MyLang: ${className} is not a valid constructor.`);
        }
      }

      // COMMAND: call [object.method] [argument]
      // Example: call console.log "Hello"
      else if (token === 'call') {
        let methodPath = tokens[++i];
        let arg = this.resolvePath(tokens[++i]);
        let func = this.resolvePath(methodPath);
        if (typeof func === 'function') {
          func(arg);
        }
      }
    }
  },

  // 5. Public API: Use this to run code strings from your main JS
  run: function(rawCode) {
    const tokens = this.lexer(rawCode);
    this.interpret(tokens);
  },

  // 6. Initialization: Scans the HTML document for custom tags
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
