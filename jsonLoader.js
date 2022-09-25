export function jsonLoader(source){
    console.log("我处理json了",source)
    return `export default ${JSON.stringify(source)}`
};