webpack是一个重要的项目打包工具，在很多框架中都有用到，比如Vue2里面的vue-cli就是基于webpack的。因此学习webpack就变得尤为重要，而学习webpack的源码，手写一个webpack，则更有助于我们理解并运用webpack。本项目的代码链接为[https://github.com/bdbdbdsbd/mini-webpack](https://github.com/bdbdbdsbd/mini-webpack)

## 1 传统的html,css的结构
创建`main.js foo.js bar.js`以及`index.html`，结构如下
```
├─example
|   ├─main.js
|   ├─foo.js
|   ├─bar.js
|   ├─index.html
```
```js
// main.js
import foo from "./foo.js"
foo.foo();
console.log("main.js")
```

```js 
// foo.js
import bar from "./bar.js"
function foo(){
    console.log("foo")
}
export default {foo}
```

```js
// bar.js
export default {} 
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>webpack</title>
    </head>
    <body>
        <script type="module" src="./main.js"></script>
    </body>
</html>
```
打开devtool，会发现输出了
```
foo
main.js
```
在很久远的年代，文件之间就是这么简单的引用，但是实际工程中我们希望可以在生产环境中将不同模块的文件打包在一起，于是webpack出现了。

## 2 webpack
用最简单的话描述webpack核心步骤：
1. 获取文件内容，即文件内部的代码（不包含文件之间的依赖关系）
2. 获取依赖关系，即文件之间的相互引用关系，生成关系map
3. 根据依赖关系合成一个/几个大的js文件，合并之后会将文件之间的引用变成函数之间的引用。

那么我们就开始动手吧，首先初始化项目`npm init -y`，再创建一个index.js，这个文件将放置我们的mini-webpack里面的核心逻辑
```
├─index.js
├─package.json
├─example
|    ├─bar.js
|    ├─foo.js
|    ├─index.html
|    └main.js
```

如果后面是想用ejs风格的代码，在package.json里面加入`"type": "module"`，如果不加入，后面的代码就不要使用import，使用require（commonJS风格）
```json
...
"version": "1.0.0",
"type": "module",
...
```
#### 2.1 读取文件代码内容以及合并准备
```js
const fs = require("fs")
const filePath = "./example/main.js"
const source = fs.readFileSync(filePath,{
    encoding:"utf-8"
});
// import foo from "./foo.js"
// foo.foo();
// console.log("main.js")
```
这样就读取到了文件的内容，接下来就是修改获取到的代码部分。合并打包之后，文件之间的引用变成函数之间的引用，而函数里面是不能写import，因此我们用require的方式来代替（再通过自定义require函数来实现自定义的函数之间的相互引用）。

那么下一步就是将ejs风格的代码转换为cjs风格的，使用ast树来做，先将ejs风格的代码转成ast树，再将ast树转换为cjs风格的代码。
首先安装`babel-preset-env`,`@babel/parser`,`babel-core`,然后在index.js里写入
```js
import fs from "fs"
import parser from "@babel/parser"
import {transformFromAst} from "babel-core"
const filePath = "./example/foo.js"
const source = fs.readFileSync(filePath,{
    encoding:"utf-8"
});
const ast = parser.parse(source,{
    sourceType:"module"
})
const {code} = transformFromAst(ast,null,{
    presets:["env"]
})
console.log(code)
// "use strict";
// Object.defineProperty(exports, "__esModule", {
//   value: true
// });
// var _bar = require("./bar.js");
// var _bar2 = _interopRequireDefault(_bar);
// function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// function foo() {
//   console.log("foo");
// }
// exports.default = {
//   foo: foo
// };
```
可以发现，输出的代码已经是cjs规范的了。

#### 2.2 读取文件依赖关系
这里先用一个数组去存储依赖关系，比如说foo.js里面引用了bar.js，那么就在deps里面添加['./bar.js']，作为依赖关系的数组。这个依赖关系里面的文件的获取，还是通过AST树。

首先，[使用AST树的一个分析的网站](https://astexplorer.net/)，放入foo.js代码可以得到
```json
{
  "type": "Program",
  "start": 0,
  "end": 88,
  "body": [
    {
      "type": "ImportDeclaration",
      "start": 0,
      "end": 26,
      "specifiers": [
        {
          "type": "ImportDefaultSpecifier",
          "start": 7,
          "end": 10,
          "local": {
            "type": "Identifier",
            "start": 7,
            "end": 10,
            "name": "bar"
          }
        }
      ],
      "source": {
        "type": "Literal",
        "start": 16,
        "end": 26,
        "value": "./bar.js",
        "raw": "\"./bar.js\""
      }
    },
    ...
  ],
  "sourceType": "module"
}
```
可以发现，在body的一个type为ImportDeclaration的对象里，通过source.value就可以直接获取到"./bar.js"，当然这里处于方便，使用了traverse来获取依赖。
```js 
// 入口文件
import fs from "fs"
import parser from "@babel/parser"
import traverse from "@babel/traverse"
import {transformFromAst} from "babel-core"
const deps = []
const filePath = "./example/foo.js"
const source = fs.readFileSync(filePath,{
    encoding:"utf-8"
});
const ast = parser.parse(source,{
    sourceType:"module"
})
traverse.default(ast,{
    // 针对import类的节点
    ImportDeclaration({node}){
        // 收集到了
        // 添加到依赖关系里面
        deps.push(node.source.value)
    }
})
const {code} = transformFromAst(ast,null,{
    presets:["env"]
})
console.log(deps)
// [ './bar.js' ]
```
最后将这部分代码打包为一个函数createAsset
```js 
// 入口文件
import fs from "fs"
import parser from "@babel/parser"
import traverse from "@babel/traverse"
import {transformFromAst} from "babel-core"
function createAsset(filePath){
    const deps = []
    const source = fs.readFileSync(filePath,{
        encoding:"utf-8"
    });
    const ast = parser.parse(source,{
        sourceType:"module"
    })
    traverse.default(ast,{
        // 针对import类的节点
        ImportDeclaration({node}){
            // 收集到了
            // 添加到依赖关系里面
            deps.push(node.source.value)
        }
    })
    const {code} = transformFromAst(ast,null,{
        presets:["env"]
    })

    return {
        filePath,
        code,
        deps
    }
}
```
#### 2.3 依赖关系的处理
处理策略：先进行main.js的依赖处理，得到了一个数组`deps = ["./foo.js"]`，再处理deps里面的文件的依赖，是一种递归的思想。所以mian.js一般也可以认为是入口文件，因为依赖关系的处理是从这个文件开始的。

这部分处理代码如下
```js 
const mainAsset = createAsset("./example/main.js")
const queue = [mainAsset]
for(const asset of queue){
    asset.deps.forEach(ralativePath=>{
        const child = createAsset(path.resolve("./example",ralativePath))
        queue.push(child)
    })
}
console.log(queue) 
// [
//   {
//     filePath: './example/main.js',
//     code: '"use strict";\n' +
//       '\n' +
//       'var _foo = require("./foo.js");\n' +
//       '\n' +
//       'var _foo2 = _interopRequireDefault(_foo);\n' +
//       '\n' +
//       'function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n' +
//       '\n' +
//       '_foo2.default.foo();\n' +
//       '\n' +
//       'console.log("main.js");',
//     deps: [ './foo.js' ]
//   },
//   {
//     filePath: 'D:\\3_code\\webpack\\test\\example\\foo.js',
//     code: '"use strict";\n' +
//       '\n' +
//       'Object.defineProperty(exports, "__esModule", {\n' +
//       '  value: true\n' +
//       '});\n' +
//       '\n' +
//       'var _bar = require("./bar.js");\n' +
//       '\n' +
//       'var _bar2 = _interopRequireDefault(_bar);\n' +
//       '\n' +
//       'function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n' +
//       '\n' +
//       'function foo() {\n' +
//       '  console.log("foo");\n' +
//       '}\n' +
//       '\n' +
//       'exports.default = {\n' +
//       '  foo: foo\n' +
//       '};',
//     deps: [ './bar.js' ]
//   },
//   {
//     filePath: 'D:\\3_code\\webpack\\test\\example\\bar.js',
//     code: '"use strict";\n' +
//       '\n' +
//       'Object.defineProperty(exports, "__esModule", {\n' +
//       '  value: true\n' +
//       '});\n' +
//       'exports.default = {};',
//     deps: []
//   }
// ]
```
queue就是我们得到的一个数组，里面有依赖关系，也有代码。得到了这些重要信息，我们就可以打包生成js文件。

## 3 打包生成js文件
#### 3.1 ejs模板
使用ejs模板来生成打包后的js文件，我们只要把代码和文件的依赖放入，就可以得到打包后的js文件。

那么这个模板应该怎么做比较好，首先就是看我们之前获取的code
```js
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
```


那么，首先封装一下这部分代码为一个函数，方便其他函数调用、向外传数据
```js 
{"./foo.js":function (require,module,exports){
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
}}
```
封装成一个对象+匿名函数的形式，其实是方便做成模板，这样我们只需要像下面这样的形式填充模板就可以得到一个对象，里面存储了一个个函数
```js 
const modules = {
    item1.filePath:function(require,module,exports){
        item1.code
    },
    item2.filePath:function(require,module,exports){
        item2.code
    },
    item3.filePath:function(require,module,exports){
        item3.code
    },
}
```
那么其实接下来的逻辑就很清楚了，对于任意一个xx.js函数，整体逻辑为
```
引入xx.js的依赖的代码（通过require函数）->执行xx.js代码-> 通过exports返回相应的内容
```

JS里面require函数是会去引入一个文件的，但是我们webpack打包后其实希望的是去引入同一个文件里面的其他函数。而exports也是同理，所以我们只是模拟了require/exports的功能，并不是真正调用了require/exports。那么接下来就去实现这个自定义的require函数以及module，exports
```js 
const require=(filePath)=>{
    const fn = modules[filePath]
    const module = {
        exports:{}
    }
    fn(require,module,module.exports)
    return module.exports
}
require("./main.js")
```
通过两个对象来实现module以及exports的功能，配合require返回相应的数据

综上所述，可以得到如下的一个模板
```js 
(function(modules){
    const require=(filePath)=>{
        const fn = modules[filePath]
        const module = {
            exports:{}
        }
        fn(require,module,module.exports)
        return module.exports
    }
    require("./main.js")
})({
    item1.filePath:function(require,module,exports){
        item1.code
    },
    item2.filePath:function(require,module,exports){
        item2.code
    },
    item3.filePath:function(require,module,exports){
        item3.code
    },
})
```
在根目录下新建一个模板文件bundle.ejs，将上文代码整理成ejs文件就是
```ejs
(function(modules){
    const require=(filePath)=>{
        const fn = modules[filePath]
        const module = {
            exports:{}
        }
        fn(require,module,module.exports)
        return module.exports
    }
    require("./main.js")
})({
    <% data.forEach((item)=>{%>
        "<%-item["filePath"]%>":function (require,module,exports){
            <%- item["code"]%>
        },
        <%}) %> 
})
```
data就是传给ejs文件的参数，是一个对象数组，对应了上文的queue。
新建一个文件夹"./dist"，用于存放bundle.js（打包后的js文件），现在的结构就成这样了
```
├─bundle.ejs
├─index.js
├─package.json
├─pnpm-lock.yaml  不使用pnpm的朋友不会有这个文件
├─example
|    ├─bar.js
|    ├─foo.js
|    ├─index.html
|    └main.js
├─dist
|  └bundle.js
```

在index.js中，将queue传给ejs模板。
```js 
// 入口文件
import fs from "fs"
import parser from "@babel/parser"
import traverse from "@babel/traverse"
import {transformFromAst} from "babel-core"
import path from "path"
import ejs from "ejs"
function createAsset(filePath){
    const deps = []
    const source = fs.readFileSync(filePath,{
        encoding:"utf-8"
    });
    const ast = parser.parse(source,{
        sourceType:"module"
    })
    traverse.default(ast,{
        // 针对import类的节点
        ImportDeclaration({node}){
            // 收集到了
            // 添加到依赖关系里面
            deps.push(node.source.value)
        }
    })
    const {code} = transformFromAst(ast,null,{
        presets:["env"]
    })

    return {
        filePath,
        code,
        deps
    }
}


function createGraph(){
    const mainAsset = createAsset("./example/main.js")
    const queue = [mainAsset]
    for(const asset of queue){
        asset.deps.forEach(ralativePath=>{
            const child = createAsset(path.resolve("./example",ralativePath))
            queue.push(child)
        })
    }
    return queue
}

function build(graph){
    const template = fs.readFileSync('./bundle.ejs',{
        encoding:"utf-8"
    })
    const data = graph.map((asset)=>{
        const {filePath,code} = asset
        return {
            filePath,
            code,
        }
    })
    const code1 = ejs.render(template,{data})
    console.log(code1)
    fs.writeFileSync("./dist/bundle.js",code1)
}
const graph = createGraph()
build(graph)
```
修改index.html为
```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>webpack</title>
    </head>
    <body>
        <!-- <script src="../dist/bundle.js"></script> -->
        <script type="module" src="../dist/bundle.js"></script>
    </body>
</html>
```
执行`node index.js`，得到了打包后的文件bundle.js
```
(function(modules){
    const require=(filePath)=>{
        const fn = modules[filePath]
        const module = {
            exports:{}
        }
        fn(require,module,module.exports)
        return module.exports
    }
    require("./main.js")
})({
    
        "./example/main.js":function (require,module,exports){
            "use strict";

var _foo = require("./foo.js");

var _foo2 = _interopRequireDefault(_foo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_foo2.default.foo();

console.log("main.js");
        },
        
        "D:\3_code\webpack\test\example\foo.js":function (require,module,exports){
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
        },
        
        "D:\3_code\webpack\test\example\bar.js":function (require,module,exports){
            "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {};
        },
         
})
```

#### 3.2 mapping 映射
然后用liveServer打开，意料之中的带着bug。原因很简单，我们reqire的时候是"./bar.js"，但是输入变量里面是"D:\3_code\webpack\test\example\bar.js"，那就做一个简简单单的映射就可以了

index.js
```js
import fs from "fs"
import parser from "@babel/parser"
import traverse from "@babel/traverse"
import path from "path"
import ejs from "ejs"
import {transformFromAst} from "babel-core"
let id = 0
// 获取文件内容
// 获取依赖关系
function createAsset(filePath){
    const deps = []
    const source = fs.readFileSync(filePath,{
        encoding:"utf-8"
    });
    // 得到ast树
    const ast = parser.parse(source,{
        sourceType:"module"
    })
    // traverse去遍历ast
    traverse.default(ast,{
        // 针对import类的节点
        ImportDeclaration({node}){
            // 收集到了
            // 添加到依赖关系里面
            deps.push(node.source.value)
        }
    })
    const {code} = transformFromAst(ast,null,{
        presets:["env"]
    })
    return {filePath,code,deps,mapping:{},id:id++,};
}



function createGraph(){
    const mainAsset = createAsset("./example/main.js")
    const queue = [mainAsset]
    for(const asset of queue){
        asset.deps.forEach(ralativePath=>{
            console.log("depsssss",path.resolve("./example",ralativePath),ralativePath)
            const child = createAsset(path.resolve("./example",ralativePath))
            asset.mapping[ralativePath] = child.id
            queue.push(child)
        })
        
    }
    return queue
}

function build(graph){
    const template = fs.readFileSync('./bundle.ejs',{
        encoding:"utf-8"
    })
    const data = graph.map((asset)=>{
        const {id,code,mapping} = asset
        return {
            id,
            code,
            mapping,
        }
    })
    const code1 = ejs.render(template,{data})
    fs.writeFileSync("./dist/bundle.js",code1)
}

const graph = createGraph()
build(graph) 
```
bundle.ejs
```ejs
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
    <% data.forEach((item)=>{%>
        "<%-item["id"]%>":[function (require,module,exports){
            <%- item["code"]%>
        },<%- JSON.stringify(item["mapping"])  %> ],
        <%}) %> 

})
// ()立即执行

// 使用commonJS规范里面的require 代替import
```
对每一个文件生成的依赖数组，增加了一个id和一个mapping，mapping里面映射了文件名和对应的id。

执行node index.js 打包后得到
```js
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_foo2.default.foo();

console.log("main.js");
        },{"./foo.js":1} ],
        
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
        },{"./bar.js":2} ],
        
        "2":[function (require,module,exports){
            "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {};
        },{} ],
         

})
```
可以发现，之前的"xx.js"被替换成了id，并且每一个js文件名都映射了一个id。
这个时候再用liveServer打开index.html，就可以正常打开了。