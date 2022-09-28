// 入口文件
import fs from "fs"
import parser from "@babel/parser"
import traverse from "@babel/traverse"
import path from "path"
import ejs from "ejs"
import {transformFromAst} from "babel-core"
import {jsonLoader} from "../webpackSource/jsonLoader.js"
import {ChangeOutputPath} from "../webpackSource/ChangeOutputPath.js"
import { SyncHook } from "tapable"
let id = 0
// 获取文件内容
// 获取依赖关系

const webpackConfig = {
    module:{
        rules:[
            {
              test: /\.json$/,
              use: jsonLoader,
            },
          ],
    },
    plugins:[new ChangeOutputPath()]
}

const hooks = {
    emitFile: new SyncHook(["context"])
}
// 注册函数
function initPlugins(){
    const plugins = webpackConfig.plugins
    plugins.forEach((plugin)=>{
        plugin.apply(hooks)
    })
}
function createAsset(filePath){
    const deps = []
    let source = fs.readFileSync(filePath,{
        encoding:"utf-8"
    });
    const loaders = webpackConfig.module.rules
    const loaderContext = {
        addDeps(dep){
            console.log("dep",dep)
        }
    }

    loaders.forEach(({test,use})=>{
        // regexObj.test(str)方法
        // 从后往前的调用loader
        if(test.test(filePath)){
            if(Array.isArray(use)){
                use.reverse().forEach((fn)=>{
                    source = fn.call(loaderContext,source)
                })
            }
            else{
                source = use.call(loaderContext,source)
            } 
        }
    })

    // 得到ast树
    const ast = parser.parse(source,{
        sourceType:"module"
    })
    // console.log(ast)
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
    // console.log("code",code,"code")
    return {filePath,code,deps,mapping:{},id:id++,};
}



function createGraph(){
    const mainAsset = createAsset("./example/main.js")
    const queue = [mainAsset]
    for(const asset of queue){
        asset.deps.forEach(ralativePath=>{
            // console.log("depsssss",path.resolve("./example",ralativePath),ralativePath)
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
    // console.log(data[1].code,"datacode",graph)
    const code1 = ejs.render(template,{data})
    // console.log(code1)
    let outputPath = "./dist/bundle.js"
    // 调用
    const context = {
        ChangeOutputPath(path){
            outputPath = path
        }
    }
    hooks.emitFile.call(context)
    fs.writeFileSync(outputPath,code1)
}
initPlugins()
const graph = createGraph()
build(graph)