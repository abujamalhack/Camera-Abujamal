class CodeObfuscation {
    constructor() {
        this.obfuscationMethods = {
            stringSplitting: true,
            variableRenaming: true,
            deadCodeInjection: true,
            controlFlowFlattening: true,
            base64Encoding: true
        };
    }

    // Advanced code obfuscation
    obfuscateCode(code) {
        try {
            let obfuscated = code.toString();
            
            // Remove comments and whitespace
            obfuscated = this.removeCommentsAndWhitespace(obfuscated);
            
            // Rename variables and functions
            if (this.obfuscationMethods.variableRenaming) {
                obfuscated = this.renameIdentifiers(obfuscated);
            }
            
            // Split strings
            if (this.obfuscationMethods.stringSplitting) {
                obfuscated = this.splitStrings(obfuscated);
            }
            
            // Inject dead code
            if (this.obfuscationMethods.deadCodeInjection) {
                obfuscated = this.injectDeadCode(obfuscated);
            }
            
            // Flatten control flow
            if (this.obfuscationMethods.controlFlowFlattening) {
                obfuscated = this.flattenControlFlow(obfuscated);
            }
            
            // Encode parts in base64
            if (this.obfuscationMethods.base64Encoding) {
                obfuscated = this.encodeStrings(obfuscated);
            }
            
            return obfuscated;
            
        } catch (error) {
            console.error('Obfuscation error:', error);
            return code;
        }
    }

    removeCommentsAndWhitespace(code) {
        return code
            .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments
            .replace(/\/\/.*$/gm, '') // Single-line comments
            .replace(/\s+/g, ' ') // Multiple whitespace to single space
            .replace(/;\s*/g, ';') // Remove spaces after semicolons
            .trim();
    }

    renameIdentifiers(code) {
        const identifierMap = new Map();
        let counter = 0;
        
        // Find all identifiers (variables, functions)
        const identifierRegex = /(?:\b(?:var|let|const|function)\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        
        return code.replace(identifierRegex, (match, p1) => {
            if (!identifierMap.has(p1)) {
                identifierMap.set(p1, this.generateObfuscatedName(counter++));
            }
            return match.replace(p1, identifierMap.get(p1));
        });
    }

    generateObfuscatedName(index) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let name = '_';
        
        for (let i = 0; i < 3; i++) {
            name += chars[Math.floor(Math.random() * chars.length)];
        }
        
        return name + index;
    }

    splitStrings(code) {
        return code.replace(/'([^']+)'|"([^"]+)"/g, (match, p1, p2) => {
            const str = p1 || p2;
            if (str.length < 3) return match;
            
            const splitIndex = Math.floor(str.length / 2);
            const part1 = str.substring(0, splitIndex);
            const part2 = str.substring(splitIndex);
            
            return `'${part1}' + '${part2}'`;
        });
    }

    injectDeadCode(code) {
        const deadCodeSnippets = [
            ';var _0xdead=_0xdead+1;',
            ';if(false){console.log("unreachable");}',
            ';try{throw new Error("dead");}catch(e){}',
            ';for(var i=0;i<0;i++){Math.random();}',
            ';function _deadCode(){return Math.random();}_deadCode();'
        ];
        
        const lines = code.split(';');
        const newLines = [];
        
        lines.forEach((line, index) => {
            newLines.push(line);
            if (index % 3 === 0 && index < lines.length - 1) {
                const randomSnippet = deadCodeSnippets[Math.floor(Math.random() * deadCodeSnippets.length)];
                newLines.push(randomSnippet);
            }
        });
        
        return newLines.join(';');
    }

    flattenControlFlow(code) {
        // Simple control flow flattening for demonstration
        return code.replace(/if\s*\(([^)]+)\)\s*{([^}]*)}/g, 
            'switch(Boolean($1)){case true:{$2}break;}');
    }

    encodeStrings(code) {
        return code.replace(/'([^']+)'|"([^"]+)"/g, (match, p1, p2) => {
            const str = p1 || p2;
            if (str.length > 10) { // Only encode longer strings
                return `atob('${btoa(str)}')`;
            }
            return match;
        });
    }

    // Advanced obfuscation with multiple layers
    advancedObfuscate(code, layers = 3) {
        let obfuscated = code;
        
        for (let i = 0; i < layers; i++) {
            obfuscated = this.obfuscateCode(obfuscated);
            
            // Add different techniques per layer
            if (i === 1) {
                obfuscated = this.addProxyFunctions(obfuscated);
            }
            if (i === 2) {
                obfuscated = this.encryptLiterals(obfuscated);
            }
        }
        
        return obfuscated;
    }

    addProxyFunctions(code) {
        // Add proxy functions for common operations
        const proxies = `
            function _p(a,b){return a+b;}
            function _m(a,b){return a*b;}
            function _c(a){return String(a);}
            function _n(a){return Number(a);}
        `;
        
        return proxies + code
            .replace(/\+/g, '_p')
            .replace(/\*/g, '_m')
            .replace(/String\(/g, '_c(')
            .replace(/Number\(/g, '_n(');
    }

    encryptLiterals(code) {
        // Simple XOR encryption for numbers
        return code.replace(/\b(\d+)\b/g, (match, num) => {
            const key = 1337;
            const encrypted = parseInt(num) ^ key;
            return `(${encrypted} ^ ${key})`;
        });
    }

    // Create self-defending code
    createSelfDefendingWrapper(code) {
        const wrapper = `
            (function(){
                'use strict';
                var _0xguard = function(){
                    var _0xcheck = typeof window !== 'undefined';
                    if(!_0xcheck) return false;
                    
                    // Anti-debugging
                    var _0xstart = new Date().getTime();
                    debugger;
                    var _0xend = new Date().getTime();
                    if(_0xend - _0xstart > 100) return false;
                    
                    return true;
                };
                
                if(!_0xguard()) return;
                
                ${code}
            })();
        `;
        
        return this.obfuscateCode(wrapper);
    }

    // Generate random obfuscation
    randomObfuscate(code) {
        const methods = [
            'obfuscateCode',
            'advancedObfuscate',
            'createSelfDefendingWrapper'
        ];
        
        const randomMethod = methods[Math.floor(Math.random() * methods.length)];
        return this[randomMethod](code);
    }
}

// Export for use in other modules
window.CodeObfuscation = CodeObfuscation;
