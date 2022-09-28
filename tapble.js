import {SyncHook,AsyncParallelHook} from "tapable"
class List  {
    getRoutes(){}
}
class Car {
	constructor() {
		this.hooks = {
			accelerate: new SyncHook(["newSpeed"]),
			brake: new SyncHook(),
			calculateRoutes: new AsyncParallelHook(["source", "target", "routesList"])
		};
	}

	setSpeed(newSpeed) {
		// following call returns undefined even when you returned values
        // 调用了call，触发了事件
		this.hooks.accelerate.call(newSpeed);
	}

        // promise形式
	useNavigationSystemPromise(source, target) {
		const routesList = new List();
		return this.hooks.calculateRoutes.promise(source, target, routesList).then((res) => {
			// res is undefined for AsyncParallelHook
			return routesList.getRoutes();
		});
	}

    // callAsync
	useNavigationSystemAsync(source, target, callback) {
		const routesList = new List();
		this.hooks.calculateRoutes.callAsync(source, target, routesList, err => {
			if(err) return callback(err);
			callback(null, routesList.getRoutes());
		});
	}
	/* ... */
}

// 1. 注册事件
const car = new Car()
car.hooks.accelerate.tap("test1",(speed)=>{
    console.log("accelerate调用了",speed)
})
car.hooks.calculateRoutes.tapPromise("test2",(source,target)=>{
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
           console.log("————taptap",source,target) 
           console.log("calculateRoutes.tapPromise来了")
           resolve()
        },0)
    })

})


// 2. 触发事件
// 由于里面使用到了call，会触发xx事件(同步事件)
car.setSpeed(10)
// 异步事件，先触发我们定义的，再触发系统本身的
car.useNavigationSystemPromise(["1","2","3"],1)