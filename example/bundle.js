(function(modules){
    const require=(filePath)=>{
        const fn = modules[filePath]
        const module = {
            exports:{}
        }
        fn(require,module,module.exports)//相当于在执行foojs、mainjs
        return module.exports
    }
    
    require("./main.js")
    
    // require,module,exports 传进来的特性？
    // exports 是输出
})({
    "./foo.js":function (require,module,exports){
        module.exports = {
            foo
        }
        function foo(){
            console.log("foo")
        }
    },
    "./main.js":function (require,module,exports){
        // 上面是手写了一个require函数，手写了一个module，exports
        // 引入了其他函数里面的东西
        const {foo} = require("./foo.js")
        foo();
        console.log("main.js")
    }
})
// ()立即执行

// 使用commonJS规范里面的require 代替import
