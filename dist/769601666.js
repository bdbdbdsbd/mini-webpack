(function(modules){
    const require=(id)=>{
        const [fn,mapping] = modules[id]
        const module = {
            exports:{}
        }
        function localRequire(filePath){
            const id = mapping[filePath]
            return require(id)
        }

        fn(localRequire,module,module.exports)//相当于在执行foojs、mainjs
        return module.exports
    }
    
    require(0)
    
    // require,module,exports 传进来的特性？
    // exports 是输出
})({
    
        "0":[function (require,module,exports){
            "use strict";

var _foo = require("./foo.js");

var _foo2 = _interopRequireDefault(_foo);

var _para = require("./para.json");

var _para2 = _interopRequireDefault(_para);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

console.log(_para2.default);

_foo2.default.foo();

console.log("main.js");
        },{"./foo.js":1,"./para.json":2} ],
        
        "1":[function (require,module,exports){
            "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bar = require("./bar.js");

var _bar2 = _interopRequireDefault(_bar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function foo() {
  console.log("foo");
}

exports.default = {
  foo: foo
};
        },{"./bar.js":3} ],
        
        "2":[function (require,module,exports){
            "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = "{\r\n    \"name\":\"father\"\r\n}";
        },{} ],
        
        "3":[function (require,module,exports){
            "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {};
        },{} ],
         

})
// ()立即执行

// 使用commonJS规范里面的require 代替import
