## 1 introduction
核心就是：
1. 获取文件内容 fs readfile utf-8
2. 获取依赖关系
    ast -> 抽象语法树

3. 生成关系map
4. 合成一个大的js文件，防止命名冲突，使用一个函数框起来  esm用法改成cjs用法

## 2 配置
package.json 加入  
"type": "module",来支持esm


## 3 生成一个大的js文件
使用ejs模板

pnpm i babel-preset-env 